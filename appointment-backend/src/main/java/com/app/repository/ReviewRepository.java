package com.app.repository;

import com.app.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    @Query("SELECT r FROM Review r JOIN FETCH r.client c JOIN FETCH r.provider s WHERE s.id = :providerId AND r.isVisible = true")
    Page<Review> findVisibleByProviderId(@Param("providerId") UUID providerId, Pageable pageable);

    @Query("SELECT r FROM Review r JOIN FETCH r.client c JOIN FETCH r.provider s WHERE c.id = :clientId")
    Page<Review> findByClientId(@Param("clientId") UUID clientId, Pageable pageable);

    boolean existsByReservationId(UUID reservationId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.provider.id = :providerId AND r.isVisible = true")
    Optional<Double> findAverageRatingByProviderId(@Param("providerId") UUID providerId);
}
