package com.app.service.impl;

import com.app.dto.request.AvailabilityRequest;
import com.app.dto.response.AvailabilityResponse;
import com.app.entity.Availability;
import com.app.entity.Specialist;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.AvailabilityMapper;
import com.app.repository.AvailabilityRepository;
import com.app.repository.SpecialistRepository;
import com.app.service.AvailabilityService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityServiceImpl implements AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final SpecialistRepository specialistRepository;
    private final AvailabilityMapper availabilityMapper;

    @Override
    @Transactional
    public AvailabilityResponse create(AvailabilityRequest request) {
        if (request.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot set availability for a past date");
        }

        Specialist specialist = getAuthenticatedSpecialist();

        availabilityRepository.findBySpecialistIdAndDate(specialist.getId(), request.getDate())
                .ifPresent(a -> {
                    throw new BadRequestException("Availability already set for " + request.getDate());
                });

        Availability availability = availabilityMapper.toEntity(request);
        availability.setSpecialist(specialist);

        return availabilityMapper.toResponse(availabilityRepository.save(availability));
    }

    @Override
    @Transactional
    public AvailabilityResponse update(String id, AvailabilityRequest request) {
        if (request.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot set availability for a past date");
        }

        Specialist specialist = getAuthenticatedSpecialist();

        Availability availability = availabilityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Availability", "id", id));

        if (!availability.getSpecialist().getId().equals(specialist.getId())) {
            throw new UnauthorizedException("You do not own this availability");
        }

        availabilityMapper.updateEntityFromRequest(request, availability);
        return availabilityMapper.toResponse(availabilityRepository.save(availability));
    }

    @Override
    @Transactional
    public void delete(String id) {
        Specialist specialist = getAuthenticatedSpecialist();

        Availability availability = availabilityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Availability", "id", id));

        if (!availability.getSpecialist().getId().equals(specialist.getId())) {
            throw new UnauthorizedException("You do not own this availability");
        }

        availabilityRepository.delete(availability);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getMyAvailabilities() {
        Specialist specialist = getAuthenticatedSpecialist();
        return availabilityRepository.findActiveBySpecialistId(specialist.getId())
                .stream()
                .map(availabilityMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getBySpecialist(String specialistId) {
        return availabilityRepository.findActiveBySpecialistId(UUID.fromString(specialistId))
                .stream()
                .map(availabilityMapper::toResponse)
                .collect(Collectors.toList());
    }

    private Specialist getAuthenticatedSpecialist() {
        String email = SecurityUtils.getCurrentUserEmail();
        return specialistRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Specialist profile not found"));
    }
}
