package com.rania.hr.service;

import com.rania.hr.dto.CreateReviewRequest;
import com.rania.hr.dto.PerformanceReviewDTO;
import com.rania.hr.entity.Employee;
import com.rania.hr.entity.PerformanceReview;
import com.rania.hr.enums.ReviewStatus;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.EmployeeRepository;
import com.rania.hr.repository.PerformanceReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final PerformanceReviewRepository reviewRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public PerformanceReviewDTO createReview(CreateReviewRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        Employee reviewer = employeeRepository.findById(request.getReviewerId())
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer", "id", request.getReviewerId()));

        PerformanceReview review = PerformanceReview.builder()
                .employee(employee)
                .reviewer(reviewer)
                .period(request.getPeriod())
                .rating(request.getRating())
                .strengths(request.getStrengths())
                .improvements(request.getImprovements())
                .goals(request.getGoals())
                .status(ReviewStatus.DRAFT)
                .build();

        PerformanceReview saved = reviewRepository.save(review);
        return toDTO(saved);
    }

    @Transactional
    public PerformanceReviewDTO submitReview(Long reviewId) {
        PerformanceReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (review.getStatus() != ReviewStatus.DRAFT) {
            throw new BadRequestException("Review is not in DRAFT status");
        }

        review.setStatus(ReviewStatus.SUBMITTED);
        PerformanceReview saved = reviewRepository.save(review);
        return toDTO(saved);
    }

    @Transactional
    public PerformanceReviewDTO acknowledgeReview(Long reviewId) {
        PerformanceReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (review.getStatus() != ReviewStatus.SUBMITTED) {
            throw new BadRequestException("Review is not in SUBMITTED status");
        }

        review.setStatus(ReviewStatus.ACKNOWLEDGED);
        PerformanceReview saved = reviewRepository.save(review);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<PerformanceReviewDTO> getEmployeeReviews(Long employeeId) {
        return reviewRepository.findByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PerformanceReviewDTO> getReviewsByReviewer(Long reviewerId) {
        return reviewRepository.findByReviewerId(reviewerId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PerformanceReviewDTO getReviewById(Long id) {
        PerformanceReview review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));
        return toDTO(review);
    }

    @Transactional(readOnly = true)
    public Double getAverageRating(Long employeeId) {
        return reviewRepository.getAverageRating(employeeId);
    }

    private PerformanceReviewDTO toDTO(PerformanceReview review) {
        return PerformanceReviewDTO.builder()
                .id(review.getId())
                .employeeId(review.getEmployee().getId())
                .employeeName(review.getEmployee().getFullName())
                .reviewerId(review.getReviewer().getId())
                .reviewerName(review.getReviewer().getFullName())
                .period(review.getPeriod())
                .rating(review.getRating())
                .strengths(review.getStrengths())
                .improvements(review.getImprovements())
                .goals(review.getGoals())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
