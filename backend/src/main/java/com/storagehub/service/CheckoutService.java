package com.storagehub.service;

import com.storagehub.dto.checkout.CancelCheckoutResponse;
import com.storagehub.dto.checkout.CheckoutRequestResponse;
import com.storagehub.dto.checkout.CreateCheckoutRequest;

/**
 * Service quản lý vòng đời yêu cầu trả kho (US-20 / FR-17 / AD-6).
 * Owner duy nhất của CHECKOUT_REQUESTS.
 */
public interface CheckoutService {

    /**
     * Khách gửi yêu cầu trả kho từ Rental Detail.
     */
    CheckoutRequestResponse createCheckoutRequest(
            String currentUserEmail,
            Long reservationId,
            CreateCheckoutRequest request
    );

    /**
     * Khách hủy yêu cầu trả kho.
     */
    CancelCheckoutResponse cancelCheckoutRequest(
            String currentUserEmail,
            Long reservationId
    );

    /**
     * Xem yêu cầu trả kho hiện tại (PENDING) của reservation.
     */
    CheckoutRequestResponse getLatestCheckoutRequest(
            String currentUserEmail,
            Long reservationId
    );

    /**
     * V42: biên bản thanh lý — refund = 0, không inspection, không payment.
     * Owner duy nhất của SETTLEMENTS.
     */
    com.storagehub.entity.Settlement createLiquidationSettlement(
            com.storagehub.entity.Reservation reservation,
            com.storagehub.entity.Contract contract,
            com.storagehub.entity.User manager,
            int lateDays,
            java.math.BigDecimal lateFee,
            String liquidationReason,
            String note
    );
}
