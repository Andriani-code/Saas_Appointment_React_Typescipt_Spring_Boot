package com.app.repository;

import com.app.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {

    boolean existsByClientIdAndProviderId(UUID clientId, UUID providerId);

    Optional<Favorite> findByClientIdAndProviderId(UUID clientId, UUID providerId);

    @Query("SELECT f FROM Favorite f JOIN FETCH f.provider WHERE f.client.id = :clientId ORDER BY f.createdAt DESC")
    List<Favorite> findAllByClientId(@Param("clientId") UUID clientId);

    void deleteByClientIdAndProviderId(UUID clientId, UUID providerId);
}
