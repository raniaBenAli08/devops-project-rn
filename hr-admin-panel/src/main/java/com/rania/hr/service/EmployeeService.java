package com.rania.hr.service;

import com.rania.hr.dto.*;
import com.rania.hr.entity.Department;
import com.rania.hr.entity.Employee;
import com.rania.hr.entity.Position;
import com.rania.hr.entity.User;
import com.rania.hr.enums.EmployeeStatus;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.DepartmentRepository;
import com.rania.hr.repository.EmployeeRepository;
import com.rania.hr.repository.PositionRepository;
import com.rania.hr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final AtomicLong codeSequence = new AtomicLong(1000);

    @Transactional(readOnly = true)
    public PageResponse<EmployeeDTO> getAllEmployees(String search, Long departmentId,
                                                     EmployeeStatus status, int page, int size,
                                                     String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Employee> employees = employeeRepository.searchEmployees(search, departmentId, status, pageable);

        return PageResponse.<EmployeeDTO>builder()
                .content(employees.getContent().stream().map(this::toDTO).toList())
                .page(employees.getNumber())
                .size(employees.getSize())
                .totalElements(employees.getTotalElements())
                .totalPages(employees.getTotalPages())
                .last(employees.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return toDTO(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeByCode(String code) {
        Employee employee = employeeRepository.findByEmployeeCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "code", code));
        return toDTO(employee);
    }

    @Transactional
    public EmployeeDTO createEmployee(CreateEmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use: " + request.getEmail());
        }

        Employee employee = Employee.builder()
                .employeeCode(generateEmployeeCode())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .hireDate(request.getHireDate())
                .salary(request.getSalary())
                .status(EmployeeStatus.ACTIVE)
                .build();

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
            employee.setDepartment(department);
        }

        if (request.getPositionId() != null) {
            Position position = positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Position", "id", request.getPositionId()));
            if (employee.getDepartment() == null || position.getDepartment() == null
                    || !position.getDepartment().getId().equals(employee.getDepartment().getId())) {
                throw new BadRequestException("Position must belong to the selected department");
            }
            employee.setPosition(position);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager", "id", request.getManagerId()));
            employee.setManager(manager);
        }

        Employee saved = employeeRepository.save(employee);
        return toDTO(saved);
    }

    @Transactional
    public EmployeeDTO updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (request.getFirstName() != null) employee.setFirstName(request.getFirstName());
        if (request.getLastName() != null) employee.setLastName(request.getLastName());
        if (request.getEmail() != null) {
            if (!employee.getEmail().equals(request.getEmail()) &&
                    employeeRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email already in use: " + request.getEmail());
            }
            employee.setEmail(request.getEmail());
        }
        if (request.isClearPhone()) {
            employee.setPhone(null);
        } else if (request.getPhone() != null) {
            employee.setPhone(request.getPhone());
        }
        if (request.isClearDateOfBirth()) {
            employee.setDateOfBirth(null);
        } else if (request.getDateOfBirth() != null) {
            employee.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getHireDate() != null) employee.setHireDate(request.getHireDate());
        if (request.getTerminationDate() != null) employee.setTerminationDate(request.getTerminationDate());
        if (request.isClearSalary()) {
            employee.setSalary(null);
        } else if (request.getSalary() != null) {
            employee.setSalary(request.getSalary());
        }
        if (request.getStatus() != null) {
            employee.setStatus(request.getStatus());
            employee.setTerminationDate(request.getStatus() == EmployeeStatus.TERMINATED ? LocalDate.now() : null);
        }

        if (request.isClearDepartment()) {
            employee.setDepartment(null);
        } else if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
            employee.setDepartment(department);
        }

        if (request.isClearPosition()) {
            employee.setPosition(null);
        } else if (request.getPositionId() != null) {
            Position position = positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Position", "id", request.getPositionId()));
            Long departmentId = employee.getDepartment() == null ? null : employee.getDepartment().getId();
            if (departmentId == null || position.getDepartment() == null
                    || !position.getDepartment().getId().equals(departmentId)) {
                throw new BadRequestException("Position must belong to the selected department");
            }
            employee.setPosition(position);
        }

        if (request.isClearManager()) {
            employee.setManager(null);
        } else if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager", "id", request.getManagerId()));
            employee.setManager(manager);
        }

        Employee saved = employeeRepository.save(employee);
        return toDTO(saved);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        employee.setStatus(EmployeeStatus.TERMINATED);
        employee.setTerminationDate(LocalDate.now());
        employeeRepository.save(employee);
    }

    @Transactional
    public void linkAttendanceAccount(Long employeeId, Long userId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));
        User currentAccount = userRepository.findByEmployeeId(employeeId).orElse(null);

        if (userId == null) {
            if (currentAccount != null) {
                currentAccount.setEmployee(null);
                userRepository.save(currentAccount);
            }
            return;
        }

        User selectedAccount = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (selectedAccount.getEmployee() != null
                && !selectedAccount.getEmployee().getId().equals(employeeId)) {
            throw new BadRequestException("This account is already linked to another employee.");
        }
        if (currentAccount != null && !currentAccount.getId().equals(userId)) {
            currentAccount.setEmployee(null);
            userRepository.save(currentAccount);
        }
        selectedAccount.setEmployee(employee);
        userRepository.save(selectedAccount);
    }

    private String generateEmployeeCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMM"));
        String employeeCode;
        do {
            long seq = codeSequence.incrementAndGet();
            employeeCode = "EMP" + datePart + String.format("%04d", seq % 10000);
        } while (employeeRepository.existsByEmployeeCode(employeeCode));
        return employeeCode;
    }

    private EmployeeDTO toDTO(Employee employee) {
        String attendanceUsername = userRepository.findByEmployeeId(employee.getId())
                .map(User::getUsername)
                .orElse(null);
        return EmployeeDTO.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .fullName(employee.getFullName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .dateOfBirth(employee.getDateOfBirth())
                .hireDate(employee.getHireDate())
                .terminationDate(employee.getTerminationDate())
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .positionId(employee.getPosition() != null ? employee.getPosition().getId() : null)
                .positionTitle(employee.getPosition() != null ? employee.getPosition().getTitle() : null)
                .managerId(employee.getManager() != null ? employee.getManager().getId() : null)
                .managerName(employee.getManager() != null ? employee.getManager().getFullName() : null)
                .salary(employee.getSalary())
                .status(employee.getStatus())
                .attendanceUsername(attendanceUsername)
                .createdAt(employee.getCreatedAt())
                .build();
    }
}
