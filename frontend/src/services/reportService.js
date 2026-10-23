/**
 * StorageHub Business Operations & Financial Reporting Service (US-31 / FR-31)
 * Đấu nối trực tiếp với Backend ReportController (/api/v1/reports/*)
 */

import { apiClient, safeParseJson } from "./apiClient.js";

export const REPORT_PERIODS = {
  THIS_MONTH: { id: "THIS_MONTH", label: "Tháng này (10/2026)", sub: "01/10/2026 – 31/10/2026" },
  LAST_MONTH: { id: "LAST_MONTH", label: "Tháng trước (09/2026)", sub: "01/09/2026 – 30/09/2026" },
  THIS_QUARTER: { id: "THIS_QUARTER", label: "Quý này (Q3 2026)", sub: "01/07/2026 – 30/09/2026" },
  YTD: { id: "YTD", label: "YTD 2026", sub: "01/01/2026 – 31/10/2026" },
  CUSTOM: { id: "CUSTOM", label: "Khoảng ngày tùy chọn", sub: "Tùy chỉnh" },
};

// Danh sách các phiên bản Rental Policy (Hiển thị trên Business Overview — PolicyController chưa có trên master)
export const POLICY_VERSIONS = [
  {
    version: "v3",
    effectiveDate: "01/10/2026",
    changedBy: "Hằng (Business Ops)",
    status: "ACTIVE",
    scope: "Ngưỡng khấu trừ hao mòn sàn Epoxy 15% & biểu phí quá hạn trả kho",
    diff: [
      { field: "Ngưỡng bồi hoàn xước sàn Epoxy", oldVal: "Tính theo hóa đơn nhà thầu thực tế", newVal: "Đồng giá tối đa 15% cọc giữ (tối đa 600.000 ₫/vết)" },
      { field: "Phụ thu quá giờ trả kho", oldVal: "50.000 ₫ / giờ", newVal: "30.000 ₫ / giờ (miễn phí 60 phút ân hạn đầu)" },
      { field: "Thời gian hoàn cọc tối đa", oldVal: "7 ngày làm việc", newVal: "Ngay khi ký biên bản Checkout (qua VietQR)" },
    ],
  },
  {
    version: "v2",
    effectiveDate: "01/07/2026",
    changedBy: "Hằng (Business Ops)",
    status: "SUPERSEDED",
    scope: "Chính sách ưu đãi cam kết thanh toán trước 3 tháng / 6 tháng",
    diff: [
      { field: "Chiết khấu trả trước 3 tháng", oldVal: "0%", newVal: "Giảm 5% tổng tiền thuê" },
      { field: "Chiết khấu trả trước 6 tháng", oldVal: "0%", newVal: "Giảm 10% + Miễn phí cấp thẻ từ phụ" },
    ],
  },
  {
    version: "v1",
    effectiveDate: "15/01/2026",
    changedBy: "Quân (Facility Lead)",
    status: "ARCHIVED",
    scope: "Khung quy chế vận hành cơ sở ban đầu tại Tân Bình Gateway VN-SGN-01",
    diff: [
      { field: "Mức cọc cơ bản", oldVal: "Không có", newVal: "100% tiền thuê 1 tháng" },
      { field: "Buffer dọn dẹp chuyển giao", oldVal: "Không", newVal: "2 giờ sau mỗi lượt thuê" },
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

/**
 * Lấy số liệu tổng hợp Business Overview & KPIs: GET /api/v1/reports/financial-summary
 */
export async function getFinancialSummary(periodId = "THIS_QUARTER", customRange = null) {
  const params = new URLSearchParams();
  params.set("period", periodId || "THIS_QUARTER");
  if (periodId === "CUSTOM" && customRange?.startDate && customRange?.endDate) {
    params.set("startDate", customRange.startDate);
    params.set("endDate", customRange.endDate);
  }

  const res = await apiClient(`/api/v1/reports/financial-summary?${params.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải báo cáo tổng hợp tài chính.");
  }

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
}

/**
 * Dữ liệu biểu đồ doanh thu theo 6 tháng gần nhất: GET /api/v1/reports/monthly-revenue
 */
export async function getMonthlyRevenueChartData(months = 6) {
  const res = await apiClient(`/api/v1/reports/monthly-revenue?months=${months}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải dữ liệu biểu đồ doanh thu.");
  }

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
}

/**
 * Trả về danh sách dữ liệu chi tiết cho Drill-down Drawer: GET /api/v1/reports/drilldown
 * @param {'revenue' | 'deposits' | 'surcharges' | 'occupancy'} kpiKey
 * @param {string} [query]
 */
export async function getDrilldownItems(kpiKey, query = "") {
  const keyMap = {
    revenue: "REVENUE",
    deposits: "DEPOSIT",
    surcharges: "SURCHARGE",
    occupancy: "OCCUPANCY",
  };
  const backendKey = keyMap[String(kpiKey).toLowerCase()] || String(kpiKey).toUpperCase();

  const params = new URLSearchParams();
  params.set("key", backendKey);
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
export async function exportFinancialAuditCSV(period = "THIS_QUARTER") {
  const res = await apiClient(`/api/v1/reports/export?period=${encodeURIComponent(period)}`);
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
