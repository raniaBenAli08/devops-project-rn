package com.rania.hr.service;

import com.rania.hr.dto.AttendanceDTO;
import com.rania.hr.dto.AttendanceQrDTO;
import com.rania.hr.entity.Attendance;
import com.rania.hr.entity.AttendanceQrToken;
import com.rania.hr.entity.Employee;
import com.rania.hr.entity.User;
import com.rania.hr.enums.EmployeeStatus;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.repository.AttendanceRepository;
import com.rania.hr.repository.AttendanceQrTokenRepository;
import com.rania.hr.repository.EmployeeRepository;
import com.rania.hr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicReference;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private AttendanceQrTokenRepository attendanceQrTokenRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    private final AtomicReference<AttendanceQrToken> persistedQrToken = new AtomicReference<>();

    @BeforeEach
    void configureQrTokenPersistence() {
        when(attendanceQrTokenRepository.findById(any(LocalDate.class)))
                .thenAnswer(invocation -> Optional.ofNullable(persistedQrToken.get()));
        lenient().when(attendanceQrTokenRepository.save(any(AttendanceQrToken.class)))
                .thenAnswer(invocation -> {
                    AttendanceQrToken token = invocation.getArgument(0);
                    persistedQrToken.set(token);
                    return token;
                });
    }

    @Test
    void dailyQrIsPersistedAndExpiresAtStartOfNextDay() {
        AttendanceQrDTO firstQr = attendanceService.getDailyQr();
        AttendanceQrDTO secondQr = attendanceService.getDailyQr();

        assertEquals(LocalDate.now(), firstQr.getDate());
        assertEquals(LocalDate.now().plusDays(1).atStartOfDay(), firstQr.getExpiresAt());
        org.junit.jupiter.api.Assertions.assertTrue(firstQr.getToken().matches("HR-\\d{4}-\\d{2}-\\d{2}-[A-HJ-NP-Z2-9]{16}"));
        assertEquals(firstQr.getToken(), secondQr.getToken());
        verify(attendanceQrTokenRepository, times(1)).save(any(AttendanceQrToken.class));
    }

    @Test
    void invalidDailyQrDoesNotLookUpEmployeeAccount() {
        assertThrows(BadRequestException.class,
                () -> attendanceService.checkInWithQr(15L, "invalid-daily-qr"));

        verify(userRepository, never()).findById(any());
        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    void rotatingDailyQrInvalidatesThePreviousToken() {
        String oldToken = attendanceService.getDailyQr().getToken();
        AttendanceQrDTO newQr = attendanceService.rotateDailyQr();

        assertNotEquals(oldToken, newQr.getToken());
        assertEquals(newQr.getToken(), attendanceService.getDailyQr().getToken());
        assertThrows(BadRequestException.class,
                () -> attendanceService.checkInWithQr(15L, oldToken));
        verify(userRepository, never()).findById(any());
    }

    @Test
    void validQrChecksInTheEmployeeLinkedToAuthenticatedAccount() {
        Employee employee = Employee.builder()
                .id(7L)
                .employeeCode("EMP-7")
                .firstName("Sam")
                .lastName("Lee")
                .status(EmployeeStatus.ACTIVE)
                .build();
        User user = User.builder().id(15L).username("sam").employee(employee).build();
        when(userRepository.findById(15L)).thenReturn(Optional.of(user));
        when(employeeRepository.findById(7L)).thenReturn(Optional.of(employee));
        when(attendanceRepository.findByEmployeeIdAndDate(eq(7L), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(invocation -> {
            Attendance attendance = invocation.getArgument(0);
            attendance.setId(21L);
            return attendance;
        });

        AttendanceDTO result = attendanceService.checkInWithQr(
                15L,
                attendanceService.getDailyQr().getToken());

        assertEquals(7L, result.getEmployeeId());
        assertEquals("Sam Lee", result.getEmployeeName());
        assertEquals(21L, result.getId());
        verify(attendanceRepository).save(any(Attendance.class));
    }
}
