package com.app.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Address extends BaseEntity {
    @Column(nullable = false, columnDefinition = "UUID")
    private String userId;

    @Column(nullable = false)
    private String country;

    private String region;

    @Column(nullable = false)
    private String city;

    private String district;

    @Column(name = "address_line")
    private String addressLine;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;
}
