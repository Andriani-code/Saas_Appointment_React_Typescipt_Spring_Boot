package com.app.service.impl;

import com.app.dto.response.FavoriteResponse;
import com.app.entity.Client;
import com.app.entity.Favorite;
import com.app.entity.Provider;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.ClientRepository;
import com.app.repository.FavoriteRepository;
import com.app.repository.ProviderRepository;
import com.app.repository.ReviewRepository;
import com.app.service.FavoriteService;
import com.app.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ClientRepository clientRepository;
    private final ProviderRepository providerRepository;
    private final ReviewRepository reviewRepository;

    @Override
    @Transactional
    public FavoriteResponse add(String providerId) {
        Client client = getAuthenticatedClient();
        Provider provider = providerRepository.findById(UUID.fromString(providerId))
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", providerId));

        if (favoriteRepository.existsByClientIdAndProviderId(client.getId(), provider.getId())) {
            throw new BadRequestException("Provider is already in your favorites");
        }

        Favorite favorite = Favorite.builder()
                .client(client)
                .provider(provider)
                .build();

        return toResponse(favoriteRepository.save(favorite));
    }

    @Override
    @Transactional
    public void remove(String providerId) {
        Client client = getAuthenticatedClient();
        favoriteRepository.deleteByClientIdAndProviderId(client.getId(), UUID.fromString(providerId));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorite(String providerId) {
        Client client = getAuthenticatedClient();
        return favoriteRepository.existsByClientIdAndProviderId(client.getId(), UUID.fromString(providerId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteResponse> getMyFavorites() {
        Client client = getAuthenticatedClient();
        return favoriteRepository.findAllByClientId(client.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private FavoriteResponse toResponse(Favorite favorite) {
        Provider provider = favorite.getProvider();
        FavoriteResponse response = new FavoriteResponse();
        response.setId(favorite.getId().toString());
        response.setClientId(favorite.getClient().getId().toString());
        response.setProviderId(provider.getId().toString());
        response.setProviderDisplayName(provider.getDisplayName() != null
                ? provider.getDisplayName()
                : provider.getFirstName() + " " + provider.getLastName());
        response.setProviderProfileTitle(provider.getProfileTitle());
        response.setProviderProfilePhoto(provider.getProfilePhoto());
        response.setProviderCategory(provider.getCategory());
        response.setCreatedAt(favorite.getCreatedAt() != null ? favorite.getCreatedAt().toString() : null);
        reviewRepository.findAverageRatingByProviderId(provider.getId())
                .ifPresent(response::setProviderAverageRating);
        return response;
    }

    private Client getAuthenticatedClient() {
        String email = SecurityUtils.getCurrentUserEmail();
        return clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found"));
    }
}
