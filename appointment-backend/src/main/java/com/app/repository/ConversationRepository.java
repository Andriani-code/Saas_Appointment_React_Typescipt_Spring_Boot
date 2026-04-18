package com.app.repository;

import com.app.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("""
            SELECT c FROM Conversation c
            JOIN FETCH c.client cl
            JOIN FETCH c.specialist s
            WHERE cl.id = :clientId AND c.isActive = true
            """)
    Page<Conversation> findActiveByClientId(@Param("clientId") UUID clientId, Pageable pageable);

    @Query("""
            SELECT c FROM Conversation c
            JOIN FETCH c.client cl
            JOIN FETCH c.specialist s
            WHERE s.id = :specialistId AND c.isActive = true
            """)
    Page<Conversation> findActiveBySpecialistId(@Param("specialistId") UUID specialistId, Pageable pageable);

    @Query("""
            SELECT c FROM Conversation c
            WHERE c.client.id = :clientId AND c.specialist.id = :specialistId AND c.isActive = true
            """)
    Optional<Conversation> findByClientIdAndSpecialistId(
            @Param("clientId") UUID clientId,
            @Param("specialistId") UUID specialistId);

    @Query("""
            SELECT c FROM Conversation c
            JOIN FETCH c.client cl
            JOIN FETCH c.specialist s
            WHERE c.reservation.id = :reservationId
            """)
    Optional<Conversation> findByReservationId(@Param("reservationId") UUID reservationId);
}
