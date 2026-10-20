export const STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "AVAILABLE", label: "Trống" },
  { key: "RENTED", label: "Đang thuê" },
  { key: "RESERVED", label: "Đã đặt chỗ" },
  { key: "PREPARING", label: "Đang xử lý" },
  { key: "MAINTENANCE", label: "Bảo trì" },
  { key: "RETIRED", label: "Ngừng thuê" },
];

export const STATUS_LABELS = {
  AVAILABLE: { text: "Trống", class: "status-chip--available" },
  RENTED: { text: "Đang thuê", class: "status-chip--rented" },
  RESERVED: { text: "Đã đặt chỗ", class: "status-chip--reserved" },
  PREPARING: { text: "Đang xử lý", class: "status-chip--preparing" },
  MAINTENANCE: { text: "Bảo trì", class: "status-chip--maintenance" },
  RETIRED: { text: "Ngừng thuê", class: "status-chip--retired" },
};
