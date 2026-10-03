package com.daoninhthai.hr.repository;

import com.daoninhthai.hr.entity.LeaveBalance;
import com.daoninhthai.hr.enums.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);

    List<LeaveBalance> findByYear(Integer year);

    Optional<LeaveBalance> findByEmployeeIdAndYearAndType(Long employeeId, Integer year, LeaveType type);
}
