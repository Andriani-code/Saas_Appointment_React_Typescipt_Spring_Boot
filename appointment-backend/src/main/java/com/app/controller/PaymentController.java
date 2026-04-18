package com.app.controller;

import com.app.dto.response.PaymentResponse;
import com.app.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Stripe payment processing")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/reservation/{reservationId}/intent")
    @PreAuthorize("hasRole('CLIENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a Stripe PaymentIntent for a reservation deposit")
    public ResponseEntity<PaymentResponse> createIntent(@PathVariable String reservationId) {
        return ResponseEntity.ok(paymentService.createPaymentIntent(reservationId));
    }

    @GetMapping("/reservation/{reservationId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get payment details for a reservation")
    public ResponseEntity<PaymentResponse> getByReservation(@PathVariable String reservationId) {
        return ResponseEntity.ok(paymentService.getByReservationId(reservationId));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook endpoint (no auth required)")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        paymentService.handleStripeWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }
}
