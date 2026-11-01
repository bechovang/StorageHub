package com.storagehub.controller;

import com.storagehub.dto.task.CreateTaskRequest;
import com.storagehub.dto.task.TaskResponse;
import com.storagehub.dto.task.UpdateTaskStatusRequest;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.Task;
import com.storagehub.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller quản lý Task Board kanban (FR-21 / FR-22 / NFR-2).
 * Hỗ trợ 3 cột To do / In progress / Done và 5 loại thẻ:
 * Check-in / Checkout / Cleaning / Support / Contract-signature.
 */
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Lấy danh sách nhiệm vụ kanban.
     * Mặc định: hiện thẻ trong ngày/ca hiện tại của staff đăng nhập.
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(name = "workDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate,
            @RequestParam(name = "shift", required = false) StaffAssignment.Shift shift,
            @RequestParam(name = "type", required = false) Task.Type type,
            @RequestParam(name = "status", required = false) Task.Status status,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        List<TaskResponse> tasks = taskService.getTasks(email, workDate, shift, type, status);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Chi tiết 1 nhiệm vụ.
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTaskDetail(
            @PathVariable("taskId") Long taskId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        TaskResponse task = taskService.getTaskDetail(email, taskId);
        return ResponseEntity.ok(task);
    }

    /**
     * Chuyển trạng thái nhiệm vụ (To do -> In progress -> Done).
     * Bị chặn bởi Snap-back (FR-22) nếu thiếu closing steps khi kéo sang Done.
     */
    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable("taskId") Long taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        TaskResponse updated = taskService.updateTaskStatus(email, taskId, request.status());
        return ResponseEntity.ok(updated);
    }

    /**
     * Hệ thống tự động phân sinh task cho staff trực ca và phụ trách Zone chứa Unit (FR-21).
     * Không hỗ trợ giao task thủ công.
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody CreateTaskRequest request
    ) {
        TaskResponse created = taskService.autoCreateTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * US-15: nhân viên hoàn tất ritual nhận kho tại quầy — ghi payment RENT
     * (CASH/QR/POS) + ký hợp đồng + cấp Access Code + DONE task (một transaction).
     */
    @PostMapping("/{taskId}/rituals/check-in")
    public ResponseEntity<com.storagehub.dto.task.TaskResponse> completeCheckinRitual(
            @PathVariable("taskId") Long taskId,
            @org.springframework.web.bind.annotation.RequestBody
            @jakarta.validation.Valid com.storagehub.dto.task.CheckinRitualRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(taskService.completeCheckinRitual(
                authentication.getName(), taskId, request));
    }

    /** US-19: ký hợp đồng/phụ lục tại quầy — lưu ảnh bản ký + SIGNED. */
    @PostMapping("/{taskId}/rituals/contract")
    public ResponseEntity<com.storagehub.dto.task.TaskResponse> completeContractRitual(
            @PathVariable("taskId") Long taskId,
            @org.springframework.web.bind.annotation.RequestBody
            @jakarta.validation.Valid com.storagehub.dto.task.ContractRitualRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(taskService.completeContractRitual(
                authentication.getName(), taskId, request));
    }

    /**
     * US-21: nhân viên tất toán trả kho tại quầy — Settlement + Inspection +
     * phí hư hại/phát sinh (payments) + đóng vòng thuê trong cùng transaction.
     */
    @PostMapping("/{taskId}/rituals/checkout")
    public ResponseEntity<com.storagehub.dto.task.TaskResponse> completeCheckoutRitual(
            @PathVariable("taskId") Long taskId,
            @org.springframework.web.bind.annotation.RequestBody
            @jakarta.validation.Valid com.storagehub.dto.task.CheckoutRitualRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(taskService.completeCheckoutRitual(
                authentication.getName(), taskId, request));
    }
}
