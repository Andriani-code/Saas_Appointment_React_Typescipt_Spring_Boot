package com.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReservationRequest {

    @NotBlank(message = "Slot ID is required")
    private String slotId;

    @NotBlank(message = "Service ID is required")
    private String serviceId;

    private String clientMessage;
}
