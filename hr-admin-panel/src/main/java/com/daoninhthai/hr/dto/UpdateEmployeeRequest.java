package com.daoninhthai.hr.dto;

import com.daoninhthai.hr.enums.EmployeeStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEmployeeRequest {
    private String firstName;
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private Long departmentId;
    private Long positionId;
    private Long managerId;
    private boolean clearDepartment;
    private boolean clearPosition;
    private boolean clearManager;
    private boolean clearPhone;
    private boolean clearDateOfBirth;
    private boolean clearSalary;

    @DecimalMin(value = "0.0", message = "Salary must be positive")
    private BigDecimal salary;

    private EmployeeStatus status;
}
