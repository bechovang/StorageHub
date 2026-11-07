package com.storagehub.service;

import com.storagehub.entity.Reservation;
import com.storagehub.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/** Nhắc khách trước hạn trả kho 7/3/1/0 ngày + quá hạn (một lần/ngày). */
@Service
@RequiredArgsConstructor
public class CheckoutReminderService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;
    private final LateCheckoutService lateCheckoutService;

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void remindUpcomingCheckouts() {
        LocalDate today = LocalDate.now(ICT_ZONE);
        for (Reservation reservation : reservationRepository.findCurrentActiveReservations()) {
            if (reservation.getStatus() != Reservation.Status.CHECKED_IN
                    && reservation.getStatus() != Reservation.Status.CHECKOUT_REQUESTED) {
                continue;
            }
            lateCheckoutService.evaluate(reservation);
            long days = ChronoUnit.DAYS.between(today, reservation.getEndDate());
            if (days == 7 || days == 3 || days == 1 || days == 0) {
                notificationService.notifyCheckoutReminder(reservation, (int) days, false);
            } else if (days < 0) {
                notificationService.notifyCheckoutReminder(reservation, (int) days, true);
            }
        }
    }
}
