package com.storagehub.dto.facility;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FacilityOverviewResponse(
        OccupancyKpi occupancy,
        UnitsInServiceKpi unitsInService,
        TasksTodayKpi tasksToday,
        EscalationsKpi escalations,
        List<StatusDistributionItem> statusDistribution,
        List<RevenueMixItem> revenueMix,
        List<TurnoverQueueItem> turnoverQueue
) {
    public record OccupancyKpi(
            BigDecimal rate,
            int rentedUnits,
            int totalUnits,
            String trend
    ) {}

    public record UnitsInServiceKpi(
            int operationalUnits,
            int totalUnits,
            BigDecimal operationalRate,
            int maintenanceUnits
    ) {}

    public record TasksTodayKpi(
            int totalTasks,
            int completed,
            int inProgress,
            int pending
    ) {}

    public record EscalationsKpi(
            int openCount,
            int highPriorityCount,
            String highlight
    ) {}

    public record StatusDistributionItem(
            String status,
            int count,
            BigDecimal percentage
    ) {}

    public record RevenueMixItem(
            String category,
            int rentedCount,
            BigDecimal monthlyRevenue,
            BigDecimal percentage
    ) {}

    public record TurnoverQueueItem(
            Long taskId,
            String unitCode,
            String unitType,
            String zoneCode,
            String taskType,
            String status,
            String staffName,
            LocalDate workDate
    ) {}
}
