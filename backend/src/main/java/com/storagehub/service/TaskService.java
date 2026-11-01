package com.storagehub.service;

import com.storagehub.dto.task.CreateTaskRequest;
import com.storagehub.dto.task.TaskResponse;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.Task;
import com.storagehub.entity.User;

import java.time.LocalDate;
import java.util.List;

/**
 * Service quản lý vòng đời Task Board (FR-21 / FR-22 / AD-6).
 * Owner duy nhất của entity Task.
 */
public interface TaskService {

    /**
     * Lấy danh sách nhiệm vụ kanban.
     * Mặc định: hiện thẻ trong ngày/ca hiện tại của staff đăng nhập.
     */
    List<TaskResponse> getTasks(
            String currentUserEmail,
            LocalDate workDate,
            StaffAssignment.Shift shift,
            Task.Type type,
            Task.Status status
    );

    /**
     * Ticket API: khách tạo ticket SR-... → tự sinh task SUPPORT gán staff
     * trực ca (idempotent theo (SUPPORT, refCode)).
     */
    Task createSupportTask(com.storagehub.entity.SupportTicket ticket);

    /**
     * US-15 ritual check-in tại quầy: ghi payment RENT (CASH/BANK/POS) vào DB
     * rồi chạy check-in chuẩn (ký HĐ + access code) và DONE task.
     */
    com.storagehub.dto.task.TaskResponse completeCheckinRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.CheckinRitualRequest request);

    /** US-19 ritual ký hợp đồng/phụ lục tại quầy: lưu ảnh + chuyển addendum/contract sang SIGNED. */
    com.storagehub.dto.task.TaskResponse completeContractRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.ContractRitualRequest request);

    /** US-21 ritual checkout: lập Settlement + Inspection + phí + đóng vòng thuê. */
    com.storagehub.dto.task.TaskResponse completeCheckoutRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.CheckoutRitualRequest request);

    /**
     * Xem chi tiết 1 task.
     */
    TaskResponse getTaskDetail(String currentUserEmail, Long taskId);

    /**
     * Chuyển trạng thái task (To do -> In progress -> Done).
     * Kiểm tra Snap-back chống Done ảo (FR-22).
     */
    TaskResponse updateTaskStatus(String currentUserEmail, Long taskId, Task.Status newStatus);

    /**
     * Tự động sinh task phân cho staff đang trực ca và phụ trách Zone chứa Unit (FR-21).
     * Không hỗ trợ giao task thủ công.
     */
    TaskResponse autoCreateTask(CreateTaskRequest request);

    /**
     * US-15: Tự động sinh task CHECK_IN khi reservation hoàn tất trả cọc.
     */
    Task createCheckInTask(User actor, Reservation reservation);

    /**
     * US-15: Hoàn tất task CHECK_IN khi staff hoàn thành Check-in ritual tại quầy.
     */
    Task completeCheckInTask(User actor, String reservationCode);

    /**
     * US-20: Tự động sinh hoặc cập nhật task CHECKOUT khi khách gửi yêu cầu trả kho.
     */
    Task createOrUpdateCheckoutTask(
            User actor,
            Reservation reservation,
            LocalDate requestedDate,
            String timeSlot,
            String reason
    );

    /**
     * US-20: Hủy task CHECKOUT khi khách hủy yêu cầu trả kho.
     */
    void cancelCheckoutTask(User actor, String reservationCode);
}
