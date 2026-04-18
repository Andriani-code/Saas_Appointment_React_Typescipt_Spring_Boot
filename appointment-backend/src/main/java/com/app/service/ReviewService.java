package com.app.service;

import com.app.dto.request.ReviewRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ReviewResponse;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse create(ReviewRequest request);
    PageResponse<ReviewResponse> getBySpecialist(String specialistId, Pageable pageable);
    PageResponse<ReviewResponse> getMyReviews(Pageable pageable);
    void toggleVisibility(String reviewId);
}
