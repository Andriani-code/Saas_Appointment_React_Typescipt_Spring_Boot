package com.app.service.impl;

import com.app.config.StripeConfig;
import com.app.dto.response.PaymentResponse;
import com.app.entity.Payment;
import com.app.entity.Reservation;
import com.app.entity.enums.PaymentStatus;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.repository.ClientRepository;
import com.app.repository.PaymentRepository;
import com.app.repository.ReservationRepository;
import com.app.service.PaymentService;
import com.app.util.SecurityUtils;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final StripeConfig stripeConfig;

    @Override
    @Transactional
    public PaymentResponse createPaymentIntent(String reservationId) {
        String email = SecurityUtils.getCurrentUserEmail();
        var client = clientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found"));

        Reservation reservation = reservationRepository.findByIdWithDetails(UUID.fromString(reservationId))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", reservationId));

        if (!reservation.getClient().getId().equals(client.getId())) {
            throw new UnauthorizedException("This reservation does not belong to you");
        }

        if (!Boolean.TRUE.equals(reservation.getDepositRequired())) {
            throw new BadRequestException("This reservation does not require a deposit payment");
        }

        // Check if payment already exists
        paymentRepository.findByReservationId(UUID.fromString(reservationId))
                .ifPresent(p -> {
                    if (p.getStatus() == PaymentStatus.SUCCESS) {
                        throw new BadRequestException("Payment already completed for this reservation");
                    }
                });

        BigDecimal amount = reservation.getDepositAmount();

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amount.multiply(BigDecimal.valueOf(100)).longValue()) // Convert to cents
                    .setCurrency("usd")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build())
                    .putMetadata("reservationId", reservationId)
                    .putMetadata("clientId", client.getId().toString())
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            Payment payment = paymentRepository.findByReservationId(UUID.fromString(reservationId))
                    .orElse(Payment.builder()
                            .reservation(reservation)
                            .amount(amount)
                            .build());

            payment.setStripePaymentIntentId(intent.getId());
            payment.setStatus(PaymentStatus.PENDING);
            Payment saved = paymentRepository.save(payment);

            PaymentResponse response = toResponse(saved);
            response.setClientSecret(intent.getClientSecret());
            return response;

        } catch (StripeException e) {
            log.error("Stripe error creating PaymentIntent: {}", e.getMessage());
            throw new BadRequestException("Payment processing failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getByReservationId(String reservationId) {
        Payment payment = paymentRepository.findByReservationId(UUID.fromString(reservationId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for reservation: " + reservationId));

        String email = SecurityUtils.getCurrentUserEmail();
        var reservation = payment.getReservation();
        boolean isClient = reservation.getClient() != null
                && reservation.getClient().getUser() != null
                && reservation.getClient().getUser().getEmail().equals(email);
        boolean isProvider = reservation.getProvider() != null
                && reservation.getProvider().getUser() != null
                && reservation.getProvider().getUser().getEmail().equals(email);
        if (!isClient && !isProvider) {
            throw new UnauthorizedException("This payment does not belong to you");
        }

        return toResponse(payment);
    }

    @Override
    @Transactional
    public void handleStripeWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            log.warn("Invalid Stripe webhook signature: {}", e.getMessage());
            throw new BadRequestException("Invalid webhook signature");
        }

        switch (event.getType()) {
            case "payment_intent.succeeded" -> {
                PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (intent != null) {
                    paymentRepository.findByStripePaymentIntentId(intent.getId())
                            .ifPresent(payment -> {
                                payment.setStatus(PaymentStatus.SUCCESS);
                                paymentRepository.save(payment);
                                log.info("Payment succeeded for intent: {}", intent.getId());
                            });
                }
            }
            case "payment_intent.payment_failed" -> {
                PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (intent != null) {
                    paymentRepository.findByStripePaymentIntentId(intent.getId())
                            .ifPresent(payment -> {
                                payment.setStatus(PaymentStatus.FAILED);
                                paymentRepository.save(payment);
                                log.warn("Payment failed for intent: {}", intent.getId());
                            });
                }
            }
            default -> log.debug("Unhandled Stripe event type: {}", event.getType());
        }
    }

    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId().toString());
        response.setReservationId(payment.getReservation().getId().toString());
        response.setAmount(payment.getAmount());
        response.setMethod(payment.getMethod().name());
        response.setStatus(payment.getStatus().name());
        response.setStripePaymentIntentId(payment.getStripePaymentIntentId());
        response.setCreatedAt(payment.getCreatedAt());
        return response;
    }
}
