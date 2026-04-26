package com.app.service;

import com.app.dto.request.SpecialistRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SpecialistResponse;
import org.springframework.data.domain.Pageable;

public interface SpecialistService {
    SpecialistResponse createProfile(SpecialistRequest request);
    boolean hasMyProfile();
    SpecialistResponse getMyProfile();
    SpecialistResponse getById(String id);
    SpecialistResponse updateProfile(SpecialistRequest request);
    SpecialistResponse requestVerification();
    PageResponse<SpecialistResponse> getAll(Pageable pageable);
    PageResponse<SpecialistResponse> getByStatus(String status, Pageable pageable);
    PageResponse<SpecialistResponse> getAllForAdmin(Pageable pageable);
    PageResponse<SpecialistResponse> getNearby(double lat, double lng, double radiusKm, Pageable pageable);
    SpecialistResponse approveVerification(String specialistId);
    SpecialistResponse rejectVerification(String specialistId);
}
