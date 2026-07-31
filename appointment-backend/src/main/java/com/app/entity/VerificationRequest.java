package com.app.entity;

import com.app.entity.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "verification_requests",
       uniqueConstraints = @UniqueConstraint(columnNames = {"provider_id"}))
public class VerificationRequest extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false, unique = true)
    private Provider provider;

    @Column(columnDefinition = "TEXT")
    private String description;

    // JSON array of document URLs (can be null)
    @Column(columnDefinition = "TEXT")
    private String documents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationStatus status = VerificationStatus.NONE;
}
