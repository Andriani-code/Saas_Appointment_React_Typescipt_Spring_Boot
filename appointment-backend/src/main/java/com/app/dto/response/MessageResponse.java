package com.app.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageResponse {
    private String id;
    private String conversationId;
    private String senderUserId;
    private String senderType;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
