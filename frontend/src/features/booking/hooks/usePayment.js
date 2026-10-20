import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import QRCode from "qrcode";
import { useAuth } from "../../../context/AuthContext.jsx";
import { paymentService } from "../../../services/paymentService.js";
import { getUnitDetail } from "../../../services/unitService.js";
import { PaymentValidator } from "../../../validation/index.js";

const DEFAULT_DEMO_RESERVATION = {
  id: 1,
  code: "RSV-2026-S3",
  status: "PENDING_PAYMENT",
  depositAmount: 103500,
  depositStatus: "UNPAID",
  durationMonths: 3,
  startDate: "2026-10-03",
  endDate: "2027-01-03",
  unit: {
    code: "S-3",
    sizeM2: 5,
    typeName: "Indoor Climate-Controlled Storage",
    monthlyPrice: 345000,
    depot: "Tân Bình Gateway",
    building: "Building B · Level 2",
    dimensions: "2.0m (W) × 2.5m (L) × 2.8m (H)",
    volume: "14.0 m³",
  },
};

export function usePayment() {
  const { reservationId: paramResId, paymentId: paramPayId, unitId: paramUnitId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const queryResId = searchParams.get("reservationId") || searchParams.get("id");
  const queryPayId = searchParams.get("paymentId");
  const targetReservationId = paramResId || queryResId;
  const targetPaymentId = paramPayId || queryPayId;

  // Trạng thái đơn đặt chỗ
  const [reservation, setReservation] = useState(DEFAULT_DEMO_RESERVATION);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [myReservations, setMyReservations] = useState([]);
  const reservationRef = useRef(reservation);
  useEffect(() => {
    reservationRef.current = reservation;
  }, [reservation]);

  // Trạng thái Modal (chỉ mở khi người dùng bấm nút tiến hành thanh toán cọc)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Phương thức thanh toán ("CARD" | "MOMO" | "VNPAY")
  const [selectedMethod, setSelectedMethod] = useState("CARD");

  // Form thẻ
  const [cardForm, setCardForm] = useState({
    number: "4242 4242 4242 4242",
    expiry: "12/28",
    cvc: "123",
    name: user?.fullName || "Nguyễn Thị Lan",
  });

  // Form MoMo
  const [momoPhone, setMomoPhone] = useState(user?.phone || "0901234567");
  const [otp, setOtp] = useState("");

  // Phiên thanh toán & kết quả
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Trạng thái loading, polling, thông báo lỗi
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
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
      // Bỏ qua lỗi phụ
    }
  }, []);

  // Bắt đầu polling khi trạng thái cần chờ xác nhận (CARD / VNPAY)
  const startPolling = useCallback(
    (paymentId) => {
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
              setNotificationToast({
                type: "PAYMENT_CONFIRMED",
                title: "Thanh toán cọc thành công",
                body: `Biên lai ${updated.receiptCode || "RT-2026-..."} đã được cấp. Đơn đặt chỗ đã chuyển sang trạng thái RESERVED.`,
              });
              if (reservationRef.current?.id) {
                loadPaymentHistory(reservationRef.current.id);
              }
            }
          }
        } catch (err) {
          stopPolling();
          setApiError(err.message || "Lỗi khi kiểm tra trạng thái thanh toán.");
        }
      }, 1500);
    },
    [stopPolling, loadPaymentHistory]
  );

  // 1. Tải danh sách đơn đặt chỗ & chi tiết ban đầu
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      if (!isAuthenticated) return;

      try {
        setLoadingReservation(true);

        if (paramUnitId) {
          try {
            const u = await getUnitDetail(paramUnitId);
            const duration = parseInt(
              searchParams.get("durationMonths") || searchParams.get("duration") || 3,
              10
            );
            const start = searchParams.get("startDate") || "2026-10-03";
            const monthly = u.baseMonthlyRent || 345000;
            const deposit = Math.round((monthly * duration * 10) / 100);

            const sDate = new Date(start);
            const eDate = new Date(sDate);
            eDate.setMonth(eDate.getMonth() + duration);
            eDate.setDate(eDate.getDate() - 1);

            if (isMounted) {
              setReservation({
                id: u.id,
                code: `RSV-2026-${u.code || u.id}`,
                status: "PENDING_PAYMENT",
                depositAmount: deposit,
                depositStatus: "UNPAID",
                durationMonths: duration,
                startDate: start,
                endDate: eDate.toISOString().split("T")[0],
                unit: {
                  code: u.code || `UNIT-${u.id}`,
                  sizeM2: u.sizeM2 || 5,
                  typeName: u.typeName || "Kho tiêu chuẩn",
                  monthlyPrice: monthly,
                  depot: u.facilityName || "Tân Bình Gateway",
                  building: `Tòa nhà B · Tầng ${u.floor || 1}`,
                  dimensions: u.dimensions || `${u.sizeM2} m²`,
                  volume: `${(u.sizeM2 * 2.8).toFixed(1)} m³`,
                },
              });
              setLoadingReservation(false);
            }
            return;
          } catch {
            // fallback
          }
        }

        const listData = await paymentService.listMyReservations({ group: "active" });
        if (isMounted && listData?.items) {
          setMyReservations(listData.items);
        }

        const pendingItem = listData?.items?.find((r) => r.status === "PENDING_PAYMENT");
        const resIdToFetch = targetReservationId || pendingItem?.id || listData?.items?.[0]?.id;

        if (resIdToFetch) {
          try {
            const detail = await paymentService.getReservation(resIdToFetch);
            if (isMounted && detail) {
              const isPaid =
                detail.status === "RESERVED" ||
                detail.depositStatus === "HELD" ||
                detail.depositStatus === "PAID";

              setReservation({
                id: detail.id,
                code: detail.code || `RSV-${detail.id}`,
                status: detail.status,
                depositAmount: detail.depositAmount || 103500,
                depositStatus: detail.depositStatus || (isPaid ? "HELD" : "UNPAID"),
                durationMonths: detail.durationMonths || 3,
                startDate: detail.startDate || "2026-10-03",
                endDate: detail.endDate || "2027-01-03",
                unit: {
                  code: detail.unit?.code || "S-3",
                  sizeM2: detail.unit?.sizeM2 || 5,
                  typeName: detail.unit?.typeName || "Indoor Climate-Controlled Storage",
                  monthlyPrice: Math.round(
                    ((detail.depositAmount || 103500) * 10) / (detail.durationMonths || 3)
                  ),
                  depot: "Tân Bình Gateway",
                  building: "Building B · Level 2",
                  dimensions: "2.0m (W) × 2.5m (L) × 2.8m (H)",
                  volume: "14.0 m³",
                },
              });

              loadPaymentHistory(resIdToFetch);

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
                  // ignore
                }
              }
            }
          } catch {
            // Giữ demo fallback nếu không gọi được API
          }
        }
      } catch {
        // Dự phòng fallback
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
  ]);

  // 2. Tải phiên thanh toán nếu có paymentId trong param
  useEffect(() => {
    if (targetPaymentId && isAuthenticated) {
      paymentService
        .getPayment(targetPaymentId)
        .then((session) => {
          setPaymentSession(session);
          if (
            session.status === "PROCESSING" ||
            (session.status === "PENDING" && session.method === "VNPAY")
          ) {
            startPolling(session.id);
          }
        })
        .catch((err) => {
          setApiError(err.message || "Không thể tải phiên thanh toán.");
        });
    }
  }, [targetPaymentId, isAuthenticated, startPolling]);

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
    const expiresAt = paymentSession?.otpExpiresAt || paymentSession?.qrExpiresAt;
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
  }, [paymentSession?.otpExpiresAt, paymentSession?.qrExpiresAt, paymentSession?.status]);

  // Dọn dẹp polling khi unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Tính countdown (giây)
  const expiresAt = paymentSession?.otpExpiresAt || paymentSession?.qrExpiresAt;
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

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 19);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardForm((prev) => ({ ...prev, number: formatted }));
    if (formErrors.number) setFormErrors((prev) => ({ ...prev, number: null }));
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + " / " + raw.slice(2);
    }
    setCardForm((prev) => ({ ...prev, expiry: raw }));
    if (formErrors.expiry) setFormErrors((prev) => ({ ...prev, expiry: null }));
  };

  const handleCardFormChange = (field, val) => {
    setCardForm((prev) => ({ ...prev, [field]: val }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleApplyCardPreset = (type) => {
    if (type === "success") {
      setCardForm({
        number: "4242 4242 4242 4242",
        expiry: "12/28",
        cvc: "123",
        name: "Nguyễn Thị Lan",
      });
    } else {
      setCardForm({
        number: "5555 5555 5555 5555",
        expiry: "09/27",
        cvc: "888",
        name: "Nguyễn Thị Lan",
      });
    }
    setFormErrors({});
  };

  const handleInitiatePayment = useCallback(
    async (e, overrideMethod) => {
      if (e && e.preventDefault) e.preventDefault();
      setApiError("");
      setFormErrors({});

      const methodToUse = overrideMethod || selectedMethod;

      if (methodToUse === "CARD") {
        const val = PaymentValidator.validateCardForm(cardForm);
        if (!val.isValid) {
          setFormErrors(val.errors);
          return;
        }
      } else if (methodToUse === "MOMO") {
        const val = PaymentValidator.validateMomoForm({ momoPhone });
        if (!val.isValid) {
          setFormErrors(val.errors);
          return;
        }
      }

      setSubmitting(true);
      try {
        const session = await paymentService.createPayment({
          purpose: "DEPOSIT",
          reservationId: reservation.id,
          method: methodToUse,
          card: methodToUse === "CARD" ? cardForm : undefined,
          momoPhone: methodToUse === "MOMO" ? momoPhone : undefined,
        });

        setPaymentSession(session);

        if (methodToUse === "CARD" || methodToUse === "VNPAY") {
          startPolling(session.id);
        }
      } catch (err) {
        if (err.code === "PAYMENT_DUPLICATE") {
          setApiError(null);
          if (reservation?.id) {
            try {
              const detail = await paymentService.getReservation(reservation.id);
              if (detail) {
                setReservation((prev) => ({
                  ...prev,
                  status: detail.status,
                  depositStatus: detail.depositStatus || "HELD",
                }));
              }
              const history = await paymentService.listPayments({ reservationId: reservation.id });
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
              // fallback
            }
          }
          setApiError("Khoản cọc này đã được thanh toán hoặc đang trong phiên xử lý.");
        } else {
          if (
            methodToUse === "VNPAY" &&
            (err.code === "BACKEND_UNAVAILABLE" ||
              !err.status ||
              err.message?.includes("Backend") ||
              err.message?.includes("fetch"))
          ) {
            const mockSession = {
              id: `vnpay-mock-${Date.now()}`,
              reservationId: reservation.id,
              purpose: "DEPOSIT",
              method: "VNPAY",
              status: "PENDING",
              amount: reservation.depositAmount || 103500,
              qrPayload: `00020101021238540010A000000727012400069704220110${Date.now()}5303704540${reservation.depositAmount || 103500}5802VN6304MOCK`,
              qrExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
            };
            setPaymentSession(mockSession);
            return;
          }
          setApiError(err.message || "Giao dịch không thành công. Vui lòng thử lại.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [cardForm, momoPhone, reservation, selectedMethod, startPolling]
  );

  const handleConfirmOtp = async (e) => {
    if (e) e.preventDefault();
    setApiError("");

    const otpValidation = PaymentValidator.validateOtp(otp);
    if (otpValidation) {
      setFormErrors({ otp: otpValidation });
      return;
    }

    setSubmitting(true);
    try {
      const result = await paymentService.confirmPayment(paymentSession.id, { otp });
      setPaymentResult(result);

      if (result.payment?.status === "SUCCEEDED") {
        setPaymentSession((prev) => ({
          ...prev,
          status: "SUCCEEDED",
          receiptCode: result.receipt?.receiptCode || result.payment?.receiptCode,
        }));
        if (result.notification) {
          setNotificationToast(result.notification);
        }
        if (reservationRef.current?.id) {
          loadPaymentHistory(reservationRef.current.id);
        }
      } else {
        setPaymentSession((prev) => ({ ...prev, status: "FAILED" }));
      }
    } catch (err) {
      if (err.code === "PAYMENT_EXPIRED") {
        setPaymentSession((prev) => ({ ...prev, status: "EXPIRED" }));
        setApiError("Phiên thanh toán OTP đã hết hạn (quá 5 phút).");
      } else {
        setApiError(err.message || "Xác thực OTP không thành công.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetOrSwitch = (newMethod) => {
    stopPolling();
    setPaymentSession(null);
    setPaymentResult(null);
    setQrDataUrl("");
    setOtp("");
    setApiError("");
    setFormErrors({});
    if (newMethod) {
      setSelectedMethod(newMethod);
      if (newMethod === "VNPAY") {
        handleInitiatePayment(null, "VNPAY");
      }
    }
  };

  const handleSelectMethod = useCallback(
    (m) => {
      setSelectedMethod(m);
      setFormErrors({});
      setApiError("");
      if (m === "VNPAY") {
        if (
          !paymentSession ||
          paymentSession.method !== "VNPAY" ||
          paymentSession.status !== "PENDING"
        ) {
          handleInitiatePayment(null, "VNPAY");
        }
      }
    },
    [handleInitiatePayment, paymentSession]
  );

  const handleCheckPaymentStatus = async () => {
    if (!paymentSession?.id || countdown === 0) {
      await handleInitiatePayment(null, "VNPAY");
      return;
    }

    setCheckingStatus(true);
    setApiError("");

    try {
      if (String(paymentSession.id).startsWith("vnpay-mock") || !isAuthenticated) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setNotificationToast({
          type: "PAYMENT_PENDING",
          title: "Chưa nhận được thanh toán",
          body: "Hệ thống chưa ghi nhận tiền cọc từ ứng dụng ngân hàng. Vui lòng quét mã QR hoặc bấm 'Giả lập quét thành công' để kiểm thử.",
        });
        return;
      }

      const updated = await paymentService.getPayment(paymentSession.id);
      setPaymentSession(updated);

      if (updated.status === "SUCCEEDED") {
        stopPolling();
        setNotificationToast({
          type: "PAYMENT_CONFIRMED",
          title: "Thanh toán cọc thành công",
          body: `Biên lai ${updated.receiptCode || "RT-2026-..."} đã được cấp. Đơn đặt chỗ đã chuyển sang trạng thái RESERVED.`,
        });
        if (reservationRef.current?.id) {
          loadPaymentHistory(reservationRef.current.id);
        }
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
    } catch {
      setNotificationToast({
        type: "PAYMENT_PENDING",
        title: "Đang kiểm tra...",
        body: "Chưa ghi nhận giao dịch thành công. Vui lòng thử lại sau.",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSimulateVNPaySuccess = () => {
    stopPolling();
    const mockReceipt = `REC-VNPAY-${Date.now().toString().slice(-6)}`;
    setPaymentSession((prev) => ({
      ...(prev || {}),
      status: "SUCCEEDED",
      receiptCode: mockReceipt,
      amount: reservation?.depositAmount || 103500,
      method: "VNPAY",
    }));
    setNotificationToast({
      type: "PAYMENT_CONFIRMED",
      title: "Thanh toán cọc thành công",
      body: `Biên lai ${mockReceipt} đã được cấp. Đơn đặt chỗ đã chuyển sang trạng thái RESERVED.`,
    });
    if (reservationRef.current?.id) {
      loadPaymentHistory(reservationRef.current.id);
    }
  };

  const handleCreateTestReservation = async () => {
    try {
      setLoadingReservation(true);
      setApiError("");
      const today = new Date().toISOString().split("T")[0];
      const candidateUnits = [4, 5, 7, 8, 9, 10, 12, 13, 14, 2];
      let created = null;

      for (const uId of candidateUnits) {
        try {
          created = await paymentService.createReservation({
            unitId: uId,
            startDate: today,
            durationMonths: 3,
          });
          if (created?.id) break;
        } catch {
          // ignore
        }
      }

      if (!created?.id) {
        throw new Error("Không còn kho mẫu nào khả dụng để tạo đơn mới.");
      }

      setReservation({
        id: created.id,
        code: created.code || `BK-${created.id}`,
        status: created.status || "PENDING_PAYMENT",
        depositAmount: created.depositAmount || 103500,
        depositStatus: "UNPAID",
        durationMonths: created.durationMonths || 3,
        startDate: created.startDate || today,
        endDate: created.endDate,
        unit: {
          code: created.unit?.code || "S-4",
          sizeM2: created.unit?.sizeM2 || 5,
          typeName: created.unit?.typeName || "Standard Storage",
          monthlyPrice: Math.round(((created.depositAmount || 103500) * 10) / 3),
          depot: "Tân Bình Gateway",
          building: "Building B · Level 2",
          dimensions: "2.0m × 2.5m × 2.8m",
          volume: "14.0 m³",
        },
      });

      handleResetOrSwitch();
      setPaymentHistory([]);
      setIsModalOpen(true);

      try {
        const listData = await paymentService.listMyReservations({ group: "active" });
        if (listData?.items) setMyReservations(listData.items);
      } catch {
        // ignore
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
        const isPaid =
          detail.status === "RESERVED" ||
          detail.depositStatus === "HELD" ||
          detail.depositStatus === "PAID";

        setReservation({
          id: detail.id,
          code: detail.code || `RSV-${detail.id}`,
          status: detail.status,
          depositAmount: detail.depositAmount || 103500,
          depositStatus: detail.depositStatus || (isPaid ? "HELD" : "UNPAID"),
          durationMonths: detail.durationMonths || 3,
          startDate: detail.startDate || "2026-10-03",
          endDate: detail.endDate || "2027-01-03",
          unit: {
            code: detail.unit?.code || "S-3",
            sizeM2: detail.unit?.sizeM2 || 5,
            typeName: detail.unit?.typeName || "Indoor Climate-Controlled Storage",
            monthlyPrice: Math.round(
              ((detail.depositAmount || 103500) * 10) / (detail.durationMonths || 3)
            ),
            depot: "Tân Bình Gateway",
            building: "Building B · Level 2",
            dimensions: "2.0m (W) × 2.5m (L) × 2.8m (H)",
            volume: "14.0 m³",
          },
        });

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
    myReservations,
    isModalOpen,
    setIsModalOpen,
    selectedMethod,
    cardForm,
    momoPhone,
    setMomoPhone,
    otp,
    setOtp,
    paymentSession,
    paymentResult,
    qrDataUrl,
    countdown,
    formatCountdown,
    submitting,
    polling,
    checkingStatus,
    formErrors,
    setFormErrors,
    apiError,
    notificationToast,
    paymentHistory,
    showHistory,
    setShowHistory,
    copiedCode,
    isAlreadyPaid,
    handleCardNumberChange,
    handleExpiryChange,
    handleCardFormChange,
    handleApplyCardPreset,
    handleInitiatePayment,
    handleConfirmOtp,
    handleResetOrSwitch,
    handleSelectMethod,
    handleCheckPaymentStatus,
    handleSimulateVNPaySuccess,
    handleCreateTestReservation,
    handleSelectReservation,
    handleCopyReceipt,
  };
}
