import { apiClient, safeParseJson } from "./apiClient.js";

export async function listCheckoutCases({ status, query = "", page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (query) params.set("q", query);
  params.set("page", page);
  params.set("page-size", pageSize);
  const res = await apiClient(`/api/v1/checkout-cases?${params.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể tải danh sách trễ checkout.");
  return Array.isArray(data) ? data : [];
}

export async function listActiveRentals({ query = "", page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", page);
  params.set("page-size", pageSize);
  const res = await apiClient(`/api/v1/checkout-cases/active-rentals?${params.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể tải đơn đang thuê.");
  return Array.isArray(data) ? data : [];
}

export async function decideCheckoutCase(caseId, { decision, extensionDays = 0, reason }) {
  const res = await apiClient(`/api/v1/checkout-cases/${caseId}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, extensionDays, reason }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể xử lý case.");
  return data;
}

export async function forceCheckoutReservation(reservationId, { checkoutType = "VIOLATION", deadline, reason }) {
  const res = await apiClient(`/api/v1/reservations/${reservationId}/checkout-request/forced`, {
    method: "POST",
    body: JSON.stringify({ checkoutType, deadline, reason }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể buộc trả kho.");
  return data;
}

export async function liquidateReservation(reservationId, { reasonType = "OVERDUE", reason }) {
  const res = await apiClient(`/api/v1/reservations/${reservationId}/liquidation`, {
    method: "POST",
    body: JSON.stringify({ reasonType, reason }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể thanh lý hợp đồng.");
  return data;
}
