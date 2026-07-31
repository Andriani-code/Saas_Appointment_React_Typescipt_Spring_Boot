package com.app.service;

import com.app.dto.request.ProviderServiceRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ProviderServiceResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProviderOfferingService {
    ProviderServiceResponse create(ProviderServiceRequest request);
    ProviderServiceResponse getById(String id);
    List<ProviderServiceResponse> getActiveByProvider(String providerId);
    PageResponse<ProviderServiceResponse> getByProvider(String providerId, Pageable pageable);
    ProviderServiceResponse update(String id, ProviderServiceRequest request);
    void deactivate(String id);
}
