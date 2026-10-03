package com.daoninhthai.hr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PositionDTO {
    private Long id;
    private String title;
    private String level;
    private BigDecimal minSalary;
    private BigDecimal maxSalary;
    private Long departmentId;
    private String departmentName;
}
