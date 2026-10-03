package com.daoninhthai.hr.dto;

import com.daoninhthai.hr.enums.ContractStatus;
import com.daoninhthai.hr.enums.ContractType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ContractDTO {
    private Long id;
    private String contractNumber;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private ContractType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal salary;
    private ContractStatus status;
    private String notes;
    private String attachmentName;
    private Long attachmentSize;
    private String attachmentContentType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
