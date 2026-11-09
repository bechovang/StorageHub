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
            Task.Status status,
            Long staffId
    );

    /**
     * Ticket API: khách tạo ticket SR-... → tự sinh task SUPPORT gán staff
     * trực ca (idempotent theo (SUPPORT, refCode)).
     */
    Task createSupportTask(com.storagehub.entity.SupportTicket ticket);

    /** Ghi chú nghiệp vụ lên task (hiển thị trên card). */
    void setTaskNote(Long taskId, String note);

    /** Dữ liệu hợp đồng tại quầy cho task check-in/check-out. */
    com.storagehub.dto.task.ContractPreviewResponse getContractPreview(Long taskId);

    /** Staff xử lý hoàn tất hoặc chuyển cấp support ticket từ Task Board. */
    TaskResponse completeSupportRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.SupportRitualRequest request
    );

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

    /** Tiền thu tại quầy (CASH/BANK/POS) theo ca trong ngày — manager/admin. */
    com.storagehub.dto.task.ShiftFinanceSummaryResponse getShiftFinanceSummary(
            String currentUserEmail,
            java.time.LocalDate workDate
    );

    /**
     * Staff/manager tiếp nhận ticket SUPPORT: gán task cho actor, đưa về
     * IN_PROGRESS, cập nhật workDate/shift hiện tại và ghi activity log.
     */
    TaskResponse acceptSupportTask(User actor, String ticketCode);

    /**
     * Tự động sinh task phân cho staff đang trực ca và phụ trách Zone chứa Unit (FR-21).
     * Không hỗ trợ giao task thủ công.
     */
    TaskResponse autoCreateTask(CreateTaskRequest request);

    /**
     * US-18/FR-12: phí gia hạn thành công → sinh task CONTRACT-signature
     * cho staff ký phụ lục giấy (idempotent theo (CONTRACT, addendum.code)).
     */
    Task createContractTask(User actor, com.storagehub.entity.ContractAddendum addendum);

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

    /**
     * V42: tạo/cập nhật task CLEANING cho kho sau thanh lý.
     * refCode = unit.code; note chứa lý do thanh lý + hướng dẫn xử lý hàng còn lại.
     */
    Task createCleaningTask(User actor, Reservation reservation, String note, LocalDate workDate);

    /** V42: kho PREPARING còn task CLEANING active → chưa được coi là available. */
    boolean hasActiveCleaningTask(String unitCode);
}
