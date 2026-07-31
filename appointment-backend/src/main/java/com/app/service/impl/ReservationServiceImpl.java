package com.app.service.impl;

import com.app.dto.request.ReservationRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ReservationResponse;
import com.app.entity.*;
import com.app.entity.enums.ReservationStatus;
import com.app.entity.enums.SlotStatus;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.ReservationMapper;
import com.app.repository.*;
import com.app.service.EmailService;
import com.app.service.ReservationService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final ProviderRepository providerRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final AvailableSlotRepository slotRepository;
    private final ConversationRepository conversationRepository;
    private final ReservationMapper reservationMapper;
    private final EmailService emailService;

    @Override
    @Transactional
    public ReservationResponse book(ReservationRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Client client = clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found"));

        AvailableSlot slot = slotRepository.findByIdWithLock(UUID.fromString(request.getSlotId()))
                .orElseThrow(() -> new ResourceNotFoundException("Slot", "id", request.getSlotId()));

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Slot is not available for booking");
        }

        ProviderService service = providerServiceRepository
                .findById(UUID.fromString(request.getServiceId()))
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", request.getServiceId()));

        if (!service.getIsActive()) {
            throw new BadRequestException("This service is no longer active");
        }

        if (!service.getProvider().getId().equals(slot.getProvider().getId())) {
            throw new BadRequestException("Service and slot belong to different providers");
        }

        // Mark slot as booked
        slot.setStatus(SlotStatus.BOOKED);
        slotRepository.save(slot);

        Reservation reservation = Reservation.builder()
                .client(client)
                .provider(slot.getProvider())
                .service(service)
                .slot(slot)
                .status(ReservationStatus.PENDING)
                .clientMessage(request.getClientMessage())
                .depositRequired(service.getDepositEnabled())
                .depositAmount(service.getDepositEnabled() ? service.getDepositAmount() : null)
                .build();

        Reservation saved = reservationRepository.save(reservation);

        // Update conversation if exists or create new one, and link last reservation
        updateConversation(client, slot.getProvider(), saved);

        // Send email confirmation to client
        emailService.sendBookingConfirmation(saved);

        return reservationMapper.toResponse(saved);
    }

    private void updateConversation(Client client, Provider provider, Reservation reservation) {
        Conversation conversation = conversationRepository.findByClientIdAndProviderId(client.getId(), provider.getId())
                .orElseGet(() -> Conversation.builder()
                        .client(client)
                        .provider(provider)
                        .isActive(true)
                        .build());
        
        conversation.setReservation(reservation);
        conversationRepository.save(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getById(String id) {
        Reservation reservation = reservationRepository.findByIdWithDetails(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));
        assertCanAccess(reservation);
        return reservationMapper.toResponse(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> getMyReservationsAsClient(Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        String email = SecurityUtils.getCurrentUserEmail();
        var clientOpt = clientRepository.findByUserEmail(email);
        if (clientOpt.isEmpty()) {
            return PageResponse.empty(cappedPageable);
        }
        Client client = clientOpt.get();
        return PageResponse.from(
                reservationRepository.findByClientId(client.getId(), cappedPageable),
                reservationMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> getMyReservationsAsProvider(Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        String email = SecurityUtils.getCurrentUserEmail();
        var providerOpt = providerRepository.findByUserEmail(email);
        if (providerOpt.isEmpty()) {
            return PageResponse.empty(cappedPageable);
        }
        Provider provider = providerOpt.get();
        return PageResponse.from(
                reservationRepository.findByProviderId(provider.getId(), cappedPageable),
                reservationMapper::toResponse);
    }

    @Override
    @Transactional
    public ReservationResponse confirm(String id) {
        log.info("Confirming reservation {}", id);
        Reservation reservation = getReservationAsProvider(id);
        assertStatus(reservation, ReservationStatus.PENDING, "confirm");
        reservation.setStatus(ReservationStatus.CONFIRMED);
        Reservation saved = reservationRepository.save(reservation);
        
        // Send email notification to client
        emailService.sendReservationAccepted(saved);
        
        return reservationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ReservationResponse reject(String id) {
        log.info("Rejecting reservation {}", id);
        Reservation reservation = getReservationAsProvider(id);
        assertStatus(reservation, ReservationStatus.PENDING, "reject");
        reservation.setStatus(ReservationStatus.REJECTED);
        freeSlot(reservation);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse cancel(String id) {
        log.info("Canceling reservation {}", id);
        Reservation reservation = reservationRepository.findByIdWithDetails(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));

        assertCanAccess(reservation);

        ReservationStatus status = reservation.getStatus();
        if (status == ReservationStatus.COMPLETED ||
                status == ReservationStatus.CANCELED ||
                status == ReservationStatus.REJECTED ||
                status == ReservationStatus.NO_SHOW) {
            throw new BadRequestException("Cannot cancel a reservation with status: " + status);
        }

        reservation.setStatus(ReservationStatus.CANCELED);
        freeSlot(reservation);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse markCompleted(String id) {
        log.info("Completing reservation {}", id);
        Reservation reservation = getReservationAsProvider(id);
        assertStatus(reservation, ReservationStatus.CONFIRMED, "complete");
        reservation.setStatus(ReservationStatus.COMPLETED);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse markNoShow(String id) {
        log.info("Marking reservation {} as no-show", id);
        Reservation reservation = getReservationAsProvider(id);
        assertStatus(reservation, ReservationStatus.CONFIRMED, "mark as no-show");
        reservation.setStatus(ReservationStatus.NO_SHOW);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Reservation getReservationAsProvider(String id) {
        String email = SecurityUtils.getCurrentUserEmail();
        Provider provider = providerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        Reservation reservation = reservationRepository.findByIdWithDetails(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));

        if (!reservation.getProvider().getId().equals(provider.getId())) {
            throw new UnauthorizedException("You do not own this reservation");
        }
        return reservation;
    }

    private void assertStatus(Reservation reservation, ReservationStatus expected, String action) {
        if (reservation.getStatus() != expected) {
            throw new BadRequestException(
                    String.format("Cannot %s a reservation with status: %s", action, reservation.getStatus()));
        }
    }

    private void assertCanAccess(Reservation reservation) {
        String email = SecurityUtils.getCurrentUserEmail();
        boolean isClient = reservation.getClient().getUser().getEmail().equals(email);
        boolean isProvider = reservation.getProvider().getUser().getEmail().equals(email);
        if (!isClient && !isProvider && !SecurityUtils.hasRole("ADMIN")) {
            throw new UnauthorizedException("Access denied to this reservation");
        }
    }

    private void freeSlot(Reservation reservation) {
        AvailableSlot slot = reservation.getSlot();
        slot.setStatus(SlotStatus.AVAILABLE);
        slotRepository.save(slot);
    }

    private Pageable capPageSize(Pageable pageable) {
        return PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), 100),
                pageable.getSort()
        );
    }
}
