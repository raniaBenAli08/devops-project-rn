package com.rania.hr.repository;

import com.rania.hr.entity.PerformanceReview;
import com.rania.hr.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, Long> {

    List<PerformanceReview> findByEmployeeId(Long employeeId);

    List<PerformanceReview> findByReviewerId(Long reviewerId);

    List<PerformanceReview> findByStatus(ReviewStatus status);

    List<PerformanceReview> findByEmployeeIdAndPeriod(Long employeeId, String period);

    @Query("SELECT AVG(pr.rating) FROM PerformanceReview pr WHERE pr.employee.id = :employeeId")
    Double getAverageRating(@Param("employeeId") Long employeeId);
}
