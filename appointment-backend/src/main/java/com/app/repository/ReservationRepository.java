package com.app.repository;

import com.app.entity.Reservation;
import com.app.entity.enums.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.client c
            JOIN FETCH r.specialist s
            JOIN FETCH r.service sv
            JOIN FETCH r.slot sl
            WHERE c.id = :clientId
            """)
    Page<Reservation> findByClientId(@Param("clientId") UUID clientId, Pageable pageable);

    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.client c
            JOIN FETCH r.specialist s
            JOIN FETCH r.service sv
            JOIN FETCH r.slot sl
            WHERE s.id = :specialistId
            """)
    Page<Reservation> findBySpecialistId(@Param("specialistId") UUID specialistId, Pageable pageable);

    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.client c
            JOIN FETCH r.specialist s
            JOIN FETCH r.service sv
            JOIN FETCH r.slot sl
            WHERE c.id = :clientId AND r.status = :status
            """)
    Page<Reservation> findByClientIdAndStatus(
            @Param("clientId") UUID clientId,
            @Param("status") ReservationStatus status,
            Pageable pageable);

    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.client c
            JOIN FETCH r.specialist s
            JOIN FETCH r.service sv
            JOIN FETCH r.slot sl
            WHERE s.id = :specialistId AND r.status = :status
            """)
    Page<Reservation> findBySpecialistIdAndStatus(
            @Param("specialistId") UUID specialistId,
            @Param("status") ReservationStatus status,
            Pageable pageable);

    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.client c
            JOIN FETCH r.specialist s
            JOIN FETCH r.service sv
            JOIN FETCH r.slot sl
            WHERE r.id = :id
            """)
    Optional<Reservation> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.client c
            JOIN FETCH r.specialist s
            JOIN FETCH r.service sv
            JOIN FETCH r.slot sl
            WHERE sl.date = :date 
            AND r.status = :status 
            AND r.reminderSent = false
            """)
    List<Reservation> findForReminder(
            @Param("date") LocalDate date, 
            @Param("status") ReservationStatus status);

    boolean existsBySlotIdAndStatusNot(UUID slotId, ReservationStatus status);
}
