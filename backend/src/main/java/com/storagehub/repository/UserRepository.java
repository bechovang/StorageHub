package com.storagehub.repository;

import com.storagehub.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long>{

    @EntityGraph(attributePaths = "role")
    Optional<User> findByEmailIgnoreCase(String email);
}