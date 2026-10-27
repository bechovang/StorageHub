/**
 * StorageHub Canonical Formatters & Helpers (DRY Architecture)
 */

export const PLACEHOLDER_UNIT_IMAGE = "/placeholder.svg";

/**
 * Chuẩn hóa chuỗi ngày giờ từ Backend (xử lý trường hợp ISO UTC thiếu hậu tố Z)
 * @param {string|Date} raw
 * @returns {Date}
 */
export function parseBackendDate(raw) {
  if (raw instanceof Date) return raw;
  const s = String(raw || "").trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    return new Date(`${s}Z`);
  }
  return new Date(s);
}

/**
 * Định dạng tiền tệ VND: ví dụ 345000 -> "345.000 ₫"
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function formatVND(amount) {
  if (amount == null || isNaN(Number(amount))) return "—";
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(Number(amount)))} ₫`;
}

export const fmtMoney = formatVND;

/**
 * Định dạng ngày ngắn gọn (dd/mm/yyyy)
 * @param {string|Date|null|undefined} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const parts = dateStr.trim().split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = parseBackendDate(dateStr);
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

export const fmtDate = formatDate;

/**
 * Định dạng ngày giờ chi tiết theo múi giờ Việt Nam (dd/mm/yyyy, hh:mm)
 * @param {string|Date|null|undefined} dateStr
 * @returns {string}
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = parseBackendDate(dateStr);
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

export const fmtDateTime = formatDateTime;

/**
 * Định dạng thời gian kiểm toán dạng mono theo giờ địa phương: YYYY-MM-DD HH:mm:ss
 * @param {string|Date|null|undefined} isoString
 * @returns {string}
 */
export function formatAuditTimestamp(isoString) {
  if (!isoString) return "—";
  try {
    const d = parseBackendDate(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } catch {
    return String(isoString);
  }
}

/**
 * Định dạng ngày đầy đủ có thứ trong tuần (vi-VN)
 * @param {string|Date|null|undefined} dateStr
 * @returns {string}
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = parseBackendDate(dateStr);
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
  const target = parseBackendDate(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Lấy ngày hôm nay theo giờ địa phương chuẩn ISO (YYYY-MM-DD) — tránh lỗi lùi ngày UTC
 * @returns {string}
 */
export function getTodayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Lấy ngày mai theo giờ địa phương chuẩn ISO (YYYY-MM-DD) — tránh lỗi lùi ngày UTC
 * @returns {string}
 */
export function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Cộng thêm số ngày vào chuỗi YYYY-MM-DD theo lịch địa phương
 * @param {string} baseDateStr
 * @param {number} days
 * @returns {string}
 */
export function addDaysToDateStr(baseDateStr, days) {
  const parts = String(baseDateStr || getTodayDate()).split("T")[0].split("-").map(Number);
  const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
  d.setDate(d.getDate() + Number(days || 0));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Chuẩn hóa chuỗi tiếng Việt: loại bỏ dấu, chuyển về chữ thường, xử lý đ/Đ và khoảng trắng thừa.
 */
export function normalizeVietnamese(str = "") {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Kiểm tra xem chuỗi nguồn (target) có chứa từ khóa tìm kiếm (query) hay không (không phân biệt dấu).
 */
export function matchSearch(target = "", query = "") {
  if (!query || !String(query).trim()) return true;
  const normQuery = normalizeVietnamese(query);
  const normTarget = normalizeVietnamese(target);
  return normTarget.includes(normQuery);
}
