/**
 * StorageHub Canonical Formatters & Helpers (DRY Architecture)
 */

export const PLACEHOLDER_UNIT_IMAGE = "/placeholder.svg";

/**
 * Định dạng tiền tệ VND: ví dụ 345000 -> "345.000 ₫"
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function formatVND(amount) {
  if (amount == null || isNaN(Number(amount))) return "—";
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(Number(amount)))} ₫`;
}

// Alias tương thích ngược cho fmtMoney
export const fmtMoney = formatVND;

/**
 * Định dạng ngày ngắn gọn (dd/mm/yyyy)
 * @param {string|Date|null|undefined} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    if (typeof dateStr === "string") {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

// Alias tương thích ngược cho fmtDate
export const fmtDate = formatDate;

/**
 * Định dạng ngày giờ chi tiết (dd/mm/yyyy, hh:mm)
 * @param {string|Date|null|undefined} dateStr
 * @returns {string}
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}

// Alias tương thích ngược cho fmtDateTime
export const fmtDateTime = formatDateTime;

/**
 * Định dạng ngày đầy đủ có thứ trong tuần (vi-VN)
 * @param {string|Date|null|undefined} dateStr
 * @returns {string}
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Tính số ngày từ hôm nay đến dateStr (âm nếu quá hạn)
 * @param {string|Date|null|undefined} dateStr
 * @returns {number|null}
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Lấy ngày mai theo chuẩn ISO (YYYY-MM-DD)
 * @returns {string}
 */
export function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
