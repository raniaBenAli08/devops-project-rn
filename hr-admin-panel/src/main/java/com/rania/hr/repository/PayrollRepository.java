package com.rania.hr.repository;

import com.rania.hr.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    List<Payroll> findByEmployeeId(Long employeeId);

    List<Payroll> findByMonthAndYear(Integer month, Integer year);

    Optional<Payroll> findByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);

    boolean existsByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);
}
