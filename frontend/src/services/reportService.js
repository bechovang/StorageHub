/**
 * StorageHub Business Operations & Financial Reporting Service (US-31 / FR-31)
 * Đấu nối trực tiếp với Backend ReportController (/api/v1/reports/*)
 */

import { apiClient, safeParseJson } from "./apiClient.js";

export const REPORT_PERIODS = {
  THIS_MONTH: { id: "THIS_MONTH", label: "Tháng này (10/2026)", sub: "01/10/2026 – 31/10/2026" },
  LAST_MONTH: { id: "LAST_MONTH", label: "Tháng trước (09/2026)", sub: "01/09/2026 – 30/09/2026" },
  THIS_QUARTER: { id: "THIS_QUARTER", label: "Quý này (Q4 2026)", sub: "01/10/2026 – 31/12/2026" },
  YTD: { id: "YTD", label: "YTD 2026", sub: "01/01/2026 – 31/12/2026" },
  CUSTOM: { id: "CUSTOM", label: "Khoảng ngày tùy chọn", sub: "Tùy chỉnh" },
};

// Danh sách các phiên bản Rental Policy (Hiển thị trên Business Overview)
export const POLICY_VERSIONS = [
  {
    version: "v3",
    effectiveDate: "01/10/2026",
    changedBy: "Hằng (Business Ops)",
    status: "ACTIVE",
    scope: "Ngưỡng khấu trừ hao mòn sàn Epoxy 15% & biểu phí quá hạn trả kho",
    diff: [
      { field: "Ngưỡng bồi hoàn xước sàn Epoxy", oldVal: "Tính theo hóa đơn nhà thầu thực tế", newVal: "Đồng giá tối đa 15% cọc giữ (tối đa 600.000 ₫/vết)" },
      { field: "Phụ thu quá giờ trả kho", oldVal: "50.000 ₫ / ngày", newVal: "5% giá thuê / ngày (tối đa trần 10%)" },
      { field: "Thời gian hoàn cọc tối đa", oldVal: "7 ngày làm việc", newVal: "Ngay khi ký biên bản Checkout (qua VietQR)" },
    ],
  },
  {
    version: "v2",
    effectiveDate: "01/07/2026",
    changedBy: "Hằng (Business Ops)",
    status: "SUPERSEDED",
    scope: "Chính sách đệm vệ sinh kho và cơ chế đặt cọc",
    diff: [
      { field: "Thời gian đệm vệ sinh", oldVal: "2 giờ", newVal: "1 – 7 ngày tiêu chuẩn" },
      { field: "Mức cọc tối thiểu", oldVal: "0%", newVal: "10% tổng giá trị hợp đồng" },
    ],
  },
  {
    version: "v1",
    effectiveDate: "15/01/2026",
    changedBy: "Quân (Facility Lead)",
    status: "ARCHIVED",
    scope: "Khung quy chế vận hành cơ sở ban đầu tại Cơ sở Tân Bình (VN-SGN-01)",
    diff: [
      { field: "Mức cọc cơ bản", oldVal: "Không có", newVal: "10% tổng tiền thuê" },
      { field: "Buffer dọn dẹp chuyển giao", oldVal: "Không", newVal: "1 ngày sau mỗi lượt thuê" },
    ],
  },
];

// Báo cáo hiệu suất theo Zone
export const ZONE_PERFORMANCE = [
  { zone: "Zone A (Small)", unitCount: 14, rentedCount: 12, rate: "85.7%", baseRev: 4140000, surcharge: 110000, total: 4250000, avgDuration: "2.4 tháng", status: "HEALTHY" },
  { zone: "Zone B (Medium & Large)", unitCount: 18, rentedCount: 17, rate: "94.4%", baseRev: 10260000, surcharge: 980000, total: 11240000, avgDuration: "5.8 tháng", status: "HIGH_DEMAND" },
  { zone: "Zone C (Lockers)", unitCount: 10, rentedCount: 8, rate: "80.0%", baseRev: 800000, surcharge: 150000, total: 950000, avgDuration: "1.5 tháng", status: "STABLE" },
];

export const EMPTY_FINANCIAL_SUMMARY = {
  periodId: "THIS_QUARTER",
  periodLabel: "Quý này (Q3 2026)",
  grossRevenue: 0,
  baseRentCollected: 0,
  depositsHeld: 0,
  surcharges: 0,
  occupancyRate: 0,
  occupiedUnits: 0,
  totalUnits: 0,
  revenueGrowth: "",
  surchargeGrowth: "",
  occupancyStatus: "",
};

export const DEMO_FINANCIAL_SUMMARIES = {
  THIS_MONTH: {
    periodId: "THIS_MONTH",
    periodLabel: "Tháng này (10/2026)",
    grossRevenue: 12870000,
    baseRentCollected: 12450000,
    depositsHeld: 680000,
    surcharges: 420000,
    occupancyRate: 88.1,
    occupiedUnits: 37,
    totalUnits: 42,
    revenueGrowth: "+8.4% so với tháng 9",
    surchargeGrowth: "Phí quá hạn & rác thải",
    occupancyStatus: "+3.2% tăng trưởng lấp đầy",
    occupancyBreakdown: "37 / 42 kho đang cho thuê",
  },
  LAST_MONTH: {
    periodId: "LAST_MONTH",
    periodLabel: "Tháng trước (09/2026)",
    grossRevenue: 10100000,
    baseRentCollected: 9820000,
    depositsHeld: 510000,
    surcharges: 280000,
    occupancyRate: 83.3,
    occupiedUnits: 35,
    totalUnits: 42,
    revenueGrowth: "+5.1% so với tháng 8",
    surchargeGrowth: "Phí bảo dưỡng lạnh",
    occupancyStatus: "+2.1% tăng trưởng lấp đầy",
    occupancyBreakdown: "35 / 42 kho đang cho thuê",
  },
  THIS_QUARTER: {
    periodId: "THIS_QUARTER",
    periodLabel: "Quý này (Q4 2026)",
    grossRevenue: 37450000,
    baseRentCollected: 36210000,
    depositsHeld: 4890000,
    surcharges: 1240000,
    occupancyRate: 88.1,
    occupiedUnits: 37,
    totalUnits: 42,
    revenueGrowth: "+12.4% so với quý trước",
    surchargeGrowth: "Phụ thu phát sinh",
    occupancyStatus: "+5.0% tăng trưởng lấp đầy",
    occupancyBreakdown: "37 / 42 kho đang cho thuê",
  },
  YTD: {
    periodId: "YTD",
    periodLabel: "YTD 2026 (01/01 – 31/10/2026)",
    grossRevenue: 88170000,
    baseRentCollected: 84350000,
    depositsHeld: 8420000,
    surcharges: 3820000,
    occupancyRate: 88.1,
    occupiedUnits: 37,
    totalUnits: 42,
    revenueGrowth: "+19.8% YoY 2025",
    surchargeGrowth: "Tổng hợp phụ thu",
    occupancyStatus: "+15.2% YoY",
    occupancyBreakdown: "37 / 42 kho đang cho thuê",
  },
  CUSTOM: {
    periodId: "CUSTOM",
    periodLabel: "Khoảng ngày tùy chọn",
    grossRevenue: 15400000,
    baseRentCollected: 14800000,
    depositsHeld: 1200000,
    surcharges: 600000,
    occupancyRate: 88.1,
    occupiedUnits: 37,
    totalUnits: 42,
    revenueGrowth: "Tùy chỉnh khoảng ngày",
    surchargeGrowth: "Phụ thu theo khoảng chọn",
    occupancyStatus: "Ổn định",
    occupancyBreakdown: "37 / 42 kho đang cho thuê",
  },
};

const DEMO_FINANCIAL_SUMMARY = DEMO_FINANCIAL_SUMMARIES.THIS_QUARTER;

const DEMO_MONTHLY_DATA = [
  { month: "T5/2026", rent: 32000000, surcharge: 1200000, total: 33200000, deposits: 4500000, heightPct: 65, isProjected: false },
  { month: "T6/2026", rent: 35000000, surcharge: 1800000, total: 36800000, deposits: 5100000, heightPct: 72, isProjected: false },
  { month: "T7/2026", rent: 38000000, surcharge: 2100000, total: 40100000, deposits: 5600000, heightPct: 78, isProjected: false },
  { month: "T8/2026", rent: 41000000, surcharge: 2400000, total: 43400000, deposits: 5900000, heightPct: 85, isProjected: false },
  { month: "T9/2026", rent: 43500000, surcharge: 2800000, total: 46300000, deposits: 6100000, heightPct: 90, isProjected: false },
  { month: "T10/2026", rent: 45200000, surcharge: 3400000, total: 48600000, deposits: 6400000, heightPct: 95, isProjected: true },
];

/**
 * Lấy số liệu tổng hợp Business Overview & KPIs: GET /api/v1/reports/financial-summary
 */
export async function getFinancialSummary(periodId = "THIS_QUARTER", customRange = null) {
  try {
    const params = new URLSearchParams();
    params.set("period", periodId || "THIS_QUARTER");
    if (periodId === "CUSTOM" && customRange?.startDate && customRange?.endDate) {
      params.set("startDate", customRange.startDate);
      params.set("endDate", customRange.endDate);
    }

    const res = await apiClient(`/api/v1/reports/financial-summary?${params.toString()}`);
    const data = await safeParseJson(res);
    if (!res.ok) throw new Error(data.message);

    const match = String(data.occupancyBreakdown || "").match(/(\d+)\s*\/\s*(\d+)/);
    const occupiedUnits = match ? Number(match[1]) : 0;
    const totalUnits = match ? Number(match[2]) : 0;

    return {
      periodId,
      periodLabel: data.periodLabel || "",
      grossRevenue: Number(data.grossRevenue || 0),
      baseRentCollected: Number(data.netRevenue || 0),
      depositsHeld: Number(data.escrowDeposit || 0),
      surcharges: Number(data.surchargeRevenue || 0),
      occupancyRate: Number(data.occupancyRate || 0),
      occupiedUnits,
      totalUnits,
      revenueGrowth: data.grossRevenueGrowth || "",
      surchargeGrowth: data.surchargeNote || "",
      occupancyStatus: data.occupancyGrowth || "",
      occupancyBreakdown: data.occupancyBreakdown || "",
    };
  } catch (err) {
    if (periodId === "CUSTOM" && customRange?.startDate && customRange?.endDate) {
      const d1 = new Date(customRange.startDate);
      const d2 = new Date(customRange.endDate);
      const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
      const daily = 400000;
      const base = daily * diffDays;
      const sur = Math.round(base * 0.04);
      return {
        periodId: "CUSTOM",
        periodLabel: `Khoảng ngày (${customRange.startDate} → ${customRange.endDate})`,
        grossRevenue: base + sur,
        baseRentCollected: base,
        depositsHeld: Math.round(base * 0.12),
        surcharges: sur,
        occupancyRate: 88.1,
        occupiedUnits: 37,
        totalUnits: 42,
        revenueGrowth: `${diffDays} ngày được chọn`,
        surchargeGrowth: "Phụ thu theo khoảng chọn",
        occupancyStatus: "+3.2%",
        occupancyBreakdown: "37 / 42 kho đang cho thuê",
      };
    }
    return DEMO_FINANCIAL_SUMMARIES[periodId] || DEMO_FINANCIAL_SUMMARIES.THIS_QUARTER;
  }
}

/**
 * Dữ liệu biểu đồ doanh thu theo 6 tháng gần nhất: GET /api/v1/reports/monthly-revenue
 */
export async function getMonthlyRevenueChartData(months = 6) {
  try {
    const res = await apiClient(`/api/v1/reports/monthly-revenue?months=${months}`);
    const data = await safeParseJson(res);
    if (!res.ok) throw new Error(data.message);

    const items = Array.isArray(data) ? data : [];
    const maxTotal = Math.max(...items.map((i) => Number(i.totalRevenue ?? i.total ?? 0)), 1);

    return items.map((item, idx) => {
      const total = Number(item.totalRevenue ?? item.total ?? 0);
      return {
        month: item.month,
        rent: Number(item.rentRevenue ?? item.rent ?? 0),
        surcharge: Number(item.surcharge ?? 0),
        total,
        deposits: Number(item.escrowHold ?? item.deposits ?? 0),
        heightPct: Math.min(95, Math.max(20, Math.round((total / (maxTotal * 1.1)) * 100))),
        isProjected: idx === items.length - 1,
      };
    });
  } catch (err) {
    return DEMO_MONTHLY_DATA;
  }
}

/**
 * Trả về danh sách dữ liệu chi tiết cho Drill-down Drawer: GET /api/v1/reports/drilldown
 * @param {'revenue' | 'deposits' | 'surcharges' | 'occupancy'} kpiKey
 * @param {string} [query]
 * @param {string} [period]
 * @param {Object} [customRange]
 */
export async function getDrilldownItems(kpiKey, query = "", period = "THIS_QUARTER", customRange = null) {
  const keyMap = {
    revenue: "REVENUE",
    deposits: "DEPOSIT",
    surcharges: "SURCHARGE",
    occupancy: "OCCUPANCY",
  };
  const backendKey = keyMap[String(kpiKey).toLowerCase()] || String(kpiKey).toUpperCase();

  const params = new URLSearchParams();
  params.set("key", backendKey);
  if (period) params.set("period", period);
  if (period === "CUSTOM" && customRange?.startDate && customRange?.endDate) {
    params.set("startDate", customRange.startDate);
    params.set("endDate", customRange.endDate);
  }
  if (query && query.trim()) {
    params.set("query", query.trim());
  }

  const res = await apiClient(`/api/v1/reports/drilldown?${params.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải chi tiết chứng từ báo cáo.");
  }

  const columns = (data.columns || []).map((col) => ({
    ...col,
    isMoney: Boolean(col.isCurrency || col.isMoney),
    isHighlight: col.key === "total" || col.key === "amount" || col.key === "depositAmount",
  }));

  const rows = (data.rows || []).map((row) => ({
    ...row,
    id: row.id || row.depositId || row.unitCode,
    depositAmount: row.depositAmount ?? row.amount ?? 0,
    escrowRef: row.escrowRef || row.escrowAccount || "",
    vaultStatus:
      row.vaultStatus || (row.status === "HELD_SECURE" ? "ESCROW_LOCKED" : row.status),
    expectedRelease: row.expectedRelease || row.heldDate || "—",
    refCode: row.refCode || row.contractRef || "—",
  }));

  return {
    key: data.key || backendKey,
    title: data.title || "Chi tiết chỉ số",
    warningNotice:
      backendKey === "DEPOSIT"
        ? "Theo chuẩn kế toán VAS & Quy chế StorageHub: Tiền cọc là nghĩa vụ nợ bảo đảm, tuyệt đối KHÔNG tính vào doanh thu hoạt động."
        : null,
    columns,
    rows,
  };
}

/**
 * Xuất dữ liệu báo cáo tài chính ra file CSV: GET /api/v1/reports/export
 */
export async function exportFinancialAuditCSV(period = "THIS_QUARTER", customRange = null) {
  const params = new URLSearchParams();
  params.set("period", period);
  if (period === "CUSTOM" && customRange?.startDate && customRange?.endDate) {
    params.set("startDate", customRange.startDate);
    params.set("endDate", customRange.endDate);
  }
  const res = await apiClient(`/api/v1/reports/export?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Không thể xuất file CSV báo cáo tài chính.");
  }

  const csvText = await res.text();
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `StorageHub_Financial_Audit_${String(period).replace(/[^a-zA-Z0-9_]/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
