package com.app.repository;

import com.app.entity.VerificationRequest;
import com.app.entity.Specialist;
import com.app.entity.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, UUID> {
    Optional<VerificationRequest> findBySpecialistAndStatus(Specialist specialist, VerificationStatus status);
    boolean existsBySpecialistAndStatus(Specialist specialist, VerificationStatus status);
}
