package com.app.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "reviews",
        uniqueConstraints = @UniqueConstraint(columnNames = {"client_id", "reservation_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Review extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialist_id", nullable = false)
    private Specialist specialist;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Reservation reservation;

    @Column(nullable = false)
    private Short rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private Boolean isVisible = true;
}
