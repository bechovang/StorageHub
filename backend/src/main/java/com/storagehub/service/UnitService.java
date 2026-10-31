package com.storagehub.service;

import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.unit.UnitAvailabilityResponse;
import com.storagehub.dto.unit.UnitDetailResponse;
import com.storagehub.dto.unit.UnitFilterOptionsResponse;
import com.storagehub.dto.unit.UnitPageResponse;
import com.storagehub.dto.unit.UnitSummaryResponse;
import com.storagehub.dto.unit.UnitTypeOptionDto;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.UnitNotFoundException;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UnitTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service quản lý kho (Unit, UnitType, Facility, Zone) theo AD-6.
 * Độc quyền tính toán Availability on-read (AD-4) và áp giá theo Active Policy (AD-11).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitService {

    private final UnitRepository unitRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final RentalPolicyRepository rentalPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final ReservationRepository reservationRepository;
    private final PricingEngine pricingEngine;
    private final LogService logService;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Lấy các tùy chọn cho filter bar Browse Units (danh mục loại kho + kích thước có sẵn).
     */
    public UnitFilterOptionsResponse getFilterOptions() {
        List<UnitTypeOptionDto> types = unitTypeRepository.findAll().stream()
                .map(t -> new UnitTypeOptionDto(t.getTypeId().longValue(), t.getName()))
                .toList();

        List<BigDecimal> sizesM2 = unitRepository.findDistinctSizesM2();
        return new UnitFilterOptionsResponse(types, sizesM2);
    }

    /**
     * Tìm kho — availability tính tại thời điểm query (FR-4, AD-4, AD-7, AD-8, AD-11).
     */
    public UnitPageResponse searchUnits(
            Long typeId,
            BigDecimal sizeM2,
            String query,
            LocalDate startDate,
            LocalDate endDate,
            String sort,
            Integer page,
            Integer pageSize
    ) {
        // Chuẩn hóa phân trang 1-based (AD-8)
        int validPage = (page == null || page < 1) ? 1 : page;
        int validPageSize = (pageSize == null || pageSize < 1) ? 25 : Math.min(pageSize, 100);
        String validSort = (sort == null || sort.isBlank()) ? "price-asc" : sort;

        LocalDate today = LocalDate.now(ICT_ZONE);
        LocalDate queryStartDate = (startDate != null) ? startDate : today;
        LocalDate queryEndDate = (endDate != null && !endDate.isBefore(queryStartDate)) ? endDate : queryStartDate;

        // Lấy chính sách giá đang hoạt động (status = 1)
        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));

        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId());

        // Map: TypeId -> BaseMonthlyRent
        Map<Integer, Long> rentRateMap = new HashMap<>();
        // Map: TypeId -> TurnoverBufferDays
        Map<Integer, Integer> bufferDaysMap = new HashMap<>();

        for (PolicyRule r : rules) {
            Integer tId = r.getType().getTypeId();
            if (r.getRuleType() == PolicyRule.RuleType.RENT_RATE) {
                rentRateMap.put(tId, r.getValue().longValue());
            } else if (r.getRuleType() == PolicyRule.RuleType.TURNOVER_BUFFER) {
                bufferDaysMap.put(tId, r.getValue().intValue());
            }
        }

        // Ứng viên: Loại trừ RENTED, MAINTENANCE, RETIRED khỏi kết quả (OpenAPI & PRD FR-4)
        List<Unit.Status> candidateStatuses = List.of(Unit.Status.AVAILABLE, Unit.Status.PREPARING);
        List<Unit> candidates = unitRepository.findCandidateUnits(candidateStatuses);

        // Lọc theo typeId và sizeM2 nếu có
        // Tìm theo mã kho (US-6): "s7", "S-7", "s-7" đều khớp S-7 — bỏ ký tự
        // không phải chữ/số rồi so sánh contains không phân biệt hoa/thường.
        String normalizedQuery = (query == null || query.isBlank())
                ? null
                : query.replaceAll("[^a-zA-Z0-9]", "").toUpperCase(Locale.ROOT);

        List<Unit> filteredUnits = candidates.stream()
                .filter(u -> typeId == null || u.getType().getTypeId().longValue() == typeId)
                .filter(u -> sizeM2 == null || u.getSizeM2().compareTo(sizeM2) == 0)
                .filter(u -> normalizedQuery == null
                        || normalizeCode(u.getCode()).contains(normalizedQuery))
                .toList();

        if (filteredUnits.isEmpty()) {
            return new UnitPageResponse(List.of(), validPage, validPageSize, 0L);
        }

        List<Long> unitIds = filteredUnits.stream().map(Unit::getUnitId).toList();

        // Lấy các reservation đang active của các unit này
        Set<Reservation.Status> activeReservationStatuses = Set.of(
                Reservation.Status.RESERVED,
                Reservation.Status.CHECKED_IN,
                Reservation.Status.CHECKOUT_REQUESTED
        );
        List<Reservation> activeReservations = reservationRepository.findActiveReservationsForUnits(
                unitIds, activeReservationStatuses
        );

        Map<Long, List<Reservation>> reservationsByUnit = activeReservations.stream()
                .collect(Collectors.groupingBy(r -> r.getUnit().getUnitId()));

        List<UnitSummaryResponse> resultItems = new ArrayList<>();

        for (Unit unit : filteredUnits) {
            Integer typeIdVal = unit.getType().getTypeId();
            int bufferDays = bufferDaysMap.getOrDefault(typeIdVal, 1);
            long dailyRent = rentRateMap.getOrDefault(typeIdVal, 0L);

            // 1. Tính ngày sẵn sàng sau dọn dẹp của kho
            LocalDate readyDate = today;
            if (unit.getStatus() == Unit.Status.PREPARING) {
                List<Reservation> closedList = reservationRepository.findLatestClosedReservations(unit.getUnitId());
                if (!closedList.isEmpty()) {
                    readyDate = closedList.get(0).getEndDate().plusDays(bufferDays);
                } else {
                    readyDate = today.plusDays(bufferDays);
                }
            }

            // 2. Tính khoảng thời gian thuê thực tế nếu khách chọn unit này
            LocalDate effectiveStart = queryStartDate.isBefore(readyDate) ? readyDate : queryStartDate;
            LocalDate effectiveEnd = queryEndDate.isBefore(effectiveStart) ? effectiveStart : queryEndDate;

            // 3. Kiểm tra xung đột (overlap) với reservation đang có trong tương lai
            List<Reservation> unitReservations = reservationsByUnit.getOrDefault(unit.getUnitId(), List.of());
            boolean hasOverlap = false;

            for (Reservation res : unitReservations) {
                LocalDate resOccupiedEnd = res.getEndDate().plusDays(bufferDays);
                LocalDate reqOccupiedEnd = effectiveEnd.plusDays(bufferDays);

                // Hai khoảng [A, B] và [C, D] trùng nhau khi A <= D && C <= B
                if (!effectiveStart.isAfter(resOccupiedEnd) && !res.getStartDate().isAfter(reqOccupiedEnd)) {
                    hasOverlap = true;
                    break;
                }
            }


            // Nếu bị trùng lịch đặt trong tương lai -> loại khỏi kết quả
            if (hasOverlap) {
                continue;
            }

            // 4. Xác định availability status
            UnitAvailabilityResponse availability;
            if (queryStartDate.isBefore(readyDate)) {
                // Đang trong turnover buffer -> AVAILABLE_SOON kèm availableFromDate
                availability = new UnitAvailabilityResponse("AVAILABLE_SOON", readyDate);
            } else {
                // Sẵn sàng đúng ngày yêu cầu -> AVAILABLE
                availability = new UnitAvailabilityResponse("AVAILABLE", null);
            }

            UnitSummaryResponse summary = new UnitSummaryResponse(
                    unit.getUnitId(),
                    unit.getCode(),
                    unit.getType().getName(),
                    unit.getSizeM2(),
                    unit.getFloor(),
                    unit.getZone().getCode(),
                    unit.getZone().getFacility().getName(),
                    unit.getAccessType(),
                    dailyRent,
                    availability,
                    "/units/" + unit.getCode() + ".jpg"
            );

            resultItems.add(summary);
        }

        // Sắp xếp theo giá (AD-8 & contract)
        if ("price-desc".equalsIgnoreCase(validSort)) {
            resultItems.sort(Comparator.comparing(UnitSummaryResponse::baseDailyRent).reversed()
                    .thenComparing(UnitSummaryResponse::code));
        } else {
            resultItems.sort(Comparator.comparing(UnitSummaryResponse::baseDailyRent)
                    .thenComparing(UnitSummaryResponse::code));
        }

        // Phân trang offset 1-based (AD-8)
        long total = resultItems.size();
        int fromIndex = (validPage - 1) * validPageSize;
        List<UnitSummaryResponse> pagedItems;

        if (fromIndex >= total) {
            pagedItems = List.of();
        } else {
            int toIndex = Math.min(fromIndex + validPageSize, (int) total);
            pagedItems = resultItems.subList(fromIndex, toIndex);
        }

        return new UnitPageResponse(pagedItems, validPage, validPageSize, total);
    }

    /**
     * Chi tiết unit — spec đầy đủ (FR-6, phần tĩnh theo schema UnitDetail).
     */
    public UnitDetailResponse getUnitDetail(Long unitId) {
        Unit unit = unitRepository.findWithDetailsById(unitId)
                .orElseThrow(() -> new UnitNotFoundException("Unit này không tồn tại."));

        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));

        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId());

        long dailyRent = 0L;
        int bufferDays = 1;
        Integer typeIdVal = unit.getType().getTypeId();

        for (PolicyRule r : rules) {
            if (r.getType().getTypeId().equals(typeIdVal)) {
                if (r.getRuleType() == PolicyRule.RuleType.RENT_RATE) {
                    dailyRent = r.getValue().longValue();
                } else if (r.getRuleType() == PolicyRule.RuleType.TURNOVER_BUFFER) {
                    bufferDays = r.getValue().intValue();
                }
            }
        }

        LocalDate today = LocalDate.now(ICT_ZONE);
        UnitAvailabilityResponse availability;

        if (unit.getStatus() == Unit.Status.PREPARING) {
            List<Reservation> closedList = reservationRepository.findLatestClosedReservations(unit.getUnitId());
            LocalDate readyDate = !closedList.isEmpty()
                    ? closedList.get(0).getEndDate().plusDays(bufferDays)
                    : today.plusDays(bufferDays);
            availability = new UnitAvailabilityResponse("AVAILABLE_SOON", readyDate);
        } else if (unit.getStatus() == Unit.Status.AVAILABLE) {
            availability = new UnitAvailabilityResponse("AVAILABLE", null);
        } else {
            // RENTED / MAINTENANCE / RETIRED
            availability = new UnitAvailabilityResponse(unit.getStatus().name(), null);
        }

        String dimensions = resolveDimensions(unit.getSizeM2());
        String security = resolveSecurity(unit.getAccessType());
        List<String> photoUrls = List.of(
                "/units/" + unit.getCode() + ".jpg",
                "/units/" + unit.getCode() + "-interior.jpg"
        );

        return new UnitDetailResponse(
                unit.getUnitId(),
                unit.getCode(),
                unit.getType().getName(),
                unit.getSizeM2(),
                unit.getFloor(),
                unit.getZone().getCode(),
                unit.getZone().getFacility().getName(),
                unit.getAccessType(),
                dailyRent,
                availability,
                "/units/" + unit.getCode() + ".jpg",
                dimensions,
                security,
                photoUrls
        );
    }

    /**
     * Bảng giá minh bạch (FR-6) tính toán từ PricingEngine (AD-11).
     */
    public QuoteResponse getUnitQuote(Long unitId, LocalDate startDate, LocalDate endDate) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new UnitNotFoundException("Unit này không tồn tại."));

        return pricingEngine.calculateQuote(unit, startDate, endDate);
    }

    /**
     * US-10 (FR-36): no-show hết hạn — mở lại unit khi khách không đến nhận kho.
     * Chỉ flip RESERVED → AVAILABLE: availability browse là derive-on-read nên
     * cột thường không giữ RESERVED; flip có điều kiện để an toàn khi US-15
     * bắt đầu set RENTED. Method-level @Transactional đè class-level readOnly.
     */
    @Transactional
    public boolean releaseHoldAfterNoShow(User actor, Unit unit) {
        if (unit.getStatus() != Unit.Status.RESERVED) {
            return false;
        }
        unit.setStatus(Unit.Status.AVAILABLE);
        unitRepository.save(unit);
        logService.log(actor, "UNIT", unit.getUnitId(),
                "STATUS_CHANGED", "RESERVED", "AVAILABLE",
                "No-show expiry — hold released");
        return true;
    }

    /**
     * US-15 (FR-15): check-in thành công → kho chính thức được thuê.
     * Chấp nhận từ RESERVED (hold) hoặc AVAILABLE (cột thường không giữ hold
     * vì availability derive-on-read) — idempotent nếu đã RENTED.
     */
    @Transactional
    public boolean markRentedAtCheckIn(User actor, Unit unit) {
        if (unit.getStatus() == Unit.Status.RENTED) {
            return false;
        }
        Unit.Status from = unit.getStatus();
        unit.setStatus(Unit.Status.RENTED);
        unitRepository.save(unit);
        logService.log(actor, "UNIT", unit.getUnitId(),
                "STATUS_CHANGED", from.name(), "RENTED",
                "Check-in — unit handed over");
        return true;
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.replaceAll("[^a-zA-Z0-9]", "").toUpperCase(Locale.ROOT);
    }

    private String resolveDimensions(BigDecimal sizeM2) {
        if (sizeM2 == null) {
            return "2.0 × 2.5 × 2.2 m";
        }
        double size = sizeM2.doubleValue();
        if (Math.abs(size - 1.5) < 0.1) {
            return "1.0 × 1.5 × 2.0 m";
        }
        if (Math.abs(size - 5.0) < 0.1) {
            return "2.0 × 2.5 × 2.2 m";
        }
        if (Math.abs(size - 8.0) < 0.1) {
            return "2.5 × 3.2 × 2.8 m";
        }
        if (Math.abs(size - 15.0) < 0.1) {
            return "3.0 × 5.0 × 3.0 m";
        }
        return String.format(Locale.US, "%.1f m² × 2.5 m", size);
    }

    private String resolveSecurity(String accessType) {
        if ("PIN".equalsIgnoreCase(accessType)) {
            return "24/7 PIN + CCTV + Motion sensors";
        } else if ("smart lock".equalsIgnoreCase(accessType)) {
            return "Smart keyless lock + CCTV 24/7";
        }
        return "Keycard/QR 24/7 + CCTV";
    }
}
