package com.app.service.impl;

import com.app.dto.request.SpecialistServiceRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SpecialistServiceResponse;
import com.app.entity.Specialist;
import com.app.entity.SpecialistService;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.mapper.SpecialistServiceMapper;
import com.app.repository.SpecialistRepository;
import com.app.repository.SpecialistServiceRepository;
import com.app.service.SpecialistOfferingService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpecialistOfferingServiceImpl implements SpecialistOfferingService {

    private final SpecialistServiceRepository serviceRepository;
    private final SpecialistRepository specialistRepository;
    private final SpecialistServiceMapper serviceMapper;

    @Override
    @Transactional
    public SpecialistServiceResponse create(SpecialistServiceRequest request) {
        validateServiceRequest(request);

        Specialist specialist = getAuthenticatedSpecialist();

        SpecialistService service = serviceMapper.toEntity(request);
        service.setSpecialist(specialist);

        return serviceMapper.toResponse(serviceRepository.save(service));
    }

    @Override
    @Transactional(readOnly = true)
    public SpecialistServiceResponse getById(String id) {
        SpecialistService service = serviceRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
        return serviceMapper.toResponse(service);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SpecialistServiceResponse> getActiveBySpecialist(String specialistId) {
        return serviceRepository.findActiveBySpecialistId(UUID.fromString(specialistId))
                .stream()
                .map(serviceMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SpecialistServiceResponse> getBySpecialist(String specialistId, Pageable pageable) {
        return PageResponse.from(
                serviceRepository.findBySpecialistId(UUID.fromString(specialistId), pageable),
                serviceMapper::toResponse
        );
    }

    @Override
    @Transactional
    public SpecialistServiceResponse update(String id, SpecialistServiceRequest request) {
        validateServiceRequest(request);
        Specialist specialist = getAuthenticatedSpecialist();

        SpecialistService service = serviceRepository
                .findByIdAndSpecialistId(UUID.fromString(id), specialist.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        serviceMapper.updateEntityFromRequest(request, service);
        return serviceMapper.toResponse(serviceRepository.save(service));
    }

    @Override
    @Transactional
    public void deactivate(String id) {
        Specialist specialist = getAuthenticatedSpecialist();

        SpecialistService service = serviceRepository
                .findByIdAndSpecialistId(UUID.fromString(id), specialist.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        service.setIsActive(false);
        serviceRepository.save(service);
    }

    private void validateServiceRequest(SpecialistServiceRequest request) {
        if (request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price must be greater than 0");
        }
        if (Boolean.TRUE.equals(request.getDepositEnabled())) {
            if (request.getDepositAmount() == null) {
                throw new BadRequestException("Deposit amount is required when deposit is enabled");
            }
            if (request.getDepositAmount().compareTo(request.getPrice()) > 0) {
                throw new BadRequestException("Deposit amount cannot exceed service price");
            }
        }
    }

    private Specialist getAuthenticatedSpecialist() {
        String email = SecurityUtils.getCurrentUserEmail();
        return specialistRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Specialist profile not found"));
    }
}
