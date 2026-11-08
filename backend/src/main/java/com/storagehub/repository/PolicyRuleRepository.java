package com.storagehub.repository;

import com.storagehub.entity.PolicyRule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyRuleRepository extends JpaRepository<PolicyRule, Long> {

    /**
     * Lấy toàn bộ rule thuộc một chính sách giá (kèm type + facility để
     * resolver không phải lazy-load từng dòng).
     */
    @EntityGraph(attributePaths = {"type", "facility"})
    List<PolicyRule> findByPolicy_PolicyId(Integer policyId);

    @Query("""
        SELECT pr FROM PolicyRule pr
        JOIN FETCH pr.type
        LEFT JOIN FETCH pr.facility
        WHERE pr.policy.status = 1
          AND pr.ruleType = :ruleType
    """)
    List<PolicyRule> findActiveRulesByType(@Param("ruleType") PolicyRule.RuleType ruleType);
}
