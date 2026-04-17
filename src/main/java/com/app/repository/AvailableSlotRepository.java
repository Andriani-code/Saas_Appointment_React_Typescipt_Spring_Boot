package com.app.repository;

import com.app.entity.AvailableSlot;
import com.app.entity.enums.SlotStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AvailableSlotRepository extends JpaRepository<AvailableSlot, UUID> {

    @Query("SELECT slot FROM AvailableSlot slot JOIN FETCH slot.specialist s WHERE s.id = :specialistId AND slot.date = :date AND slot.status = :status")
    List<AvailableSlot> findBySpecialistIdAndDateAndStatus(
            @Param("specialistId") UUID specialistId,
            @Param("date") LocalDate date,
            @Param("status") SlotStatus status);

    @Query("SELECT slot FROM AvailableSlot slot JOIN FETCH slot.specialist s WHERE s.id = :specialistId AND slot.date BETWEEN :startDate AND :endDate AND slot.status = :status")
    Page<AvailableSlot> findBySpecialistIdAndDateRangeAndStatus(
            @Param("specialistId") UUID specialistId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") SlotStatus status,
            Pageable pageable);

    boolean existsBySpecialistIdAndDateAndStartTime(UUID specialistId, LocalDate date, LocalTime startTime);

    @Query("SELECT slot FROM AvailableSlot slot JOIN FETCH slot.specialist s WHERE s.id = :specialistId AND slot.date = :date")
    List<AvailableSlot> findBySpecialistIdAndDate(
            @Param("specialistId") UUID specialistId,
            @Param("date") LocalDate date);
}
