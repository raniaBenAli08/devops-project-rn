package com.daoninhthai.hr.dto;

import com.daoninhthai.hr.enums.LeaveStatus;
import com.daoninhthai.hr.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequestDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LeaveType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal days;
    private String reason;
    private LeaveStatus status;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime createdAt;
}
