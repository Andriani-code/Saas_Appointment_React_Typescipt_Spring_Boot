package com.app.service.impl;

import com.app.dto.request.MessageRequest;
import com.app.dto.response.ConversationResponse;
import com.app.dto.response.MessageResponse;
import com.app.dto.response.PageResponse;
import com.app.entity.*;
import com.app.entity.enums.SenderType;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.ConversationMapper;
import com.app.mapper.MessageMapper;
import com.app.repository.*;
import com.app.service.MessagingService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessagingServiceImpl implements MessagingService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ClientRepository clientRepository;
    private final SpecialistRepository specialistRepository;
    private final UserRepository userRepository;
    private final MessageMapper messageMapper;
    private final ConversationMapper conversationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public MessageResponse sendMessage(String conversationId, MessageRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Conversation conversation = conversationRepository.findById(UUID.fromString(conversationId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        assertParticipant(conversation, sender);

        SenderType senderType = resolveSenderType(conversation, sender);

        Message message = Message.builder()
                .conversation(conversation)
                .senderUser(sender)
                .senderType(senderType)
                .content(request.getContent())
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);
        MessageResponse response = messageMapper.toResponse(saved);

        // Push via WebSocket to conversation topic
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId,
                response
        );

        return response;
    }

    @Override
    @Transactional
    public PageResponse<MessageResponse> getMessages(String conversationId, Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Conversation conversation = conversationRepository.findById(UUID.fromString(conversationId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        assertParticipant(conversation, user);

        // Mark messages as read
        messageRepository.markAsReadByConversationIdAndNotSender(
                UUID.fromString(conversationId), user.getId());

        Page<Message> page = messageRepository.findByConversationId(UUID.fromString(conversationId), pageable);
        return PageResponse.from(page, messageMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getMyConversations(Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Page<Conversation> page;

        // Determine role and fetch accordingly
        var clientOpt = clientRepository.findByUserEmail(email);
        var specialistOpt = specialistRepository.findByUserEmail(email);

        if (clientOpt.isPresent()) {
            page = conversationRepository.findActiveByClientId(clientOpt.get().getId(), pageable);
        } else if (specialistOpt.isPresent()) {
            page = conversationRepository.findActiveBySpecialistId(specialistOpt.get().getId(), pageable);
        } else {
            return PageResponse.empty(pageable);
        }

        return PageResponse.from(page, c -> {
            ConversationResponse resp = conversationMapper.toResponse(c);
            long unread = messageRepository
                    .countByConversationIdAndIsReadFalseAndSenderUserIdNot(c.getId(), user.getId());
            resp.setUnreadCount(unread);
            return resp;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversation(String conversationId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Conversation conversation = conversationRepository.findById(UUID.fromString(conversationId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        assertParticipant(conversation, user);

        ConversationResponse resp = conversationMapper.toResponse(conversation);
        long unread = messageRepository
                .countByConversationIdAndIsReadFalseAndSenderUserIdNot(conversation.getId(), user.getId());
        resp.setUnreadCount(unread);
        return resp;
    }

    @Override
    @Transactional
    public void markAsRead(String conversationId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Conversation conversation = conversationRepository.findById(UUID.fromString(conversationId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        assertParticipant(conversation, user);
        messageRepository.markAsReadByConversationIdAndNotSender(conversation.getId(), user.getId());
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private void assertParticipant(Conversation conversation, User user) {
        boolean isClient = conversation.getClient().getUser().getId().equals(user.getId());
        boolean isSpecialist = conversation.getSpecialist().getUser().getId().equals(user.getId());
        if (!isClient && !isSpecialist) {
            throw new UnauthorizedException("You are not a participant of this conversation");
        }
    }

    private SenderType resolveSenderType(Conversation conversation, User user) {
        if (conversation.getClient().getUser().getId().equals(user.getId())) {
            return SenderType.CLIENT;
        }
        return SenderType.SPECIALIST;
    }
}
