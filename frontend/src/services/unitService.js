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

  items.sort((a, b) => {
    const isAvailA =
      (a.availability?.status === "AVAILABLE" || a.availability === "AVAILABLE") &&
      !a.availability?.availableFromDate;
    const isAvailB =
      (b.availability?.status === "AVAILABLE" || b.availability === "AVAILABLE") &&
      !b.availability?.availableFromDate;

    if (isAvailA !== isAvailB) {
      return isAvailA ? -1 : 1;
    }

    const priceA = a.baseMonthlyRent ?? a.monthlyPrice ?? 0;
    const priceB = b.baseMonthlyRent ?? b.monthlyPrice ?? 0;
    return sort === "price-desc" ? priceB - priceA : priceA - priceB;
  });

  return {
    items,
    page: 1,
    pageSize: items.length,
    total: items.length,
  };
}

/**
 * Lấy chi tiết thông tin kho (FR-6)
 * @param {number|string} unitId
 */
export async function getUnitDetail(unitId) {
  try {
    const res = await apiClient(`/api/v1/units/${unitId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / network error -> dùng fallback
  }

  const found = FALLBACK_UNITS.find((u) => String(u.id) === String(unitId)) || FALLBACK_UNITS[0];
  const sizeM2 = found.sizeM2 || 5.0;
  const volumeM3 = (sizeM2 * 2.8).toFixed(1);

  return {
    ...found,
    dimensions: sizeM2 <= 1.5 ? "1.0 × 1.5 × 2.0 m" : sizeM2 <= 5 ? "2.0 × 2.5 × 2.8 m" : sizeM2 <= 8 ? "2.5 × 3.2 × 2.8 m" : "3.0 × 5.0 × 2.8 m",
    security: "CCTV 24/7 + Cảm biến chuyển động riêng + Khóa mã số PIN điện tử tự quản",
    clearHeight: "2.8 m (Trần cao thông thoáng)",
    volumeM3,
    floorLevel: `Tầng ${found.floor || 1} · Khu ${found.zoneCode || "A"}`,
    facilityCode: "VN-SGN-01",
    facilityAddress: "144 Nguyễn Thái Bình, Phường 12, Quận Tân Bình, TP.HCM",
    photoUrls: [
      found.photoUrl || "/units/S-1.jpg",
      "/units/interior.jpg",
      "/units/hallway.jpg",
    ],
  };
}

/**
 * Lấy bảng giá minh bạch tính toán từ PricingEngine theo Rental Policy active (FR-6, AD-11)
 * @param {number|string} unitId
 * @param {object} params
 * @param {string} params.startDate YYYY-MM-DD
 * @param {number} params.durationMonths
 */
export async function getUnitQuote(unitId, { startDate, durationMonths = 3 } = {}) {
  const duration = Math.max(1, parseInt(durationMonths, 10) || 1);
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("start-date", startDate);
  queryParams.set("duration-months", duration);

  try {
    const res = await apiClient(`/api/v1/units/${unitId}/quote?${queryParams.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / network error -> dùng calculation fallback
  }

  // Fallback calculation matching backend PricingEngine.java exactly
  const found = FALLBACK_UNITS.find((u) => String(u.id) === String(unitId)) || FALLBACK_UNITS[0];
  const monthlyRent = found.baseMonthlyRent || 345000;
  const totalRent = monthlyRent * duration;
  const depositPercent = 10;
  const depositAmount = Math.round((totalRent * depositPercent) / 100);
  const dueNow = depositAmount;

  // Tính endDate
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + duration);
  end.setDate(end.getDate() - 1);
  const endDateStr = end.toISOString().split("T")[0];

  const formattedMonthly = new Intl.NumberFormat("vi-VN").format(monthlyRent) + " ₫";
  const formattedTotal = new Intl.NumberFormat("vi-VN").format(totalRent) + " ₫";

  const lines = [
    {
      kind: "RENT",
      code: "RENT_RATE",
      label: `Tiền thuê ${formattedMonthly}/tháng × ${duration} tháng`,
      amount: totalRent,
      refundable: false,
    },
    {
      kind: "SURCHARGE",
      code: "SURCHARGE_FACILITY",
      label: "Phí dịch vụ cơ sở & giám sát an ninh (Rental Policy v3)",
      amount: 0,
      refundable: false,
      note: "Bao gồm trong gói",
    },
    {
      kind: "SURCHARGE",
      code: "SURCHARGE_INSURANCE",
      label: "Bảo hiểm tài sản lưu trữ tiêu chuẩn",
      amount: 0,
      refundable: false,
      note: "Bao gồm (Standard Policy)",
    },
    {
      kind: "SURCHARGE",
      code: "SURCHARGE_PIN_KEYLESS",
      label: "Phí cấp mã số PIN điện tử tự quản 24/7",
      amount: 0,
      refundable: false,
      note: "Miễn phí (Waived)",
    },
    {
      kind: "DEPOSIT",
      code: "DEPOSIT_RATE",
      label: `Tiền cọc (${depositPercent}%, hoàn lại khi trả kho)`,
      amount: depositAmount,
      refundable: true,
      note: "Refundable",
    },
  ];

  return {
    unitId: Number(unitId),
    startDate: startDate || new Date().toISOString().split("T")[0],
    endDate: endDateStr,
    durationMonths: duration,
    lines,
    totalRent,
    depositAmount,
    dueNow,
    policyVersion: "v3",
  };
}
