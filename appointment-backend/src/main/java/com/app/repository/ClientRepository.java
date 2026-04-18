package com.app.repository;

import com.app.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    @Query("SELECT c FROM Client c JOIN FETCH c.user WHERE c.user.id = :userId")
    Optional<Client> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Client c JOIN FETCH c.user WHERE c.user.email = :email")
    Optional<Client> findByUserEmail(@Param("email") String email);

    boolean existsByUserId(UUID userId);
}
