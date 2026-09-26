package com.storagehub.dto.reservation;

import com.storagehub.dto.payment.PaymentRecordResponse;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Schema ReservationDetail (openapi.yaml) — mapper TỐI THIỂU cho US-8:
 * quote/checkInDeadline cần dữ liệu nguồn của US-9 (entity chưa có field),
 * accessCode chỉ reveal sau khi hợp đồng có ảnh ký (AD-5 — US-15).
 * US-9/US-10 mở rộng mapper này khi merge.
 */
public record ReservationDetailResponse(
        Long id,
        String code,
        Reservation.Status status,
        UnitSummary unit,
        LocalDate startDate,
        LocalDate endDate,
        long depositAmount,
        String depositStatus,
        int durationMonths,
        Object quote, // TODO US-9: quote snapshot (AD-11)
        LocalDate checkInDeadline, // TODO US-9/US-10
        String depositForfeitReason,
        String accessCode,
        List<PaymentRecordResponse> payments,
        List<Object> contracts
) {

    /** depositStatus (HELD/FORFEITED/SETTLED) — caller derive từ payments. */
    public static ReservationDetailResponse from(
            Reservation reservation,
            List<Payment> payments,
            String depositStatus
    ) {
        return new ReservationDetailResponse(
                reservation.getReservationId(),
                reservation.getCode(),
                reservation.getStatus(),
                UnitSummary.from(reservation.getUnit()),
                reservation.getStartDate(),
                reservation.getEndDate(),
                reservation.getDepositAmount().longValueExact(),
                depositStatus,
                (int) ChronoUnit.MONTHS.between(
                        reservation.getStartDate(),
                        reservation.getEndDate()
                ),
                null,
                null,
                null,
                null,
                payments.stream().map(PaymentRecordResponse::from).toList(),
                List.of()
        );
    }

    public record UnitSummary(
            String code,
            BigDecimal sizeM2,
            String typeName
    ) {

        public static UnitSummary from(Unit unit) {
            return new UnitSummary(
                    unit.getCode(),
                    unit.getSizeM2(),
                    unit.getType().getName()
            );
        }
    }
}
