package com.app.service.impl;

import com.app.config.StripeConfig;
import com.app.entity.Payment;
import com.app.entity.Reservation;
import com.app.entity.enums.PaymentStatus;
import com.app.exception.BadRequestException;
import com.app.repository.ClientRepository;
import com.app.repository.PaymentRepository;
import com.app.repository.ReservationRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private StripeConfig stripeConfig;

    @Test
    void handleStripeWebhookMarksPaymentSuccessfulForValidSignature() {
        PaymentServiceImpl service = new PaymentServiceImpl(
                paymentRepository, reservationRepository, clientRepository, stripeConfig);

        Payment payment = Payment.builder()
                .reservation(Reservation.builder().id(UUID.randomUUID()).build())
                .status(PaymentStatus.PENDING)
                .stripePaymentIntentId("pi_123")
                .build();

        Event event = mock(Event.class);
        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        PaymentIntent paymentIntent = mock(PaymentIntent.class);

        when(stripeConfig.getWebhookSecret()).thenReturn("whsec_test");
        when(event.getType()).thenReturn("payment_intent.succeeded");
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(paymentIntent));
        when(paymentIntent.getId()).thenReturn("pi_123");
        when(paymentRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(payment));

        try (MockedStatic<Webhook> webhook = org.mockito.Mockito.mockStatic(Webhook.class)) {
            webhook.when(() -> Webhook.constructEvent("payload", "signature", "whsec_test"))
                    .thenReturn(event);

            service.handleStripeWebhook("payload", "signature");
        }

        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        verify(paymentRepository).save(payment);
    }

    @Test
    void handleStripeWebhookRejectsInvalidSignature() {
        PaymentServiceImpl service = new PaymentServiceImpl(
                paymentRepository, reservationRepository, clientRepository, stripeConfig);

        when(stripeConfig.getWebhookSecret()).thenReturn("whsec_test");

        try (MockedStatic<Webhook> webhook = org.mockito.Mockito.mockStatic(Webhook.class)) {
            webhook.when(() -> Webhook.constructEvent("payload", "bad-signature", "whsec_test"))
                    .thenThrow(new SignatureVerificationException("bad", "sig"));

            BadRequestException exception = assertThrows(BadRequestException.class,
                    () -> service.handleStripeWebhook("payload", "bad-signature"));

            assertEquals("Invalid webhook signature", exception.getMessage());
        }
    }
}
