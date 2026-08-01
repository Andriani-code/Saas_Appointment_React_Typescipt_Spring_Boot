package com.app.service.impl;

import com.app.dto.request.ClientRequest;
import com.app.dto.response.ClientResponse;
import com.app.dto.response.PageResponse;
import com.app.entity.Address;
import com.app.entity.Client;
import com.app.entity.User;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.mapper.AddressMapper;
import com.app.mapper.ClientMapper;
import com.app.repository.ClientRepository;
import com.app.repository.UserRepository;
import com.app.service.ClientService;
import com.app.service.FileStorageService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ClientMapper clientMapper;
    private final AddressMapper addressMapper;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public ClientResponse createProfile(ClientRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (clientRepository.existsByUserId(user.getId())) {
            throw new BadRequestException("Client profile already exists for this user");
        }

        Client client = clientMapper.toEntity(request);
        client.setUser(user);

        if (request.getAddress() != null) {
            Address address = addressMapper.toEntity(request.getAddress());
            address.setUser(user);
            client.setAddress(address);
        }

        return clientMapper.toResponse(clientRepository.save(client));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMyProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        return clientRepository.findByUserEmail(email).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public ClientResponse getMyProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        Client client = clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found"));
        return clientMapper.toResponse(client);
    }

    @Override
    @Transactional(readOnly = true)
    public ClientResponse getById(String id) {
        Client client = clientRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));
        return clientMapper.toResponse(client);
    }

    @Override
    @Transactional
    public ClientResponse updateProfile(ClientRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Client client = clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found"));

        String oldProfilePhoto = client.getProfilePhoto();
        clientMapper.updateEntityFromRequest(request, client);

        if (oldProfilePhoto != null && !oldProfilePhoto.equals(request.getProfilePhoto())) {
            fileStorageService.delete(oldProfilePhoto);
        }

        if (request.getAddress() != null) {
            if (client.getAddress() != null) {
                addressMapper.updateEntityFromRequest(request.getAddress(), client.getAddress());
            } else {
                Address address = addressMapper.toEntity(request.getAddress());
                address.setUser(client.getUser());
                client.setAddress(address);
            }
        }

        return clientMapper.toResponse(clientRepository.save(client));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ClientResponse> getAll(Pageable pageable) {
        Page<Client> page = clientRepository.findAll(pageable);
        return PageResponse.from(page, clientMapper::toResponse);
    }
}
