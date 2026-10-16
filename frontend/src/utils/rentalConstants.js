/**
 * StorageHub Domain Constants for Rentals, Payments, Contracts (DRY Architecture)
 */

import { formatVND, formatDate, formatDateTime } from "./formatters";

export const STATUS_LABEL = {
  PENDING_PAYMENT: "Chờ thanh toán cọc",
  RESERVED: "Đã xác nhận — Chờ nhận kho",
  CHECKED_IN: "Đang thuê",
  CHECKOUT_REQUESTED: "Chờ trả kho",
  CLOSED: "Đã hoàn tất",
  EXPIRED: "Hết hạn (mất cọc)",
};

export const STATUS_COLOR = {
  PENDING_PAYMENT: "warning",
  RESERVED: "accent",
  CHECKED_IN: "success",
  CHECKOUT_REQUESTED: "info",
  CLOSED: "success",
  EXPIRED: "danger",
};

export const DEPOSIT_STATUS_LABEL = {
  PENDING: "Chờ thanh toán",
  HELD: "Đã giữ cọc an toàn",
  SETTLED: "Đã tất toán / hoàn trả",
  FORFEITED: "Đã tịch thu cọc",
};

export const PAYMENT_STATUS_LABEL = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  SUCCEEDED: "Thành công",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
};

export const CONTRACT_STATUS_LABEL = {
  DRAFT: "Bản thảo",
  PRINTED: "Đã in",
  SIGNED: "Đã ký",
  ACTIVE: "Đang hiệu lực",
  CLOSED: "Đã đóng",
  SUPERSEDED: "Đã thay thế",
};

export const fmtMoney = formatVND;
export const fmtDate = formatDate;
export const fmtDateTime = formatDateTime;
