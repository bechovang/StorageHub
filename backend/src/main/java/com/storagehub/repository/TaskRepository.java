package com.storagehub.repository;

import com.storagehub.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByWorkDateOrderByCreatedAtAsc(LocalDate workDate);

    /** refCode đa hình (BK-/CL-/SR-) không FK nên tra theo cặp type + refCode. */
    Optional<Task> findFirstByTypeAndRefCodeOrderByCreatedAtDesc(Task.Type type, String refCode);

    Optional<Task> findFirstByTypeAndRefCodeAndStatusIn(
            Task.Type type,
            String refCode,
            List<Task.Status> statuses
    );
}
