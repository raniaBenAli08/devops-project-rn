package com.rania.hr.controller;

import com.rania.hr.dto.CreateLeaveRequest;
import com.rania.hr.dto.LeaveBalanceDTO;
import com.rania.hr.dto.LeaveRequestDTO;
import com.rania.hr.service.LeaveService;
import com.rania.hr.security.UserPrincipal;
import com.rania.hr.entity.User;
import com.rania.hr.repository.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<List<LeaveRequestDTO>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(leaveService.getEmployeeLeaves(getEmployeeId(principal)));
    }

    @GetMapping("/balance/me")
    public ResponseEntity<List<LeaveBalanceDTO>> getMyBalance(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam int year) {
        return ResponseEntity.ok(leaveService.getBalance(getEmployeeId(principal), year));
    }

    private Long getEmployeeId(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getEmployee() == null) throw new IllegalStateException("Account is not linked to an employee");
        return user.getEmployee().getId();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<LeaveRequestDTO>> getAllRequests() {
        return ResponseEntity.ok(leaveService.getAllRequests());
    }

    @PostMapping("/request")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<LeaveRequestDTO> requestLeave(@Valid @RequestBody CreateLeaveRequest request) {
        return new ResponseEntity<>(leaveService.requestLeave(request), HttpStatus.CREATED);
    }

    @PostMapping("/request/me")
    public ResponseEntity<LeaveRequestDTO> requestMyLeave(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateLeaveRequest request) {
        request.setEmployeeId(getEmployeeId(principal));
        return new ResponseEntity<>(leaveService.requestLeave(request), HttpStatus.CREATED);
    }

    @GetMapping("/balance")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<LeaveBalanceDTO>> getBalances(@RequestParam int year) {
        return ResponseEntity.ok(leaveService.getBalances(year));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<LeaveRequestDTO> approveLeave(
            @PathVariable Long id,
            @RequestParam Long approverId) {
        return ResponseEntity.ok(leaveService.approveLeave(id, approverId));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<LeaveRequestDTO> rejectLeave(
            @PathVariable Long id,
            @RequestParam Long approverId) {
        return ResponseEntity.ok(leaveService.rejectLeave(id, approverId));
    }

    @GetMapping("/balance/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<LeaveBalanceDTO>> getBalance(
            @PathVariable Long employeeId,
            @RequestParam int year) {
        return ResponseEntity.ok(leaveService.getBalance(employeeId, year));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<LeaveRequestDTO>> getEmployeeLeaves(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getEmployeeLeaves(employeeId));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<LeaveRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(leaveService.getPendingRequests());
    }
}
