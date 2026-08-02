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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessagingServiceImpl implements MessagingService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ClientRepository clientRepository;
    private final ProviderRepository providerRepository;
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

        // 1) Broadcast to the conversation topic (any client subscribed to it)
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId,
                response
        );

        // 2) Send directly to the recipient's personal queue (/user/{email}/queue/messages)
        String recipientEmail = resolveRecipientEmail(conversation, sender);
        if (recipientEmail != null) {
            messagingTemplate.convertAndSendToUser(
                    recipientEmail,
                    "/queue/messages",
                    response
            );
        }

        // 3) Send back to the sender's personal queue so the sender's other tabs stay in sync
        messagingTemplate.convertAndSendToUser(
                email,
                "/queue/messages",
                response
        );

        return response;
    }

    @Override
    @Transactional
    public PageResponse<MessageResponse> getMessages(String conversationId, Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Conversation conversation = conversationRepository.findById(UUID.fromString(conversationId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        assertParticipant(conversation, user);

        // Mark messages as read
        messageRepository.markAsReadByConversationIdAndNotSender(
                UUID.fromString(conversationId), user.getId());

        Page<Message> page = messageRepository.findByConversationId(UUID.fromString(conversationId), cappedPageable);
        return PageResponse.from(page, messageMapper::toResponse);
    }

    @Override
    @Transactional
    public ConversationResponse getOrCreateConversation(String providerId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        var clientOpt = clientRepository.findByUserEmail(email);
        if (clientOpt.isEmpty()) {
            throw new UnauthorizedException("Only clients can start a conversation with a provider");
        }

        Provider provider = providerRepository.findById(UUID.fromString(providerId))
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", providerId));

        Conversation conversation = conversationRepository.findByClientIdAndProviderId(clientOpt.get().getId(), provider.getId())
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder()
                                .client(clientOpt.get())
                                .provider(provider)
                                .isActive(true)
                                .build()
                ));

        ConversationResponse resp = conversationMapper.toResponse(conversation);
        long unread = messageRepository
                .countByConversationIdAndIsReadFalseAndSenderUserIdNot(conversation.getId(), user.getId());
        resp.setUnreadCount(unread);
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getMyConversations(Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Page<Conversation> page;

        // Determine role and fetch accordingly
        var clientOpt = clientRepository.findByUserEmail(email);
        var providerOpt = providerRepository.findByUserEmail(email);

        if (clientOpt.isPresent()) {
            page = conversationRepository.findActiveByClientId(clientOpt.get().getId(), cappedPageable);
        } else if (providerOpt.isPresent()) {
            page = conversationRepository.findActiveByProviderId(providerOpt.get().getId(), cappedPageable);
        } else {
            return PageResponse.empty(cappedPageable);
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
        boolean isProvider = conversation.getProvider().getUser().getId().equals(user.getId());
        if (!isClient && !isProvider) {
            throw new UnauthorizedException("You are not a participant of this conversation");
        }
    }

    private SenderType resolveSenderType(Conversation conversation, User user) {
        if (conversation.getClient().getUser().getId().equals(user.getId())) {
            return SenderType.CLIENT;
        }
        return SenderType.PROVIDER;
    }

    private String resolveRecipientEmail(Conversation conversation, User sender) {
        User clientUser = conversation.getClient().getUser();
        User providerUser = conversation.getProvider().getUser();

        if (clientUser.getId().equals(sender.getId())) {
            return providerUser.getEmail();
        } else if (providerUser.getId().equals(sender.getId())) {
            return clientUser.getEmail();
        }
        return null;
    }

    private Pageable capPageSize(Pageable pageable) {
        return PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), 100),
                pageable.getSort()
        );
    }
}
