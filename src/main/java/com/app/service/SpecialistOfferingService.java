package com.app.service;

import com.app.dto.request.SpecialistServiceRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SpecialistServiceResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SpecialistOfferingService {
    SpecialistServiceResponse create(SpecialistServiceRequest request);
    SpecialistServiceResponse getById(String id);
    List<SpecialistServiceResponse> getActiveBySpecialist(String specialistId);
    PageResponse<SpecialistServiceResponse> getBySpecialist(String specialistId, Pageable pageable);
    SpecialistServiceResponse update(String id, SpecialistServiceRequest request);
    void deactivate(String id);
}
