/**
 * StorageHub Domain Constants for Rentals, Payments, Contracts (DRY Architecture)
 */

import { formatVND, formatDate, formatDateTime } from "./formatters";

export const STATUS_LABEL = {
  PENDING_PAYMENT: "Chờ thanh toán cọc",
  RESERVED: "Chờ nhận kho",
  CHECKED_IN: "Đang thuê",
  CHECKOUT_REQUESTED: "Chờ trả kho",
  PREPARING: "Đang chuẩn bị",
  CLOSED: "Đã hoàn tất",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
  EXPIRED: "Không hoàn cọc (quá hạn)",
};

export const STATUS_COLOR = {
  PENDING_PAYMENT: "warning",
  RESERVED: "accent",
  CHECKED_IN: "success",
  CHECKOUT_REQUESTED: "info",
  PREPARING: "warning",
  CLOSED: "success",
  COMPLETED: "success",
  CANCELLED: "neutral",
  EXPIRED: "danger",
};

export const DEPOSIT_STATUS_LABEL = {
  PENDING: "Chờ thanh toán cọc",
  HELD: "Đang giữ ký quỹ",
  PAID: "Đang giữ ký quỹ",
  UNPAID: "Chưa thanh toán cọc",
  SETTLED: "Đã tất toán / hoàn trả",
  FORFEITED: "Không hoàn cọc (quá hạn)",
};

export const PAYMENT_STATUS_LABEL = {
  PENDING: "Chờ thanh toán",
  PROCESSING: "Đang xử lý",
  SUCCEEDED: "Đã thanh toán",
  PAID: "Đã thanh toán",
  COMPLETED: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  EXPIRED: "Hết hạn giao dịch",
  REFUNDED: "Đã hoàn tiền",
};

export const CONTRACT_STATUS_LABEL = {
  DRAFT: "Bản thảo",
  AWAITING_SIGNATURE: "Chờ ký xác nhận",
  PRINTED: "Đã in hợp đồng",
  SIGNED: "Đã ký xác nhận",
  ACTIVE: "Đang hiệu lực",
  CLOSED: "Đã thanh lý",
  SUPERSEDED: "Đã thay thế",
  CANCELLED: "Đã hủy",
};

export const fmtMoney = formatVND;
export const fmtDate = formatDate;
export const fmtDateTime = formatDateTime;

/** Số ngày còn lại đến hạn trả kho (âm = quá hạn). */
export function checkoutDaysLeft(endDate) {
  if (!endDate) return null;
  const end = new Date(`${String(endDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

export function checkoutDeadlineLabel(daysLeft) {
  if (daysLeft == null) return "—";
  if (daysLeft < 0) return `Quá hạn ${Math.abs(daysLeft)} ngày`;
  if (daysLeft === 0) return "Hết hạn hôm nay";
  return `Còn ${daysLeft} ngày`;
}
