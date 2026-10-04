package com.rania.hr.repository;

import com.rania.hr.entity.LeaveRequest;
import com.rania.hr.enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findAllByOrderByCreatedAtDesc();

    List<LeaveRequest> findByEmployeeId(Long employeeId);

    List<LeaveRequest> findByStatus(LeaveStatus status);

    List<LeaveRequest> findByEmployeeIdAndStatus(Long employeeId, LeaveStatus status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = 'APPROVED' " +
            "AND :date BETWEEN lr.startDate AND lr.endDate")
    List<LeaveRequest> findApprovedLeavesOnDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.status = 'APPROVED' " +
            "AND :date BETWEEN lr.startDate AND lr.endDate")
    long countOnLeaveToday(@Param("date") LocalDate date);
}
