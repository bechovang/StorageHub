import { apiClient, safeParseJson } from "./apiClient";

const DEMO_RESERVATIONS = [
  {
    id: "rsv-s3",
    code: "RSV-2026-S3",
    status: "CHECKED_IN",
    depositStatus: "PAID",
    depositAmount: 120000,
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    checkInDeadline: "2026-09-05",
    accessCode: "492015",
    durationMonths: 3,
    unit: {
      id: "u-301",
      code: "BOX-301",
      typeName: "Standard",
      sizeM2: 6.0,
      floor: 3,
      zoneCode: "B",
      baseMonthlyRent: 1200000,
      facilityName: "Cơ sở Tân Bình",
    },
    quote: {
      monthlyRent: 1200000,
      totalRent: 3600000,
      deposit: 120000,
      dueNow: 0,
      policyVersion: "2026.Q4",
    },
    payments: [
      {
        id: "pay-1",
        code: "REC-2026-01",
        purpose: "DEPOSIT",
        method: "PAYOS",
        amount: 120000,
        status: "SUCCEEDED",
        createdAt: "2026-08-30T10:00:00Z",
      },
      {
        id: "pay-2",
        code: "REC-2026-02",
        purpose: "RENT",
        method: "PAYOS",
        amount: 3480000,
        status: "SUCCEEDED",
        createdAt: "2026-09-01T08:30:00Z",
      },
    ],
    contracts: [
      {
        id: "c-1",
        code: "CTR-2026-0881",
        kind: "ORIGINAL",
        status: "ACTIVE",
        isLatest: true,
        signatureDueDate: null,
      },
    ],
  },
  {
    id: "rsv-l1",
    code: "RSV-2026-L1",
    status: "RESERVED",
    depositStatus: "PAID",
    depositAmount: 230000,
    startDate: "2026-11-01",
    endDate: "2027-02-01",
    checkInDeadline: "2026-11-04",
    durationMonths: 3,
    unit: {
      id: "u-101",
      code: "LOCK-1",
      typeName: "Large",
      sizeM2: 12.0,
      floor: 1,
      zoneCode: "A",
      baseMonthlyRent: 2300000,
      facilityName: "Cơ sở Tân Bình",
    },
    quote: {
      monthlyRent: 2300000,
      totalRent: 6900000,
      deposit: 230000,
      dueNow: 2070000,
      policyVersion: "2026.Q4",
    },
    payments: [
      {
        id: "pay-3",
        code: "REC-2026-03",
        purpose: "DEPOSIT",
        method: "PAYOS",
        amount: 230000,
        status: "SUCCEEDED",
        createdAt: "2026-10-25T14:20:00Z",
      },
    ],
    contracts: [
      {
        id: "c-2",
        code: "CTR-2026-0994",
        kind: "ORIGINAL",
        status: "AWAITING_SIGNATURE",
        isLatest: true,
        signatureDueDate: "2026-11-04",
      },
    ],
  },
  {
    id: "rsv-m2",
    code: "RSV-2026-M2",
    status: "PENDING_PAYMENT",
    depositStatus: "UNPAID",
    depositAmount: 175000,
    startDate: "2026-11-15",
    endDate: "2026-12-15",
    checkInDeadline: "2026-11-18",
    durationMonths: 1,
    unit: {
      id: "u-204",
      code: "SEC-204",
      typeName: "Medium",
      sizeM2: 8.5,
      floor: 2,
      zoneCode: "A",
      baseMonthlyRent: 1750000,
      facilityName: "Cơ sở Tân Bình",
    },
    quote: {
      monthlyRent: 1750000,
      totalRent: 1750000,
      deposit: 175000,
      dueNow: 175000,
      policyVersion: "2026.Q4",
    },
    payments: [],
    contracts: [],
  },
];

/**
 * GET /api/v1/reservations?group=active|history&page=&page-size=
 * Trả ReservationPage { items, page, pageSize, total }
 */
export async function listMyReservations({ group = "active", page = 1, pageSize = 25 } = {}) {
  try {
    const res = await apiClient(
      `/api/v1/reservations?group=${group}&page=${page}&page-size=${pageSize}`
    );
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    // Offline / backend unavailable demo fallback
    const items = DEMO_RESERVATIONS.filter((r) => {
      if (group === "history") {
        return ["CLOSED", "CANCELLED", "FORFEITED"].includes(r.status);
      }
      return ["PENDING_PAYMENT", "RESERVED", "CHECKED_IN", "CHECKOUT_REQUESTED"].includes(r.status);
    });
    return {
      items,
      page: 1,
      pageSize,
      total: items.length,
    };
  }
}

/**
 * GET /api/v1/reservations/{reservationId}
 * Trả ReservationDetail (bao gồm payments[], contracts[])
 */
export async function getReservation(reservationId) {
  try {
    const res = await apiClient(`/api/v1/reservations/${reservationId}`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    if (err?.status === 404 || err?.status === 403) throw err;
    const found = DEMO_RESERVATIONS.find(
      (r) => r.id === reservationId || r.code === reservationId
    );
    if (found) return found;
    // Fallback to first demo reservation if ID doesn't match
    return DEMO_RESERVATIONS[0];
  }
}

/**
 * GET /api/v1/reservations/{reservationId}/check-in-pass
 * Trả { code, unit, startDate, checkInDeadline, instructions[] }
 */
export async function getCheckInPass(reservationId) {
  try {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/check-in-pass`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    if (err?.status === 409 || err?.status === 403 || err?.status === 404) throw err;
    const r = DEMO_RESERVATIONS.find(
      (item) => item.id === reservationId || item.code === reservationId
    ) || DEMO_RESERVATIONS[1]; // RSV-2026-L1 is RESERVED

    return {
      code: "CIP-2026-8891",
      unit: r.unit,
      startDate: r.startDate,
      checkInDeadline: r.checkInDeadline,
      instructions: [
        "Xuất trình mã xác thực hoặc quét mã QR này tại quầy khi đến nhận kho.",
        "Mang theo CCCD/CMND hoặc Hộ chiếu gốc để đối chiếu và ký hợp đồng thuê kho.",
        "Thanh toán tiền thuê còn lại tại quầy trước khi nhận kho.",
      ],
    };
  }
}

/**
 * GET /api/v1/reservations/{reservationId}/contracts
 * Trả ContractChainItem[]
 */
export async function listContractsByReservation(reservationId) {
  try {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/contracts`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    const r = DEMO_RESERVATIONS.find(
      (item) => item.id === reservationId || item.code === reservationId
    ) || DEMO_RESERVATIONS[0];
    return r.contracts || [];
  }
}

/**
 * GET /api/v1/contracts/{contractId}
 * Trả ContractDetail
 */
export async function getContract(contractId) {
  try {
    const res = await apiClient(`/api/v1/contracts/${contractId}`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    return {
      id: contractId,
      code: "CTR-2026-0881",
      kind: "ORIGINAL",
      status: "ACTIVE",
      signedAt: "2026-09-01T08:45:00Z",
      contentSnapshot: "HỢP ĐỒNG THUÊ KHO TỰ QUẢN STORAGEHUB VN...",
    };
  }
}

/**
 * POST /api/v1/reservations/{reservationId}/checkout-request
 * Gửi yêu cầu trả kho (US-20 / FR-17)
 */
export async function createCheckoutRequest(reservationId, { requestedDate, timeSlot, reason }) {
  try {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/checkout-request`, {
      method: "POST",
      body: JSON.stringify({ requestedDate, timeSlot, reason }),
    });
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    const target = DEMO_RESERVATIONS.find(
      (r) => r.id === reservationId || r.code === reservationId
    );
    if (target) {
      target.status = "CHECKOUT_REQUESTED";
      target.checkoutRequest = { requestedDate, timeSlot, reason };
    }
    return {
      success: true,
      status: "CHECKOUT_REQUESTED",
      requestedDate,
      timeSlot,
      reason,
    };
  }
}

/**
 * DELETE /api/v1/reservations/{reservationId}/checkout-request
 * Hủy yêu cầu trả kho (US-20 / FR-17)
 */
export async function cancelCheckoutRequest(reservationId) {
  try {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/checkout-request`, {
      method: "DELETE",
    });
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    const target = DEMO_RESERVATIONS.find(
      (r) => r.id === reservationId || r.code === reservationId
    );
    if (target) {
      target.status = "CHECKED_IN";
      delete target.checkoutRequest;
    }
    return {
      success: true,
      status: "CHECKED_IN",
    };
  }
}
