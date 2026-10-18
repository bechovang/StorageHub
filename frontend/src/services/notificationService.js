import { apiClient, safeParseJson } from "./apiClient";

/**
 * GET /api/v1/notifications?unread-only=false&page=1&page-size=25
 * Lấy danh sách thông báo của user (FR-34)
 */
export async function getNotifications({ unreadOnly = false, page = 1, pageSize = 25 } = {}) {
  const res = await apiClient(
    `/api/v1/notifications?unread-only=${unreadOnly}&page=${page}&page-size=${pageSize}`
  );
  const data = await safeParseJson(res);
  if (!res.ok) throw { status: res.status, ...data };
  return data; // { items, page, pageSize, total }
}

/**
 * GET /api/v1/notifications/unread-count
 * Đếm số lượng thông báo chưa đọc cho bell badge (FR-33)
 */
export async function getUnreadNotificationCount() {
  const res = await apiClient("/api/v1/notifications/unread-count");
  const data = await safeParseJson(res);
  if (!res.ok) throw { status: res.status, ...data };
  return data; // { count }
}

/**
 * POST /api/v1/notifications/mark-all-read
 * Đánh dấu đã đọc tất cả thông báo (FR-34)
 */
export async function markAllNotificationsRead() {
  const res = await apiClient("/api/v1/notifications/mark-all-read", {
    method: "POST",
  });
  if (!res.ok) {
    const data = await safeParseJson(res);
    throw { status: res.status, ...data };
  }
  return true;
}
