package com.storagehub.dto.reservation;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.storagehub.dto.contract.ContractChainItemResponse;
import com.storagehub.dto.payment.PaymentRecordResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.entity.Reservation;

import java.time.LocalDate;
import java.util.List;

/**
 * Chi tiết đặt chỗ/thuê theo schema ReservationDetail trong contracts/openapi.yaml.
 */
public record ReservationDetailResponse(
        Long id,
        String code,
        Reservation.Status status,
        ReservationUnitSummaryResponse unit,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate endDate,
        Long depositAmount,
        String depositStatus,
        Integer durationMonths,
        QuoteResponse quote,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate checkInDeadline,
        String depositForfeitReason,
        String accessCode,
        List<PaymentRecordResponse> payments,
        List<ContractChainItemResponse> contracts
) {
}
