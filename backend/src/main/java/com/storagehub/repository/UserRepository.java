package com.storagehub.repository;

import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "role")
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "role")
    Optional<User> findFirstByRole_NameAndStatus(Role.Name roleName, Integer status);

    Optional<User> findFirstByRole_NameAndStatusOrderByUserIdAsc(Role.Name name, Integer status);

    @Query(value = """
        SELECT u FROM User u
        JOIN FETCH u.role r
        WHERE (:query IS NULL OR :query = '' 
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
               OR (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', :query, '%')))
          AND (:roleName IS NULL OR r.name = :roleName)
          AND (:status IS NULL OR u.status = :status)
        ORDER BY u.userId DESC
    """,
    countQuery = """
        SELECT COUNT(u) FROM User u
        JOIN u.role r
        WHERE (:query IS NULL OR :query = '' 
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
               OR (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', :query, '%')))
          AND (:roleName IS NULL OR r.name = :roleName)
          AND (:status IS NULL OR u.status = :status)
    """)
    Page<User> findUsers(
            @Param("query") String query,
            @Param("roleName") Role.Name roleName,
            @Param("status") Integer status,
            Pageable pageable
    );
}
