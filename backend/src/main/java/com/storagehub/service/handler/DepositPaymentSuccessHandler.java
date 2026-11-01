package com.storagehub.service.handler;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.dto.task.CreateTaskRequest;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Task;
import com.storagehub.exception.PaymentInvalidStateException;
import com.storagehub.service.ContractService;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.ReservationService;
import com.storagehub.service.TaskService;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * FR-5/FR-10: Deposit SUCCEEDED → tạo Reservation RESERVED từ payload payment.
 * Không còn booking trước khi trả tiền: payment PENDING giữ unit/ngày/quote.
 * Nếu unit đã bị người khác đặt trong lúc thanh toán → payment vẫn SUCCEEDED,
 * đánh dấu refund_required + tạo task hoàn tiền; KHÔNG tạo booking.
 */
@Component
public class DepositPaymentSuccessHandler implements PaymentSuccessHandler {

    private final ReservationService reservationService;
    private final ContractService contractService;
    private final NotificationService notificationService;
    private final LogService logService;
    private final TaskService taskService;

    public DepositPaymentSuccessHandler(
            ReservationService reservationService,
            ContractService contractService,
            NotificationService notificationService,
            LogService logService,
            TaskService taskService
    ) {
        this.reservationService = reservationService;
        this.contractService = contractService;
        this.notificationService = notificationService;
        this.logService = logService;
        this.taskService = taskService;
    }

    @Override
    public boolean supports(Payment.Purpose purpose) {
        return purpose == Payment.Purpose.DEPOSIT;
    }

    @Override
    public PaymentSuccessOutcome onSuccess(Payment payment) {
        if (payment.getReservation() != null) {
            // Webhook lặp lại sau khi đã tạo booking — no-op.
            return new PaymentSuccessOutcome(null, null);
        }
        if (payment.getUnit() == null || payment.getStartDate() == null || payment.getEndDate() == null) {
            throw new PaymentInvalidStateException(
                    "Payment cọc thiếu unit/ngày — không thể tạo booking.");
        }

        Reservation reservation = reservationService.createReservedFromBooking(
                payment.getPayer(),
                payment.getUnit().getUnitId(),
                payment.getStartDate(),
                payment.getEndDate(),
                payment.getAmount()
        );

        if (reservation == null) {
            payment.setRefundRequired(true);
            payment.setRefundReason(
                    "Kho " + payment.getUnit().getCode()
                            + " đã bị đặt trong lúc thanh toán — cần hoàn cọc.");

            try {
                taskService.autoCreateTask(new CreateTaskRequest(
                        Task.Type.SUPPORT,
                        payment.getUnit().getUnitId(),
                        "REFUND-" + payment.getPaymentId(),
                        LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")),
                        null,
                        null,
                        "HIGH",
                        "Khách đã trả cọc nhưng kho vừa bị đặt — hoàn tiền gấp.",
                        payment.getRefundReason()
                ));
            } catch (RuntimeException taskError) {
                // Không để lỗi phân công task làm webhook fail/retry vô hạn —
                // payment vẫn SUCCEEDED + refund_required là nguồn sự thật.
                logService.log(
                        payment.getPayer(),
                        "PAYMENT",
                        payment.getPaymentId(),
                        "REFUND_TASK_FAILED",
                        null,
                        "SUCCEEDED",
                        "Không tạo được task hoàn tiền: " + taskError.getMessage()
                );
            }
            logService.log(
                    payment.getPayer(),
                    "PAYMENT",
                    payment.getPaymentId(),
                    "REFUND_REQUIRED",
                    null,
                    "SUCCEEDED",
                    payment.getRefundReason()
            );
            return new PaymentSuccessOutcome(null, null);
        }

        payment.setReservation(reservation);
        Contract contract = contractService.autoDraftContract(reservation);

        NotificationEventResponse notification =
                notificationService.notifyReservationConfirmed(reservation, payment);

        logService.log(
                payment.getPayer(),
                "PAYMENT",
                payment.getPaymentId(),
                "PAYMENT_SUCCEEDED",
                null,
                "SUCCEEDED",
                "Deposit " + payment.getReceiptCode()
                        + " via " + payment.getMethod()
        );
        logService.log(
                payment.getPayer(),
                "RESERVATION",
                reservation.getReservationId(),
                "STATUS_CHANGED",
                null,
                "RESERVED",
                "Deposit paid — " + payment.getReceiptCode()
        );

        return new PaymentSuccessOutcome(contract, notification);
    }
}
