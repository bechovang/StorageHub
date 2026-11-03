/**
 * StorageHub — Facility Operations & Monitoring Service (FR-32)
 * Kết nối API /api/v1/facility/overview, /drilldown, danh sách và layout 3D.
 */

import { apiClient, safeParseJson } from "./apiClient.js";

export async function getFacilityOverview() {
  const response = await apiClient("/api/v1/facility/overview");
  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data.message || "Không thể tải tổng quan cơ sở.");
  }
  return data;
}

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

export async function getFacilities() {
  const response = await apiClient("/api/v1/facility");
  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data.message || "Không thể tải danh sách cơ sở.");
  }
  return Array.isArray(data) ? data : [];
}

export async function getFacilityLayout(facilityId) {
  const response = await apiClient(`/api/v1/facility/${facilityId}/layout`);
  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data.message || "Không thể tải sơ đồ cơ sở.");
  }
  return data;
}
