package com.app.dto.response;

import lombok.Data;

@Data
public class ClientResponse {
    private String id;
    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String profilePhoto;
    private AddressResponse address;
}
