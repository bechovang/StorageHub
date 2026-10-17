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
}
