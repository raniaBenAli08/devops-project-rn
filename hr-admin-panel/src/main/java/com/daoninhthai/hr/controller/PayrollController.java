package com.daoninhthai.hr.controller;

import com.daoninhthai.hr.dto.PayrollDTO;
import com.daoninhthai.hr.service.PayrollService;
import com.daoninhthai.hr.security.UserPrincipal;
import com.daoninhthai.hr.entity.User;
import com.daoninhthai.hr.repository.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<List<PayrollDTO>> getMyPayroll(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getEmployee() == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(payrollService.getPayrollHistory(user.getEmployee().getId()));
    }

    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<PayrollDTO>> calculateMonthly(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(payrollService.calculateMonthly(month, year));
    }

    @GetMapping("/payslip/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<PayrollDTO> generatePayslip(
            @PathVariable Long employeeId,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(payrollService.generatePayslip(employeeId, month, year));
    }

    @GetMapping("/history/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<PayrollDTO>> getPayrollHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(payrollService.getPayrollHistory(employeeId));
    }

    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<PayrollDTO>> getMonthlyPayroll(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(payrollService.getMonthlyPayroll(month, year));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<PayrollDTO> approvePayroll(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.approvePayroll(id));
    }
}
