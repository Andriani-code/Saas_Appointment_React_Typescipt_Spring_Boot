package com.app.service;

import com.app.dto.request.AddressRequest;
import com.app.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {
    AddressResponse create(String userId, AddressRequest request);
    List<AddressResponse> getByUser(String userId);
    AddressResponse update(String userId, String id, AddressRequest request);
    void delete(String id);
}
