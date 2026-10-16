package com.storagehub.controller;

import com.storagehub.dto.task.TaskResponse;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * US-15 (FR-25): Task Board của ca trực — chỉ staff trở lên được xem.
 * FE (fe/tuan_anh) đang gọi endpoint này với fallback mock localStorage.
 */
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public TaskController(TaskService taskService, UserRepository userRepository) {
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> listTasks(
            @RequestParam(name = "date", required = false) LocalDate date,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (user.getRole().getName() == Role.Name.CUSTOMER) {
            throw new AccessDeniedException("Task board is staff-only.");
        }

        LocalDate workDate = date != null ? date : LocalDate.now(ICT_ZONE);
        return ResponseEntity.ok(taskService.listTasksForDate(workDate));
    }
}
