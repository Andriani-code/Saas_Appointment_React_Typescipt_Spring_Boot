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
import com.app.service.ReservationService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final SpecialistRepository specialistRepository;
    private final SpecialistServiceRepository specialistServiceRepository;
    private final AvailableSlotRepository slotRepository;
    private final ConversationRepository conversationRepository;
    private final ReservationMapper reservationMapper;

    @Override
    @Transactional
    public ReservationResponse book(ReservationRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Client client = clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found"));

        AvailableSlot slot = slotRepository.findById(UUID.fromString(request.getSlotId()))
                .orElseThrow(() -> new ResourceNotFoundException("Slot", "id", request.getSlotId()));

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Slot is not available for booking");
        }

        SpecialistService service = specialistServiceRepository
                .findById(UUID.fromString(request.getServiceId()))
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", request.getServiceId()));

        if (!service.getIsActive()) {
            throw new BadRequestException("This service is no longer active");
        }

        if (!service.getSpecialist().getId().equals(slot.getSpecialist().getId())) {
            throw new BadRequestException("Service does not belong to the slot's specialist");
        }

        // Mark slot as booked
        slot.setStatus(SlotStatus.BOOKED);
        slotRepository.save(slot);

        Reservation reservation = Reservation.builder()
                .client(client)
                .specialist(slot.getSpecialist())
                .service(service)
                .slot(slot)
                .status(ReservationStatus.PENDING)
                .clientMessage(request.getClientMessage())
                .depositRequired(service.getDepositEnabled())
                .depositAmount(service.getDepositEnabled() ? service.getDepositAmount() : null)
                .build();

        Reservation saved = reservationRepository.save(reservation);

        // Automatically create conversation
        createConversationIfAbsent(client, slot.getSpecialist(), saved);

        return reservationMapper.toResponse(saved);
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
        String email = SecurityUtils.getCurrentUserEmail();
        var clientOpt = clientRepository.findByUserEmail(email);
        if (clientOpt.isEmpty()) {
            return PageResponse.empty(pageable);
        }
        Client client = clientOpt.get();
        return PageResponse.from(
                reservationRepository.findByClientId(client.getId(), pageable),
                reservationMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> getMyReservationsAsSpecialist(Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        var specialistOpt = specialistRepository.findByUserEmail(email);
        if (specialistOpt.isEmpty()) {
            return PageResponse.empty(pageable);
        }
        Specialist specialist = specialistOpt.get();
        return PageResponse.from(
                reservationRepository.findBySpecialistId(specialist.getId(), pageable),
                reservationMapper::toResponse);
    }

    @Override
    @Transactional
    public ReservationResponse confirm(String id) {
        Reservation reservation = getReservationAsSpecialist(id);
        assertStatus(reservation, ReservationStatus.PENDING, "confirm");
        reservation.setStatus(ReservationStatus.CONFIRMED);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse reject(String id) {
        Reservation reservation = getReservationAsSpecialist(id);
        assertStatus(reservation, ReservationStatus.PENDING, "reject");
        reservation.setStatus(ReservationStatus.REJECTED);
        freeSlot(reservation);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse cancel(String id) {
        Reservation reservation = reservationRepository.findByIdWithDetails(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));

        assertCanAccess(reservation);

        if (reservation.getStatus() == ReservationStatus.COMPLETED ||
                reservation.getStatus() == ReservationStatus.CANCELED) {
            throw new BadRequestException("Cannot cancel a reservation with status: " + reservation.getStatus());
        }

        reservation.setStatus(ReservationStatus.CANCELED);
        freeSlot(reservation);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse markCompleted(String id) {
        Reservation reservation = getReservationAsSpecialist(id);
        assertStatus(reservation, ReservationStatus.CONFIRMED, "complete");
        reservation.setStatus(ReservationStatus.COMPLETED);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public ReservationResponse markNoShow(String id) {
        Reservation reservation = getReservationAsSpecialist(id);
        assertStatus(reservation, ReservationStatus.CONFIRMED, "mark as no-show");
        reservation.setStatus(ReservationStatus.NO_SHOW);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Reservation getReservationAsSpecialist(String id) {
        String email = SecurityUtils.getCurrentUserEmail();
        Specialist specialist = specialistRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Specialist profile not found"));

        Reservation reservation = reservationRepository.findByIdWithDetails(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));

        if (!reservation.getSpecialist().getId().equals(specialist.getId())) {
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
        boolean isSpecialist = reservation.getSpecialist().getUser().getEmail().equals(email);
        if (!isClient && !isSpecialist && !SecurityUtils.hasRole("ADMIN")) {
            throw new UnauthorizedException("Access denied to this reservation");
        }
    }

    private void freeSlot(Reservation reservation) {
        AvailableSlot slot = reservation.getSlot();
        slot.setStatus(SlotStatus.AVAILABLE);
        slotRepository.save(slot);
    }

    private void createConversationIfAbsent(Client client, Specialist specialist, Reservation reservation) {
        conversationRepository.findByClientIdAndSpecialistId(client.getId(), specialist.getId())
                .orElseGet(() -> {
                    Conversation conversation = Conversation.builder()
                            .client(client)
                            .specialist(specialist)
                            .reservation(reservation)
                            .isActive(true)
                            .build();
                    return conversationRepository.save(conversation);
                });
    }
}
