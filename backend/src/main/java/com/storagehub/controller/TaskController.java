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
     * US-21: Xác nhận tất toán và hoàn tất thủ tục trả kho trên Drawer Task Board.
     */
    @PostMapping("/{taskId}/complete-checkout")
    public ResponseEntity<TaskResponse> completeCheckout(
            @PathVariable("taskId") Long taskId,
            @RequestBody(required = false) com.storagehub.dto.task.CompleteCheckoutRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        Long refund = request != null ? request.refundAmount() : null;
        Long damage = request != null ? request.damageFee() : null;
        TaskResponse response = taskService.completeCheckoutRitual(email, taskId, refund, damage);
        return ResponseEntity.ok(response);
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
}
