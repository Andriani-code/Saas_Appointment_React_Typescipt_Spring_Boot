package com.app.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private String id;
    private String reservationId;
    private BigDecimal amount;
    private String method;
    private String status;
    private String stripePaymentIntentId;
    private String clientSecret;
    private LocalDateTime createdAt;
}
