package com.app.service;

import com.app.dto.response.FavoriteResponse;

import java.util.List;

public interface FavoriteService {
    FavoriteResponse add(String providerId);
    void remove(String providerId);
    boolean isFavorite(String providerId);
    List<FavoriteResponse> getMyFavorites();
}
