package com.app.service;

import com.app.dto.response.PaymentResponse;

public interface PaymentService {
    PaymentResponse createPaymentIntent(String reservationId);
    PaymentResponse getByReservationId(String reservationId);
    void handleStripeWebhook(String payload, String sigHeader);
}
