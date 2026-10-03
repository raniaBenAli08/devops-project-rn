package com.daoninhthai.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePositionRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Level is required")
    private String level;

    private BigDecimal minSalary;
    private BigDecimal maxSalary;

    @NotNull(message = "Department is required")
    private Long departmentId;
}
