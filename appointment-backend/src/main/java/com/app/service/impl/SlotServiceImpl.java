package com.app.service.impl;

import com.app.dto.request.SlotGenerationRequest;
import com.app.dto.request.SlotRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SlotResponse;
import com.app.entity.Availability;
import com.app.entity.AvailableSlot;
import com.app.entity.Specialist;
import com.app.entity.enums.SlotStatus;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.SlotMapper;
import com.app.repository.AvailabilityRepository;
import com.app.repository.AvailableSlotRepository;
import com.app.repository.SpecialistRepository;
import com.app.service.SlotService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlotServiceImpl implements SlotService {

    private final AvailableSlotRepository slotRepository;
    private final AvailabilityRepository availabilityRepository;
    private final SpecialistRepository specialistRepository;
    private final SlotMapper slotMapper;

    @Override
    @Transactional
    public SlotResponse createSlot(SlotRequest request) {
        if (request.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot create slot for a past date");
        }
        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        Specialist specialist = getAuthenticatedSpecialist();
        
        // Ensure date is active for this specialist
        availabilityRepository.findBySpecialistIdAndDate(specialist.getId(), request.getDate())
                .orElseThrow(() -> new BadRequestException("Date " + request.getDate() + " must be activated first in availability"));

        // Check for overlap or identical start time
        if (slotRepository.existsBySpecialistIdAndDateAndStartTime(specialist.getId(), request.getDate(), request.getStartTime())) {
            throw new BadRequestException("A slot starting at " + request.getStartTime() + " already exists for this date");
        }

        AvailableSlot slot = AvailableSlot.builder()
                .specialist(specialist)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(SlotStatus.AVAILABLE)
                .build();

        return slotMapper.toResponse(slotRepository.save(slot));
    }

    @Override
    @Transactional
    public void deleteSlot(String slotId) {
        Specialist specialist = getAuthenticatedSpecialist();
        AvailableSlot slot = getSlotOwnedBy(slotId, specialist);

        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new BadRequestException("Cannot delete a booked slot");
        }

        slotRepository.delete(slot);
    }

    @Override
    @Transactional
    public List<SlotResponse> generateSlots(SlotGenerationRequest request) {
        // Deprecated/Not used based on new requirement of manual activation
        return new ArrayList<>();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlotResponse> getAvailableSlotsBySpecialistAndDate(String specialistId, LocalDate date) {
        // Return ALL slots for the date so frontend can grey out BOOKED ones
        return slotRepository.findBySpecialistIdAndDate(UUID.fromString(specialistId), date)
                .stream()
                .map(slotMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SlotResponse> getSlotsBySpecialistAndDateRange(
            String specialistId, LocalDate start, LocalDate end, Pageable pageable) {
        return PageResponse.from(
                slotRepository.findBySpecialistIdAndDateRange(
                        UUID.fromString(specialistId), start, end, pageable),
                slotMapper::toResponse
        );
    }

    @Override
    @Transactional
    public SlotResponse blockSlot(String slotId) {
        Specialist specialist = getAuthenticatedSpecialist();
        AvailableSlot slot = getSlotOwnedBy(slotId, specialist);

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Only AVAILABLE slots can be blocked");
        }

        slot.setStatus(SlotStatus.BLOCKED);
        return slotMapper.toResponse(slotRepository.save(slot));
    }

    @Override
    @Transactional
    public SlotResponse unblockSlot(String slotId) {
        Specialist specialist = getAuthenticatedSpecialist();
        AvailableSlot slot = getSlotOwnedBy(slotId, specialist);

        if (slot.getStatus() != SlotStatus.BLOCKED) {
            throw new BadRequestException("Only BLOCKED slots can be unblocked");
        }

        slot.setStatus(SlotStatus.AVAILABLE);
        return slotMapper.toResponse(slotRepository.save(slot));
    }

    private AvailableSlot getSlotOwnedBy(String slotId, Specialist specialist) {
        AvailableSlot slot = slotRepository.findById(UUID.fromString(slotId))
                .orElseThrow(() -> new ResourceNotFoundException("Slot", "id", slotId));
        if (!slot.getSpecialist().getId().equals(specialist.getId())) {
            throw new UnauthorizedException("You do not own this slot");
        }
        return slot;
    }

    private Specialist getAuthenticatedSpecialist() {
        String email = SecurityUtils.getCurrentUserEmail();
        return specialistRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Specialist profile not found"));
    }
}
