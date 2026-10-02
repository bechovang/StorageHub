import { apiClient } from "./apiClient";

export const FALLBACK_FILTER_OPTIONS = {
  types: [
    { id: 1, name: "Locker" },
    { id: 2, name: "Kho nhỏ (S)" },
    { id: 3, name: "Kho vừa (M)" },
    { id: 4, name: "Kho lớn (L)" },
  ],
  sizesM2: [1.5, 5.0, 8.0, 15.0],
  facilities: [
    { id: 1, name: "Cơ sở Tân Bình (VN-SGN-01)", code: "VN-SGN-01", address: "144 Nguyễn Thái Bình, Tân Bình" },
    { id: 2, name: "Cơ sở Quận 7 (Sắp mở)", code: "VN-SGN-02", address: "Khu đô thị Phú Mỹ Hưng, Quận 7" },
  ],
};

export const FALLBACK_UNITS = [
  {
    id: 1,
    code: "S-1",
    typeName: "Kho nhỏ (S)",
    typeId: 2,
    sizeM2: 5.0,
    floor: 1,
    zoneCode: "A",
    facilityName: "Tân Bình Depot",
    accessType: "QR",
    baseMonthlyRent: 345000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Tầng trệt", "Hành lang chính"],
    photoUrl: "/units/S-1.jpg",
  },
  {
    id: 2,
    code: "S-2",
    typeName: "Kho nhỏ (S)",
    typeId: 2,
    sizeM2: 5.0,
    floor: 1,
    zoneCode: "A",
    facilityName: "Tân Bình Depot",
    accessType: "PIN",
    baseMonthlyRent: 345000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Mã PIN riêng 24/7", "Camera an ninh"],
    photoUrl: "/units/S-2.jpg",
  },
  {
    id: 4,
    code: "S-4",
    typeName: "Kho nhỏ (S)",
    typeId: 2,
    sizeM2: 5.0,
    floor: 1,
    zoneCode: "A",
    facilityName: "Tân Bình Depot",
    accessType: "QR",
    baseMonthlyRent: 345000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Gần lối vào", "Cảm biến nhiệt độ"],
    photoUrl: "/units/S-4.jpg",
  },
  {
    id: 5,
    code: "M-1",
    typeName: "Kho vừa (M)",
    typeId: 3,
    sizeM2: 8.0,
    floor: 1,
    zoneCode: "A",
    facilityName: "Tân Bình Depot",
    accessType: "QR",
    baseMonthlyRent: 380000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Cửa cuốn rộng", "Gần thang nâng hàng"],
    photoUrl: "/units/M-1.jpg",
  },
  {
    id: 7,
    code: "M-3",
    typeName: "Kho vừa (M)",
    typeId: 3,
    sizeM2: 8.0,
    floor: 2,
    zoneCode: "B",
    facilityName: "Tân Bình Depot",
    accessType: "QR",
    baseMonthlyRent: 380000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Thông thoáng", "Khu B yên tĩnh"],
    photoUrl: "/units/M-3.jpg",
  },
  {
    id: 8,
    code: "M-4",
    typeName: "Kho vừa (M)",
    typeId: 3,
    sizeM2: 8.0,
    floor: 2,
    zoneCode: "B",
    facilityName: "Tân Bình Depot",
    accessType: "smart lock",
    baseMonthlyRent: 380000,
    availability: { status: "AVAILABLE_SOON", availableFromDate: "2026-10-21" },
    bufferNote: "Đệm dọn dẹp vệ sinh kho",
    features: ["Khoá thông minh", "Chuẩn bị bàn giao"],
    photoUrl: "/units/M-4.jpg",
  },
  {
    id: 9,
    code: "M-5",
    typeName: "Kho vừa (M)",
    typeId: 3,
    sizeM2: 8.0,
    floor: 2,
    zoneCode: "B",
    facilityName: "Tân Bình Depot",
    accessType: "smart lock",
    baseMonthlyRent: 380000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Khoá thông minh", "Góc 2 mặt thoáng"],
    photoUrl: "/units/M-5.jpg",
  },
  {
    id: 10,
    code: "L-1",
    typeName: "Kho lớn (L)",
    typeId: 4,
    sizeM2: 15.0,
    floor: 2,
    zoneCode: "B",
    facilityName: "Tân Bình Depot",
    accessType: "smart lock",
    baseMonthlyRent: 890000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Sức chứa lớn", "Thích hợp pallet & nội thất"],
    photoUrl: "/units/L-1.jpg",
  },
  {
    id: 12,
    code: "LOCK-1",
    typeName: "Locker",
    typeId: 1,
    sizeM2: 1.5,
    floor: 1,
    zoneCode: "C",
    facilityName: "Tân Bình Depot",
    accessType: "QR",
    baseMonthlyRent: 100000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Ngăn tủ cá nhân", "Phù hợp tài liệu, balo"],
    photoUrl: "/units/LOCK-1.jpg",
  },
  {
    id: 13,
    code: "LOCK-2",
    typeName: "Locker",
    typeId: 1,
    sizeM2: 1.5,
    floor: 1,
    zoneCode: "C",
    facilityName: "Tân Bình Depot",
    accessType: "QR",
    baseMonthlyRent: 100000,
    availability: { status: "AVAILABLE", availableFromDate: null },
    features: ["Ngăn tủ cá nhân", "Quét QR mở tủ"],
    photoUrl: "/units/LOCK-2.jpg",
  },
];

/**
 * Lấy danh sách options cho bộ lọc (loại kho và kích thước m²)
 */
export async function getUnitFilterOptions() {
  try {
    const res = await apiClient("/api/v1/units/filter-options");
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / network error -> dùng fallback
  }
  return FALLBACK_FILTER_OPTIONS;
}

/**
 * Tìm kiếm kho theo bộ lọc
 * @param {object} params
 * @param {number|string} [params.typeId]
 * @param {number|string} [params.sizeM2]
 * @param {string} [params.startDate]
 * @param {number|string} [params.durationMonths]
 * @param {string} [params.sort] "price-asc" | "price-desc"
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 */
export async function searchUnits({
  typeId = "",
  sizeM2 = "",
  startDate = "",
  facilityId = "",
  durationMonths = "",
  sort = "price-asc",
  page = 1,
  pageSize = 25,
} = {}) {
  const queryParams = new URLSearchParams();
  if (typeId) queryParams.set("type-id", typeId);
  if (sizeM2) queryParams.set("size-m2", sizeM2);
  if (startDate) queryParams.set("start-date", startDate);
  if (facilityId) queryParams.set("facility-id", facilityId);
  if (durationMonths) queryParams.set("duration-months", durationMonths);
  if (sort) queryParams.set("sort", sort);
  queryParams.set("page", page);
  queryParams.set("page-size", pageSize);

  try {
    const res = await apiClient(`/api/v1/units?${queryParams.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / network error -> lọc từ dữ liệu fallback
  }

  // Fallback lọc dữ liệu mẫu
  let items = [...FALLBACK_UNITS];

  if (typeId) {
    items = items.filter((u) => String(u.typeId) === String(typeId));
  }

  if (sizeM2) {
    items = items.filter((u) => Number(u.sizeM2) === Number(sizeM2));
  }

  if (facilityId) {
    items = items.filter((u) => String(u.facilityId || 1) === String(facilityId));
  }

  if (sort === "price-desc") {
    items.sort((a, b) => b.baseMonthlyRent - a.baseMonthlyRent);
  } else {
    items.sort((a, b) => a.baseMonthlyRent - b.baseMonthlyRent);
  }

  return {
    items,
    page: 1,
    pageSize: items.length,
    total: items.length,
  };
}
