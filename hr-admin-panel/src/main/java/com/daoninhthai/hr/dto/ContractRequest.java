package com.daoninhthai.hr.dto;

import com.daoninhthai.hr.enums.ContractStatus;
import com.daoninhthai.hr.enums.ContractType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ContractRequest {

    @NotNull
    private Long employeeId;

    @NotNull
    private ContractType type;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate;

    @DecimalMin(value = "0.0")
    private BigDecimal salary;

    private ContractStatus status;

    @Size(max = 2000)
    private String notes;
}
