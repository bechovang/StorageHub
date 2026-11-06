package com.storagehub.service.handler;

import com.storagehub.entity.ContractAddendum;
import com.storagehub.entity.Extension;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Task;
import com.storagehub.entity.User;
import com.storagehub.service.ContractService;
import com.storagehub.service.ExtensionService;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.ReservationService;
import com.storagehub.service.TaskService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExtensionPaymentSuccessHandlerTest {

    @Mock private ExtensionService extensionService;
    @Mock private ReservationService reservationService;
    @Mock private ContractService contractService;
    @Mock private TaskService taskService;
    @Mock private NotificationService notificationService;
    @Mock private LogService logService;
    @InjectMocks private ExtensionPaymentSuccessHandler handler;

    @Test
    @DisplayName("Extension success tạo task CONTRACT và bell đúng assignee")
    void createsContractTaskAndNotifiesAssignee() {
        User customer = new User();
        customer.setUserId(17L);
        customer.setFullName("Nguyễn Thị Lan");

        User staff = new User();
        staff.setUserId(5L);
        staff.setFullName("Nguyễn Văn An");

        Reservation reservation = new Reservation();
        reservation.setReservationId(2L);
        reservation.setCode("BK-2026-0002");
        reservation.setCustomer(customer);

        Extension extension = new Extension();
        extension.setExtensionId(3L);
        extension.setNewEndDate(LocalDate.of(2026, 11, 13));

        Payment payment = new Payment();
        payment.setPaymentId(9L);
        payment.setPayer(customer);
        payment.setReservation(reservation);

        ContractAddendum addendum = new ContractAddendum();
        addendum.setAddendumId(4L);
        addendum.setCode("CT-2026-0002-A1");

        Task task = new Task();
        task.setTaskId(77L);
        task.setAssignedStaff(staff);

        when(extensionService.pendingExtensionFor(2L)).thenReturn(extension);
        when(extensionService.breakdownFor(reservation, extension.getNewEndDate()))
                .thenReturn(new ExtensionService.Breakdown(7, 210000, 5000, 16000, 21000, 226000, "v4"));
        when(contractService.createAddendumForExtension(
                eq(customer), eq(reservation), eq(extension), eq(16000L), eq(21000L)))
                .thenReturn(addendum);
        when(taskService.createContractTask(customer, addendum)).thenReturn(task);

        handler.onSuccess(payment);

        verify(taskService).createContractTask(customer, addendum);
        verify(notificationService).notifyAddendumAwaitingSignature(reservation, addendum, staff);
        verify(logService).log(any(), eq("PAYMENT"), eq(9L), eq("PAYMENT_SUCCEEDED"),
                eq(null), eq("SUCCEEDED"), any());
    }
}
