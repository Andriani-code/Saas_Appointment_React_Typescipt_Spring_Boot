package com.app.service;

import com.app.dto.request.AvailabilityRequest;
import com.app.dto.response.AvailabilityResponse;

import java.util.List;

public interface AvailabilityService {
    AvailabilityResponse create(AvailabilityRequest request);
    AvailabilityResponse update(String id, AvailabilityRequest request);
    void delete(String id);
    List<AvailabilityResponse> getMyAvailabilities();
    List<AvailabilityResponse> getByProvider(String providerId);
}
