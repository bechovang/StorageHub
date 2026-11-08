package com.storagehub.repository;

import com.storagehub.entity.RentalPolicy;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RentalPolicyRepository extends JpaRepository<RentalPolicy, Integer> {

    /**
     * Tìm chính sách giá theo trạng thái (status = 1 là đang sử dụng).
     */
    Optional<RentalPolicy> findByStatus(Integer status);

    /**
     * Khoá dòng policy đang hiệu lực khi lưu/reset — tránh hai cơ sở lưu đồng
     * thời sinh hai version từ cùng một bản cũ và làm mất thay đổi của nhau.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM RentalPolicy p WHERE p.status = :status")
    Optional<RentalPolicy> findForUpdateByStatus(@Param("status") Integer status);
}
