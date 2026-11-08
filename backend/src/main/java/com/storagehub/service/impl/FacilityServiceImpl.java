package com.storagehub.service.impl;

import com.storagehub.dto.facility.FacilityDrilldownItem;
import com.storagehub.dto.facility.FacilityDrilldownResponse;
import com.storagehub.dto.facility.FacilityOverviewResponse;
import com.storagehub.dto.facility.FacilitySummaryResponse;
import com.storagehub.dto.facility.FacilityLayoutResponse;
import com.storagehub.entity.*;
import com.storagehub.repository.*;
import com.storagehub.service.FacilityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FacilityServiceImpl implements FacilityService {

    private final UnitRepository unitRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final ReservationRepository reservationRepository;
    private final TaskRepository taskRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final FacilityRepository facilityRepository;

    public FacilityServiceImpl(
            UnitRepository unitRepository,
            UnitTypeRepository unitTypeRepository,
            ReservationRepository reservationRepository,
            TaskRepository taskRepository,
            SupportTicketRepository supportTicketRepository,
            PolicyRuleRepository policyRuleRepository,
            FacilityRepository facilityRepository
    ) {
        this.unitRepository = unitRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.reservationRepository = reservationRepository;
        this.taskRepository = taskRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.policyRuleRepository = policyRuleRepository;
        this.facilityRepository = facilityRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityLayoutResponse getLayout(Integer facilityId) {
        return getLayout(facilityId, LocalDate.now(), LocalDate.now());
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityLayoutResponse getLayout(
            Integer facilityId, LocalDate startDate, LocalDate endDate) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("Cơ sở không tồn tại: " + facilityId));
        List<Unit> units = unitRepository.findLayoutByFacility(facilityId);

        LocalDate rangeStart = startDate != null ? startDate : LocalDate.now();
        LocalDate rangeEnd = endDate != null && !endDate.isBefore(rangeStart) ? endDate : rangeStart;
        List<Long> unitIds = units.stream().map(Unit::getUnitId).toList();
        java.util.Map<Long, List<Reservation>> reservationsByUnit = unitIds.isEmpty()
                ? java.util.Map.of()
                : reservationRepository.findActiveReservationsForUnits(
                        unitIds,
                        List.of(Reservation.Status.RESERVED,
                                Reservation.Status.CHECKED_IN,
                                Reservation.Status.CHECKOUT_REQUESTED))
                .stream().collect(Collectors.groupingBy(r -> r.getUnit().getUnitId()));

        Map<Integer, Map<String, List<Unit>>> byFloor = new TreeMap<>();
        for (Unit unit : units) {
            byFloor.computeIfAbsent(unit.getFloor(), f -> new LinkedHashMap<>())
                    .computeIfAbsent(unit.getZone().getCode(), z -> new ArrayList<>())
                    .add(unit);
        }

        List<FacilityLayoutResponse.Floor> floors = byFloor.entrySet().stream()
                .map(floorEntry -> {
                    List<FacilityLayoutResponse.Zone> zones = floorEntry.getValue().entrySet().stream()
                            .map(zoneEntry -> {
                                List<Unit> zoneUnits = zoneEntry.getValue();
                                String typeName = zoneUnits.isEmpty() ? null
                                        : zoneUnits.get(0).getType().getName();
                                List<FacilityLayoutResponse.UnitCell> cells = zoneUnits.stream()
                                        .map(u -> {
                                            List<Reservation> reservations =
                                                    reservationsByUnit.getOrDefault(u.getUnitId(), List.of());
                                            boolean overlaps = reservations.stream().anyMatch(r ->
                                                    !r.getStartDate().isAfter(rangeEnd)
                                                            && !r.getEndDate().isBefore(rangeStart));
                                            boolean currentRented = reservations.stream().anyMatch(r ->
                                                    (r.getStatus() == Reservation.Status.CHECKED_IN
                                                            || r.getStatus() == Reservation.Status.CHECKOUT_REQUESTED)
                                                            && !r.getStartDate().isAfter(rangeEnd)
                                                            && !r.getEndDate().isBefore(rangeStart));
                                            String status;
                                            if (u.getStatus() == Unit.Status.MAINTENANCE
                                                    || u.getStatus() == Unit.Status.RETIRED) {
                                                status = u.getStatus().name();
                                            } else if (overlaps) {
                                                status = currentRented ? "RENTED" : "RESERVED";
                                            } else if (u.getStatus() == Unit.Status.PREPARING) {
                                                status = "PREPARING";
                                            } else {
                                                status = "AVAILABLE";
                                            }
                                            LocalDate availableFrom = reservations.stream()
                                                    .map(r -> r.getEndDate().plusDays(1))
                                                    .max(LocalDate::compareTo)
                                                    .orElse(null);
                                            return new FacilityLayoutResponse.UnitCell(
                                                    u.getUnitId(), u.getCode(), u.getGridRow(), u.getGridCol(),
                                                    status, u.getType().getName(),
                                                    u.getSizeM2() == null ? null : u.getSizeM2().intValue(),
                                                    availableFrom);
                                        })
                                        .toList();
                                return new FacilityLayoutResponse.Zone(zoneEntry.getKey(), typeName, cells);
                            })
                            .toList();
                    return new FacilityLayoutResponse.Floor(floorEntry.getKey(), zones);
                })
                .toList();

        return new FacilityLayoutResponse(
                facility.getFacilityId(), facility.getName(), facility.getAddress(), floors);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacilitySummaryResponse> listActiveFacilities() {
        return facilityRepository.findByStatusOrderByFacilityIdAsc(1).stream()
                .map(f -> new FacilitySummaryResponse(
                        f.getFacilityId(),
                        f.getCode(),
                        f.getName(),
                        f.getDescription(),
                        f.getAddress(),
                        f.getPhone(),
                        f.getPhotoUrl(),
                        unitRepository.countByZone_Facility_FacilityIdAndStatusNot(
                                f.getFacilityId(), Unit.Status.RETIRED)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityOverviewResponse getFacilityOverview() {
        List<Unit> units = unitRepository.findAllWithDetails();
        int totalAll = units.size();
        int activeUnits = (int) units.stream().filter(u -> u.getStatus() != Unit.Status.RETIRED).count();
        int baseUnits = (activeUnits > 0) ? activeUnits : totalAll;

        // 1. KPI Occupancy
        int rentedUnits = (int) units.stream().filter(u -> u.getStatus() == Unit.Status.RENTED).count();
        BigDecimal occupancyRate = (baseUnits > 0)
                ? BigDecimal.valueOf(rentedUnits * 100.0 / baseUnits).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        String occupancyTrend = "+2.4% so với tuần trước";
        FacilityOverviewResponse.OccupancyKpi occupancyKpi = new FacilityOverviewResponse.OccupancyKpi(
                occupancyRate,
                rentedUnits,
                baseUnits,
                occupancyTrend
        );

        // 2. KPI Units in Service
        int maintenanceUnits = (int) units.stream().filter(u -> u.getStatus() == Unit.Status.MAINTENANCE).count();
        int operationalUnits = (int) units.stream()
                .filter(u -> u.getStatus() != Unit.Status.RETIRED && u.getStatus() != Unit.Status.MAINTENANCE)
                .count();
        BigDecimal operationalRate = (baseUnits > 0)
                ? BigDecimal.valueOf(operationalUnits * 100.0 / baseUnits).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        FacilityOverviewResponse.UnitsInServiceKpi unitsInServiceKpi = new FacilityOverviewResponse.UnitsInServiceKpi(
                operationalUnits,
                baseUnits,
                operationalRate,
                maintenanceUnits
        );

        // 3. KPI Tasks Today
        LocalDate today = LocalDate.now();
        List<Task> tasksToday = taskRepository.findByWorkDateWithStaff(today);
        int completedTasks = (int) tasksToday.stream().filter(t -> t.getStatus() == Task.Status.DONE).count();
        int inProgressTasks = (int) tasksToday.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count();
        int pendingTasks = (int) tasksToday.stream().filter(t -> t.getStatus() == Task.Status.TODO).count();
        int totalTasks = tasksToday.size();
        FacilityOverviewResponse.TasksTodayKpi tasksTodayKpi = new FacilityOverviewResponse.TasksTodayKpi(
                totalTasks,
                completedTasks,
                inProgressTasks,
                pendingTasks
        );

        // 4. KPI Escalations
        List<SupportTicket> openTickets = supportTicketRepository.findByStatusInWithDetails(
                List.of(SupportTicket.Status.OPEN, SupportTicket.Status.ESCALATED)
        );
        int openCount = openTickets.size();
        int highPriorityCount = (int) openTickets.stream()
                .filter(t -> t.getIncidentType() == SupportTicket.IncidentType.LOST_ACCESS
                        || t.getIncidentType() == SupportTicket.IncidentType.SECURITY
                        || t.getStatus() == SupportTicket.Status.ESCALATED)
                .count();
        String highlight;
        if (openTickets.isEmpty()) {
            highlight = "Không có sự cố khẩn cấp";
        } else {
            SupportTicket top = openTickets.get(0);
            String unitInfo = (top.getUnit() != null) ? " · Kho " + top.getUnit().getCode() : "";
            highlight = top.getCode() + unitInfo + " (" + top.getIncidentType() + ")";
        }
        FacilityOverviewResponse.EscalationsKpi escalationsKpi = new FacilityOverviewResponse.EscalationsKpi(
                openCount,
                highPriorityCount,
                highlight
        );

        // 5. Biểu đồ phân bổ trạng thái kho (Status Distribution)
        List<FacilityOverviewResponse.StatusDistributionItem> statusDistribution = new ArrayList<>();
        for (Unit.Status s : Unit.Status.values()) {
            int count = (int) units.stream().filter(u -> u.getStatus() == s).count();
            BigDecimal pct = (totalAll > 0)
                    ? BigDecimal.valueOf(count * 100.0 / totalAll).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            statusDistribution.add(new FacilityOverviewResponse.StatusDistributionItem(s.name(), count, pct));
        }

        // 6. Biểu đồ cơ cấu doanh thu theo loại kho (Revenue Mix)
        Map<String, BigDecimal> rentRateMap = rentRateIndex(
                policyRuleRepository.findActiveRulesByType(PolicyRule.RuleType.RENT_RATE));

        List<UnitType> unitTypes = unitTypeRepository.findAll();
        Map<Integer, BigDecimal> typeRevenueMap = new LinkedHashMap<>();
        Map<Integer, Integer> typeRentedCountMap = new LinkedHashMap<>();
        BigDecimal totalMonthlyRevenue = BigDecimal.ZERO;

        for (UnitType ut : unitTypes) {
            List<Unit> rentedOfType = units.stream()
                    .filter(u -> u.getStatus() == Unit.Status.RENTED
                            && u.getType() != null
                            && ut.getTypeId().equals(u.getType().getTypeId()))
                    .toList();
            BigDecimal typeRev = rentedOfType.stream()
                    .map(u -> rentRateFor(u, rentRateMap))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            typeRevenueMap.put(ut.getTypeId(), typeRev);
            typeRentedCountMap.put(ut.getTypeId(), rentedOfType.size());
            totalMonthlyRevenue = totalMonthlyRevenue.add(typeRev);
        }

        List<FacilityOverviewResponse.RevenueMixItem> revenueMix = new ArrayList<>();
        for (UnitType ut : unitTypes) {
            BigDecimal rev = typeRevenueMap.get(ut.getTypeId());
            BigDecimal pct = (totalMonthlyRevenue.compareTo(BigDecimal.ZERO) > 0)
                    ? rev.multiply(BigDecimal.valueOf(100)).divide(totalMonthlyRevenue, 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            revenueMix.add(new FacilityOverviewResponse.RevenueMixItem(
                    ut.getName(),
                    typeRentedCountMap.get(ut.getTypeId()),
                    rev,
                    pct
            ));
        }

        // 7. Bảng dữ liệu: Hàng chờ dọn dẹp & bàn giao (Turnover Queue)
        List<Task> activeTurnoverTasks = taskRepository.findActiveTasksByTypesWithStaff(
                List.of(Task.Type.CLEANING, Task.Type.CHECKOUT)
        );
        Set<String> matchedUnitCodes = new HashSet<>();
        List<FacilityOverviewResponse.TurnoverQueueItem> turnoverQueue = new ArrayList<>();

        for (Task t : activeTurnoverTasks) {
            String ref = t.getRefCode();
            Unit matchedUnit = null;
            if (ref != null) {
                matchedUnit = units.stream()
                        .filter(u -> ref.equalsIgnoreCase(u.getCode()) || ref.contains(u.getCode()) || u.getCode().contains(ref))
                        .findFirst()
                        .orElse(null);
            }

            String uCode = (matchedUnit != null) ? matchedUnit.getCode() : (ref != null ? ref : "Chưa rõ");
            String uType = (matchedUnit != null && matchedUnit.getType() != null) ? matchedUnit.getType().getName() : "—";
            String zCode = (matchedUnit != null && matchedUnit.getZone() != null) ? matchedUnit.getZone().getCode() : "—";
            String staffName = (t.getAssignedStaff() != null) ? t.getAssignedStaff().getFullName() : "Chưa phân công";

            if (matchedUnit != null) {
                matchedUnitCodes.add(matchedUnit.getCode());
            }

            turnoverQueue.add(new FacilityOverviewResponse.TurnoverQueueItem(
                    t.getTaskId(),
                    uCode,
                    uType,
                    zCode,
                    t.getType().name(),
                    t.getStatus().name(),
                    staffName,
                    t.getWorkDate() != null ? t.getWorkDate() : today
            ));
        }

        // Bổ sung các unit đang PREPARING mà chưa có task trong danh sách
        for (Unit u : units) {
            if (u.getStatus() == Unit.Status.PREPARING && !matchedUnitCodes.contains(u.getCode())) {
                turnoverQueue.add(new FacilityOverviewResponse.TurnoverQueueItem(
                        null,
                        u.getCode(),
                        (u.getType() != null) ? u.getType().getName() : "—",
                        (u.getZone() != null) ? u.getZone().getCode() : "—",
                        "CLEANING",
                        "PREPARING",
                        "Chưa phân công",
                        today
                ));
                matchedUnitCodes.add(u.getCode());
            }
        }

        turnoverQueue.sort(Comparator.comparing(FacilityOverviewResponse.TurnoverQueueItem::workDate)
                .thenComparing(FacilityOverviewResponse.TurnoverQueueItem::unitCode));

        return new FacilityOverviewResponse(
                occupancyKpi,
                unitsInServiceKpi,
                tasksTodayKpi,
                escalationsKpi,
                statusDistribution,
                revenueMix,
                turnoverQueue
        );
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityDrilldownResponse getFacilityDrilldown(String status, String query, int page, int pageSize) {
        int validPage = Math.max(1, page);
        int validPageSize = (pageSize <= 0) ? 25 : Math.min(pageSize, 100);

        Unit.Status unitStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                unitStatus = Unit.Status.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái phòng không hợp lệ: " + status);
            }
        }

        String search = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        List<Unit> matchedUnits = unitRepository.findUnitsForDrilldown(unitStatus, search);

        // Tra cứu reservation đang hoạt động cho từng unit
        List<Reservation> activeReservations = reservationRepository.findCurrentActiveReservations();
        Map<Long, Reservation> unitReservationMap = new HashMap<>();
        for (Reservation r : activeReservations) {
            if (r.getUnit() == null) continue;
            Long uid = r.getUnit().getUnitId();
            Reservation existing = unitReservationMap.get(uid);
            if (existing == null || r.getStatus() == Reservation.Status.CHECKED_IN || r.getStatus() == Reservation.Status.CHECKOUT_REQUESTED) {
                unitReservationMap.put(uid, r);
            }
        }

        // Bảng giá thuê chuẩn theo (facility, type), fallback global
        Map<String, BigDecimal> rentRateMap = rentRateIndex(
                policyRuleRepository.findActiveRulesByType(PolicyRule.RuleType.RENT_RATE));

        long totalItems = matchedUnits.size();
        int totalPages = (int) Math.ceil((double) totalItems / validPageSize);
        int fromIndex = (validPage - 1) * validPageSize;

        List<FacilityDrilldownItem> items;
        if (fromIndex >= totalItems) {
            items = List.of();
        } else {
            int toIndex = (int) Math.min(fromIndex + validPageSize, totalItems);
            items = matchedUnits.subList(fromIndex, toIndex).stream().map(u -> {
                Reservation res = unitReservationMap.get(u.getUnitId());
                String tenantName = (res != null && res.getCustomer() != null) ? res.getCustomer().getFullName() : null;
                String rentalCode = (res != null) ? res.getCode() : null;
                BigDecimal rentPrice = rentRateFor(u, rentRateMap);
                return new FacilityDrilldownItem(
                        u.getUnitId(),
                        u.getCode(),
                        (u.getType() != null) ? u.getType().getName() : null,
                        u.getSizeM2(),
                        (u.getZone() != null) ? u.getZone().getCode() : null,
                        u.getFloor(),
                        u.getStatus().name(),
                        rentPrice,
                        tenantName,
                        rentalCode
                );
            }).toList();
        }

        return new FacilityDrilldownResponse(
                items,
                validPage,
                validPageSize,
                totalItems,
                totalPages,
                status
        );
    }

    /** Index RENT_RATE theo "facilityId:typeId" và "g:typeId" (global fallback). */
    private Map<String, BigDecimal> rentRateIndex(List<PolicyRule> rules) {
        Map<String, BigDecimal> index = new HashMap<>();
        for (PolicyRule r : rules) {
            if (r.getType() == null) continue;
            if (r.getFacility() != null) {
                index.put(r.getFacility().getFacilityId() + ":" + r.getType().getTypeId(),
                        r.getValue());
            } else {
                index.putIfAbsent("g:" + r.getType().getTypeId(), r.getValue());
            }
        }
        return index;
    }

    private BigDecimal rentRateFor(Unit unit, Map<String, BigDecimal> index) {
        if (unit == null || unit.getType() == null) {
            return BigDecimal.ZERO;
        }
        Integer facilityId = unit.getZone() != null && unit.getZone().getFacility() != null
                ? unit.getZone().getFacility().getFacilityId()
                : null;
        BigDecimal rate = facilityId != null
                ? index.get(facilityId + ":" + unit.getType().getTypeId())
                : null;
        if (rate == null) {
            rate = index.get("g:" + unit.getType().getTypeId());
        }
        return rate != null ? rate : BigDecimal.ZERO;
    }
}
