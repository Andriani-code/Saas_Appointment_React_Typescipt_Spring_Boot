package com.app.repository;

import com.app.entity.SpecialistService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpecialistServiceRepository extends JpaRepository<SpecialistService, UUID> {

    @Query("SELECT ss FROM SpecialistService ss JOIN FETCH ss.specialist s WHERE s.id = :specialistId AND ss.isActive = true")
    List<SpecialistService> findActiveBySpecialistId(@Param("specialistId") UUID specialistId);

    @Query("SELECT ss FROM SpecialistService ss JOIN FETCH ss.specialist s WHERE s.id = :specialistId")
    Page<SpecialistService> findBySpecialistId(@Param("specialistId") UUID specialistId, Pageable pageable);

    @Query("SELECT ss FROM SpecialistService ss JOIN FETCH ss.specialist s WHERE ss.id = :id AND s.id = :specialistId")
    Optional<SpecialistService> findByIdAndSpecialistId(@Param("id") UUID id, @Param("specialistId") UUID specialistId);
}
