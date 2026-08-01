package com.app.dto.response;

import lombok.Data;

@Data
public class FavoriteResponse {
    private String id;
    private String clientId;
    private String providerId;
    private String providerDisplayName;
    private String providerProfileTitle;
    private String providerProfilePhoto;
    private String providerCategory;
    private Double providerAverageRating;
    private String createdAt;
}
