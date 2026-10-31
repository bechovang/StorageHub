/**
 * StorageHub — Facility Operations & Monitoring Service (FR-32)
 * Kết nối API /api/v1/facility/overview và /api/v1/facility/drilldown
 */

import { apiClient, safeParseJson } from "./apiClient.js";

/**
 * Lấy dữ liệu tổng quan cơ sở: GET /api/v1/facility/overview
 * @returns {Promise<Object>} FacilityOverviewResponse
 */
export async function getFacilityOverview() {
  const response = await apiClient("/api/v1/facility/overview");
  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data.message || "Không thể tải tổng quan cơ sở.");
  }
  return data;
}

/**
 * Tra cứu chi tiết danh sách kho phục vụ drill-down từ KPI / Biểu đồ:
 * GET /api/v1/facility/drilldown
 */
export async function getFacilityDrilldown({ status = "", query = "", page = 1, pageSize = 50, signal } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.append("status", status);
  if (query && query.trim()) params.append("query", query.trim());
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const response = await apiClient(`/api/v1/facility/drilldown?${params.toString()}`, { signal });
  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data.message || "Không thể tải chi tiết danh sách kho.");
  }
  return data;
}
