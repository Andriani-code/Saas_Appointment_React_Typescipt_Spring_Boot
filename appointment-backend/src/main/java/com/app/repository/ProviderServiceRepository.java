package com.app.repository;

import com.app.entity.ProviderService;
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
public interface ProviderServiceRepository extends JpaRepository<ProviderService, UUID> {

    @Query("SELECT ss FROM ProviderService ss JOIN FETCH ss.provider s WHERE s.id = :providerId AND ss.isActive = true")
    List<ProviderService> findActiveByProviderId(@Param("providerId") UUID providerId);

    @Query("SELECT ss FROM ProviderService ss JOIN FETCH ss.provider s WHERE s.id = :providerId")
    Page<ProviderService> findByProviderId(@Param("providerId") UUID providerId, Pageable pageable);

    @Query("SELECT ss FROM ProviderService ss JOIN FETCH ss.provider s WHERE ss.id = :id AND s.id = :providerId")
    Optional<ProviderService> findByIdAndProviderId(@Param("id") UUID id, @Param("providerId") UUID providerId);
}
