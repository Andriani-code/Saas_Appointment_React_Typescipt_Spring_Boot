package com.app.service.impl;

import com.app.dto.request.ReviewRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ReviewResponse;
import com.app.entity.Client;
import com.app.entity.Reservation;
import com.app.entity.Review;
import com.app.entity.enums.ReservationStatus;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.ReviewMapper;
import com.app.repository.ClientRepository;
import com.app.repository.ReservationRepository;
import com.app.repository.ReviewRepository;
import com.app.service.ReviewService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final ReviewMapper reviewMapper;

    @Override
    @Transactional
    public ReviewResponse create(ReviewRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Client client = clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Client profile not found"));

        Reservation reservation = reservationRepository
                .findByIdWithDetails(UUID.fromString(request.getReservationId()))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", request.getReservationId()));

        if (!reservation.getClient().getId().equals(client.getId())) {
            throw new UnauthorizedException("This reservation does not belong to you");
        }

        if (reservation.getStatus() != ReservationStatus.COMPLETED) {
            throw new BadRequestException("Reviews can only be submitted for COMPLETED reservations");
        }

        if (reviewRepository.existsByReservationId(reservation.getId())) {
            throw new BadRequestException("A review has already been submitted for this reservation");
        }

        Review review = Review.builder()
                .client(client)
                .specialist(reservation.getSpecialist())
                .reservation(reservation)
                .rating(request.getRating())
                .comment(request.getComment())
                .isVisible(true)
                .build();

        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getBySpecialist(String specialistId, Pageable pageable) {
        return PageResponse.from(
                reviewRepository.findVisibleBySpecialistId(UUID.fromString(specialistId), pageable),
                reviewMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        Client client = clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Client profile not found"));
        return PageResponse.from(
                reviewRepository.findByClientId(client.getId(), pageable),
                reviewMapper::toResponse);
    }

    @Override
    @Transactional
    public void toggleVisibility(String reviewId) {
        Review review = reviewRepository.findById(UUID.fromString(reviewId))
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        review.setIsVisible(!review.getIsVisible());
        reviewRepository.save(review);
    }
}
