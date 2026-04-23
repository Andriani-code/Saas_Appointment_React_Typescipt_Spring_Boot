package com.app.service;

import com.app.dto.request.ClientRequest;
import com.app.dto.response.ClientResponse;
import com.app.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ClientService {
    ClientResponse createProfile(ClientRequest request);
    boolean hasMyProfile();
    ClientResponse getMyProfile();
    ClientResponse getById(String id);
    ClientResponse updateProfile(ClientRequest request);
    PageResponse<ClientResponse> getAll(Pageable pageable);
}
