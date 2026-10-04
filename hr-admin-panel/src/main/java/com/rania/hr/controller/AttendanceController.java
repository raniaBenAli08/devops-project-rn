package com.rania.hr.controller;

import com.rania.hr.dto.AttendanceDTO;
import com.rania.hr.dto.AttendanceQrDTO;
import com.rania.hr.dto.AttendanceQrRequest;
import com.rania.hr.dto.AttendanceTodayDTO;
import com.rania.hr.security.UserPrincipal;
import com.rania.hr.service.AttendanceService;
import com.rania.hr.entity.User;
import com.rania.hr.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<List<AttendanceDTO>> getMyAttendance(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getEmployee() == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(attendanceService.getEmployeeAttendance(user.getEmployee().getId(), startDate, endDate));
    }

    @PostMapping("/check-in/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<AttendanceDTO> checkIn(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.checkIn(employeeId));
    }

    @PostMapping("/check-out/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<AttendanceDTO> checkOut(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.checkOut(employeeId));
    }

    @GetMapping("/me/today")
    public ResponseEntity<AttendanceTodayDTO> getMyAttendanceToday(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(attendanceService.getTodayForUser(principal.getId()));
    }

    @GetMapping("/qr/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<AttendanceQrDTO> getTodayQr() {
        return ResponseEntity.ok(attendanceService.getDailyQr());
    }

    @PostMapping("/qr/today/rotate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<AttendanceQrDTO> rotateTodayQr() {
        return ResponseEntity.ok(attendanceService.rotateDailyQr());
    }

    @PostMapping("/me/check-in")
    public ResponseEntity<AttendanceDTO> checkInWithQr(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AttendanceQrRequest request) {
        return ResponseEntity.ok(attendanceService.checkInWithQr(principal.getId(), request.getToken()));
    }

    @PostMapping("/me/check-out")
    public ResponseEntity<AttendanceDTO> checkOutWithQr(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AttendanceQrRequest request) {
        return ResponseEntity.ok(attendanceService.checkOutWithQr(principal.getId(), request.getToken()));
    }

    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<AttendanceDTO>> getDailyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getDailyReport(date));
    }

    @GetMapping("/monthly/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<AttendanceDTO>> getMonthlyReport(
            @PathVariable Long employeeId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(attendanceService.getMonthlyReport(employeeId, year, month));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<AttendanceDTO>> getEmployeeAttendance(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getEmployeeAttendance(employeeId, startDate, endDate));
    }
}
