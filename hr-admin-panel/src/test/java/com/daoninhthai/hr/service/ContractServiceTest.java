package com.daoninhthai.hr.service;

import com.daoninhthai.hr.dto.ContractDTO;
import com.daoninhthai.hr.dto.ContractRequest;
import com.daoninhthai.hr.entity.Contract;
import com.daoninhthai.hr.entity.Employee;
import com.daoninhthai.hr.enums.ContractStatus;
import com.daoninhthai.hr.enums.ContractType;
import com.daoninhthai.hr.exception.BadRequestException;
import com.daoninhthai.hr.repository.ContractRepository;
import com.daoninhthai.hr.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private ContractService contractService;

    @Test
    void createContractAssignsNumberAndEmployeeDetails() {
        AtomicInteger temporaryNumberLength = new AtomicInteger();
        Employee employee = Employee.builder()
                .id(7L)
                .employeeCode("EMP-7")
                .firstName("Alex")
                .lastName("Martin")
                .build();
        when(employeeRepository.findById(7L)).thenReturn(Optional.of(employee));
        when(contractRepository.saveAndFlush(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            temporaryNumberLength.set(contract.getContractNumber().length());
            contract.setId(42L);
            return contract;
        });
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContractDTO result = contractService.createContract(request());

        assertEquals("CTR-000042", result.getContractNumber());
        assertEquals(30, temporaryNumberLength.get());
        assertEquals(7L, result.getEmployeeId());
        assertEquals("Alex Martin", result.getEmployeeName());
        assertEquals(ContractStatus.DRAFT, result.getStatus());
        verify(contractRepository).saveAndFlush(any(Contract.class));
    }

    @Test
    void updateArchivedContractIsRejected() {
        Contract archivedContract = Contract.builder()
                .id(42L)
                .status(ContractStatus.ARCHIVED)
                .build();
        when(contractRepository.findById(42L)).thenReturn(Optional.of(archivedContract));

        assertThrows(BadRequestException.class, () -> contractService.updateContract(42L, request()));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void createRejectsEndDateBeforeStartDate() {
        ContractRequest request = request();
        request.setEndDate(LocalDate.of(2024, 12, 31));

        assertThrows(BadRequestException.class, () -> contractService.createContract(request));

        verify(employeeRepository, never()).findById(any());
        verify(contractRepository, never()).save(any(Contract.class));
    }

    private ContractRequest request() {
        ContractRequest request = new ContractRequest();
        request.setEmployeeId(7L);
        request.setType(ContractType.CDI);
        request.setStartDate(LocalDate.of(2025, 1, 1));
        return request;
    }
}
