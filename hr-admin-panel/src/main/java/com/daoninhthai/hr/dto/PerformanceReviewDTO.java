package com.daoninhthai.hr.dto;

import com.daoninhthai.hr.enums.ReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceReviewDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long reviewerId;
    private String reviewerName;
    private String period;
    private Integer rating;
    private String strengths;
    private String improvements;
    private String goals;
    private ReviewStatus status;
    private LocalDateTime createdAt;
}
