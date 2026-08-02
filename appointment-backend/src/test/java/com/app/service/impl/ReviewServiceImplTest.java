package com.app.service.impl;

import com.app.dto.request.ReviewRequest;
import com.app.dto.response.ReviewResponse;
import com.app.entity.Client;
import com.app.entity.Provider;
import com.app.entity.Reservation;
import com.app.entity.Review;
import com.app.entity.User;
import com.app.entity.enums.ReservationStatus;
import com.app.entity.enums.Role;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.ReviewMapper;
import com.app.repository.ClientRepository;
import com.app.repository.ReservationRepository;
import com.app.repository.ReviewRepository;
import com.app.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ReviewMapper reviewMapper;

    private ReviewServiceImpl service() {
        return new ReviewServiceImpl(reviewRepository, reservationRepository, clientRepository, reviewMapper);
    }

    @Test
    void createRejectsReservationOfAnotherClient() {
        ReviewServiceImpl service = service();

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                .firstName("Jane")
                .lastName("Doe")
                .build();

        Client otherClient = Client.builder().id(UUID.randomUUID()).build();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .client(otherClient)
                .status(ReservationStatus.COMPLETED)
                .build();

        ReviewRequest request = new ReviewRequest();
        request.setReservationId(reservation.getId().toString());
        request.setRating(5);

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(reservationRepository.findByIdWithDetails(reservation.getId())).thenReturn(Optional.of(reservation));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            assertThrows(UnauthorizedException.class, () -> service.create(request));
        }
    }

    @Test
    void createRejectsNonCompletedReservation() {
        ReviewServiceImpl service = service();

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                .firstName("Jane")
                .lastName("Doe")
                .build();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .status(ReservationStatus.PENDING)
                .build();

        ReviewRequest request = new ReviewRequest();
        request.setReservationId(reservation.getId().toString());
        request.setRating(5);

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(reservationRepository.findByIdWithDetails(reservation.getId())).thenReturn(Optional.of(reservation));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            assertThrows(BadRequestException.class, () -> service.create(request));
        }
    }

    @Test
    void createRejectsDuplicateReview() {
        ReviewServiceImpl service = service();

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                .build();

        Provider provider = Provider.builder().id(UUID.randomUUID()).build();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .status(ReservationStatus.COMPLETED)
                .build();

        ReviewRequest request = new ReviewRequest();
        request.setReservationId(reservation.getId().toString());
        request.setRating(4);
        request.setComment("Très bien");

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(reservationRepository.findByIdWithDetails(reservation.getId())).thenReturn(Optional.of(reservation));
        when(reviewRepository.existsByReservationId(reservation.getId())).thenReturn(true);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            assertThrows(BadRequestException.class, () -> service.create(request));
        }
    }

    @Test
    void createSavesReviewForCompletedReservation() {
        ReviewServiceImpl service = service();

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                .firstName("Jane")
                .lastName("Doe")
                .build();

        Provider provider = Provider.builder().id(UUID.randomUUID()).build();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .status(ReservationStatus.COMPLETED)
                .build();

        Review saved = Review.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .reservation(reservation)
                .rating((short) 4)
                .comment("Très bien")
                .isVisible(true)
                .build();

        ReviewResponse response = new ReviewResponse();
        response.setId(saved.getId().toString());

        ReviewRequest request = new ReviewRequest();
        request.setReservationId(reservation.getId().toString());
        request.setRating(4);
        request.setComment("Très bien");

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(reservationRepository.findByIdWithDetails(reservation.getId())).thenReturn(Optional.of(reservation));
        when(reviewRepository.existsByReservationId(reservation.getId())).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(saved);
        when(reviewMapper.toResponse(saved)).thenReturn(response);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            ReviewResponse result = service.create(request);

            assertEquals(saved.getId().toString(), result.getId());

            ArgumentCaptor<Review> captor = ArgumentCaptor.forClass(Review.class);
            verify(reviewRepository).save(captor.capture());
            assertEquals((short) 4, captor.getValue().getRating());
            assertEquals("Très bien", captor.getValue().getComment());
            assertEquals(true, captor.getValue().getIsVisible());
        }
    }

    @Test
    void getMyReviewsReturnsEmptyPageWhenClientMissing() {
        ReviewServiceImpl service = service();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            var result = service.getMyReviews(Pageable.unpaged());

            assertEquals(0, result.getContent().size());
            verify(reviewRepository, never()).findByClientId(any(), any());
        }
    }

    @Test
    void toggleVisibilityFlipsIsVisible() {
        ReviewServiceImpl service = service();

        Review review = Review.builder()
                .id(UUID.randomUUID())
                .isVisible(true)
                .build();

        when(reviewRepository.findById(review.getId())).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        service.toggleVisibility(review.getId().toString());

        ArgumentCaptor<Review> captor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(captor.capture());
        assertEquals(false, captor.getValue().getIsVisible());
    }

    @Test
    void toggleVisibilityThrowsWhenReviewMissing() {
        ReviewServiceImpl service = service();

        when(reviewRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.toggleVisibility(UUID.randomUUID().toString()));
    }
}
