package com.app.controller;

import com.app.dto.request.ReviewRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ReviewResponse;
import com.app.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Client reviews for specialists")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Submit a review for a completed reservation")
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(request));
    }

    @GetMapping("/specialist/{specialistId}")
    @Operation(summary = "Get visible reviews for a specialist (public)")
    public ResponseEntity<PageResponse<ReviewResponse>> getBySpecialist(
            @PathVariable String specialistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reviewService.getBySpecialist(specialistId, PageRequest.of(page, size)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my submitted reviews")
    public ResponseEntity<PageResponse<ReviewResponse>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reviewService.getMyReviews(PageRequest.of(page, size)));
    }

    @PatchMapping("/{id}/visibility")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Toggle review visibility (admin only)")
    public ResponseEntity<Void> toggleVisibility(@PathVariable String id) {
        reviewService.toggleVisibility(id);
        return ResponseEntity.noContent().build();
    }
}
