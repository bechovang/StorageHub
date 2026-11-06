package com.storagehub.service;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.ContractAddendum;
import com.storagehub.entity.Extension;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.User;
import com.storagehub.repository.ContractAddendumRepository;
import com.storagehub.repository.ExtensionRepository;
import com.storagehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Cọc gia hạn đã xác nhận (PayOS hoặc QR=0) → giữ kỳ thuê, sinh Addendum
 * AWAITING_SIGNATURE + Task CONTRACT. 100% rent vẫn thu tại quầy.
 */
@Service
@RequiredArgsConstructor
public class ExtensionDepositService {

    private final ExtensionRepository extensionRepository;
    private final ContractAddendumRepository contractAddendumRepository;
    private final UserRepository userRepository;
    private final ExtensionService extensionService;
    private final ReservationService reservationService;
    private final ContractService contractService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final LogService logService;

    @Transactional
    public NotificationEventResponse applyDeposit(User actor, Reservation reservation, Extension extension) {
        if (extension.getStatus() == Extension.Status.PENDING_CONTRACT
                || extension.getStatus() == Extension.Status.APPLIED) {
            return null;
        }
        ExtensionService.Breakdown breakdown =
                extensionService.breakdownFor(reservation, extension.getNewEndDate());
        extensionService.markDepositPaid(actor, extension);
        reservationService.markExtensionDepositPaid(
                reservation, extension.getNewEndDate(),
                breakdown.oldDeposit(), breakdown.newDeposit());

        ContractAddendum addendum = contractService.createAddendumForExtension(
                actor, reservation, extension,
                Math.max(0, breakdown.newDeposit() - breakdown.oldDeposit()),
                breakdown.newDeposit());
        var task = taskService.createContractTask(actor, addendum);
        NotificationEventResponse notification =
                notificationService.notifyExtensionApplied(reservation, extension);
        notificationService.notifyAddendumAwaitingSignature(
                reservation, addendum, task != null ? task.getAssignedStaff() : null);
        return notification;
    }

    @Transactional
    public NotificationEventResponse confirmZeroDeposit(
            String email, Long reservationId, Long extensionId) {
        User actor = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccessDeniedException("Người dùng không tồn tại"));
        Extension extension = extensionRepository.findById(extensionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu gia hạn."));
        if (!extension.getReservation().getReservationId().equals(reservationId)
                || !extension.getReservation().getCustomer().getUserId().equals(actor.getUserId())) {
            throw new AccessDeniedException("Yêu cầu gia hạn không thuộc đơn của bạn.");
        }
        if (extension.getStatus() != Extension.Status.PENDING_PAYMENT) {
            return null;
        }
        ExtensionService.Breakdown breakdown =
                extensionService.breakdownFor(extension.getReservation(), extension.getNewEndDate());
        if (breakdown.depositDelta() > 0) {
            throw new IllegalArgumentException("Cọc gia hạn vẫn còn chênh lệch — cần thanh toán QR.");
        }
        NotificationEventResponse result = applyDeposit(
                actor, extension.getReservation(), extension);
        logService.log(actor, "EXTENSION", extensionId, "DEPOSIT_CONFIRMED",
                "PENDING_PAYMENT", "PENDING_CONTRACT",
                "QR = 0 — cọc đã đủ, sinh task contract cho staff");
        return result;
    }
}
