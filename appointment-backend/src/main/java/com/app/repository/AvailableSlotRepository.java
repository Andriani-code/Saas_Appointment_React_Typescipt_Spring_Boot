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

    @Query("SELECT slot FROM AvailableSlot slot JOIN FETCH slot.provider s WHERE s.id = :providerId AND slot.date = :date AND slot.status = :status")
    List<AvailableSlot> findByProviderIdAndDateAndStatus(
            @Param("providerId") UUID providerId,
            @Param("date") LocalDate date,
            @Param("status") SlotStatus status);

    @Query("SELECT slot FROM AvailableSlot slot JOIN FETCH slot.provider s WHERE s.id = :providerId AND slot.date BETWEEN :startDate AND :endDate AND slot.status = :status")
    Page<AvailableSlot> findByProviderIdAndDateRangeAndStatus(
            @Param("providerId") UUID providerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") SlotStatus status,
            Pageable pageable);

    boolean existsByProviderIdAndDateAndStartTime(UUID providerId, LocalDate date, LocalTime startTime);

    @Query("SELECT slot FROM AvailableSlot slot JOIN FETCH slot.provider s WHERE s.id = :providerId AND slot.date = :date")
    List<AvailableSlot> findByProviderIdAndDate(
            @Param("providerId") UUID providerId,
            @Param("date") LocalDate date);

    @Query("SELECT slot FROM AvailableSlot slot JOIN FETCH slot.provider s WHERE s.id = :providerId AND slot.date BETWEEN :startDate AND :endDate")
    Page<AvailableSlot> findByProviderIdAndDateRange(
            @Param("providerId") UUID providerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AvailableSlot s WHERE s.id = :id")
    java.util.Optional<AvailableSlot> findByIdWithLock(@Param("id") UUID id);
}
