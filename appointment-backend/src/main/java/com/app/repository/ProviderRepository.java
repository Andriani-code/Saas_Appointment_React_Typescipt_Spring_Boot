package com.app.repository;

import com.app.entity.Provider;
import com.app.entity.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderRepository extends JpaRepository<Provider, UUID> {

    @Query("SELECT s FROM Provider s JOIN FETCH s.user WHERE s.user.id = :userId")
    Optional<Provider> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM Provider s JOIN FETCH s.user WHERE s.user.email = :email")
    Optional<Provider> findByUserEmail(@Param("email") String email);

    Page<Provider> findByIsActiveAndIsVerified(Boolean isActive, Boolean isVerified, Pageable pageable);

    Page<Provider> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    /**
     * Find providers sorted by distance from given coordinates using Haversine formula.
     * Returns providers within radiusKm kilometers.
     */
    @Query(value = """
            SELECT s.* FROM providers s
            JOIN addresses a ON s.service_address_id = a.id
            WHERE s.is_active = true AND s.is_verified = true
              AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL
              AND (
                6371 * acos(
                  cos(radians(:lat)) * cos(radians(a.latitude))
                  * cos(radians(a.longitude) - radians(:lng))
                  + sin(radians(:lat)) * sin(radians(a.latitude))
                )
              ) <= :radiusKm
            ORDER BY (
                6371 * acos(
                  cos(radians(:lat)) * cos(radians(a.latitude))
                  * cos(radians(a.longitude) - radians(:lng))
                  + sin(radians(:lat)) * sin(radians(a.latitude))
                )
            ) ASC
            """,
            countQuery = """
            SELECT COUNT(s.id) FROM providers s
            JOIN addresses a ON s.service_address_id = a.id
            WHERE s.is_active = true AND s.is_verified = true
              AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL
              AND (
                6371 * acos(
                  cos(radians(:lat)) * cos(radians(a.latitude))
                  * cos(radians(a.longitude) - radians(:lng))
                  + sin(radians(:lat)) * sin(radians(a.latitude))
                )
              ) <= :radiusKm
            """,
            nativeQuery = true)
    Page<Provider> findNearbyProviders(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm,
            Pageable pageable);
}
