package com.app.service.impl;

import com.app.dto.request.SlotGenerationRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SlotResponse;
import com.app.entity.Availability;
import com.app.entity.AvailableSlot;
import com.app.entity.Specialist;
import com.app.entity.enums.DayOfWeek;
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
import java.time.LocalTime;
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
    public List<SlotResponse> generateSlots(SlotGenerationRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }
        if (request.getStartDate().plusDays(90).isBefore(request.getEndDate())) {
            throw new BadRequestException("Cannot generate slots for more than 90 days");
        }

        Specialist specialist = getAuthenticatedSpecialist();
        List<Availability> availabilities = availabilityRepository.findActiveBySpecialistId(specialist.getId());

        if (availabilities.isEmpty()) {
            throw new BadRequestException("No active availabilities found. Please set your availability first.");
        }

        List<AvailableSlot> slotsToSave = new ArrayList<>();
        LocalDate current = request.getStartDate();

        while (!current.isAfter(request.getEndDate())) {
            final LocalDate date = current;
            DayOfWeek dayOfWeek = DayOfWeek.valueOf(date.getDayOfWeek().name());

            availabilities.stream()
                    .filter(a -> a.getDayOfWeek() == dayOfWeek)
                    .forEach(availability -> {
                        List<AvailableSlot> daySlots = generateSlotsForDay(specialist, availability, date);
                        slotsToSave.addAll(daySlots);
                    });

            current = current.plusDays(1);
        }

        List<AvailableSlot> saved = slotRepository.saveAll(slotsToSave);
        log.info("Generated {} slots for specialist {}", saved.size(), specialist.getId());

        return saved.stream().map(slotMapper::toResponse).collect(Collectors.toList());
    }

    private List<AvailableSlot> generateSlotsForDay(Specialist specialist, Availability availability, LocalDate date) {
        List<AvailableSlot> slots = new ArrayList<>();
        LocalTime cursor = availability.getStartTime();

        while (cursor.plusMinutes(availability.getIntervalMinutes()).compareTo(availability.getEndTime()) <= 0) {
            LocalTime slotEnd = cursor.plusMinutes(availability.getIntervalMinutes());

            // skip if slot already exists
            if (!slotRepository.existsBySpecialistIdAndDateAndStartTime(specialist.getId(), date, cursor)) {
                slots.add(AvailableSlot.builder()
                        .specialist(specialist)
                        .date(date)
                        .startTime(cursor)
                        .endTime(slotEnd)
                        .status(SlotStatus.AVAILABLE)
                        .build());
            }

            cursor = slotEnd;
        }

        return slots;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlotResponse> getAvailableSlotsBySpecialistAndDate(String specialistId, LocalDate date) {
        return slotRepository.findBySpecialistIdAndDateAndStatus(
                        UUID.fromString(specialistId), date, SlotStatus.AVAILABLE)
                .stream()
                .map(slotMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SlotResponse> getSlotsBySpecialistAndDateRange(
            String specialistId, LocalDate start, LocalDate end, Pageable pageable) {
        return PageResponse.from(
                slotRepository.findBySpecialistIdAndDateRangeAndStatus(
                        UUID.fromString(specialistId), start, end, SlotStatus.AVAILABLE, pageable),
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
                .orElseThrow(() -> new UnauthorizedException("Specialist profile not found"));
    }
}
