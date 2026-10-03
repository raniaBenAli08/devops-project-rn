package com.daoninhthai.hr.service;

import com.daoninhthai.hr.enums.EmployeeStatus;
import com.daoninhthai.hr.repository.*;
import com.daoninhthai.hr.entity.User;
import com.daoninhthai.hr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final PerformanceReviewRepository performanceReviewRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final PayrollRepository payrollRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalEmployees = employeeRepository.count();
        long activeEmployees = employeeRepository.countByStatus(EmployeeStatus.ACTIVE);
        long onLeaveToday = leaveRequestRepository.countOnLeaveToday(LocalDate.now());

        stats.put("totalEmployees", totalEmployees);
        stats.put("activeEmployees", activeEmployees);
        stats.put("onLeaveToday", onLeaveToday);
        stats.put("openPositions", positionRepository.count());

        // Department distribution
        List<Map<String, Object>> deptDistribution = departmentRepository.findAll().stream()
                .map(dept -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("department", dept.getName());
                    entry.put("count", dept.getEmployees() != null ? dept.getEmployees().size() : 0);
                    return entry;
                })
                .collect(Collectors.toList());
        stats.put("departmentDistribution", deptDistribution);

        // Attendance trend (last 7 days)
        List<Map<String, Object>> attendanceTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", date.toString());
            entry.put("present", attendanceRepository.countPresentByDate(date));
            entry.put("total", totalEmployees);
            attendanceTrend.add(entry);
        }
        stats.put("attendanceTrend", attendanceTrend);

        // Average attendance rate
        if (totalEmployees > 0) {
            long presentToday = attendanceRepository.countPresentByDate(LocalDate.now());
            double avgAttendance = (double) presentToday / totalEmployees * 100;
            stats.put("averageAttendance", Math.round(avgAttendance * 10.0) / 10.0);
        } else {
            stats.put("averageAttendance", 0);
        }

        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPersonalDashboardStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getEmployee() == null) {
            throw new IllegalStateException("Your account is not linked to an employee");
        }
        Long employeeId = user.getEmployee().getId();
        LocalDate start = LocalDate.now().minusDays(30);
        long present = attendanceRepository.countByEmployeeAndDateRangeAndStatus(
                employeeId, start, LocalDate.now(), com.daoninhthai.hr.enums.AttendanceStatus.PRESENT);
        long total = attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, start, LocalDate.now()).size();
        Map<String, Object> stats = new HashMap<>();
        stats.put("employeeName", user.getEmployee().getFullName());
        stats.put("attendancePresentDays", present);
        stats.put("attendanceTotalDays", total);
        stats.put("attendanceRate", total == 0 ? 0 : Math.round((double) present / total * 1000.0) / 10.0);
        stats.put("pendingLeaveRequests", leaveRequestRepository.findByEmployeeIdAndStatus(
                employeeId, com.daoninhthai.hr.enums.LeaveStatus.PENDING).size());
        stats.put("approvedLeaveDays", leaveRequestRepository.findByEmployeeIdAndStatus(
                employeeId, com.daoninhthai.hr.enums.LeaveStatus.APPROVED).stream()
                .mapToDouble(request -> request.getDays().doubleValue()).sum());
        stats.put("performanceRating", performanceReviewRepository.getAverageRating(employeeId));
        stats.put("recentPayrollNet", payrollRepository.findByEmployeeId(employeeId).stream()
                .max(Comparator.comparing(payroll -> payroll.getYear() * 100 + payroll.getMonth()))
                .map(payroll -> payroll.getNetSalary()).orElse(null));
        return stats;
    }
}
