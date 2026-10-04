package com.rania.hr.service;

import com.rania.hr.dto.PayrollDTO;
import com.rania.hr.entity.Employee;
import com.rania.hr.entity.Payroll;
import com.rania.hr.enums.EmployeeStatus;
import com.rania.hr.enums.PayrollStatus;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.EmployeeRepository;
import com.rania.hr.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;

    private static final BigDecimal TAX_RATE = new BigDecimal("0.10");
    private static final BigDecimal INSURANCE_RATE = new BigDecimal("0.08");

    @Transactional
    public List<PayrollDTO> calculateMonthly(int month, int year) {
        List<Employee> activeEmployees = employeeRepository.findByStatus(EmployeeStatus.ACTIVE);
        List<PayrollDTO> payrolls = new ArrayList<>();

        for (Employee employee : activeEmployees) {
            if (payrollRepository.existsByEmployeeIdAndMonthAndYear(employee.getId(), month, year)) {
                continue;
            }

            BigDecimal baseSalary = employee.getSalary() != null ? employee.getSalary() : BigDecimal.ZERO;
            BigDecimal tax = baseSalary.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal insurance = baseSalary.multiply(INSURANCE_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal deductions = tax.add(insurance);
            BigDecimal netSalary = baseSalary.subtract(deductions);

            Payroll payroll = Payroll.builder()
                    .employee(employee)
                    .month(month)
                    .year(year)
                    .baseSalary(baseSalary)
                    .overtime(BigDecimal.ZERO)
                    .deductions(deductions)
                    .bonus(BigDecimal.ZERO)
                    .netSalary(netSalary)
                    .status(PayrollStatus.CALCULATED)
                    .build();

            Payroll saved = payrollRepository.save(payroll);
            payrolls.add(toDTO(saved));
        }

        return payrolls;
    }

    @Transactional(readOnly = true)
    public PayrollDTO generatePayslip(Long employeeId, int month, int year) {
        Payroll payroll = payrollRepository.findByEmployeeIdAndMonthAndYear(employeeId, month, year)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payroll not found for employee " + employeeId + " for " + month + "/" + year));
        return toDTO(payroll);
    }

    @Transactional(readOnly = true)
    public List<PayrollDTO> getPayrollHistory(Long employeeId) {
        return payrollRepository.findByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PayrollDTO> getMonthlyPayroll(int month, int year) {
        return payrollRepository.findByMonthAndYear(month, year).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public PayrollDTO approvePayroll(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll", "id", payrollId));

        if (payroll.getStatus() != PayrollStatus.CALCULATED) {
            throw new BadRequestException("Payroll must be in CALCULATED status to approve");
        }

        payroll.setStatus(PayrollStatus.APPROVED);
        Payroll saved = payrollRepository.save(payroll);
        return toDTO(saved);
    }

    private PayrollDTO toDTO(Payroll payroll) {
        return PayrollDTO.builder()
                .id(payroll.getId())
                .employeeId(payroll.getEmployee().getId())
                .employeeName(payroll.getEmployee().getFullName())
                .employeeCode(payroll.getEmployee().getEmployeeCode())
                .month(payroll.getMonth())
                .year(payroll.getYear())
                .baseSalary(payroll.getBaseSalary())
                .overtime(payroll.getOvertime())
                .deductions(payroll.getDeductions())
                .bonus(payroll.getBonus())
                .netSalary(payroll.getNetSalary())
                .status(payroll.getStatus())
                .createdAt(payroll.getCreatedAt())
                .build();
    }
}
