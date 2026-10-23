package com.storagehub.dto.payment;

import com.storagehub.entity.Extension;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Settlement;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Regression: payment gắn extension/settlement (reservation = null) không được NPE. */
class PaymentRecordResponseTest {

    private static Payment payment(Payment.Purpose purpose) {
        Payment payment = new Payment();
        payment.setPurpose(purpose);
        payment.setMethod(Payment.Method.MOMO);
        payment.setAmount(BigDecimal.valueOf(10_000));
        payment.setStatus(Payment.Status.SUCCEEDED);
        payment.setReceiptCode("RT-2026-0001");
        return payment;
    }

    private static Reservation reservation(long id) {
        Reservation reservation = mock(Reservation.class);
        when(reservation.getReservationId()).thenReturn(id);
        return reservation;
    }

    @Test
    @DisplayName("Payment gắn trực tiếp reservation")
    void mapsReservation() {
        Payment payment = payment(Payment.Purpose.DEPOSIT);
        payment.setReservation(reservation(11L));

        assertThat(PaymentRecordResponse.from(payment).reservationId()).isEqualTo(11L);
    }

    @Test
    @DisplayName("Payment EXTENSION_FEE (reservation null) lấy reservation qua extension")
    void mapsReservationThroughExtension() {
        Payment payment = payment(Payment.Purpose.EXTENSION_FEE);
        Extension extension = new Extension();
        extension.setReservation(reservation(42L));
        payment.setExtension(extension);

        assertThat(PaymentRecordResponse.from(payment).reservationId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("Payment gắn settlement lấy reservation qua settlement")
    void mapsReservationThroughSettlement() {
        Payment payment = payment(Payment.Purpose.DAMAGE_FEE);
        Settlement settlement = new Settlement();
        settlement.setReservation(reservation(77L));
        payment.setSettlement(settlement);

        assertThat(PaymentRecordResponse.from(payment).reservationId()).isEqualTo(77L);
    }
}
