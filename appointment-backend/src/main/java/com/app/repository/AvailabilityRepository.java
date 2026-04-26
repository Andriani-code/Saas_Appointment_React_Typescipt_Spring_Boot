package com.app.repository;

import com.app.entity.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, UUID> {

    @Query("SELECT a FROM Availability a JOIN FETCH a.specialist s WHERE s.id = :specialistId AND a.isActive = true")
    List<Availability> findActiveBySpecialistId(@Param("specialistId") UUID specialistId);

    @Query("SELECT a FROM Availability a JOIN FETCH a.specialist s WHERE s.id = :specialistId AND a.date = :date")
    Optional<Availability> findBySpecialistIdAndDate(
            @Param("specialistId") UUID specialistId,
            @Param("date") LocalDate date);

    @Query("SELECT a FROM Availability a JOIN FETCH a.specialist s WHERE s.id = :specialistId")
    List<Availability> findAllBySpecialistId(@Param("specialistId") UUID specialistId);
}
