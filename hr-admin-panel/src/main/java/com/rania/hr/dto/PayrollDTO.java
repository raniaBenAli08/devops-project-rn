package com.rania.hr.dto;

import com.rania.hr.enums.PayrollStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private Integer month;
    private Integer year;
    private BigDecimal baseSalary;
    private BigDecimal overtime;
    private BigDecimal deductions;
    private BigDecimal bonus;
    private BigDecimal netSalary;
    private PayrollStatus status;
    private LocalDateTime createdAt;
}
