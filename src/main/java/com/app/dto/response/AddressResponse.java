package com.app.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AddressResponse {
    private String id;
    private String country;
    private String region;
    private String city;
    private String district;
    private String addressLine;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
