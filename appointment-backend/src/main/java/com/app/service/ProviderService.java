package com.app.service;

import com.app.dto.request.ProviderRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ProviderResponse;
import org.springframework.data.domain.Pageable;

public interface ProviderService {
    ProviderResponse createProfile(ProviderRequest request);
    boolean hasMyProfile();
    ProviderResponse getMyProfile();
    ProviderResponse getById(String id);
    ProviderResponse updateProfile(ProviderRequest request);
    ProviderResponse requestVerification();
    PageResponse<ProviderResponse> getAll(Pageable pageable);
    PageResponse<ProviderResponse> getByStatus(String status, Pageable pageable);
    PageResponse<ProviderResponse> getAllForAdmin(Pageable pageable);
    PageResponse<ProviderResponse> getNearby(double lat, double lng, double radiusKm, Pageable pageable);
    ProviderResponse approveVerification(String providerId);
    ProviderResponse rejectVerification(String providerId);
}
