package com.app.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SpecialistServiceResponse {
    private String id;
    private String specialistId;
    private String specialistDisplayName;
    private String name;
    private String description;
    private Integer durationMinutes;
    private BigDecimal price;
    private Boolean depositEnabled;
    private BigDecimal depositAmount;
    private Boolean isActive;
}
