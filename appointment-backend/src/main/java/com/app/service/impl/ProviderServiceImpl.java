package com.app.service.impl;

import com.app.dto.request.ProviderRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ProviderResponse;
import com.app.entity.Address;
import com.app.entity.Provider;
import com.app.entity.User;
import com.app.entity.enums.VerificationStatus;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.mapper.AddressMapper;
import com.app.mapper.ProviderMapper;
import com.app.repository.ReviewRepository;
import com.app.repository.ProviderRepository;
import com.app.repository.UserRepository;
import com.app.service.ProviderService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProviderServiceImpl implements ProviderService {

    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ProviderMapper providerMapper;
    private final AddressMapper addressMapper;

    @Override
    @Transactional
    public ProviderResponse createProfile(ProviderRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (providerRepository.findByUserId(user.getId()).isPresent()) {
            throw new BadRequestException("Provider profile already exists for this user");
        }

        Provider provider = providerMapper.toEntity(request);
        provider.setUser(user);

        if (request.getPersonalAddress() != null) {
            provider.setPersonalAddress(addressMapper.toEntity(request.getPersonalAddress()));
        }
        if (request.getServiceAddress() != null) {
            provider.setServiceAddress(addressMapper.toEntity(request.getServiceAddress()));
        }

        return enrichWithRating(providerMapper.toResponse(providerRepository.save(provider)));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMyProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        return providerRepository.findByUserEmail(email).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderResponse getMyProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        Provider provider = providerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));
        return enrichWithRating(providerMapper.toResponse(provider));
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderResponse getById(String id) {
        Provider provider = providerRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", id));
        return enrichWithRating(providerMapper.toResponse(provider));
    }

    @Override
    @Transactional
    public ProviderResponse updateProfile(ProviderRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Provider provider = providerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        providerMapper.updateEntityFromRequest(request, provider);

        if (request.getPersonalAddress() != null) {
            if (provider.getPersonalAddress() != null) {
                addressMapper.updateEntityFromRequest(request.getPersonalAddress(), provider.getPersonalAddress());
            } else {
                provider.setPersonalAddress(addressMapper.toEntity(request.getPersonalAddress()));
            }
        }
        if (request.getServiceAddress() != null) {
            if (provider.getServiceAddress() != null) {
                addressMapper.updateEntityFromRequest(request.getServiceAddress(), provider.getServiceAddress());
            } else {
                provider.setServiceAddress(addressMapper.toEntity(request.getServiceAddress()));
            }
        }

        return enrichWithRating(providerMapper.toResponse(providerRepository.save(provider)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProviderResponse> getAll(Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        Page<Provider> page = providerRepository.findByIsActiveAndIsVerified(true, true, cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(providerMapper.toResponse(s)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProviderResponse> getByStatus(String status, Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        VerificationStatus verificationStatus = VerificationStatus.valueOf(status.toUpperCase());
        Page<Provider> page = providerRepository.findByVerificationStatus(verificationStatus, cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(providerMapper.toResponse(s)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProviderResponse> getAllForAdmin(Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        Page<Provider> page = providerRepository.findAll(cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(providerMapper.toResponse(s)));
    }

    @Override
    @Transactional
    public ProviderResponse requestVerification() {
        String email = SecurityUtils.getCurrentUserEmail();
        Provider provider = providerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));
        
        if (provider.getVerificationStatus() == VerificationStatus.APPROVED) {
            throw new BadRequestException("Profile is already verified");
        }
        if (provider.getVerificationStatus() == VerificationStatus.PENDING) {
            throw new BadRequestException("Verification is already pending");
        }
        
        provider.setVerificationStatus(VerificationStatus.PENDING);
        return enrichWithRating(providerMapper.toResponse(providerRepository.save(provider)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProviderResponse> getNearby(double lat, double lng, double radiusKm, Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        Page<Provider> page = providerRepository.findNearbyProviders(lat, lng, radiusKm, cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(providerMapper.toResponse(s)));
    }

    @Override
    @Transactional
    public ProviderResponse approveVerification(String providerId) {
        Provider provider = providerRepository.findById(UUID.fromString(providerId))
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", providerId));

        if (provider.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Only pending profiles can be approved");
        }

        provider.setVerificationStatus(VerificationStatus.APPROVED);
        provider.setIsVerified(true);
        return enrichWithRating(providerMapper.toResponse(providerRepository.save(provider)));
    }

    @Override
    @Transactional
    public ProviderResponse rejectVerification(String providerId) {
        Provider provider = providerRepository.findById(UUID.fromString(providerId))
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", providerId));

        if (provider.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Only pending profiles can be rejected");
        }

        provider.setVerificationStatus(VerificationStatus.REJECTED);
        provider.setIsVerified(false);
        return enrichWithRating(providerMapper.toResponse(providerRepository.save(provider)));
    }

    private ProviderResponse enrichWithRating(ProviderResponse response) {
        reviewRepository.findAverageRatingByProviderId(UUID.fromString(response.getId()))
                .ifPresent(response::setAverageRating);
        return response;
    }

    private Pageable capPageSize(Pageable pageable) {
        return PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), 100),
                pageable.getSort()
        );
    }
}
