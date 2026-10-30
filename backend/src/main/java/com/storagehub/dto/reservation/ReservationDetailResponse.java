package com.storagehub.dto.reservation;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.storagehub.dto.contract.ContractChainItemResponse;
import com.storagehub.dto.payment.PaymentRecordResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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
        Integer durationDays,
        QuoteResponse quote,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate checkInDeadline,
        String depositForfeitReason,
        String accessCode,
        List<PaymentRecordResponse> payments,
        List<ContractChainItemResponse> contracts,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate latestNewCheckout
) {
    public ReservationDetailResponse(
            Long id,
            String code,
            Reservation.Status status,
            ReservationUnitSummaryResponse unit,
            LocalDate startDate,
            LocalDate endDate,
            Long depositAmount,
            String depositStatus,
            Integer durationMonths,
            QuoteResponse quote,
            LocalDate checkInDeadline,
            String depositForfeitReason,
            String accessCode,
            List<PaymentRecordResponse> payments,
            List<ContractChainItemResponse> contracts,
            LocalDate latestNewCheckout
    ) {
        this(
                id,
                code,
                status,
                unit,
                startDate,
                endDate,
                depositAmount,
                depositStatus,
                durationMonths,
                (startDate != null && endDate != null)
                        ? (int) ChronoUnit.DAYS.between(startDate, endDate) + 1
                        : (durationMonths != null ? durationMonths * 30 : null),
                quote,
                checkInDeadline,
                depositForfeitReason,
                accessCode,
                payments,
                contracts,
                latestNewCheckout
        );
    }

    /**
     * US-8: bản tóm tắt tối giản trong PaymentResult sau khi thanh toán deposit.
     * quote / checkInDeadline / accessCode do US-9 (ReservationService) tự tính
     * theo flow riêng — ở đây không có dữ liệu nguồn, trả null.
     */
    public static ReservationDetailResponse from(
            Reservation reservation,
            List<Payment> payments,
            String depositStatus
    ) {
        return from(reservation, payments, depositStatus, null);
    }

    /** US-18: overload cho flow có boundary gia hạn (Rental Detail). */
    public static ReservationDetailResponse from(
            Reservation reservation,
            List<Payment> payments,
            String depositStatus,
            LocalDate latestNewCheckout
    ) {
        long months = ChronoUnit.MONTHS.between(
                reservation.getStartDate(), reservation.getEndDate());
        long days = ChronoUnit.DAYS.between(
                reservation.getStartDate(), reservation.getEndDate()) + 1;

        return new ReservationDetailResponse(
                reservation.getReservationId(),
                reservation.getCode(),
                reservation.getStatus(),
                new ReservationUnitSummaryResponse(
                        reservation.getUnit().getCode(),
                        reservation.getUnit().getSizeM2(),
                        reservation.getUnit().getType().getName()),
                reservation.getStartDate(),
                reservation.getEndDate(),
                reservation.getDepositAmount().longValueExact(),
                depositStatus,
                (int) months,
                (int) days,
                null,
                null,
                null,
                null,
                payments.stream().map(PaymentRecordResponse::from).toList(),
                List.of(),
                latestNewCheckout
        );
    }
}
