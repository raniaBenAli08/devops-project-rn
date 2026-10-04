package com.rania.hr.controller;

import com.rania.hr.dto.CreateReviewRequest;
import com.rania.hr.dto.PerformanceReviewDTO;
import com.rania.hr.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<PerformanceReviewDTO> createReview(@Valid @RequestBody CreateReviewRequest request) {
        return new ResponseEntity<>(reviewService.createReview(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerformanceReviewDTO> getReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewById(id));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<PerformanceReviewDTO> submitReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.submitReview(id));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<PerformanceReviewDTO> acknowledgeReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.acknowledgeReview(id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PerformanceReviewDTO>> getEmployeeReviews(@PathVariable Long employeeId) {
        return ResponseEntity.ok(reviewService.getEmployeeReviews(employeeId));
    }

    @GetMapping("/reviewer/{reviewerId}")
    public ResponseEntity<List<PerformanceReviewDTO>> getReviewsByReviewer(@PathVariable Long reviewerId) {
        return ResponseEntity.ok(reviewService.getReviewsByReviewer(reviewerId));
    }

    @GetMapping("/employee/{employeeId}/average-rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long employeeId) {
        return ResponseEntity.ok(reviewService.getAverageRating(employeeId));
    }
}
