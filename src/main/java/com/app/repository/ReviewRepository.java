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

    @Query("SELECT r FROM Review r JOIN FETCH r.client c JOIN FETCH r.specialist s WHERE s.id = :specialistId AND r.isVisible = true")
    Page<Review> findVisibleBySpecialistId(@Param("specialistId") UUID specialistId, Pageable pageable);

    @Query("SELECT r FROM Review r JOIN FETCH r.client c JOIN FETCH r.specialist s WHERE c.id = :clientId")
    Page<Review> findByClientId(@Param("clientId") UUID clientId, Pageable pageable);

    boolean existsByReservationId(UUID reservationId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.specialist.id = :specialistId AND r.isVisible = true")
    Optional<Double> findAverageRatingBySpecialistId(@Param("specialistId") UUID specialistId);
}
