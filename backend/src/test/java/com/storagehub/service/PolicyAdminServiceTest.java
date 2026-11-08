package com.storagehub.service;

import com.storagehub.dto.policy.PolicyActiveResponse;
import com.storagehub.dto.policy.PolicySaveRequest;
import com.storagehub.entity.Facility;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.UnitType;
import com.storagehub.repository.FacilityRepository;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.UnitTypeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PolicyAdminServiceTest {

    @Mock
    private RentalPolicyRepository rentalPolicyRepository;

    @Mock
    private PolicyRuleRepository policyRuleRepository;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    @Mock
    private FacilityRepository facilityRepository;

    @InjectMocks
    private PolicyAdminService policyAdminService;

    @Test
    @DisplayName("savePolicy chỉ đổi RENT_RATE của cơ sở đang chọn, giữ giá cơ sở khác")
    void savePolicy_ReplacesOnlyTargetFacilityRent() {
        Facility tanBinh = facility(1, "TB", "Tân Bình Depot");
        Facility thuDuc = facility(2, "TD", "Thủ Đức Depot");
        UnitType freezer = unitType(1, "Kho cấp đông", "Kho âm sâu");

        RentalPolicy current = policy(4, "v4");
        PolicyRule tanBinhRent = rule(freezer, PolicyRule.RuleType.RENT_RATE, 30_000, tanBinh);
        PolicyRule thuDucRent = rule(freezer, PolicyRule.RuleType.RENT_RATE, 27_000, thuDuc);
        PolicyRule globalDeposit = rule(freezer, PolicyRule.RuleType.DEPOSIT_RATE, 10, null);
        List<PolicyRule> currentRules = List.of(tanBinhRent, thuDucRent, globalDeposit);

        when(facilityRepository.findById(1)).thenReturn(Optional.of(tanBinh));
        when(rentalPolicyRepository.findForUpdateByStatus(1)).thenReturn(Optional.of(current));
        when(policyRuleRepository.findByPolicy_PolicyId(4)).thenReturn(currentRules);
        when(unitTypeRepository.findAll()).thenReturn(List.of(freezer));
        when(rentalPolicyRepository.findAll()).thenReturn(List.of(current));
        when(rentalPolicyRepository.save(any(RentalPolicy.class))).thenAnswer(inv -> {
            RentalPolicy p = inv.getArgument(0);
            if (p.getPolicyId() == null) {
                p.setPolicyId(5);
            }
            return p;
        });

        AtomicReference<List<PolicyRule>> savedRules = new AtomicReference<>();
        when(policyRuleRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<PolicyRule> rules = inv.getArgument(0);
            savedRules.set(rules);
            return rules;
        });
        when(policyRuleRepository.findByPolicy_PolicyId(5))
                .thenAnswer(inv -> savedRules.get());

        PolicySaveRequest request = new PolicySaveRequest(
                List.of(new PolicySaveRequest.RateItem(1L, "Kho cấp đông", 32_000L)),
                1,
                null,
                null,
                15,
                null,
                null,
                null,
                null,
                null,
                "ops@demo.storagehub.vn"
        );

        PolicyActiveResponse response = policyAdminService.savePolicy(
                request, "ops@demo.storagehub.vn");

        List<PolicyRule> rules = savedRules.get();
        assertThat(rules).isNotNull();
        assertThat(rentValue(rules, PolicyRule.RuleType.RENT_RATE, tanBinh)).isEqualTo(32_000L);
        assertThat(rentValue(rules, PolicyRule.RuleType.RENT_RATE, thuDuc)).isEqualTo(27_000L);
        assertThat(rules.stream()
                .filter(r -> r.getRuleType() == PolicyRule.RuleType.DEPOSIT_RATE)
                .allMatch(r -> r.getFacility() == null))
                .isTrue();
        assertThat(rules.stream()
                .filter(r -> r.getRuleType() == PolicyRule.RuleType.DEPOSIT_RATE)
                .findFirst().orElseThrow().getValue())
                .isEqualByComparingTo("15");
        assertThat(rules.stream()
                .filter(r -> r.getRuleType() != PolicyRule.RuleType.RENT_RATE)
                .allMatch(r -> r.getFacility() == null))
                .isTrue();

        assertThat(current.getStatus()).isEqualTo(2);
        assertThat(response.version()).isEqualTo("v5");
        assertThat(response.facilityId()).isEqualTo(1);
        assertThat(response.baseRates()).hasSize(1);
        assertThat(response.baseRates().get(0).rateVnd()).isEqualTo(32_000L);
        assertThat(response.surcharges().depositPercent()).isEqualTo(15);
    }

    @Test
    @DisplayName("resetToDefault đưa RENT_RATE cơ sở đang chọn về đúng bảng seed, giữ cơ sở khác")
    void resetToDefault_UsesFacilityDefaultMatrix() {
        Facility tanBinh = facility(1, "TB", "Tân Bình Depot");
        Facility thuDuc = facility(2, "TD", "Thủ Đức Depot");
        UnitType freezer = unitType(1, "Kho cấp đông", "Kho âm sâu");

        RentalPolicy current = policy(4, "v4");
        PolicyRule tanBinhRent = rule(freezer, PolicyRule.RuleType.RENT_RATE, 50_000, tanBinh);
        PolicyRule thuDucRent = rule(freezer, PolicyRule.RuleType.RENT_RATE, 27_000, thuDuc);
        List<PolicyRule> currentRules = List.of(tanBinhRent, thuDucRent);

        when(facilityRepository.findById(1)).thenReturn(Optional.of(tanBinh));
        when(rentalPolicyRepository.findForUpdateByStatus(1)).thenReturn(Optional.of(current));
        when(policyRuleRepository.findByPolicy_PolicyId(4)).thenReturn(currentRules);
        when(unitTypeRepository.findAll()).thenReturn(List.of(freezer));
        when(rentalPolicyRepository.findAll()).thenReturn(List.of(current));
        when(rentalPolicyRepository.save(any(RentalPolicy.class))).thenAnswer(inv -> {
            RentalPolicy p = inv.getArgument(0);
            if (p.getPolicyId() == null) {
                p.setPolicyId(5);
            }
            return p;
        });

        AtomicReference<List<PolicyRule>> savedRules = new AtomicReference<>();
        when(policyRuleRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<PolicyRule> rules = inv.getArgument(0);
            savedRules.set(rules);
            return rules;
        });
        when(policyRuleRepository.findByPolicy_PolicyId(5))
                .thenAnswer(inv -> savedRules.get());

        PolicyActiveResponse response = policyAdminService.resetToDefault(1, "ops@demo.storagehub.vn");

        assertThat(rentValue(savedRules.get(), PolicyRule.RuleType.RENT_RATE, tanBinh))
                .isEqualTo(30_000L);
        assertThat(rentValue(savedRules.get(), PolicyRule.RuleType.RENT_RATE, thuDuc))
                .isEqualTo(27_000L);
        assertThat(response.baseRates().get(0).rateVnd()).isEqualTo(30_000L);
        assertThat(current.getStatus()).isEqualTo(2);
    }

    private long rentValue(List<PolicyRule> rules, PolicyRule.RuleType ruleType, Facility facility) {
        return rules.stream()
                .filter(r -> r.getRuleType() == ruleType)
                .filter(r -> r.getFacility() != null
                        && r.getFacility().getFacilityId().equals(facility.getFacilityId()))
                .findFirst()
                .orElseThrow()
                .getValue()
                .longValue();
    }

    private Facility facility(int id, String code, String name) {
        Facility f = new Facility();
        f.setFacilityId(id);
        f.setCode(code);
        f.setName(name);
        f.setStatus(1);
        return f;
    }

    private UnitType unitType(int id, String name, String description) {
        UnitType t = new UnitType();
        t.setTypeId(id);
        t.setName(name);
        t.setDescription(description);
        return t;
    }

    private RentalPolicy policy(int id, String version) {
        RentalPolicy p = new RentalPolicy();
        p.setPolicyId(id);
        p.setVersion(version);
        p.setStatus(1);
        return p;
    }

    private PolicyRule rule(
            UnitType type,
            PolicyRule.RuleType ruleType,
            long value,
            Facility facility
    ) {
        PolicyRule r = new PolicyRule();
        r.setType(type);
        r.setRuleType(ruleType);
        r.setValue(BigDecimal.valueOf(value));
        r.setFacility(facility);
        return r;
    }
}
