package com.app.service.impl;

import com.app.dto.request.ProviderServiceRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ProviderServiceResponse;
import com.app.entity.Provider;
import com.app.entity.ProviderService;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.mapper.ProviderServiceMapper;
import com.app.repository.ProviderRepository;
import com.app.repository.ProviderServiceRepository;
import com.app.service.FileStorageService;
import com.app.service.ProviderOfferingService;
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
public class ProviderOfferingServiceImpl implements ProviderOfferingService {

    private final ProviderServiceRepository serviceRepository;
    private final ProviderRepository providerRepository;
    private final ProviderServiceMapper serviceMapper;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public ProviderServiceResponse create(ProviderServiceRequest request) {
        validateServiceRequest(request);

        Provider provider = getAuthenticatedProvider();

        ProviderService service = serviceMapper.toEntity(request);
        service.setProvider(provider);

        return serviceMapper.toResponse(serviceRepository.save(service));
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderServiceResponse getById(String id) {
        ProviderService service = serviceRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
        return serviceMapper.toResponse(service);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProviderServiceResponse> getActiveByProvider(String providerId) {
        return serviceRepository.findActiveByProviderId(UUID.fromString(providerId))
                .stream()
                .map(serviceMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProviderServiceResponse> getByProvider(String providerId, Pageable pageable) {
        return PageResponse.from(
                serviceRepository.findByProviderId(UUID.fromString(providerId), pageable),
                serviceMapper::toResponse
        );
    }

    @Override
    @Transactional
    public ProviderServiceResponse update(String id, ProviderServiceRequest request) {
        validateServiceRequest(request);
        Provider provider = getAuthenticatedProvider();

        ProviderService service = serviceRepository
                .findByIdAndProviderId(UUID.fromString(id), provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        String oldPhoto = service.getPhotoUrl();
        serviceMapper.updateEntityFromRequest(request, service);
        if (oldPhoto != null && !oldPhoto.equals(request.getPhotoUrl())) {
            fileStorageService.delete(oldPhoto);
        }
        return serviceMapper.toResponse(serviceRepository.save(service));
    }

    @Override
    @Transactional
    public void deactivate(String id) {
        Provider provider = getAuthenticatedProvider();

        ProviderService service = serviceRepository
                .findByIdAndProviderId(UUID.fromString(id), provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        service.setIsActive(false);
        serviceRepository.save(service);
    }

    private void validateServiceRequest(ProviderServiceRequest request) {
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

    private Provider getAuthenticatedProvider() {
        String email = SecurityUtils.getCurrentUserEmail();
        return providerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));
    }
}
