package com.daoninhthai.hr.dto;

import com.daoninhthai.hr.enums.EmployeeStatus;
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
public class EmployeeDTO {
    private Long id;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private Long departmentId;
    private String departmentName;
    private Long positionId;
    private String positionTitle;
    private Long managerId;
    private String managerName;
    private BigDecimal salary;
    private EmployeeStatus status;
    private String attendanceUsername;
    private LocalDateTime createdAt;
}
