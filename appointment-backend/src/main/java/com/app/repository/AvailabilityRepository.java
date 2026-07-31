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

    @Query("SELECT a FROM Availability a JOIN FETCH a.provider s WHERE s.id = :providerId AND a.isActive = true")
    List<Availability> findActiveByProviderId(@Param("providerId") UUID providerId);

    @Query("SELECT a FROM Availability a JOIN FETCH a.provider s WHERE s.id = :providerId AND a.date = :date")
    Optional<Availability> findByProviderIdAndDate(
            @Param("providerId") UUID providerId,
            @Param("date") LocalDate date);

    @Query("SELECT a FROM Availability a JOIN FETCH a.provider s WHERE s.id = :providerId")
    List<Availability> findAllByProviderId(@Param("providerId") UUID providerId);
}
