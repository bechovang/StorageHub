package com.storagehub.repository;

import com.storagehub.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByWorkDateOrderByCreatedAtAsc(LocalDate workDate);

    /** refCode đa hình (BK-/CL-/SR-) không FK nên tra theo cặp type + refCode. */
    Optional<Task> findFirstByTypeAndRefCodeOrderByCreatedAtDesc(Task.Type type, String refCode);

    Optional<Task> findFirstByTypeAndRefCodeAndStatusIn(
            Task.Type type,
            String refCode,
            List<Task.Status> statuses
    );

    @Query("SELECT t FROM Task t JOIN FETCH t.assignedStaff s WHERE t.taskId = :taskId")
    Optional<Task> findWithStaffById(@Param("taskId") Long taskId);

    @Query("""
        SELECT t FROM Task t
        JOIN FETCH t.assignedStaff s
        WHERE (:staffId IS NULL OR s.userId = :staffId)
          AND (:workDate IS NULL OR t.workDate = :workDate)
          AND (:type IS NULL OR t.type = :type)
          AND (:status IS NULL OR t.status = :status)
        ORDER BY t.taskId ASC
    """)
    List<Task> findFilteredTasks(
            @Param("staffId") Long staffId,
            @Param("workDate") LocalDate workDate,
            @Param("type") Task.Type type,
            @Param("status") Task.Status status
    );

    @Query("""
        SELECT t FROM Task t
        JOIN FETCH t.assignedStaff s
        WHERE s.userId = :staffId
          AND (:type IS NULL OR t.type = :type)
          AND (:status IS NULL OR t.status = :status)
        ORDER BY t.workDate DESC, t.taskId ASC
    """)
    List<Task> findStaffTasks(
            @Param("staffId") Long staffId,
            @Param("type") Task.Type type,
            @Param("status") Task.Status status
    );
}
