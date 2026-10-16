package com.storagehub.repository;

import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long>{

    @EntityGraph(attributePaths = "role")
    Optional<User> findByEmailIgnoreCase(String email);

    /** US-15: fallback gán task khi zone/date chưa có StaffAssignment. */
    Optional<User> findFirstByRole_NameAndStatusOrderByUserIdAsc(Role.Name name, Integer status);
}