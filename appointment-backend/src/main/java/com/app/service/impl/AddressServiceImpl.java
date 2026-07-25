package com.app.service.impl;

import com.app.dto.request.AddressRequest;
import com.app.dto.response.AddressResponse;
import com.app.entity.Address;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.AddressMapper;
import com.app.repository.AddressRepository;
import com.app.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final AddressMapper addressMapper;

    @Override
    @Transactional
    public AddressResponse create(String userId, AddressRequest request) {
        Address address = addressMapper.toEntity(request);
        address.setUserId(UUID.fromString(userId));
        Address saved = addressRepository.save(address);
        return addressMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getByUser(String userId) {
        return addressRepository.findByUserId(UUID.fromString(userId))
                .stream()
                .map(addressMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse update(String userId, String id, AddressRequest request) {
        Address address = addressRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));
        // Ensure the address belongs to the user trying to update it
        if (!address.getUserId().toString().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to update this address");
        }
        addressMapper.updateEntityFromRequest(request, address);
        Address saved = addressRepository.save(address);
        return addressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Address address = addressRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));
        addressRepository.delete(address);
    }
}
