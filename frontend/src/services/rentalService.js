import { apiClient, safeParseJson } from "./apiClient";

/**
 * GET /api/v1/reservations?group=active|history&page=&page-size=
 * Trả ReservationPage { items, page, pageSize, total }
 */
export async function listMyReservations({ group = "active", page = 1, pageSize = 25 } = {}) {
    const res = await apiClient(
        `/api/v1/reservations?group=${group}&page=${page}&page-size=${pageSize}`
    );
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data; // { items, page, pageSize, total }
}

/**
 * GET /api/v1/reservations/{reservationId}
 * Trả ReservationDetail (bao gồm payments[], contracts[])
 * Kích hoạt EXPIRED no-show on-read nếu quá hạn (AD-4)
 */
export async function getReservation(reservationId) {
    const res = await apiClient(`/api/v1/reservations/${reservationId}`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

/**
 * GET /api/v1/reservations/{reservationId}/check-in-pass
 * Trả { code, unit, startDate, checkInDeadline, instructions[] }
 * 409 nếu reservation không ở trạng thái RESERVED
 */
export async function getCheckInPass(reservationId) {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/check-in-pass`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

/**
 * GET /api/v1/reservations/{reservationId}/contracts
 * Trả ContractChainItem[]
 */
export async function listContractsByReservation(reservationId) {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/contracts`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

/**
 * GET /api/v1/contracts/{contractId}
 * Trả ContractDetail (có contentSnapshot để render print view)
 */
export async function getContract(contractId) {
    const res = await apiClient(`/api/v1/contracts/${contractId}`);
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

/**
 * POST /api/v1/reservations/{reservationId}/checkout-request
 * Gửi yêu cầu trả kho (US-20 / FR-17)
 */
export async function createCheckoutRequest(reservationId, { requestedDate, timeSlot, reason }) {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/checkout-request`, {
        method: "POST",
        body: JSON.stringify({ requestedDate, timeSlot, reason }),
    });
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

/**
 * DELETE /api/v1/reservations/{reservationId}/checkout-request
 * Hủy yêu cầu trả kho (US-20 / FR-17)
 */
export async function cancelCheckoutRequest(reservationId) {
    const res = await apiClient(`/api/v1/reservations/${reservationId}/checkout-request`, {
        method: "DELETE",
    });
    const data = await safeParseJson(res);
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}
