package com.app.controller;

import com.app.dto.request.MessageRequest;
import com.app.dto.response.ConversationResponse;
import com.app.dto.response.MessageResponse;
import com.app.dto.response.PageResponse;
import com.app.service.MessagingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Messaging", description = "Conversations and messages between clients and specialists")
public class MessageController {

    private final MessagingService messagingService;

    @GetMapping("/conversations")
    @Operation(summary = "Get my conversations")
    public ResponseEntity<PageResponse<ConversationResponse>> getConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(messagingService.getMyConversations(PageRequest.of(page, size)));
    }

    @GetMapping("/conversations/{conversationId}")
    @Operation(summary = "Get a single conversation")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable String conversationId) {
        return ResponseEntity.ok(messagingService.getConversation(conversationId));
    }

    @PostMapping("/conversations/{conversationId}")
    @Operation(summary = "Send a message to a conversation (REST fallback)")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody MessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messagingService.sendMessage(conversationId, request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @Operation(summary = "Get messages in a conversation (paginated)")
    public ResponseEntity<PageResponse<MessageResponse>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(messagingService.getMessages(conversationId, PageRequest.of(page, size)));
    }

    @PatchMapping("/conversations/{conversationId}/read")
    @Operation(summary = "Mark all messages in a conversation as read")
    public ResponseEntity<Void> markAsRead(@PathVariable String conversationId) {
        messagingService.markAsRead(conversationId);
        return ResponseEntity.noContent().build();
    }

    // ─── WebSocket STOMP handler ────────────────────────────────────────────────
    // Clients send to /app/chat/{conversationId}
    // Messages are broadcast to /topic/conversations/{conversationId}

    @MessageMapping("/chat/{conversationId}")
    public void handleWebSocketMessage(
            @DestinationVariable String conversationId,
            MessageRequest request) {
        messagingService.sendMessage(conversationId, request);
    }
}
