package com.app.service.impl;

import com.app.dto.request.SpecialistRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SpecialistResponse;
import com.app.entity.Address;
import com.app.entity.Specialist;
import com.app.entity.User;
import com.app.entity.enums.VerificationStatus;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.mapper.AddressMapper;
import com.app.mapper.SpecialistMapper;
import com.app.repository.ReviewRepository;
import com.app.repository.SpecialistRepository;
import com.app.repository.UserRepository;
import com.app.service.SpecialistService;
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
public class SpecialistServiceImpl implements SpecialistService {

    private final SpecialistRepository specialistRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final SpecialistMapper specialistMapper;
    private final AddressMapper addressMapper;

    @Override
    @Transactional
    public SpecialistResponse createProfile(SpecialistRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (specialistRepository.findByUserId(user.getId()).isPresent()) {
            throw new BadRequestException("Specialist profile already exists for this user");
        }

        Specialist specialist = specialistMapper.toEntity(request);
        specialist.setUser(user);

        if (request.getPersonalAddress() != null) {
            specialist.setPersonalAddress(addressMapper.toEntity(request.getPersonalAddress()));
        }
        if (request.getServiceAddress() != null) {
            specialist.setServiceAddress(addressMapper.toEntity(request.getServiceAddress()));
        }

        return enrichWithRating(specialistMapper.toResponse(specialistRepository.save(specialist)));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMyProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        return specialistRepository.findByUserEmail(email).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public SpecialistResponse getMyProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        Specialist specialist = specialistRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Specialist profile not found"));
        return enrichWithRating(specialistMapper.toResponse(specialist));
    }

    @Override
    @Transactional(readOnly = true)
    public SpecialistResponse getById(String id) {
        Specialist specialist = specialistRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Specialist", "id", id));
        return enrichWithRating(specialistMapper.toResponse(specialist));
    }

    @Override
    @Transactional
    public SpecialistResponse updateProfile(SpecialistRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Specialist specialist = specialistRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Specialist profile not found"));

        specialistMapper.updateEntityFromRequest(request, specialist);

        if (request.getPersonalAddress() != null) {
            if (specialist.getPersonalAddress() != null) {
                addressMapper.updateEntityFromRequest(request.getPersonalAddress(), specialist.getPersonalAddress());
            } else {
                specialist.setPersonalAddress(addressMapper.toEntity(request.getPersonalAddress()));
            }
        }
        if (request.getServiceAddress() != null) {
            if (specialist.getServiceAddress() != null) {
                addressMapper.updateEntityFromRequest(request.getServiceAddress(), specialist.getServiceAddress());
            } else {
                specialist.setServiceAddress(addressMapper.toEntity(request.getServiceAddress()));
            }
        }

        return enrichWithRating(specialistMapper.toResponse(specialistRepository.save(specialist)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SpecialistResponse> getAll(Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        Page<Specialist> page = specialistRepository.findByIsActiveAndIsVerified(true, true, cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(specialistMapper.toResponse(s)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SpecialistResponse> getByStatus(String status, Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        VerificationStatus verificationStatus = VerificationStatus.valueOf(status.toUpperCase());
        Page<Specialist> page = specialistRepository.findByVerificationStatus(verificationStatus, cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(specialistMapper.toResponse(s)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SpecialistResponse> getAllForAdmin(Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        Page<Specialist> page = specialistRepository.findAll(cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(specialistMapper.toResponse(s)));
    }

    @Override
    @Transactional
    public SpecialistResponse requestVerification() {
        String email = SecurityUtils.getCurrentUserEmail();
        Specialist specialist = specialistRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Specialist profile not found"));
        
        if (specialist.getVerificationStatus() == VerificationStatus.APPROVED) {
            throw new BadRequestException("Profile is already verified");
        }
        if (specialist.getVerificationStatus() == VerificationStatus.PENDING) {
            throw new BadRequestException("Verification is already pending");
        }
        
        specialist.setVerificationStatus(VerificationStatus.PENDING);
        return enrichWithRating(specialistMapper.toResponse(specialistRepository.save(specialist)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SpecialistResponse> getNearby(double lat, double lng, double radiusKm, Pageable pageable) {
        Pageable cappedPageable = capPageSize(pageable);
        Page<Specialist> page = specialistRepository.findNearbySpecialists(lat, lng, radiusKm, cappedPageable);
        return PageResponse.from(page, s -> enrichWithRating(specialistMapper.toResponse(s)));
    }

    @Override
    @Transactional
    public SpecialistResponse approveVerification(String specialistId) {
        Specialist specialist = specialistRepository.findById(UUID.fromString(specialistId))
                .orElseThrow(() -> new ResourceNotFoundException("Specialist", "id", specialistId));

        if (specialist.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Only pending profiles can be approved");
        }

        specialist.setVerificationStatus(VerificationStatus.APPROVED);
        specialist.setIsVerified(true);
        return enrichWithRating(specialistMapper.toResponse(specialistRepository.save(specialist)));
    }

    @Override
    @Transactional
    public SpecialistResponse rejectVerification(String specialistId) {
        Specialist specialist = specialistRepository.findById(UUID.fromString(specialistId))
                .orElseThrow(() -> new ResourceNotFoundException("Specialist", "id", specialistId));

        if (specialist.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Only pending profiles can be rejected");
        }

        specialist.setVerificationStatus(VerificationStatus.REJECTED);
        specialist.setIsVerified(false);
        return enrichWithRating(specialistMapper.toResponse(specialistRepository.save(specialist)));
    }

    private SpecialistResponse enrichWithRating(SpecialistResponse response) {
        reviewRepository.findAverageRatingBySpecialistId(UUID.fromString(response.getId()))
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
