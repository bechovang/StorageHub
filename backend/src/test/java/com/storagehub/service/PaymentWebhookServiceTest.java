package com.storagehub.service;

import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.exception.PaymentWebhookException;
import com.storagehub.gateway.PaymentGateway;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.handler.PaymentSuccessHandler;
import com.storagehub.service.impl.PaymentServiceImpl;
import com.storagehub.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentWebhookServiceTest {

    private PaymentRepository paymentRepository;
    private PaymentGateway gateway;
    private PaymentSuccessHandler handler;
    private PaymentServiceImpl paymentService;
    private Payment payment;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        gateway = mock(PaymentGateway.class);
        handler = mock(PaymentSuccessHandler.class);

        PlatformTransactionManager transactionManager = new PlatformTransactionManager() {
            @Override
            public org.springframework.transaction.TransactionStatus getTransaction(
                    TransactionDefinition definition
            ) {
                return new SimpleTransactionStatus();
            }

            @Override
            public void commit(org.springframework.transaction.TransactionStatus status) {
            }

            @Override
            public void rollback(org.springframework.transaction.TransactionStatus status) {
            }
        };

        paymentService = new PaymentServiceImpl(
                paymentRepository,
                mock(UnitRepository.class),
                mock(ReservationRepository.class),
                mock(UserRepository.class),
                gateway,
                List.of(handler),
                transactionManager,
                mock(PricingEngine.class),
                mock(ExtensionService.class),
                mock(ReservationService.class)
        );

        Reservation reservation = new Reservation();
        reservation.setReservationId(1042L);

        payment = new Payment();
        payment.setPaymentId(11L);
        payment.setPayer(new com.storagehub.entity.User());
        payment.setReservation(reservation);
        payment.setPurpose(Payment.Purpose.DEPOSIT);
        payment.setMethod(Payment.Method.PAYOS);
        payment.setAmount(BigDecimal.valueOf(50_000));
        payment.setStatus(Payment.Status.PENDING);
        payment.setReceiptCode("RT-2026-0001");
    }

    @Test
    @DisplayName("Webhook SUCCEEDED chuyển payment + chạy handler đúng một lần")
    void succeedsAndRunsHandlerOnce() {
        when(gateway.verifyWebhook("{}"))
                .thenReturn(Optional.of(new PaymentGateway.WebhookEvent(11L, true, 50_000L)));
        when(paymentRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(payment));
        when(handler.supports(Payment.Purpose.DEPOSIT)).thenReturn(true);
        when(handler.onSuccess(payment)).thenReturn(
                new PaymentSuccessHandler.PaymentSuccessOutcome(null, null));

        paymentService.handlePayOsWebhook("{}");

        assertThat(payment.getStatus()).isEqualTo(Payment.Status.SUCCEEDED);
        verify(handler, times(1)).onSuccess(payment);
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    @DisplayName("Webhook retry khi payment đã SUCCEEDED → idempotent, không chạy handler lại")
    void duplicateWebhookIsIdempotent() {
        payment.setStatus(Payment.Status.SUCCEEDED);
        when(gateway.verifyWebhook("{}"))
                .thenReturn(Optional.of(new PaymentGateway.WebhookEvent(11L, true, 50_000L)));
        when(paymentRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(payment));

        paymentService.handlePayOsWebhook("{}");

        verify(handler, never()).onSuccess(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Chữ ký sai → không đụng DB")
    void invalidSignatureDoesNotTouchDatabase() {
        when(gateway.verifyWebhook("{}"))
                .thenThrow(new PaymentWebhookException("bad signature"));

        assertThatThrownBy(() -> paymentService.handlePayOsWebhook("{}"))
                .isInstanceOf(PaymentWebhookException.class);
        verify(paymentRepository, never()).findByIdForUpdate(any());
    }

    @Test
    @DisplayName("Số tiền webhook lệch payment → 400, payment giữ PENDING")
    void amountMismatchIsRejected() {
        when(gateway.verifyWebhook("{}"))
                .thenReturn(Optional.of(new PaymentGateway.WebhookEvent(11L, true, 1L)));
        when(paymentRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.handlePayOsWebhook("{}"))
                .isInstanceOf(PaymentWebhookException.class);
        assertThat(payment.getStatus()).isEqualTo(Payment.Status.PENDING);
        verify(paymentRepository, never()).save(any());
    }
}
