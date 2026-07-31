package com.app.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationResponse {
    private String id;
    private String clientId;
    private String clientFullName;
    private String providerId;
    private String providerDisplayName;
    private String reservationId;
    private Boolean isActive;
    private long unreadCount;
    private LocalDateTime createdAt;
}
