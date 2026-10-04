package com.rania.hr.service;

import com.rania.hr.dto.OrgNodeDTO;
import com.rania.hr.entity.Employee;
import com.rania.hr.enums.EmployeeStatus;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrgChartService {

    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<OrgNodeDTO> getOrgTree() {
        List<Employee> topLevel = employeeRepository.findAll().stream()
                .filter(e -> e.getManager() == null && e.getStatus() == EmployeeStatus.ACTIVE)
                .toList();

        return topLevel.stream()
                .map(this::buildOrgNode)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrgNodeDTO> getDirectReports(Long managerId) {
        employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", managerId));

        List<Employee> reports = employeeRepository.findByManagerId(managerId);
        return reports.stream()
                .map(this::toOrgNode)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrgNodeDTO> getTeamMembers(Long managerId) {
        employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", managerId));

        List<OrgNodeDTO> team = new ArrayList<>();
        collectTeamMembers(managerId, team);
        return team;
    }

    @Transactional(readOnly = true)
    public List<OrgNodeDTO> getReportingChain(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        List<OrgNodeDTO> chain = new ArrayList<>();
        Employee current = employee;
        while (current != null) {
            chain.add(0, toOrgNode(current));
            current = current.getManager();
        }
        return chain;
    }

    private OrgNodeDTO buildOrgNode(Employee employee) {
        OrgNodeDTO node = toOrgNode(employee);
        List<Employee> reports = employeeRepository.findByManagerId(employee.getId());
        List<OrgNodeDTO> children = reports.stream()
                .filter(e -> e.getStatus() == EmployeeStatus.ACTIVE)
                .map(this::buildOrgNode)
                .toList();
        node.setDirectReports(children);
        return node;
    }

    private void collectTeamMembers(Long managerId, List<OrgNodeDTO> team) {
        List<Employee> directReports = employeeRepository.findByManagerId(managerId);
        for (Employee report : directReports) {
            if (report.getStatus() == EmployeeStatus.ACTIVE) {
                team.add(toOrgNode(report));
                collectTeamMembers(report.getId(), team);
            }
        }
    }

    private OrgNodeDTO toOrgNode(Employee employee) {
        return OrgNodeDTO.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .fullName(employee.getFullName())
                .positionTitle(employee.getPosition() != null ? employee.getPosition().getTitle() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .email(employee.getEmail())
                .build();
    }
}
