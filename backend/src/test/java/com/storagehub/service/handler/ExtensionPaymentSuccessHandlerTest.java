package com.storagehub.service.handler;

import com.storagehub.entity.Extension;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.User;
import com.storagehub.service.ExtensionDepositService;
import com.storagehub.service.ExtensionService;
import com.storagehub.service.LogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExtensionPaymentSuccessHandlerTest {

    @Mock private ExtensionService extensionService;
    @Mock private ExtensionDepositService extensionDepositService;
    @Mock private LogService logService;
    @InjectMocks private ExtensionPaymentSuccessHandler handler;

    @Test
    @DisplayName("Extension deposit success áp dụng deposit flow")
    void appliesDepositFlow() {
        User customer = new User();
        customer.setUserId(17L);
        customer.setFullName("Nguyễn Thị Lan");

        Reservation reservation = new Reservation();
        reservation.setReservationId(2L);
        reservation.setCode("BK-2026-0002");
        reservation.setCustomer(customer);

        Extension extension = new Extension();
        extension.setExtensionId(3L);
        extension.setReservation(reservation);

        Payment payment = new Payment();
        payment.setPaymentId(9L);
        payment.setPayer(customer);
        payment.setReservation(reservation);
        payment.setReceiptCode("RT-EXT-1");

        when(extensionService.pendingExtensionFor(2L)).thenReturn(extension);

        handler.onSuccess(payment);

        verify(extensionDepositService).applyDeposit(customer, reservation, extension);
        verify(logService).log(eq(customer), eq("PAYMENT"), eq(9L), eq("PAYMENT_SUCCEEDED"),
                eq(null), eq("SUCCEEDED"), any());
    }
}
