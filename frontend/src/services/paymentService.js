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
   * Backend chỉ chấp nhận method = "PAYOS" (thanh toán QR).
   *
   * @param {Object} params
   * @param {string} [params.purpose="DEPOSIT"] - "DEPOSIT" | "RENT" | "EXTENSION_FEE"
   * @param {number|string} [params.reservationId] - ID đơn (RENT/EXTENSION_FEE)
   * @param {number|string} [params.unitId] - DEPOSIT: kho cần đặt
   * @param {string} [params.startDate] - DEPOSIT yyyy-MM-dd
   * @param {string} [params.endDate] - DEPOSIT yyyy-MM-dd
   * @param {string} params.method - "PAYOS"
   * @returns {Promise<Object>} PaymentSessionResponse
   */
  async createPayment({ purpose = "DEPOSIT", reservationId, unitId, startDate, endDate, method = "PAYOS" }) {
    const body = { purpose, method };
    if (reservationId != null) body.reservationId = Number(reservationId);
    if (unitId != null) body.unitId = Number(unitId);
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;

    const res = await apiClient("/api/v1/payments", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return handleResponse(res, "PAYMENT_FAILED", "Không thể khởi tạo giao dịch thanh toán.");
  },

  /**
   * Lấy thông tin trạng thái phiên thanh toán (GET /api/v1/payments/{paymentId})
   * Dùng để FE poll khi trạng thái là PENDING (chờ webhook PayOS)
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
   * DEMO ONLY: Bỏ qua thanh toán — đánh dấu phiên PENDING/PROCESSING là SUCCEEDED
   * (POST /api/v1/payments/{paymentId}/demo-complete)
   * Backend có thể trả 400 (demo disabled) — message sẽ surface lên UI.
   *
   * @param {number|string} paymentId
   * @returns {Promise<Object>} PaymentSessionResponse (giống getPayment)
   */
  async demoCompletePayment(paymentId) {
    const res = await apiClient(`/api/v1/payments/${paymentId}/demo-complete`, {
      method: "POST",
    });

    return handleResponse(res, "DEMO_COMPLETE_FAILED", "Không thể bỏ qua thanh toán (demo).");
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

};

export default paymentService;
