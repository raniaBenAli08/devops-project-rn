package com.daoninhthai.hr.service;

import com.daoninhthai.hr.dto.CreateEmployeeRequest;
import com.daoninhthai.hr.dto.EmployeeDTO;
import com.daoninhthai.hr.entity.Department;
import com.daoninhthai.hr.entity.Employee;
import com.daoninhthai.hr.entity.Position;
import com.daoninhthai.hr.exception.BadRequestException;
import com.daoninhthai.hr.repository.DepartmentRepository;
import com.daoninhthai.hr.repository.EmployeeRepository;
import com.daoninhthai.hr.repository.PositionRepository;
import com.daoninhthai.hr.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void createEmployeeSkipsEmployeeCodesAlreadyStoredInDatabase() {
        when(employeeRepository.existsByEmail("new.employee@example.com")).thenReturn(false);
        when(employeeRepository.existsByEmployeeCode(any(String.class))).thenReturn(true, false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee employee = invocation.getArgument(0);
            employee.setId(42L);
            return employee;
        });
        when(userRepository.findByEmployeeId(42L)).thenReturn(Optional.empty());

        EmployeeDTO created = employeeService.createEmployee(CreateEmployeeRequest.builder()
                .firstName("New")
                .lastName("Employee")
                .email("new.employee@example.com")
                .hireDate(LocalDate.now())
                .build());

        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMM"));
        assertEquals("EMP" + datePart + "1002", created.getEmployeeCode());
        verify(employeeRepository, times(2)).existsByEmployeeCode(any(String.class));
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    void createEmployeeRejectsPositionFromAnotherDepartment() {
        Department department = Department.builder().id(1L).name("Finance").code("FIN").build();
        Department otherDepartment = Department.builder().id(2L).name("Engineering").code("ENG").build();
        Position position = Position.builder().id(7L).title("Developer").department(otherDepartment).build();

        when(employeeRepository.existsByEmail("new.employee@example.com")).thenReturn(false);
        when(employeeRepository.existsByEmployeeCode(any(String.class))).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(positionRepository.findById(7L)).thenReturn(Optional.of(position));

        assertThrows(BadRequestException.class, () -> employeeService.createEmployee(CreateEmployeeRequest.builder()
                .firstName("New")
                .lastName("Employee")
                .email("new.employee@example.com")
                .hireDate(LocalDate.now())
                .departmentId(1L)
                .positionId(7L)
                .build()));

        verify(employeeRepository, never()).save(any(Employee.class));
    }
}
