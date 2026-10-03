package com.daoninhthai.hr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Long headId;
    private String headName;
    private Long parentDepartmentId;
    private String parentDepartmentName;
    private int employeeCount;
    private List<DepartmentDTO> childDepartments;
    private LocalDateTime createdAt;
}
