package com.rania.hr.service;

import com.rania.hr.dto.CreateDepartmentRequest;
import com.rania.hr.dto.DepartmentDTO;
import com.rania.hr.entity.Department;
import com.rania.hr.entity.Employee;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.DepartmentRepository;
import com.rania.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        return toDTO(department);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getRootDepartments() {
        return departmentRepository.findByParentDepartmentIsNull().stream()
                .map(this::toDTOWithChildren)
                .toList();
    }

    @Transactional
    public DepartmentDTO createDepartment(CreateDepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Department code already exists: " + request.getCode());
        }
        if (departmentRepository.existsByName(request.getName())) {
            throw new BadRequestException("Department name already exists: " + request.getName());
        }

        Department department = Department.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .build();

        if (request.getHeadId() != null) {
            Employee head = employeeRepository.findById(request.getHeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getHeadId()));
            department.setHead(head);
        }

        if (request.getParentDepartmentId() != null) {
            Department parent = departmentRepository.findById(request.getParentDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getParentDepartmentId()));
            department.setParentDepartment(parent);
        }

        Department saved = departmentRepository.save(department);
        return toDTO(saved);
    }

    @Transactional
    public DepartmentDTO updateDepartment(Long id, CreateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        if (request.getName() != null) department.setName(request.getName());
        if (request.getCode() != null) department.setCode(request.getCode());
        if (request.getDescription() != null) department.setDescription(request.getDescription());

        if (request.getHeadId() != null) {
            Employee head = employeeRepository.findById(request.getHeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getHeadId()));
            department.setHead(head);
        }

        Department saved = departmentRepository.save(department);
        return toDTO(saved);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        if (!department.getEmployees().isEmpty()) {
            throw new BadRequestException("Cannot delete department with employees");
        }
        departmentRepository.delete(department);
    }

    private DepartmentDTO toDTO(Department department) {
        return DepartmentDTO.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .description(department.getDescription())
                .headId(department.getHead() != null ? department.getHead().getId() : null)
                .headName(department.getHead() != null ? department.getHead().getFullName() : null)
                .parentDepartmentId(department.getParentDepartment() != null ? department.getParentDepartment().getId() : null)
                .parentDepartmentName(department.getParentDepartment() != null ? department.getParentDepartment().getName() : null)
                .employeeCount(department.getEmployees() != null ? department.getEmployees().size() : 0)
                .createdAt(department.getCreatedAt())
                .build();
    }

    private DepartmentDTO toDTOWithChildren(Department department) {
        DepartmentDTO dto = toDTO(department);
        List<DepartmentDTO> children = department.getChildDepartments() != null
                ? department.getChildDepartments().stream().map(this::toDTOWithChildren).toList()
                : Collections.emptyList();
        dto.setChildDepartments(children);
        return dto;
    }
}
