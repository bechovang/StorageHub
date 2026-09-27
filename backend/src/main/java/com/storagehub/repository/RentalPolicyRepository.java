package com.storagehub.repository;

import com.storagehub.entity.RentalPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RentalPolicyRepository extends JpaRepository<RentalPolicy, Integer> {

    /**
     * Tìm chính sách giá theo trạng thái (status = 1 là đang sử dụng).
     */
    Optional<RentalPolicy> findByStatus(Integer status);
}
