import { apiClient, safeParseJson } from "./apiClient";

/**
 * Trợ giúp đọc JSON an toàn và chuẩn hóa lỗi API (bao gồm cả trường hợp Backend chưa bật hoặc sập socket).
 */
async function handleResponse(res, defaultCode, defaultMessage) {
  const data = await safeParseJson(res);

  if (!res.ok) {
    const isServerUnavailable = res.status >= 500;
    throw {
      status: res.status,
      code: data?.code || (isServerUnavailable ? "BACKEND_UNAVAILABLE" : defaultCode),
      message:
        data?.message ||
        (isServerUnavailable
          ? "Không thể kết nối đến máy chủ Backend (Port 8080). Vui lòng kiểm tra backend đã được khởi chạy chưa."
          : defaultMessage),
      fieldErrors: data?.fieldErrors || [],
    };
  }

  return data;
}

/**
 * Service giao tiếp với Backend cho toàn bộ luồng thanh toán và quản lý đơn đặt chỗ liên quan (US-8).
 * Khớp chuẩn 100% với contracts/openapi.yaml và PaymentController.
 */
export const paymentService = {
  /**
   * Khởi tạo phiên thanh toán mới (POST /api/v1/payments)
   *
   * @param {Object} params
   * @param {string} [params.purpose="DEPOSIT"] - "DEPOSIT" | "RENT"
   * @param {number|string} params.reservationId - ID đơn đặt chỗ
   * @param {string} params.method - "CARD" | "MOMO" | "VNPAY"
   * @param {Object} [params.card] - { number, expiry, cvc } (bắt buộc khi method=CARD)
   * @param {string} [params.momoPhone] - SĐT MoMo (bắt buộc khi method=MOMO)
   * @returns {Promise<Object>} PaymentSessionResponse
   */
  async createPayment({ purpose = "DEPOSIT", reservationId, method, card, momoPhone }) {
    const body = {
      purpose,
      reservationId: Number(reservationId),
      method,
    };

    if (method === "CARD" && card) {
      body.card = {
        number: card.number.replace(/[\s-]/g, ""),
        expiry: card.expiry.trim(),
        cvc: card.cvc.trim(),
      };
    } else if (method === "MOMO" && momoPhone) {
      body.momoPhone = momoPhone.trim().replace(/[\s.-]/g, "");
    }

    const res = await apiClient("/api/v1/payments", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return handleResponse(res, "PAYMENT_FAILED", "Không thể khởi tạo giao dịch thanh toán.");
  },

  /**
   * Lấy thông tin trạng thái phiên thanh toán (GET /api/v1/payments/{paymentId})
   * Dùng để FE poll khi trạng thái là PROCESSING (CARD) hoặc PENDING (VNPAY auto-resolve)
   *
   * @param {number|string} paymentId
   * @returns {Promise<Object>} PaymentSessionResponse
   */
  async getPayment(paymentId) {
    const res = await apiClient(`/api/v1/payments/${paymentId}`, {
      method: "GET",
    });

    return handleResponse(res, "PAYMENT_FETCH_FAILED", "Không tìm thấy giao dịch này.");
  },

  /**
   * Xác nhận thanh toán bước 2 bằng OTP (POST /api/v1/payments/{paymentId}/confirm)
   * Chỉ dùng cho MoMo (mock OTP: 123456)
   *
   * @param {number|string} paymentId
   * @param {Object} params
   * @param {string} params.otp - 6 chữ số
   * @returns {Promise<Object>} PaymentResultResponse
   */
  async confirmPayment(paymentId, { otp }) {
    const res = await apiClient(`/api/v1/payments/${paymentId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ otp: otp.trim() }),
    });

    return handleResponse(res, "PAYMENT_CONFIRM_FAILED", "Xác nhận OTP thất bại.");
  },

  /**
   * Lịch sử giao dịch thanh toán / biên lai (GET /api/v1/payments) (FR-9)
   *
   * @param {Object} [filter]
   * @param {number|string} [filter.reservationId]
   * @param {number} [filter.page=1]
   * @param {number} [filter.pageSize=25]
   * @returns {Promise<Object>} PaymentPageResponse
   */
  async listPayments({ reservationId, page = 1, pageSize = 25 } = {}) {
    const params = new URLSearchParams();
    if (reservationId) {
      params.append("reservation-id", reservationId);
    }
    params.append("page", page);
    params.append("page-size", pageSize);

    const res = await apiClient(`/api/v1/payments?${params.toString()}`, {
      method: "GET",
    });

    return handleResponse(res, "PAYMENT_LIST_FAILED", "Không thể tải lịch sử thanh toán.");
  },

  /**
   * Lấy chi tiết đơn đặt chỗ (GET /api/v1/reservations/{reservationId})
   *
   * @param {number|string} reservationId
   * @returns {Promise<Object>} ReservationDetailResponse
   */
  async getReservation(reservationId) {
    const res = await apiClient(`/api/v1/reservations/${reservationId}`, {
      method: "GET",
    });

    return handleResponse(res, "RESERVATION_NOT_FOUND", "Không tìm thấy thông tin đặt chỗ.");
  },

  /**
   * Lấy danh sách đặt chỗ của người dùng hiện tại (GET /api/v1/reservations)
   *
   * @param {Object} [params]
   * @param {string} [params.group="active"]
   * @param {number} [params.page=1]
   * @param {number} [params.pageSize=25]
   * @returns {Promise<Object>} ReservationPageResponse
   */
  async listMyReservations({ group = "active", page = 1, pageSize = 25 } = {}) {
    const params = new URLSearchParams();
    params.append("group", group);
    params.append("page", page);
    params.append("page-size", pageSize);

    const res = await apiClient(`/api/v1/reservations?${params.toString()}`, {
      method: "GET",
    });

    return handleResponse(res, "RESERVATIONS_FETCH_FAILED", "Không thể tải danh sách đặt chỗ.");
  },

  /**
   * Tạo đơn đặt chỗ mới để test trực tiếp luồng (POST /api/v1/reservations)
   *
   * @param {Object} payload { unitId, startDate, durationMonths }
   * @returns {Promise<Object>} ReservationDetailResponse
   */
  async createReservation({ unitId = 1, startDate, durationMonths = 3 }) {
    const res = await apiClient("/api/v1/reservations", {
      method: "POST",
      body: JSON.stringify({
        unitId,
        startDate,
        durationMonths,
      }),
    });

    return handleResponse(res, "RESERVATION_CREATE_FAILED", "Không thể tạo đơn đặt chỗ.");
  },
};

export default paymentService;
