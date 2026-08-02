package com.app.service;

import com.app.dto.request.MessageRequest;
import com.app.dto.response.ConversationResponse;
import com.app.dto.response.MessageResponse;
import com.app.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface MessagingService {
    MessageResponse sendMessage(String conversationId, MessageRequest request);
    PageResponse<MessageResponse> getMessages(String conversationId, Pageable pageable);
    PageResponse<ConversationResponse> getMyConversations(Pageable pageable);
    ConversationResponse getConversation(String conversationId);
    ConversationResponse getOrCreateConversation(String providerId);
    ConversationResponse getOrCreateConversationForReservation(String reservationId);
    void markAsRead(String conversationId);
}
