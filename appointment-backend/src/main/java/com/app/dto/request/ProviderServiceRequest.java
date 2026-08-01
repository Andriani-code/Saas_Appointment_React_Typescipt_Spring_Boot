package com.app.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProviderServiceRequest {

    @NotBlank(message = "Service name is required")
    private String name;

    private String description;

    private String photoUrl;

    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Duration must be at least 15 minutes")
    private Integer durationMinutes;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Deposit enabled flag is required")
    private Boolean depositEnabled;

    @DecimalMin(value = "0.01", message = "Deposit amount must be greater than 0")
    private BigDecimal depositAmount;
}
