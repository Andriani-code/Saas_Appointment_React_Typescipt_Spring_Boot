package com.app.service.impl;

import com.app.dto.request.AvailabilityRequest;
import com.app.dto.response.AvailabilityResponse;
import com.app.entity.Availability;
import com.app.entity.Provider;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.AvailabilityMapper;
import com.app.repository.AvailabilityRepository;
import com.app.repository.ProviderRepository;
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
    private final ProviderRepository providerRepository;
    private final AvailabilityMapper availabilityMapper;

    @Override
    @Transactional
    public AvailabilityResponse create(AvailabilityRequest request) {
        if (request.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot set availability for a past date");
        }

        Provider provider = getAuthenticatedProvider();

        availabilityRepository.findByProviderIdAndDate(provider.getId(), request.getDate())
                .ifPresent(a -> {
                    throw new BadRequestException("Availability already set for " + request.getDate());
                });

        Availability availability = availabilityMapper.toEntity(request);
        availability.setProvider(provider);

        return availabilityMapper.toResponse(availabilityRepository.save(availability));
    }

    @Override
    @Transactional
    public AvailabilityResponse update(String id, AvailabilityRequest request) {
        if (request.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot set availability for a past date");
        }

        Provider provider = getAuthenticatedProvider();

        Availability availability = availabilityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Availability", "id", id));

        if (!availability.getProvider().getId().equals(provider.getId())) {
            throw new UnauthorizedException("You do not own this availability");
        }

        availabilityMapper.updateEntityFromRequest(request, availability);
        return availabilityMapper.toResponse(availabilityRepository.save(availability));
    }

    @Override
    @Transactional
    public void delete(String id) {
        Provider provider = getAuthenticatedProvider();

        Availability availability = availabilityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Availability", "id", id));

        if (!availability.getProvider().getId().equals(provider.getId())) {
            throw new UnauthorizedException("You do not own this availability");
        }

        availabilityRepository.delete(availability);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getMyAvailabilities() {
        Provider provider = getAuthenticatedProvider();
        return availabilityRepository.findActiveByProviderId(provider.getId())
                .stream()
                .map(availabilityMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getByProvider(String providerId) {
        return availabilityRepository.findActiveByProviderId(UUID.fromString(providerId))
                .stream()
                .map(availabilityMapper::toResponse)
                .collect(Collectors.toList());
    }

    private Provider getAuthenticatedProvider() {
        String email = SecurityUtils.getCurrentUserEmail();
        return providerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));
    }
}
