package com.app.service.impl;

import com.app.dto.request.MessageRequest;
import com.app.dto.response.ConversationResponse;
import com.app.dto.response.MessageResponse;
import com.app.entity.Client;
import com.app.entity.Conversation;
import com.app.entity.Message;
import com.app.entity.Provider;
import com.app.entity.Reservation;
import com.app.entity.User;
import com.app.entity.enums.Role;
import com.app.entity.enums.SenderType;
import com.app.exception.UnauthorizedException;
import com.app.mapper.ConversationMapper;
import com.app.mapper.MessageMapper;
import com.app.repository.ClientRepository;
import com.app.repository.ConversationRepository;
import com.app.repository.MessageRepository;
import com.app.repository.ProviderRepository;
import com.app.repository.ReservationRepository;
import com.app.repository.UserRepository;
import com.app.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessagingServiceImplTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ProviderRepository providerRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageMapper messageMapper;

    @Mock
    private ConversationMapper conversationMapper;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private MessagingServiceImpl service() {
        return new MessagingServiceImpl(
                messageRepository,
                conversationRepository,
                clientRepository,
                providerRepository,
                reservationRepository,
                userRepository,
                messageMapper,
                conversationMapper,
                messagingTemplate
        );
    }

    @Test
    void getOrCreateConversationForReservationCreatesConversationForClient() {
        MessagingServiceImpl service = service();

        User clientUser = User.builder().id(UUID.randomUUID()).email("client@example.com").role(Role.CLIENT).build();
        User providerUser = User.builder().id(UUID.randomUUID()).email("provider@example.com").role(Role.PROVIDER).build();

        Client client = Client.builder().id(UUID.randomUUID()).user(clientUser).firstName("Jane").lastName("Doe").build();
        Provider provider = Provider.builder().id(UUID.randomUUID()).user(providerUser).firstName("Sam").lastName("Provider").build();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .build();

        Conversation savedConversation = Conversation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .reservation(reservation)
                .isActive(true)
                .build();

        ConversationResponse response = new ConversationResponse();
        response.setId(savedConversation.getId().toString());

        when(userRepository.findByEmail("client@example.com")).thenReturn(Optional.of(clientUser));
        when(reservationRepository.findById(reservation.getId())).thenReturn(Optional.of(reservation));
        when(conversationRepository.findByClientIdAndProviderId(client.getId(), provider.getId()))
                .thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConversation);
        when(conversationMapper.toResponse(savedConversation)).thenReturn(response);
        when(messageRepository.countByConversationIdAndIsReadFalseAndSenderUserIdNot(any(), any())).thenReturn(3L);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            ConversationResponse result = service.getOrCreateConversationForReservation(reservation.getId().toString());

            assertEquals(savedConversation.getId().toString(), result.getId());
            assertEquals(3L, result.getUnreadCount());
            verify(conversationRepository).save(any(Conversation.class));
        }
    }

    @Test
    void getOrCreateConversationForReservationReusesExistingConversation() {
        MessagingServiceImpl service = service();

        User clientUser = User.builder().id(UUID.randomUUID()).email("client@example.com").role(Role.CLIENT).build();
        User providerUser = User.builder().id(UUID.randomUUID()).email("provider@example.com").role(Role.PROVIDER).build();

        Client client = Client.builder().id(UUID.randomUUID()).user(clientUser).firstName("Jane").lastName("Doe").build();
        Provider provider = Provider.builder().id(UUID.randomUUID()).user(providerUser).firstName("Sam").lastName("Provider").build();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .build();

        Conversation existing = Conversation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .reservation(reservation)
                .isActive(true)
                .build();

        ConversationResponse response = new ConversationResponse();
        response.setId(existing.getId().toString());

        when(userRepository.findByEmail("provider@example.com")).thenReturn(Optional.of(providerUser));
        when(reservationRepository.findById(reservation.getId())).thenReturn(Optional.of(reservation));
        when(conversationRepository.findByClientIdAndProviderId(client.getId(), provider.getId()))
                .thenReturn(Optional.of(existing));
        when(conversationMapper.toResponse(existing)).thenReturn(response);
        when(messageRepository.countByConversationIdAndIsReadFalseAndSenderUserIdNot(any(), any())).thenReturn(0L);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            ConversationResponse result = service.getOrCreateConversationForReservation(reservation.getId().toString());

            assertEquals(existing.getId().toString(), result.getId());
            verify(conversationRepository, never()).save(any(Conversation.class));
        }
    }

    @Test
    void getOrCreateConversationForReservationRejectsNonParticipant() {
        MessagingServiceImpl service = service();

        User clientUser = User.builder().id(UUID.randomUUID()).email("client@example.com").role(Role.CLIENT).build();
        User providerUser = User.builder().id(UUID.randomUUID()).email("provider@example.com").role(Role.PROVIDER).build();
        User stranger = User.builder().id(UUID.randomUUID()).email("stranger@example.com").role(Role.CLIENT).build();

        Client client = Client.builder().id(UUID.randomUUID()).user(clientUser).build();
        Provider provider = Provider.builder().id(UUID.randomUUID()).user(providerUser).build();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .build();

        when(userRepository.findByEmail("stranger@example.com")).thenReturn(Optional.of(stranger));
        when(reservationRepository.findById(reservation.getId())).thenReturn(Optional.of(reservation));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("stranger@example.com");

            assertThrows(UnauthorizedException.class,
                    () -> service.getOrCreateConversationForReservation(reservation.getId().toString()));
        }
    }

    @Test
    void sendMessagePushesOnlyToPrivateQueuesOfBothParticipants() {
        MessagingServiceImpl service = service();

        User clientUser = User.builder().id(UUID.randomUUID()).email("client@example.com").role(Role.CLIENT).build();
        User providerUser = User.builder().id(UUID.randomUUID()).email("provider@example.com").role(Role.PROVIDER).build();

        Client client = Client.builder().id(UUID.randomUUID()).user(clientUser).build();
        Provider provider = Provider.builder().id(UUID.randomUUID()).user(providerUser).build();

        Conversation conversation = Conversation.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .isActive(true)
                .build();

        Message saved = Message.builder()
                .id(UUID.randomUUID())
                .conversation(conversation)
                .senderUser(clientUser)
                .senderType(SenderType.CLIENT)
                .content("Bonjour")
                .isRead(false)
                .build();

        MessageResponse response = new MessageResponse();
        response.setId(saved.getId().toString());
        response.setContent("Bonjour");

        when(userRepository.findByEmail("client@example.com")).thenReturn(Optional.of(clientUser));
        when(conversationRepository.findById(conversation.getId())).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(Message.class))).thenReturn(saved);
        when(messageMapper.toResponse(saved)).thenReturn(response);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            MessageRequest request = new MessageRequest();
            request.setContent("Bonjour");
            service.sendMessage(conversation.getId().toString(), request);
        }

        // Le message est poussé sur la file privée du destinataire ET de l'expéditeur
        verify(messagingTemplate).convertAndSendToUser("provider@example.com", "/queue/messages", response);
        verify(messagingTemplate).convertAndSendToUser("client@example.com", "/queue/messages", response);
    }

    @Test
    void getMyConversationsCapsRequestedPageSizeAtOneHundred() {
        MessagingServiceImpl service = service();

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                .build();

        when(userRepository.findByEmail("client@example.com"))
                .thenReturn(Optional.of(client.getUser()));
        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(conversationRepository.findActiveByClientId(any(), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            var response = service.getMyConversations(PageRequest.of(0, 500));

            org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> captor =
                    org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
            verify(conversationRepository).findActiveByClientId(any(), captor.capture());

            assertEquals(100, captor.getValue().getPageSize());
            assertEquals(100, response.getSize());
        }
    }
}
