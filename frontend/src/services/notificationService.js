import { apiClient, safeParseJson } from "./apiClient";
import { translateBackendMessage } from "../utils/statusLabels";

let cachedUnread = { count: 0, fetchedAt: 0 };
const UNREAD_CACHE_TTL_MS = 12000;

/**
 * GET /api/v1/notifications?unread-only=false&page=1&page-size=25
 * Lấy danh sách thông báo của người dùng và tự động Việt hóa nội dung
 */
export async function getNotifications({ unreadOnly = false, page = 1, pageSize = 25 } = {}) {
  const res = await apiClient(
    `/api/v1/notifications?unread-only=${unreadOnly}&page=${page}&page-size=${pageSize}`
  );
  const data = await safeParseJson(res);
  if (!res.ok) throw { status: res.status, ...data };

  const items = Array.isArray(data?.items)
    ? data.items.map((item) => ({
        ...item,
        title: translateBackendMessage(item.title || ""),
      }))
    : [];

  return {
    ...data,
    items,
  };
}

/**
 * GET /api/v1/notifications/unread-count
 * Có cơ chế chống gọi lặp khi chuyển trang liên tục
 */
export async function getUnreadNotificationCount({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - cachedUnread.fetchedAt < UNREAD_CACHE_TTL_MS) {
    return { count: cachedUnread.count };
  }
  const res = await apiClient("/api/v1/notifications/unread-count");
  const data = await safeParseJson(res);
  if (!res.ok) throw { status: res.status, ...data };
  cachedUnread = {
    count: Number(data?.count || 0),
    fetchedAt: now,
  };
  return data;
}

/**
 * POST /api/v1/notifications/{id}/read — đánh dấu 1 thông báo đã đọc khi bấm vào.
 * Cập nhật cache unread (giảm 1) để badge chuông phản hồi tức thì.
 */
export async function markNotificationRead(id) {
  const res = await apiClient(`/api/v1/notifications/${id}/read`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await safeParseJson(res);
    throw { status: res.status, ...data };
  }
  if (cachedUnread.count > 0) {
    cachedUnread = { count: cachedUnread.count - 1, fetchedAt: Date.now() };
  }
  return true;
}

/**
 * POST /api/v1/notifications/mark-all-read
 */
export async function markAllNotificationsRead() {
  const res = await apiClient("/api/v1/notifications/mark-all-read", {
    method: "POST",
  });
  if (!res.ok) {
    const data = await safeParseJson(res);
    throw { status: res.status, ...data };
  }
  cachedUnread = { count: 0, fetchedAt: Date.now() };
  return true;
}
