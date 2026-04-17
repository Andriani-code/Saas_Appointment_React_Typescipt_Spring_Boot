package com.app.dto.response;

import lombok.Data;

@Data
public class SpecialistResponse {
    private String id;
    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String displayName;
    private String profileTitle;
    private String bio;
    private String profilePhoto;
    private String coverPhoto;
    private Boolean isActive;
    private Boolean isVerified;
    private String verificationStatus;
    private AddressResponse personalAddress;
    private AddressResponse serviceAddress;
    private Double averageRating;
}
