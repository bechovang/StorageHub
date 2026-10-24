/**
 * StorageHub — Facility Operations & Monitoring Service (FR-32)
 * Kết nối API /api/v1/facility/overview và /api/v1/facility/drilldown
 */

import { apiClient, safeParseJson } from "./apiClient.js";

/**
 * Lấy dữ liệu tổng quan cơ sở: 4 KPI vận hành, phân bổ trạng thái, cơ cấu doanh thu, hàng chờ bàn giao/vệ sinh.
 * @returns {Promise<Object>} FacilityOverviewResponse
 */
export async function getFacilityOverview() {
  const response = await apiClient("/api/v1/facility/overview");
  if (!response.ok) {
    const errorData = await safeParseJson(response);
    throw new Error(errorData.message || "Không thể tải dữ liệu tổng quan cơ sở.");
  }
  return await safeParseJson(response);
}

/**
 * Tra cứu chi tiết danh sách kho phục vụ drill-down từ KPI / Biểu đồ
 * @param {Object} params
 * @param {string} [params.status]
 * @param {string} [params.query]
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=50]
 * @returns {Promise<Object>} FacilityDrilldownResponse
 */
export async function getFacilityDrilldown({ status = "", query = "", page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.append("status", status);
  if (query && query.trim()) params.append("query", query.trim());
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const response = await apiClient(`/api/v1/facility/drilldown?${params.toString()}`);
  if (!response.ok) {
    const errorData = await safeParseJson(response);
    throw new Error(errorData.message || "Không thể tải danh sách chi tiết kho.");
  }
  return await safeParseJson(response);
}
