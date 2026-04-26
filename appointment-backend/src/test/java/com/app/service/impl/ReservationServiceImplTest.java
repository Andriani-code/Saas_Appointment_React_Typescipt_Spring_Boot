package com.app.service.impl;

import com.app.dto.response.PageResponse;
import com.app.dto.response.ReservationResponse;
import com.app.entity.AvailableSlot;
import com.app.entity.Client;
import com.app.entity.Conversation;
import com.app.entity.Reservation;
import com.app.entity.Specialist;
import com.app.entity.SpecialistService;
import com.app.entity.User;
import com.app.entity.enums.ReservationStatus;
import com.app.entity.enums.Role;
import com.app.entity.enums.SlotStatus;
import com.app.exception.ResourceNotFoundException;
import com.app.mapper.ReservationMapper;
import com.app.repository.AvailableSlotRepository;
import com.app.repository.ClientRepository;
import com.app.repository.ConversationRepository;
import com.app.repository.ReservationRepository;
import com.app.repository.SpecialistRepository;
import com.app.repository.SpecialistServiceRepository;
import com.app.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

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
class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private SpecialistRepository specialistRepository;

    @Mock
    private SpecialistServiceRepository specialistServiceRepository;

    @Mock
    private AvailableSlotRepository slotRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ReservationMapper reservationMapper;

    @Test
    void getMyReservationsAsClientCapsRequestedPageSizeAtOneHundred() {
        ReservationServiceImpl service = new ReservationServiceImpl(
                reservationRepository,
                clientRepository,
                specialistRepository,
                specialistServiceRepository,
                slotRepository,
                conversationRepository,
                reservationMapper
        );

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                .firstName("Jane")
                .lastName("Doe")
                .build();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(reservationRepository.findByClientId(any(), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");
            PageResponse<ReservationResponse> response =
                    service.getMyReservationsAsClient(PageRequest.of(0, 500));

            ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
                    ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
            verify(reservationRepository).findByClientId(any(), pageableCaptor.capture());

            assertEquals(100, pageableCaptor.getValue().getPageSize());
            assertEquals(100, response.getSize());
        }
    }

    @Test
    void rejectStopsBeforeSavingReservationWhenFreeingSlotFails() {
        ReservationServiceImpl service = new ReservationServiceImpl(
                reservationRepository,
                clientRepository,
                specialistRepository,
                specialistServiceRepository,
                slotRepository,
                conversationRepository,
                reservationMapper
        );

        UUID reservationId = UUID.randomUUID();
        UUID specialistId = UUID.randomUUID();

        Specialist specialist = Specialist.builder()
                .id(specialistId)
                .user(User.builder().email("specialist@example.com").role(Role.SPECIALIST).build())
                .firstName("Sam")
                .lastName("Specialist")
                .build();

        AvailableSlot slot = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .status(SlotStatus.BOOKED)
                .build();

        Reservation reservation = Reservation.builder()
                .id(reservationId)
                .specialist(specialist)
                .client(Client.builder()
                        .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                        .firstName("Jane")
                        .lastName("Doe")
                        .build())
                .service(SpecialistService.builder().name("Consultation").build())
                .slot(slot)
                .status(ReservationStatus.PENDING)
                .build();

        when(specialistRepository.findByUserEmail("specialist@example.com")).thenReturn(Optional.of(specialist));
        when(reservationRepository.findByIdWithDetails(reservationId)).thenReturn(Optional.of(reservation));
        when(slotRepository.save(any())).thenThrow(new RuntimeException("slot write failed"));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("specialist@example.com");

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> service.reject(reservationId.toString()));

            assertEquals("slot write failed", exception.getMessage());
            verify(reservationRepository, never()).save(any());
        }
    }
}
