/**
 * StorageHub — Facility Operations & Monitoring Service (FR-32)
 * Kết nối API /api/v1/facility/overview và /api/v1/facility/drilldown
 */

import { apiClient, safeParseJson } from "./apiClient.js";

const DEMO_FACILITY_OVERVIEW = {
  facilityName: "Cơ sở Tân Bình",
  facilityCode: "VN-SGN-01",
  occupancy: {
    totalUnits: 40,
    rentedUnits: 28,
    rate: 70.0,
    trend: "+1.4%",
  },
  unitsInService: {
    operationalUnits: 39,
    operationalRate: "97.5",
    maintenanceUnits: 1,
  },
  tasksToday: {
    totalTasks: 8,
    completed: 3,
    inProgress: 2,
    pending: 3,
  },
  escalations: {
    openCount: 1,
    highPriorityCount: 1,
    highlight: "Cửa cuốn bị kẹt tại Unit S-4",
  },
  statusDistribution: [
    { status: "RENTED", count: 28 },
    { status: "AVAILABLE", count: 7 },
    { status: "RESERVED", count: 2 },
    { status: "PREPARING", count: 2 },
    { status: "MAINTENANCE", count: 1 },
    { status: "RETIRED", count: 0 },
  ],
  turnoverQueue: [
    {
      taskId: "1",
      unitCode: "LOCK-1",
      unitType: "Kho Lớn",
      zoneCode: "A",
      taskType: "CHECKOUT",
      staffName: "Trần Minh",
      workDate: "10:30",
    },
    {
      taskId: "2",
      unitCode: "BOX-205",
      unitType: "Kho Tiêu chuẩn",
      zoneCode: "B",
      taskType: "CLEANING",
      staffName: "Phạm Tuấn",
      workDate: "16:00",
    },
  ],
};

const DEMO_DRILLDOWN_UNITS = [
  { unitId: "u-101", code: "LOCK-1", typeName: "Large", sizeM2: 12.0, floor: 1, zone: "Khu A", status: "RESERVED", baseRentPrice: 2300000, tenant: "Trần Thị Lan", contractRef: "CTR-2026-0994" },
  { unitId: "u-301", code: "BOX-301", typeName: "Standard", sizeM2: 6.0, floor: 3, zone: "Khu B", status: "RENTED", baseRentPrice: 1200000, tenant: "Trần Thị Lan", contractRef: "CTR-2026-0881" },
  { unitId: "u-102", code: "BOX-102", typeName: "Standard", sizeM2: 6.0, floor: 1, zone: "Khu A", status: "RENTED", baseRentPrice: 1200000, tenant: "Nguyễn Văn Hùng", contractRef: "CTR-2026-0711" },
  { unitId: "u-205", code: "BOX-205", typeName: "Standard", sizeM2: 6.0, floor: 2, zone: "Khu B", status: "PREPARING", baseRentPrice: 1200000, tenant: null, contractRef: null },
  { unitId: "u-204", code: "SEC-204", typeName: "Medium", sizeM2: 8.5, floor: 2, zone: "Khu A", status: "AVAILABLE", baseRentPrice: 1750000, tenant: null, contractRef: null },
  { unitId: "u-104", code: "SEC-104", typeName: "Medium", sizeM2: 8.5, floor: 1, zone: "Khu A", status: "MAINTENANCE", baseRentPrice: 1750000, tenant: null, contractRef: null },
];

/**
 * Lấy dữ liệu tổng quan cơ sở
 * @returns {Promise<Object>} FacilityOverviewResponse
 */
export async function getFacilityOverview() {
  try {
    const response = await apiClient("/api/v1/facility/overview");
    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throw new Error(errorData.message);
    }
    return await safeParseJson(response);
  } catch (err) {
    return DEMO_FACILITY_OVERVIEW;
  }
}

/**
 * Tra cứu chi tiết danh sách kho phục vụ drill-down từ KPI / Biểu đồ
 */
export async function getFacilityDrilldown({ status = "", query = "", page = 1, pageSize = 50, signal } = {}) {
  try {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (query && query.trim()) params.append("query", query.trim());
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    const response = await apiClient(`/api/v1/facility/drilldown?${params.toString()}`, { signal });
    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throw new Error(errorData.message);
    }
    return await safeParseJson(response);
  } catch (err) {
    let items = DEMO_DRILLDOWN_UNITS;
    if (status && status !== "ALL") {
      items = items.filter((u) => u.status === status);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      items = items.filter((u) => u.code.toLowerCase().includes(q) || (u.tenant && u.tenant.toLowerCase().includes(q)));
    }
    return {
      items,
      total: items.length,
      page,
      pageSize,
    };
  }
}
