package com.rania.hr.service;

import com.rania.hr.dto.AttendanceDTO;
import com.rania.hr.dto.AttendanceQrDTO;
import com.rania.hr.dto.AttendanceTodayDTO;
import com.rania.hr.entity.Attendance;
import com.rania.hr.entity.AttendanceQrToken;
import com.rania.hr.entity.Employee;
import com.rania.hr.entity.User;
import com.rania.hr.enums.AttendanceStatus;
import com.rania.hr.enums.EmployeeStatus;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.AttendanceRepository;
import com.rania.hr.repository.AttendanceQrTokenRepository;
import com.rania.hr.repository.EmployeeRepository;
import com.rania.hr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final String QR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom QR_RANDOM = new SecureRandom();

    private final AttendanceRepository attendanceRepository;
    private final AttendanceQrTokenRepository attendanceQrTokenRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Transactional
    public AttendanceDTO checkIn(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndDate(employeeId, today).isPresent()) {
            throw new BadRequestException("Employee already checked in today");
        }

        LocalDateTime now = LocalDateTime.now();
        AttendanceStatus status = now.getHour() >= 9 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .date(today)
                .checkIn(now)
                .status(status)
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        return toDTO(saved);
    }

    @Transactional
    public AttendanceDTO checkOut(Long employeeId) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new BadRequestException("Employee has not checked in today"));

        if (attendance.getCheckOut() != null) {
            throw new BadRequestException("Employee already checked out today");
        }

        LocalDateTime now = LocalDateTime.now();
        attendance.setCheckOut(now);

        Duration duration = Duration.between(attendance.getCheckIn(), now);
        BigDecimal hours = BigDecimal.valueOf(duration.toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        attendance.setTotalHours(hours);

        if (hours.compareTo(BigDecimal.valueOf(4)) < 0) {
            attendance.setStatus(AttendanceStatus.HALF_DAY);
        }

        Attendance saved = attendanceRepository.save(attendance);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public AttendanceTodayDTO getTodayForUser(Long userId) {
        User user = findUser(userId);
        Employee employee = user.getEmployee();
        if (employee == null) {
            return new AttendanceTodayDTO(null, null, null);
        }
        AttendanceDTO today = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), LocalDate.now())
                .map(this::toDTO)
                .orElse(null);
        return new AttendanceTodayDTO(employee.getId(), employee.getFullName(), today);
    }

    @Transactional
    public AttendanceQrDTO getDailyQr() {
        LocalDate today = LocalDate.now();
        AttendanceQrToken token = attendanceQrTokenRepository.findById(today)
                .orElseGet(() -> attendanceQrTokenRepository.save(createDailyQrToken(today)));
        return toQrDTO(token);
    }

    @Transactional
    public AttendanceQrDTO rotateDailyQr() {
        LocalDate today = LocalDate.now();
        return toQrDTO(attendanceQrTokenRepository.save(createDailyQrToken(today)));
    }

    @Transactional
    public AttendanceDTO checkInWithQr(Long userId, String token) {
        validateQrToken(token);
        Employee employee = findAttendanceEmployee(userId);
        return checkIn(employee.getId());
    }

    @Transactional
    public AttendanceDTO checkOutWithQr(Long userId, String token) {
        validateQrToken(token);
        Employee employee = findAttendanceEmployee(userId);
        return checkOut(employee.getId());
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getDailyReport(LocalDate date) {
        return attendanceRepository.findByDate(date).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getMonthlyReport(Long employeeId, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getEmployeeAttendance(Long employeeId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate).stream()
                .map(this::toDTO)
                .toList();
    }

    private AttendanceDTO toDTO(Attendance attendance) {
        return AttendanceDTO.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeName(attendance.getEmployee().getFullName())
                .employeeCode(attendance.getEmployee().getEmployeeCode())
                .date(attendance.getDate())
                .checkIn(attendance.getCheckIn())
                .checkOut(attendance.getCheckOut())
                .status(attendance.getStatus())
                .totalHours(attendance.getTotalHours())
                .notes(attendance.getNotes())
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private Employee findAttendanceEmployee(Long userId) {
        Employee employee = findUser(userId).getEmployee();
        if (employee == null) {
            throw new BadRequestException("Your login account is not linked to an employee. Contact HR.");
        }
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new BadRequestException("Only active employees can record attendance.");
        }
        return employee;
    }

    private void validateQrToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Scan or enter the attendance QR code for today.");
        }
        LocalDate today = LocalDate.now();
        AttendanceQrToken currentToken = attendanceQrTokenRepository.findById(today)
                .orElseThrow(() -> new BadRequestException("This attendance QR code is invalid or has expired."));
        byte[] expected = currentToken.getToken().getBytes(StandardCharsets.US_ASCII);
        byte[] supplied = token.trim().getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(expected, supplied)) {
            throw new BadRequestException("This attendance QR code is invalid or has expired.");
        }
    }

    private AttendanceQrToken createDailyQrToken(LocalDate date) {
        StringBuilder randomSuffix = new StringBuilder(16);
        for (int index = 0; index < 16; index++) {
            randomSuffix.append(QR_ALPHABET.charAt(QR_RANDOM.nextInt(QR_ALPHABET.length())));
        }
        return AttendanceQrToken.builder()
                .date(date)
                .token("HR-" + date + "-" + randomSuffix)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private AttendanceQrDTO toQrDTO(AttendanceQrToken token) {
        return new AttendanceQrDTO(token.getToken(), token.getDate(), token.getDate().plusDays(1).atStartOfDay());
    }
}
