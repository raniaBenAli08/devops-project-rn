package com.rania.hr.service;

import com.rania.hr.dto.CreateLeaveRequest;
import com.rania.hr.dto.LeaveBalanceDTO;
import com.rania.hr.dto.LeaveRequestDTO;
import com.rania.hr.entity.Employee;
import com.rania.hr.entity.LeaveBalance;
import com.rania.hr.entity.LeaveRequest;
import com.rania.hr.enums.LeaveStatus;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.EmployeeRepository;
import com.rania.hr.repository.LeaveBalanceRepository;
import com.rania.hr.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public LeaveRequestDTO requestLeave(CreateLeaveRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        long daysBetween = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        BigDecimal days = BigDecimal.valueOf(daysBetween);

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .days(days)
                .reason(request.getReason())
                .status(LeaveStatus.PENDING)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        return toDTO(saved);
    }

    @Transactional
    public LeaveRequestDTO approveLeave(Long leaveRequestId, Long approverId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveRequestId));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Leave request is not in PENDING status");
        }

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", approverId));

        leaveRequest.setStatus(LeaveStatus.APPROVED);
        leaveRequest.setApprovedBy(approver);

        // Update leave balance
        int year = leaveRequest.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndYearAndType(leaveRequest.getEmployee().getId(), year, leaveRequest.getType())
                .orElseGet(() -> LeaveBalance.builder()
                        .employee(leaveRequest.getEmployee())
                        .year(year)
                        .type(leaveRequest.getType())
                        .totalDays(BigDecimal.valueOf(20))
                        .usedDays(BigDecimal.ZERO)
                        .remainingDays(BigDecimal.valueOf(20))
                        .build());

        balance.setUsedDays(balance.getUsedDays().add(leaveRequest.getDays()));
        balance.setRemainingDays(balance.getTotalDays().subtract(balance.getUsedDays()));
        leaveBalanceRepository.save(balance);

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        return toDTO(saved);
    }

    @Transactional
    public LeaveRequestDTO rejectLeave(Long leaveRequestId, Long approverId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveRequestId));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Leave request is not in PENDING status");
        }

        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", approverId));

        leaveRequest.setStatus(LeaveStatus.REJECTED);
        leaveRequest.setApprovedBy(approver);

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getAllRequests() {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceDTO> getBalance(Long employeeId, int year) {
        return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year).stream()
                .map(this::toBalanceDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceDTO> getBalances(int year) {
        return leaveBalanceRepository.findByYear(year).stream()
                .map(this::toBalanceDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getEmployeeLeaves(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getPendingRequests() {
        return leaveRequestRepository.findByStatus(LeaveStatus.PENDING).stream()
                .map(this::toDTO)
                .toList();
    }

    private LeaveRequestDTO toDTO(LeaveRequest request) {
        return LeaveRequestDTO.builder()
                .id(request.getId())
                .employeeId(request.getEmployee().getId())
                .employeeName(request.getEmployee().getFullName())
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .days(request.getDays())
                .reason(request.getReason())
                .status(request.getStatus())
                .approvedById(request.getApprovedBy() != null ? request.getApprovedBy().getId() : null)
                .approvedByName(request.getApprovedBy() != null ? request.getApprovedBy().getFullName() : null)
                .createdAt(request.getCreatedAt())
                .build();
    }

    private LeaveBalanceDTO toBalanceDTO(LeaveBalance balance) {
        return LeaveBalanceDTO.builder()
                .id(balance.getId())
                .employeeId(balance.getEmployee().getId())
                .year(balance.getYear())
                .type(balance.getType())
                .totalDays(balance.getTotalDays())
                .usedDays(balance.getUsedDays())
                .remainingDays(balance.getRemainingDays())
                .build();
    }
}
