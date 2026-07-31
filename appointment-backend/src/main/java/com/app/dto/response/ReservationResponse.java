package com.app.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ReservationResponse {
    private String id;
    private String clientId;
    private String clientFullName;
    private String providerId;
    private String providerDisplayName;
    private String serviceId;
    private String serviceName;
    private SlotResponse slot;
    private String status;
    private String clientMessage;
    private Boolean depositRequired;
    private BigDecimal depositAmount;
    private LocalDateTime createdAt;
}
