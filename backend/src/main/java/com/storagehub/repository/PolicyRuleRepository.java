package com.storagehub.repository;

import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PolicyRuleRepository extends JpaRepository<PolicyRule, Long> {

    @Query("""
        SELECT pr FROM PolicyRule pr
        WHERE pr.policy.status = 1
          AND pr.type = :unitType
          AND pr.ruleType = :ruleType
    """)
    Optional<PolicyRule> findActivePolicyRule(
            @Param("unitType") UnitType unitType,
            @Param("ruleType") PolicyRule.RuleType ruleType
    );

    /**
     * Lấy toàn bộ rule thuộc một chính sách giá.
     */
    List<PolicyRule> findByPolicy_PolicyId(Integer policyId);
}
