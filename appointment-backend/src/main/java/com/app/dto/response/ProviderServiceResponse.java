package com.app.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProviderServiceResponse {
    private String id;
    private String providerId;
    private String providerDisplayName;
    private String name;
    private String description;
    private String photoUrl;
    private Integer durationMinutes;
    private BigDecimal price;
    private Boolean depositEnabled;
    private BigDecimal depositAmount;
    private Boolean isActive;
}
