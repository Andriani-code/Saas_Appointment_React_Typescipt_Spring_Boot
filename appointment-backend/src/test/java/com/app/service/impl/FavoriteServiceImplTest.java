package com.app.service.impl;

import com.app.dto.response.FavoriteResponse;
import com.app.entity.Client;
import com.app.entity.Favorite;
import com.app.entity.Provider;
import com.app.entity.User;
import com.app.entity.enums.Role;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.ClientRepository;
import com.app.repository.FavoriteRepository;
import com.app.repository.ProviderRepository;
import com.app.repository.ReviewRepository;
import com.app.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceImplTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ProviderRepository providerRepository;

    @Mock
    private ReviewRepository reviewRepository;

    private FavoriteServiceImpl service() {
        return new FavoriteServiceImpl(favoriteRepository, clientRepository, providerRepository, reviewRepository);
    }

    private Client client() {
        return Client.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("client@example.com").role(Role.CLIENT).build())
                .firstName("Jane")
                .lastName("Doe")
                .build();
    }

    private Provider provider() {
        return Provider.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("provider@example.com").role(Role.PROVIDER).build())
                .firstName("Sam")
                .lastName("Provider")
                .displayName("Dr Sam")
                .profileTitle("Médecin")
                .category("Santé")
                .build();
    }

    @Test
    void addThrowsWhenProviderAlreadyFavorite() {
        FavoriteServiceImpl service = service();
        Client client = client();
        Provider provider = provider();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(providerRepository.findById(provider.getId())).thenReturn(Optional.of(provider));
        when(favoriteRepository.existsByClientIdAndProviderId(client.getId(), provider.getId())).thenReturn(true);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            assertThrows(BadRequestException.class, () -> service.add(provider.getId().toString()));
        }
    }

    @Test
    void addThrowsWhenProviderMissing() {
        FavoriteServiceImpl service = service();
        Client client = client();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(providerRepository.findById(any())).thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            assertThrows(ResourceNotFoundException.class, () -> service.add(UUID.randomUUID().toString()));
        }
    }

    @Test
    void addSavesFavoriteWithProviderDisplayName() {
        FavoriteServiceImpl service = service();
        Client client = client();
        Provider provider = provider();

        Favorite favorite = Favorite.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .build();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(providerRepository.findById(provider.getId())).thenReturn(Optional.of(provider));
        when(favoriteRepository.existsByClientIdAndProviderId(client.getId(), provider.getId())).thenReturn(false);
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(favorite);
        when(reviewRepository.findAverageRatingByProviderId(provider.getId())).thenReturn(Optional.of(4.5));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            FavoriteResponse response = service.add(provider.getId().toString());

            assertEquals(provider.getId().toString(), response.getProviderId());
            assertEquals("Dr Sam", response.getProviderDisplayName());
            assertEquals("Santé", response.getProviderCategory());
            assertEquals(4.5, response.getProviderAverageRating());
            verify(favoriteRepository).save(any(Favorite.class));
        }
    }

    @Test
    void removeDeletesFavorite() {
        FavoriteServiceImpl service = service();
        Client client = client();
        Provider provider = provider();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            service.remove(provider.getId().toString());

            verify(favoriteRepository).deleteByClientIdAndProviderId(client.getId(), provider.getId());
        }
    }

    @Test
    void isFavoriteReturnsTrueWhenExists() {
        FavoriteServiceImpl service = service();
        Client client = client();
        Provider provider = provider();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(favoriteRepository.existsByClientIdAndProviderId(client.getId(), provider.getId())).thenReturn(true);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            assertTrue(service.isFavorite(provider.getId().toString()));
        }
    }

    @Test
    void isFavoriteReturnsFalseWhenNotExists() {
        FavoriteServiceImpl service = service();
        Client client = client();
        Provider provider = provider();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(favoriteRepository.existsByClientIdAndProviderId(client.getId(), provider.getId())).thenReturn(false);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            assertFalse(service.isFavorite(provider.getId().toString()));
        }
    }

    @Test
    void getMyFavoritesReturnsMappedList() {
        FavoriteServiceImpl service = service();
        Client client = client();
        Provider provider = provider();

        Favorite favorite = Favorite.builder()
                .id(UUID.randomUUID())
                .client(client)
                .provider(provider)
                .build();

        when(clientRepository.findByUserEmail("client@example.com")).thenReturn(Optional.of(client));
        when(favoriteRepository.findAllByClientId(client.getId())).thenReturn(List.of(favorite));
        when(reviewRepository.findAverageRatingByProviderId(provider.getId())).thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("client@example.com");

            List<FavoriteResponse> responses = service.getMyFavorites();

            assertEquals(1, responses.size());
            assertEquals("Dr Sam", responses.get(0).getProviderDisplayName());
        }
    }
}
