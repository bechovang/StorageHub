package com.storagehub.repository;

import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

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
}
