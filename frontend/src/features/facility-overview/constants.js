export const INITIAL_FACILITY_UNITS = [
  { id: 1, code: "S-1", type: "Small (5m²)", zone: "Zone A", status: "AVAILABLE", rentPrice: 345000, tenant: null, nextEvent: "Khách hẹn xem kho 14:30" },
  { id: 2, code: "S-2", type: "Small (5m²)", zone: "Zone A", status: "AVAILABLE", rentPrice: 345000, tenant: null, nextEvent: "Sẵn sàng bàn giao" },
  { id: 3, code: "S-3", type: "Small (5m²)", zone: "Zone A", status: "RENTED", rentPrice: 345000, tenant: "Nguyễn Thị Lan", contractRef: "CT-1042", nextEvent: "Hạn hợp đồng 18/10/2026" },
  { id: 4, code: "S-4", type: "Small (5m²)", zone: "Zone A", status: "RENTED", rentPrice: 345000, tenant: "Lê Minh Trí", contractRef: "CT-1038", nextEvent: "Sự cố SR-0032 (Cửa kẹt)" },
  { id: 5, code: "M-1", type: "Medium (8m²)", zone: "Zone A", status: "RENTED", rentPrice: 380000, tenant: "Đỗ Mai Hương", contractRef: "CT-1040", nextEvent: "Vừa nhận kho ca sáng" },
  { id: 6, code: "M-2", type: "Medium (8m²)", zone: "Zone B", status: "PREPARING", rentPrice: 380000, tenant: "Hoàng Nam", contractRef: "CT-0988", nextEvent: "Đang kiểm tra checkout RT-0871" },
  { id: 7, code: "M-3", type: "Medium (8m²)", zone: "Zone B", status: "RENTED", rentPrice: 380000, tenant: "Công ty Alpha Logistics", contractRef: "CT-0941", nextEvent: "Gia hạn thêm 6 tháng" },
  { id: 8, code: "M-4", type: "Medium (8m²)", zone: "Zone B", status: "MAINTENANCE", rentPrice: 380000, tenant: null, nextEvent: "Đang sửa khóa thông minh SmartLock" },
  { id: 9, code: "M-5", type: "Medium (8m²)", zone: "Zone B", status: "RESERVED", rentPrice: 380000, tenant: "Phạm Thị Trang", contractRef: "BK-1044", nextEvent: "Hẹn check-in 19/10/2026" },
  { id: 10, code: "L-1", type: "Large (15m²)", zone: "Zone B", status: "RENTED", rentPrice: 890000, tenant: "Trần Anh Quân", contractRef: "CT-0912", nextEvent: "Hợp đồng dài hạn 12 tháng" },
  { id: 11, code: "L-2", type: "Large (15m²)", zone: "Zone B", status: "RENTED", rentPrice: 890000, tenant: "Vũ Bảo Long", contractRef: "CT-0925", nextEvent: "Đóng tiền kỳ kế tiếp 01/11" },
  { id: 12, code: "L-3", type: "Large (15m²)", zone: "Zone B", status: "PREPARING", rentPrice: 890000, tenant: null, nextEvent: "Đang vệ sinh khử ẩm (Task CL-0102)" },
  { id: 13, code: "LOCK-1", type: "Locker (1.5m²)", zone: "Zone C", status: "AVAILABLE", rentPrice: 100000, tenant: null, nextEvent: "Trống sẵn sàng" },
  { id: 14, code: "LOCK-2", type: "Locker (1.5m²)", zone: "Zone C", status: "RENTED", rentPrice: 100000, tenant: "Trịnh Gia Huy", contractRef: "CT-1011", nextEvent: "Gia hạn theo quý" },
  { id: 15, code: "LOCK-3", type: "Locker (1.5m²)", zone: "Zone C", status: "RESERVED", rentPrice: 100000, tenant: "Bùi Tuyết Mai", contractRef: "BK-1046", nextEvent: "Hạn thanh toán cọc" },
  { id: 16, code: "LOCK-4", type: "Locker (1.5m²)", zone: "Zone C", status: "RETIRED", rentPrice: 100000, tenant: null, nextEvent: "Tạm dừng cho thuê quy hoạch lại" },
];

export const TURNOVER_QUEUE = [
  {
    id: 1,
    unitCode: "M-2",
    spec: "Medium · 8 m² (Zone B)",
    fromStatus: "RENTED",
    toStatus: "PREPARING",
    taskName: "Nghiệm thu trả kho (Checkout)",
    refCode: "RT-0871",
    staffName: "Minh (Staff Tân Bình)",
    dueTime: "14:00",
  },
  {
    id: 2,
    unitCode: "S-1",
    spec: "Small · 5 m² (Zone A)",
    fromStatus: "PREPARING",
    toStatus: "AVAILABLE",
    taskName: "Dọn dẹp khử ẩm bàn giao (Cleaning)",
    refCode: "CL-0101",
    staffName: "Mai (Staff Tân Bình)",
    dueTime: "16:00",
  },
];

export const STATUS_CONFIGS = {
  ALL: { label: "Tất cả kho", color: "#475569", bg: "#f1f5f9" },
  AVAILABLE: { label: "Trống (Available)", color: "#059669", bg: "#ecfdf5", barWidth: "22%" },
  RESERVED: { label: "Đã đặt chỗ (Reserved)", color: "#1e40af", bg: "#f1f5f9", barWidth: "12%" },
  RENTED: { label: "Đang thuê (Rented)", color: "#334155", bg: "#f1f5f9", barWidth: "50%" },
  PREPARING: { label: "Đang xử lý (Preparing)", color: "#0284c7", bg: "#f0f9ff", barWidth: "8%" },
  MAINTENANCE: { label: "Bảo trì (Maintenance)", color: "#c2410c", bg: "#fff7ed", barWidth: "4%" },
  RETIRED: { label: "Ngừng thuê (Retired)", color: "#767676", bg: "#f5f5f5", barWidth: "4%" },
};
