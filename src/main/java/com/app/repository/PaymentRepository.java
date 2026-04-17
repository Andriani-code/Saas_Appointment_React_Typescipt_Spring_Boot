package com.app.repository;

import com.app.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @Query("SELECT p FROM Payment p JOIN FETCH p.reservation r WHERE r.id = :reservationId")
    Optional<Payment> findByReservationId(@Param("reservationId") UUID reservationId);

    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
}
