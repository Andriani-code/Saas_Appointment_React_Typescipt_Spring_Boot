package com.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AvailabilityRequest {

    @NotNull(message = "Date is required")
    private LocalDate date;

    private Boolean isActive = true;
}
