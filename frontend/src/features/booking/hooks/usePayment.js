import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import QRCode from "qrcode";
import { useAuth } from "../../../context/AuthContext.jsx";
import { paymentService } from "../../../services/paymentService.js";
import { getUnitDetail, getUnitQuote } from "../../../services/unitService.js";

/**
 * Chuẩn hoá thông điệp lỗi: bảo vệ người dùng khỏi các lỗi nội bộ, config keys, hoặc stack traces
 */
function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') {
    return 'Giao dịch chưa thành công. Quý khách vui lòng thử lại sau.';
  }
  if (msg.includes('PAYOS_') || msg.toLowerCase().includes('payos chưa được cấu hình')) {
    return 'Cổng thanh toán QR hiện đang tạm bảo trì kết nối. Quý khách vui lòng thử lại sau ít phút.';
  }
  if (msg.includes('Backend') || msg.includes('fetch') || msg.includes('8080') || msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
    return 'Không thể kết nối đến máy chủ thanh toán. Quý khách vui lòng kiểm tra kết nối mạng và thử lại.';
  }
  if (msg.includes('Exception') || msg.includes('SQL') || msg.includes('NullPointer') || msg.includes('Internal Server')) {
    return 'Hệ thống đang bận xử lý. Quý khách vui lòng thử lại sau ít phút.';
  }
  return msg;
}

/** Cộng thêm n ngày vào chuỗi ngày yyyy-MM-dd */
function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Map ReservationDetail (API) sang state hiển thị — mô hình thuê theo ngày */
function mapDetailToReservation(detail) {
  return {
    id: detail.id,
    code: detail.code || `RSV-${detail.id}`,
    status: detail.status,
    depositAmount: detail.depositAmount ?? detail.quote?.deposit ?? 0,
    depositStatus: detail.depositStatus,
    durationDays: detail.durationDays ?? null,
    startDate: detail.startDate,
    endDate: detail.endDate,
    unit: {
      code: detail.unit?.code || "",
      sizeM2: detail.unit?.sizeM2 || 0,
      typeName: detail.unit?.typeName || "",
      baseDailyRent: detail.unit?.baseDailyRent || 0,
      depot: detail.unit?.facilityName || "",
      building: detail.unit?.zoneCode ? `Khu ${detail.unit.zoneCode}` : "",
      floor: detail.unit?.floor,
    },
  };
}

export function usePayment() {
  const { reservationId: paramResId, paymentId: paramPayId, unitId: paramUnitId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const queryResId = searchParams.get("reservationId") || searchParams.get("id");
  const queryPayId = searchParams.get("paymentId");
  const targetReservationId = paramResId || queryResId;
  const targetPaymentId = paramPayId || queryPayId;

  // Trạng thái đơn đặt chỗ (không dùng dữ liệu cứng — chỉ theo API)
  const [reservation, setReservation] = useState(null);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const [myReservations, setMyReservations] = useState([]);
  // Trạng thái Modal (chỉ mở khi người dùng bấm nút tiến hành thanh toán cọc)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Phương thức thanh toán — Backend chỉ hỗ trợ PAYOS (QR)
  const [selectedMethod, setSelectedMethod] = useState("PAYOS");

  // Phiên thanh toán & kết quả
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Trạng thái loading, polling, thông báo lỗi
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [apiError, setApiError] = useState("");
  const [payOsUnavailable, setPayOsUnavailable] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);

  // Lịch sử thanh toán & Copy
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const pollIntervalRef = useRef(null);

  // Dừng polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  }, []);

  // Tải lịch sử thanh toán
  const loadPaymentHistory = useCallback(async (resId) => {
    if (!resId) return;
    try {
      const data = await paymentService.listPayments({ reservationId: resId, pageSize: 10 });
      if (data?.items) {
        setPaymentHistory(data.items);
      }
    } catch {
      // Bỏ qua lỗi phụ của lịch sử
    }
  }, []);

  // Sau khi PayOS SUCCEEDED, handler BE đã sinh reservation — tải lại state
  // để trang chuyển từ draft sang đơn thật.
  const syncReservationFromSession = useCallback(async (session) => {
    if (!session?.reservationId) return;
    try {
      const detail = await paymentService.getReservation(session.reservationId);
      if (detail) {
        setReservation(mapDetailToReservation(detail));
        loadPaymentHistory(session.reservationId);
      }
    } catch {
      // Đơn vừa tạo có thể chưa đọc được ngay — lần poll sau sẽ thử lại.
    }
  }, [loadPaymentHistory]);

  // Bắt đầu polling khi chờ webhook PayOS xác nhận
  const startPolling = useCallback(
    (paymentId, intervalMs = 5000) => {
      stopPolling();
      setPolling(true);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const updated = await paymentService.getPayment(paymentId);
          setPaymentSession(updated);

          if (
            updated.status === "SUCCEEDED" ||
            updated.status === "FAILED" ||
            updated.status === "EXPIRED"
          ) {
            stopPolling();
            if (updated.status === "SUCCEEDED") {
              if (updated.refundRequired) {
                setNotificationToast({
                  type: "PAYMENT_REFUND_REQUIRED",
                  title: "Đã thanh toán nhưng kho vừa được đặt",
                  body: updated.refundReason
                    || "Hệ thống sẽ hoàn lại tiền cọc cho bạn. Không có đơn thuê nào được tạo.",
                });
              } else {
                setNotificationToast({
                  type: "PAYMENT_CONFIRMED",
                  title: "Thanh toán cọc thành công",
                  body: `Biên lai ${updated.receiptCode || "RT-..."} đã được cấp. Đơn thuê đã được tạo.`,
                });
                syncReservationFromSession(updated);
              }
            }
          }
        } catch (err) {
          stopPolling();
          setApiError(err.message || "Lỗi khi kiểm tra trạng thái thanh toán.");
        }
      }, intervalMs);
    },
    [stopPolling, loadPaymentHistory, syncReservationFromSession]
  );

  // 1. Tải danh sách đơn đặt chỗ & chi tiết ban đầu
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      if (!isAuthenticated) return;

      try {
        setLoadingReservation(true);
        setReservationError("");

        if (paramUnitId) {
          // Flow /units/:unitId/book — chỉ lấy quote; booking sinh sau khi trả cọc.
          // CHƯA có reservation; reservation chỉ sinh khi PayOS SUCCEEDED.
          const u = await getUnitDetail(paramUnitId);
          const start =
            searchParams.get("startDate") || new Date().toISOString().split("T")[0];
          const end = searchParams.get("endDate") || addDays(start, 1);
          // Chỉ lấy quote để hiển thị — KHÔNG tạo booking/draft. Payment PENDING
          // mới là thứ tồn tại trước khi PayOS SUCCEEDED.
          const quote = await getUnitQuote(paramUnitId, { startDate: start, endDate: end });

          if (isMounted) {
            setReservation({
              id: null,
              unitId: Number(paramUnitId),
              code: `Đơn mới · ${u.code || u.id}`,
              status: "DRAFT",
              depositAmount: quote.depositAmount ?? quote.deposit ?? 0,
              depositStatus: null,
              durationDays: quote.durationDays,
              totalRent: quote.totalRent,
              startDate: quote.startDate || start,
              endDate: quote.endDate || end,
              unit: {
                code: u.code || `UNIT-${u.id}`,
                sizeM2: u.sizeM2 || 0,
                typeName: u.typeName || "Kho tiêu chuẩn",
                baseDailyRent: u.baseDailyRent || 0,
                depot: u.facilityName || "",
                building: u.floor ? `Tầng ${u.floor}` : "",
                floor: u.floor,
              },
            });
          }
          return;
        }

        const listData = await paymentService.listMyReservations({ group: "active" });
        if (isMounted && listData?.items) {
          setMyReservations(listData.items);
        }

        const resIdToFetch = targetReservationId || listData?.items?.[0]?.id;

        if (resIdToFetch) {
          const detail = await paymentService.getReservation(resIdToFetch);
          if (isMounted && detail) {
            setReservation(mapDetailToReservation(detail));
            loadPaymentHistory(resIdToFetch);

            const isPaid =
              detail.status === "RESERVED" ||
              detail.depositStatus === "HELD" ||
              detail.depositStatus === "PAID";
            if (isPaid) {
              try {
                const history = await paymentService.listPayments({ reservationId: resIdToFetch });
                const successPayment = history?.items?.find(
                  (p) => p.purpose === "DEPOSIT" && p.status === "SUCCEEDED"
                );
                if (isMounted && successPayment) {
                  setPaymentSession({
                    id: successPayment.id,
                    status: "SUCCEEDED",
                    receiptCode: successPayment.receiptCode,
                    amount: successPayment.amount,
                    method: successPayment.method,
                  });
                }
              } catch {
                // Bỏ qua lỗi phụ tải biên lai cũ
              }
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setReservationError(err.message || "Không thể tải thông tin đơn đặt chỗ.");
        }
      } finally {
        if (isMounted) setLoadingReservation(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    paramUnitId,
    searchParams,
    targetReservationId,
    loadPaymentHistory,
    mapDetailToReservation,
  ]);

  // 2. Tải phiên thanh toán nếu có paymentId trong param
  useEffect(() => {
    if (targetPaymentId && isAuthenticated) {
      paymentService
        .getPayment(targetPaymentId)
        .then(async (session) => {
          setPaymentSession(session);
          if (session.method) setSelectedMethod(session.method);
          setIsModalOpen(true);

          if (session.reservationId) {
            try {
              const detail = await paymentService.getReservation(session.reservationId);
              if (detail) {
                setReservation(mapDetailToReservation(detail));
                loadPaymentHistory(session.reservationId);
              }
            } catch {
              // Vẫn giữ phiên thanh toán; reservation chỉ để hiển thị
            }
          }

          if (session.status === "PENDING" && session.method === "PAYOS") {
            startPolling(session.id, 5000);
          }
        })
        .catch((err) => {
          setApiError(err.message || "Không thể tải phiên thanh toán.");
        });
    }
  }, [targetPaymentId, isAuthenticated, startPolling, loadPaymentHistory, mapDetailToReservation]);

  // 3. Render mã QR khi có qrPayload
  useEffect(() => {
    let active = true;
    if (paymentSession?.qrPayload) {
      QRCode.toDataURL(paymentSession.qrPayload, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
      })
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch(() => {
          if (active) setQrDataUrl("");
        });
    }
    return () => {
      active = false;
    };
  }, [paymentSession?.qrPayload]);

  // 4. Đồng hồ đếm ngược 1s tick
  useEffect(() => {
    const expiresAt = paymentSession?.qrExpiresAt;
    if (
      !expiresAt ||
      paymentSession?.status === "SUCCEEDED" ||
      paymentSession?.status === "FAILED"
    ) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSession?.qrExpiresAt, paymentSession?.status]);

  // Dọn dẹp polling khi unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Tính countdown (giây)
  const expiresAt = paymentSession?.qrExpiresAt;
  const countdown =
    expiresAt && paymentSession?.status === "PENDING"
      ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
      : null;

  const formatCountdown = (seconds) => {
    if (seconds == null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleInitiatePayment = useCallback(
    async (e, overrideMethod) => {
      if (e && e.preventDefault) e.preventDefault();
      setApiError("");

      const methodToUse = overrideMethod || selectedMethod || "PAYOS";

      setSubmitting(true);
      const reservationId = reservation?.id;
      const unitId = reservation?.unitId;
      try {
        if (!reservationId && !unitId) {
          setApiError("Chưa có kho/thời gian thuê để thanh toán.");
          return;
        }

        const session = await paymentService.createPayment({
          purpose: "DEPOSIT",
          ...(reservationId
            ? { reservationId }
            : {
                unitId,
                startDate: reservation.startDate,
                endDate: reservation.endDate,
              }),
          method: methodToUse,
        });

        setPaymentSession(session);

        // PayOS chờ webhook — poll định kỳ
        startPolling(session.id, 5000);
      } catch (err) {
        if (err.code === "PAYMENT_DUPLICATE") {
          setApiError(null);
          if (reservationId) {
            try {
              const detail = await paymentService.getReservation(reservationId);
              if (detail) {
                setReservation((prev) => ({
                  ...prev,
                  depositStatus: detail.depositStatus || "HELD",
                }));
              }
              const history = await paymentService.listPayments({ reservationId });
              const successPayment = history?.items?.find(
                (p) => p.purpose === "DEPOSIT" && p.status === "SUCCEEDED"
              );
              if (successPayment) {
                setPaymentSession({
                  id: successPayment.id,
                  status: "SUCCEEDED",
                  receiptCode: successPayment.receiptCode,
                  amount: successPayment.amount,
                  method: successPayment.method,
                });
                setNotificationToast({
                  type: "PAYMENT_ALREADY_DONE",
                  title: "Khoản cọc đã được thanh toán",
                  body: `Đơn đặt chỗ ${reservation.code} đã có biên lai ${successPayment.receiptCode}.`,
                });
                return;
              }
            } catch {
              // Lỗi phụ khi đối soát lại đơn đã thanh toán
            }
          }
          setApiError("Khoản cọc này đã được thanh toán hoặc đang trong phiên xử lý.");
        } else {
          if (methodToUse === "PAYOS") {
            setPayOsUnavailable(true);
            setApiError(sanitizeErrorMessage(err.message));
          } else {
            setApiError(sanitizeErrorMessage(err.message));
          }
        }
      } finally {
        setSubmitting(false);
      }
    },
    [reservation, selectedMethod, startPolling, loadPaymentHistory]
  );

  const handleResetOrSwitch = (newMethod) => {
    stopPolling();
    setPaymentSession(null);
    setPaymentResult(null);
    setQrDataUrl("");
    setApiError("");
    setPayOsUnavailable(false);
    if (newMethod) {
      setSelectedMethod(newMethod);
      if (newMethod === "PAYOS") {
        handleInitiatePayment(null, newMethod);
      }
    }
  };

  const handleSelectMethod = useCallback(
    (m) => {
      setSelectedMethod(m);
      setApiError("");
      if (m === "PAYOS") {
        if (
          !paymentSession ||
          paymentSession.method !== m ||
          paymentSession.status !== "PENDING"
        ) {
          handleInitiatePayment(null, m);
        }
      }
    },
    [handleInitiatePayment, paymentSession]
  );

  const handleCheckPaymentStatus = async () => {
    if (!paymentSession?.id || countdown === 0) {
      await handleInitiatePayment(null, selectedMethod);
      return;
    }

    setCheckingStatus(true);
    setApiError("");

    try {
      const updated = await paymentService.getPayment(paymentSession.id);
      setPaymentSession(updated);

      if (updated.status === "SUCCEEDED") {
        stopPolling();
        setNotificationToast({
          type: "PAYMENT_CONFIRMED",
          title: "Thanh toán cọc thành công",
          body: `Biên lai ${updated.receiptCode || "RT-..."} đã được cấp. Đơn thuê đã được tạo.`,
        });
        syncReservationFromSession(updated);
      } else if (updated.status === "FAILED") {
        stopPolling();
      } else if (updated.status === "EXPIRED") {
        stopPolling();
        setApiError("Mã QR đã hết hạn. Vui lòng bấm 'Làm mới' để tạo mã mới.");
      } else {
        setNotificationToast({
          type: "PAYMENT_PENDING",
          title: "Chưa nhận được thanh toán",
          body: "Hệ thống chưa nhận được tiền từ ngân hàng. Vui lòng hoàn tất quét mã và bấm 'Làm mới' lại sau ít giây.",
        });
      }
    } catch (err) {
      setApiError(err.message || "Không thể kiểm tra trạng thái thanh toán.");
    } finally {
      setCheckingStatus(false);
    }
  };

  /**
   * DEMO ONLY: Bỏ qua thanh toán — gọi /payments/{id}/demo-complete rồi refresh
   * phiên như luồng poll bình thường. Lỗi 400 (demo bị tắt) hiển thị message.
   */
  const handleDemoCompletePayment = async () => {
    if (!paymentSession?.id) return;
    setCheckingStatus(true);
    setApiError("");
    try {
      const updated = await paymentService.demoCompletePayment(paymentSession.id);
      setPaymentSession(updated);
      stopPolling();
      if (updated.status === "SUCCEEDED") {
        setNotificationToast({
          type: "PAYMENT_CONFIRMED",
          title: "Đã bỏ qua thanh toán (Demo)",
          body: `Biên lai ${updated.receiptCode || "RT-..."} đã được cấp. Đơn thuê đã được tạo.`,
        });
        syncReservationFromSession(updated);
      }
    } catch (err) {
      setApiError(err.message || "Không thể bỏ qua thanh toán (demo).");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCreateTestReservation = async () => {
    try {
      setLoadingReservation(true);
      setApiError("");
      const today = new Date().toISOString().split("T")[0];
      const start = today;
      const end = addDays(today, 30);
      const candidateUnits = [4, 5, 7, 8, 9, 10, 12, 13, 14, 2];
      let unit = null;
      let quote = null;
      let unitId = null;

      for (const uId of candidateUnits) {
        try {
          const [detail, q] = await Promise.all([
            getUnitDetail(uId),
            getUnitQuote(uId, { startDate: start, endDate: end }),
          ]);
          unit = detail;
          quote = q;
          unitId = uId;
          break;
        } catch {
          // Kho không khả dụng — thử kho kế tiếp
        }
      }

      if (!unitId) {
        throw new Error("Không còn kho mẫu nào khả dụng để đặt.");
      }

      setReservation({
        id: null,
        unitId,
        code: `Đơn mới · ${unit.code || unitId}`,
        status: "DRAFT",
        depositAmount: quote.depositAmount ?? quote.deposit ?? 0,
        depositStatus: null,
        durationDays: quote.durationDays,
        totalRent: quote.totalRent,
        startDate: quote.startDate || start,
        endDate: quote.endDate || end,
        unit: {
          code: unit.code || "",
          sizeM2: unit.sizeM2 || 0,
          typeName: unit.typeName || "",
          baseDailyRent: unit.baseDailyRent || 0,
          depot: unit.facilityName || "",
          building: unit.floor ? `Tầng ${unit.floor}` : "",
          floor: unit.floor,
        },
      });

      handleResetOrSwitch();
      setPaymentHistory([]);
      setIsModalOpen(true);

      try {
        const listData = await paymentService.listMyReservations({ group: "active" });
        if (listData?.items) setMyReservations(listData.items);
      } catch {
        // Bỏ qua lỗi phụ tải danh sách
      }
    } catch (err) {
      setApiError(err.message || "Không thể tạo đơn đặt chỗ thử nghiệm.");
    } finally {
      setLoadingReservation(false);
    }
  };

  const handleSelectReservation = async (resId) => {
    try {
      setLoadingReservation(true);
      setApiError("");
      const detail = await paymentService.getReservation(resId);
      if (detail) {
        setReservation(mapDetailToReservation(detail));
        handleResetOrSwitch();
        loadPaymentHistory(resId);
      }
    } catch (err) {
      setApiError(err.message || "Không thể tải chi tiết đặt chỗ.");
    } finally {
      setLoadingReservation(false);
    }
  };

  const handleCopyReceipt = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isAlreadyPaid =
    reservation?.depositStatus === "HELD" ||
    reservation?.depositStatus === "PAID" ||
    reservation?.status === "RESERVED" ||
    paymentSession?.status === "SUCCEEDED";

  return {
    user,
    navigate,
    reservation,
    loadingReservation,
    reservationError,
    myReservations,
    isModalOpen,
    setIsModalOpen,
    selectedMethod,
    paymentSession,
    paymentResult,
    qrDataUrl,
    countdown,
    formatCountdown,
    submitting,
    polling,
    checkingStatus,
    apiError,
    notificationToast,
    paymentHistory,
    showHistory,
    setShowHistory,
    copiedCode,
    isAlreadyPaid,
    payOsUnavailable,
    handleInitiatePayment,
    handleResetOrSwitch,
    handleSelectMethod,
    handleCheckPaymentStatus,
    handleDemoCompletePayment,
    handleCreateTestReservation,
    handleSelectReservation,
    handleCopyReceipt,
  };
}
