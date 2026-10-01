import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router";
import QRCode from "qrcode";
import {
  CreditCard,
  Wallet,
  QrCode as QrCodeIcon,
  CheckCircle,
  XCircle,
  Clock,
  ArrowCounterClockwise,
  Lock,
  ShieldCheck,
  WarningCircle,
  CaretRight,
  Copy,
  Check,
  CircleNotch,
  Info,
  SignIn,
  PlusCircle,
  FileText,
} from "@phosphor-icons/react";

import Header from "../../components/Header/Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { paymentService } from "../../services/paymentService.js";
import { PaymentValidator } from "../../validation";

import "./PaymentPage.css";

// Mẫu dữ liệu đặt chỗ mặc định (khớp với Mockup F1-06 & PRD UJ-1)
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
    depot: "Tân Bình Gateway (Near Gate 04)",
    building: "Building B · Level 2",
    dimensions: "2.0m (W) × 2.5m (L) × 2.8m (H)",
    volume: "14.0 m³",
  },
};

export default function PaymentPage() {
  const { reservationId: paramResId, paymentId: paramPayId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();

  // ID lấy từ param hoặc search query
  const queryResId = searchParams.get("reservationId") || searchParams.get("id");
  const queryPayId = searchParams.get("paymentId");
  const targetReservationId = paramResId || queryResId;
  const targetPaymentId = paramPayId || queryPayId;

  // Trạng thái đơn đặt chỗ
  const [reservation, setReservation] = useState(DEFAULT_DEMO_RESERVATION);
  const reservationRef = useRef(reservation);
  useEffect(() => {
    reservationRef.current = reservation;
  }, [reservation]);

  const [loadingReservation, setLoadingReservation] = useState(false);
  const [myReservations, setMyReservations] = useState([]);

  // Trạng thái phương thức thanh toán ("CARD" | "MOMO" | "VNPAY")
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

  // Phiên thanh toán & Kết quả
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  // QR Code Data URL
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Đồng hồ thời gian thực (cho đếm ngược)
  const [now, setNow] = useState(() => Date.now());

  // Loading & Lỗi
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [notificationToast, setNotificationToast] = useState(null);

  // Lịch sử thanh toán của reservation này
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Copy trạng thái
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const pollIntervalRef = useRef(null);

  // Callback tải lịch sử thanh toán
  const loadPaymentHistory = useCallback(async (resId) => {
    try {
      const data = await paymentService.listPayments({ reservationId: resId, pageSize: 10 });
      if (data?.items) {
        setPaymentHistory(data.items);
      }
    } catch {
      // Bỏ qua lỗi phụ
    }
  }, []);

  // Callback dừng polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  }, []);

  // Callback bắt đầu polling
  const startPolling = useCallback((paymentId) => {
    stopPolling();
    setPolling(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const updated = await paymentService.getPayment(paymentId);
        setPaymentSession(updated);

        if (updated.status === "SUCCEEDED" || updated.status === "FAILED" || updated.status === "EXPIRED") {
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
  }, [stopPolling, loadPaymentHistory]);

  // 1. Tải danh sách đơn đặt chỗ & chi tiết
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      if (!isAuthenticated) return;

      try {
        setLoadingReservation(true);
        // Tải danh sách active reservations
        const listData = await paymentService.listMyReservations({ group: "active" });
        if (isMounted && listData?.items) {
          setMyReservations(listData.items);
        }

        // Ưu tiên đơn đang chờ thanh toán (PENDING_PAYMENT), nếu không thì lấy đơn đầu tiên
        const pendingItem = listData?.items?.find((r) => r.status === "PENDING_PAYMENT");
        const resIdToFetch = targetReservationId || pendingItem?.id || listData?.items?.[0]?.id;
        if (resIdToFetch) {
          try {
            const detail = await paymentService.getReservation(resIdToFetch);
            if (isMounted && detail) {
              const isPaid = detail.status === "RESERVED" || detail.depositStatus === "HELD" || detail.depositStatus === "PAID";
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
                  monthlyPrice: Math.round((detail.depositAmount || 103500) * 10 / (detail.durationMonths || 3)),
                  depot: "Tân Bình Gateway",
                  building: "Building B · Level 2",
                  dimensions: "2.0m (W) × 2.5m (L) × 2.8m (H)",
                  volume: "14.0 m³",
                },
              });

              // Tải lịch sử thanh toán
              loadPaymentHistory(resIdToFetch);

              // Nếu đơn đã thanh toán cọc trong DB, nạp phiên thành công để hiển thị Receipt RT-...
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
                  // Ignore history fetch errors
                }
              }
            }
          } catch {
            // Giữ demo fallback nếu reservation cụ thể không tồn tại
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
  }, [isAuthenticated, targetReservationId, loadPaymentHistory]);

  // 2. Nếu có targetPaymentId truyền trực tiếp qua URL, tải phiên thanh toán đó
  useEffect(() => {
    if (targetPaymentId && isAuthenticated) {
      paymentService.getPayment(targetPaymentId)
        .then((session) => {
          setPaymentSession(session);
          if (session.status === "PROCESSING" || (session.status === "PENDING" && session.method === "VNPAY")) {
            startPolling(session.id);
          }
        })
        .catch((err) => {
          setApiError(err.message || "Không thể tải phiên thanh toán.");
        });
    }
  }, [targetPaymentId, isAuthenticated, startPolling]);

  // 3. Xử lý Sinh mã QR khi có qrPayload
  useEffect(() => {
    let active = true;
    if (paymentSession?.qrPayload) {
      QRCode.toDataURL(paymentSession.qrPayload, {
        width: 200,
        margin: 1,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
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

  // 4. Tick mỗi giây khi cần đếm ngược
  useEffect(() => {
    const expiresAt = paymentSession?.otpExpiresAt || paymentSession?.qrExpiresAt;
    if (!expiresAt || paymentSession?.status === "SUCCEEDED" || paymentSession?.status === "FAILED") {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSession?.otpExpiresAt, paymentSession?.qrExpiresAt, paymentSession?.status]);

  // Cleanup polling khi unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Tính countdown dựa trên now và expiration date
  const expiresAt = paymentSession?.otpExpiresAt || paymentSession?.qrExpiresAt;
  const countdown =
    expiresAt && paymentSession?.status === "PENDING"
      ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
      : null;

  // Định dạng thời gian đếm ngược MM:SS
  const formatCountdown = (seconds) => {
    if (seconds == null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Định dạng tiền tệ VND
  const formatVND = (val) => {
    if (!val && val !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
  };

  // Format số thẻ cách 4 số
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 19);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardForm((prev) => ({ ...prev, number: formatted }));
    if (formErrors.number) setFormErrors((prev) => ({ ...prev, number: null }));
  };

  // Format ngày hết hạn MM/YY
  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + " / " + raw.slice(2);
    }
    setCardForm((prev) => ({ ...prev, expiry: raw }));
    if (formErrors.expiry) setFormErrors((prev) => ({ ...prev, expiry: null }));
  };

  // Quick preset điền thẻ
  const applyCardPreset = (type) => {
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

  // 6. Xử lý Tạo thanh toán (POST /api/v1/payments)
  const handleInitiatePayment = async (e) => {
    if (e) e.preventDefault();
    setApiError("");
    setFormErrors({});

    // Validate form theo phương thức
    if (selectedMethod === "CARD") {
      const val = PaymentValidator.validateCardForm({
        number: cardForm.number,
        expiry: cardForm.expiry,
        cvc: cardForm.cvc,
      });
      if (!val.isValid) {
        setFormErrors(val.errors);
        return;
      }
    } else if (selectedMethod === "MOMO") {
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
        method: selectedMethod,
        card: selectedMethod === "CARD" ? cardForm : undefined,
        momoPhone: selectedMethod === "MOMO" ? momoPhone : undefined,
      });

      setPaymentSession(session);

      // Xử lý luồng theo method
      if (selectedMethod === "CARD") {
        // CARD ban đầu trả về PROCESSING, FE poll auto-complete ~2s
        startPolling(session.id);
      } else if (selectedMethod === "VNPAY") {
        // VNPAY ban đầu trả PENDING + QR, FE poll auto-complete ~2s
        startPolling(session.id);
      } else if (selectedMethod === "MOMO") {
        // MOMO trả về PENDING + otpRequired: true, chờ người dùng nhập OTP
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
                title: "Khoản cọc đã được thanh toán thành công",
                body: `Đơn đặt chỗ ${reservation.code} đã có biên lai thanh toán cọc ${successPayment.receiptCode}.`,
              });
              return;
            }
          } catch {
            // fallback bên dưới
          }
        }
        setApiError("Khoản cọc này đã được thanh toán hoặc đang trong phiên xử lý.");
      } else if (err.code === "PAYMENT_INVALID_STATE") {
        setApiError("Đơn đặt chỗ này không ở trạng thái chờ thanh toán.");
      } else {
        setApiError(err.message || "Giao dịch không thành công. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Xử lý Xác nhận OTP MoMo (POST /api/v1/payments/{paymentId}/confirm)
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
        setPaymentSession((prev) => ({
          ...prev,
          status: "FAILED",
        }));
      }
    } catch (err) {
      if (err.code === "PAYMENT_EXPIRED") {
        setPaymentSession((prev) => ({ ...prev, status: "EXPIRED" }));
        setApiError("Phiên thanh toán OTP đã hết hạn (quá 5 phút). Vui lòng thử lại.");
      } else {
        setApiError(err.message || "Xác thực OTP không thành công.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Đặt lại / Thử lại / Đổi phương thức
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
    }
  };

  // 9. Tạo đơn đặt chỗ mới để test trực tiếp
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
          // Thử tiếp unit khác nếu unit này đã có người đặt
        }
      }

      if (!created || !created.id) {
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
          monthlyPrice: Math.round((created.depositAmount || 103500) * 10 / 3),
          depot: "Tân Bình Gateway",
          building: "Building B · Level 2",
          dimensions: "2.0m × 2.5m × 2.8m",
          volume: "14.0 m³",
        },
      });

      handleResetOrSwitch();
      setPaymentHistory([]);
      try {
        const listData = await paymentService.listMyReservations({ group: "active" });
        if (listData?.items) setMyReservations(listData.items);
      } catch {
        // ignore
      }

      setNotificationToast({
        type: "NEW_RESERVATION",
        title: "Đơn đặt chỗ mới đã sẵn sàng",
        body: `Đã khởi tạo đơn ${created.code || `BK-${created.id}`} (${created.unit?.code || "Unit"}). Bạn có thể tiến hành thanh toán cọc.`,
      });
    } catch (err) {
      setApiError(err.message || "Không thể tạo đơn đặt chỗ thử nghiệm.");
    } finally {
      setLoadingReservation(false);
    }
  };

  // Đổi reservation từ danh sách
  const handleSelectReservation = async (resId) => {
    try {
      setLoadingReservation(true);
      setApiError("");
      const detail = await paymentService.getReservation(resId);
      if (detail) {
        const isPaid = detail.status === "RESERVED" || detail.depositStatus === "HELD" || detail.depositStatus === "PAID";
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
            monthlyPrice: Math.round((detail.depositAmount || 103500) * 10 / (detail.durationMonths || 3)),
            depot: "Tân Bình Gateway",
            building: "Building B · Level 2",
            dimensions: "2.0m (W) × 2.5m (L) × 2.8m (H)",
            volume: "14.0 m³",
          },
        });
        handleResetOrSwitch();
        loadPaymentHistory(resId);

        if (isPaid) {
          try {
            const history = await paymentService.listPayments({ reservationId: resId });
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
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      setApiError(err.message || "Không thể tải chi tiết đặt chỗ.");
    } finally {
      setLoadingReservation(false);
    }
  };

  // Đăng nhập nhanh Demo
  const handleQuickDemoLogin = async () => {
    try {
      await login("lan@demo.storagehub.vn", "password");
      window.location.reload();
    } catch {
      setApiError("Không thể đăng nhập tài khoản demo. Vui lòng kiểm tra backend.");
    }
  };

  // Copy receipt code
  const handleCopyReceipt = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy QR payload
  const handleCopyPayload = (payload) => {
    if (!payload) return;
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const currentStatus = countdown === 0 && paymentSession?.status === "PENDING" ? "EXPIRED" : paymentSession?.status;
  const isAlreadyPaid =
    reservation?.depositStatus === "HELD" ||
    reservation?.depositStatus === "PAID" ||
    reservation?.status === "RESERVED";
  const isTerminalSuccess = currentStatus === "SUCCEEDED" || isAlreadyPaid;
  const isTerminalFailed = currentStatus === "FAILED";
  const isTerminalExpired = currentStatus === "EXPIRED";
  const isProcessing = currentStatus === "PROCESSING" || polling;
  const isMoMoOtpStage = selectedMethod === "MOMO" && paymentSession?.otpRequired && currentStatus === "PENDING";
  const isVNPayQrStage = selectedMethod === "VNPAY" && paymentSession?.qrPayload && currentStatus === "PENDING";

  return (
    <div className="payment-page">
      {/* 1. Global Header đồng bộ giao diện */}
      <Header
        brandName="STORAGEHUB"
        brandHref="/"
        roleLabel={user?.role || "CUSTOMER"}
        avatarText={
          user?.fullName
            ? user.fullName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(-2)
                .toUpperCase()
            : "LN"
        }
        navLinks={[
          { label: "Browse Units", href: "/browse" },
          { label: "My Rentals", href: "/rentals" },
          { label: "Payment", href: "/payment", active: true },
        ]}
      />

      {/* 2. Subbar & Breadcrumb */}
      <div className="payment-page__subbar">
        <div className="shell payment-page__breadcrumb-wrap">
          <nav className="payment-breadcrumb" aria-label="Breadcrumb">
            <Link to="/browse">Depot Directory</Link>
            <CaretRight size={13} weight="bold" />
            <Link to="/rentals">My Rentals</Link>
            <CaretRight size={13} weight="bold" />
            <span className="payment-breadcrumb__current">
              {reservation?.code || "Unit Booking"} — Thanh toán cọc
            </span>
          </nav>

          <div className="payment-step-indicator">
            <ShieldCheck size={14} weight="bold" />
            <span>Bước 3 / 3: Xác nhận & Thanh toán</span>
          </div>
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <main className="shell payment-page__content">
        {/* Banner cảnh báo chưa đăng nhập */}
        {!isAuthenticated && (
          <div className="auth-preview-alert">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={20} weight="bold" />
              <span>
                Bạn đang ở chế độ xem trước (Chưa đăng nhập). Bạn có thể đăng nhập nhanh bằng tài khoản thử nghiệm để gọi trực tiếp các API Backend.
              </span>
            </div>
            <button type="button" onClick={handleQuickDemoLogin}>
              <SignIn size={14} style={{ marginRight: "4px" }} />
              Đăng nhập Demo (Lan Nguyen)
            </button>
          </div>
        )}

        <div className="payment-layout">
          {/* CỘT TRÁI: FORM THANH TOÁN HOẶC TRẠNG THÁI TERMINAL */}
          <section className="payment-main-col">
            <div
              className={`payment-panel ${
                isTerminalSuccess
                  ? "payment-panel--success"
                  : isTerminalFailed
                  ? "payment-panel--error"
                  : isTerminalExpired
                  ? "payment-panel--warning"
                  : ""
              }`}
            >
              {/* Header của Payment Panel */}
              <div className="payment-panel__header">
                <div className="payment-panel__tag-row">
                  <span>Checkout Authorization</span>
                  <span className="bullet">·</span>
                  <span className="payment-panel__ref">{reservation.code}</span>
                  {reservation.status === "PENDING_PAYMENT" && (
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#b45309",
                        background: "#fef3c7",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                      }}
                    >
                      Chờ thanh toán cọc
                    </span>
                  )}
                </div>

                <h1 className="payment-panel__title">
                  {isTerminalSuccess
                    ? `Thanh toán cọc thành công — ${formatVND(paymentSession?.amount || reservation.depositAmount)}`
                    : isTerminalFailed
                    ? "Giao dịch không thành công"
                    : isTerminalExpired
                    ? "Phiên thanh toán đã hết hạn"
                    : isProcessing
                    ? "Đang xử lý giao dịch..."
                    : `Thanh toán tiền cọc — ${formatVND(reservation.depositAmount)}`}
                </h1>

                <p className="payment-panel__subtitle">
                  {isTerminalSuccess
                    ? `Đã nhận tiền cọc cho kho ${reservation.unit.code} tại Tân Bình Gateway.`
                    : isTerminalFailed
                    ? "Chưa có khoản tiền nào bị trừ khỏi tài khoản của bạn (No money was taken)."
                    : isTerminalExpired
                    ? "Thời gian hiệu lực của mã QR / OTP đã hết hạn bảo mật (5 phút)."
                    : `Giữ kho ${reservation.unit.code} (${reservation.unit.typeName}) tại Tân Bình Gateway · REF: ${reservation.code}`}
                </p>
              </div>

              {/* Body của Payment Panel */}
              <div className="payment-panel__body">
                {/* Thông báo lỗi từ server */}
                {apiError && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      color: "#dc2626",
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "18px",
                    }}
                  >
                    <WarningCircle size={18} weight="bold" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* Toast Notification từ server nếu có */}
                {notificationToast && (
                  <div className="notification-banner" style={{ marginBottom: "18px" }}>
                    <CheckCircle size={20} weight="fill" />
                    <div>
                      <h5 className="notification-banner__title">{notificationToast.title}</h5>
                      <p className="notification-banner__body">{notificationToast.body}</p>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TRẠNG THÁI 1: THÀNH CÔNG (SUCCEEDED)                           */}
                {/* ============================================================== */}
                {isTerminalSuccess ? (
                  <div className="terminal-view">
                    <div className="terminal-header">
                      <div className="status-icon-badge status-icon-badge--success">
                        <CheckCircle size={24} weight="fill" />
                      </div>
                      <span className="status-pill status-pill--success">
                        <span className="status-pill__dot" />
                        Deposit Confirmed
                      </span>
                    </div>

                    <div className="terminal-content">
                      <h3>{formatVND(paymentSession?.amount || reservation.depositAmount)}</h3>
                      <p>
                        Khoản đặt cọc giữ chỗ đã được ghi nhận. Kho <strong>{reservation.unit.code}</strong> được giữ cho bạn đến ngày nhận kho <strong>{reservation.startDate}</strong>. Mã PIN cửa ra vào (Access Code) sẽ kích hoạt vào lúc 08:00 AM ngày nhận kho.
                      </p>
                    </div>

                    {/* Khối hiển thị Biên lai (Receipt code) */}
                    {(() => {
                      const finalReceiptCode =
                        paymentSession?.receiptCode ||
                        paymentResult?.receipt?.receiptCode ||
                        paymentHistory?.find((p) => p.status === "SUCCEEDED")?.receiptCode ||
                        "RT-2026-0001";
                      return (
                        <div className="receipt-highlight-card">
                          <div className="receipt-meta">
                            <span className="receipt-meta__label">Mã biên lai giao dịch</span>
                            <span className="receipt-meta__code">{finalReceiptCode}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-copy"
                            onClick={() => handleCopyReceipt(finalReceiptCode)}
                          >
                            {copiedCode ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                            <span>{copiedCode ? "Đã chép" : "Sao chép mã"}</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Nút hành động */}
                    <div className="payment-actions" style={{ flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                        <button
                          type="button"
                          className="btn-pay-primary"
                          onClick={() => navigate(`/rentals/${reservation.id}`)}
                          style={{ flex: 1 }}
                        >
                          <FileText size={18} />
                          <span>Xem chi tiết thuê kho</span>
                        </button>
                        <button
                          type="button"
                          className="btn-pay-secondary"
                          onClick={() => navigate("/rentals")}
                          style={{ flex: 1 }}
                        >
                          <PlusCircle size={18} />
                          <span>Danh sách đơn thuê</span>
                        </button>
                      </div>

                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={handleCreateTestReservation}
                          disabled={loadingReservation}
                          style={{
                            background: "#f0fdf4",
                            border: "1px dashed #22c55e",
                            color: "#15803d",
                            borderRadius: "6px",
                            padding: "10px 14px",
                            fontWeight: 600,
                            fontSize: "0.84rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            width: "100%",
                          }}
                        >
                          <CreditCard size={18} />
                          <span>Tạo đơn đặt cọc mới để thử phương thức khác (MoMo / VNPay QR / Thẻ)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : isTerminalFailed ? (
                  /* ============================================================== */
                  /* TRẠNG THÁI 2: THẤT BẠI (FAILED)                                */
                  /* ============================================================== */
                  <div className="terminal-view">
                    <div className="terminal-header">
                      <div className="status-icon-badge status-icon-badge--error">
                        <XCircle size={24} weight="fill" />
                      </div>
                      <span className="status-pill status-pill--error">
                        <span className="status-pill__dot" />
                        Payment Declined
                      </span>
                    </div>

                    <div className="terminal-content">
                      <h3>Giao dịch bị từ chối</h3>
                      <p>
                        Giao dịch không thành công. <strong>Không có khoản tiền nào bị trừ khỏi tài khoản của bạn</strong>. Ngân hàng phát hành hoặc ví điện tử đã từ chối giao dịch (ERR_CARD_DECLINED hoặc OTP không hợp lệ).
                      </p>
                    </div>

                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                        color: "#991b1b",
                      }}
                    >
                      <span style={{ fontWeight: 700, textTransform: "uppercase" }}>Mã phản hồi từ Gateway</span>
                      <code style={{ fontFamily: "monospace", fontWeight: 700 }}>DECLINE_CODE_51</code>
                    </div>

                    <div className="payment-actions" style={{ flexDirection: "row", marginTop: "12px" }}>
                      <button
                        type="button"
                        className="btn-pay-primary"
                        style={{ background: "#dc2626" }}
                        onClick={() => handleResetOrSwitch(selectedMethod)}
                      >
                        <ArrowCounterClockwise size={18} />
                        <span>Thử lại thanh toán</span>
                      </button>
                      <button
                        type="button"
                        className="btn-pay-secondary"
                        onClick={() => handleResetOrSwitch(selectedMethod === "CARD" ? "MOMO" : "CARD")}
                      >
                        <span>Đổi phương thức khác</span>
                      </button>
                    </div>
                  </div>
                ) : isTerminalExpired ? (
                  /* ============================================================== */
                  /* TRẠNG THÁI 3: HẾT HẠN (EXPIRED)                                */
                  /* ============================================================== */
                  <div className="terminal-view">
                    <div className="terminal-header">
                      <div className="status-icon-badge status-icon-badge--warning">
                        <Clock size={24} weight="fill" />
                      </div>
                      <span className="status-pill status-pill--warning">
                        <span className="status-pill__dot" />
                        Session Expired
                      </span>
                    </div>

                    <div className="terminal-content">
                      <h3>Phiên thanh toán đã hết hạn</h3>
                      <p>
                        Mã QR hoặc mã xác nhận OTP đã quá thời gian hiệu lực bảo mật (5 phút). Vui lòng chọn lại phương thức thanh toán để khởi tạo phiên giao dịch mới.
                      </p>
                    </div>

                    <div className="payment-actions" style={{ marginTop: "12px" }}>
                      <button
                        type="button"
                        className="btn-pay-primary"
                        onClick={() => handleResetOrSwitch(selectedMethod)}
                      >
                        <ArrowCounterClockwise size={18} />
                        <span>Tạo phiên thanh toán mới</span>
                      </button>
                    </div>
                  </div>
                ) : isProcessing ? (
                  /* ============================================================== */
                  /* TRẠNG THÁI 4: ĐANG XỬ LÝ / POLLING                              */
                  /* ============================================================== */
                  <div className="payment-processing-box">
                    <CircleNotch size={48} className="spinner-icon" />
                    <h3 className="payment-processing__title">Đang xác thực giao dịch...</h3>
                    <p className="payment-processing__desc">
                      Hệ thống đang kết nối an toàn với cổng thanh toán và ngân hàng. Kết quả sẽ được cập nhật tự động trong giây lát. Vui lòng không đóng hoặc tải lại trang.
                    </p>
                    <div className="processing-pulse-bar" />
                  </div>
                ) : isMoMoOtpStage ? (
                  /* ============================================================== */
                  /* BƯỚC 2 MOMO: NHẬP OTP XÁC NHẬN                                 */
                  /* ============================================================== */
                  <form onSubmit={handleConfirmOtp} className="momo-otp-box">
                    <div className="otp-info-banner">
                      <Wallet size={20} weight="fill" />
                      <div>
                        <strong>Xác thực tài khoản MoMo</strong>
                        <p style={{ margin: "2px 0 0" }}>
                          Mã xác thực 6 số đã được gửi tới số điện thoại <strong>{momoPhone}</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="otp-input-wrap">
                      <label className="form-label" htmlFor="momo-otp">
                        Nhập mã OTP 6 chữ số
                      </label>
                      <input
                        id="momo-otp"
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          if (formErrors.otp) setFormErrors({});
                        }}
                        className={`otp-input ${formErrors.otp ? "has-error" : ""}`}
                        placeholder="••••••"
                        autoFocus
                      />
                      {formErrors.otp && <span className="field-error-text">{formErrors.otp}</span>}

                      {countdown !== null && (
                        <div className="countdown-timer-chip">
                          <Clock size={14} />
                          <span>Hiệu lực còn: {formatCountdown(countdown)}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick test chip */}
                    <div className="test-presets-box">
                      <span className="test-presets-box__header">Kiểm thử Mock Gateway:</span>
                      <div className="test-preset-chips">
                        <button
                          type="button"
                          className="test-chip test-chip--success"
                          onClick={() => setOtp("123456")}
                        >
                          Điền OTP hợp lệ (123456)
                        </button>
                        <button
                          type="button"
                          className="test-chip test-chip--fail"
                          onClick={() => setOtp("999999")}
                        >
                          Điền OTP sai (999999)
                        </button>
                      </div>
                    </div>

                    <div className="payment-actions">
                      <button
                        type="submit"
                        className="btn-pay-primary"
                        disabled={submitting || otp.length !== 6}
                      >
                        {submitting ? (
                          <>
                            <CircleNotch size={18} className="spinner-icon" />
                            <span>Đang xác nhận...</span>
                          </>
                        ) : (
                          <>
                            <Lock size={18} />
                            <span>Xác nhận thanh toán</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-pay-secondary"
                        onClick={() => handleResetOrSwitch()}
                        disabled={submitting}
                      >
                        Hủy và chọn lại phương thức
                      </button>
                    </div>
                  </form>
                ) : isVNPayQrStage ? (
                  /* ============================================================== */
                  /* BƯỚC 2 VNPAY: HIỂN THỊ MÃ QR + COUNTDOWN                        */
                  /* ============================================================== */
                  <div className="vnpay-qr-box">
                    <div className="qr-frame">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="VNPay QR Code" />
                      ) : (
                        <div
                          style={{
                            width: "200px",
                            height: "200px",
                            display: "grid",
                            placeItems: "center",
                            background: "#f1f5f9",
                          }}
                        >
                          <CircleNotch size={32} className="spinner-icon" />
                        </div>
                      )}
                      <div className="qr-brand-badge">
                        <QrCodeIcon size={16} />
                        <span>VNPAY-QR MOCK PAY</span>
                      </div>
                    </div>

                    {countdown !== null && (
                      <div className="countdown-timer-chip">
                        <Clock size={14} />
                        <span>Mã QR hết hạn sau: {formatCountdown(countdown)}</span>
                      </div>
                    )}

                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", maxWidth: "360px" }}>
                      Mở ứng dụng ngân hàng hoặc ví VNPAY, chọn Quét QR để thanh toán <strong>{formatVND(paymentSession.amount)}</strong>.
                    </p>

                    {/* QR Payload Debug Box */}
                    <div className="qr-payload-card">
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {paymentSession.qrPayload}
                      </span>
                      <button
                        type="button"
                        className="btn-copy"
                        onClick={() => handleCopyPayload(paymentSession.qrPayload)}
                      >
                        {copiedPayload ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        <span>{copiedPayload ? "Đã chép" : "Chép"}</span>
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.78rem",
                        color: "#0284c7",
                      }}
                    >
                      <CircleNotch size={16} className="spinner-icon" style={{ color: "#0284c7" }} />
                      <span>Hệ thống đang tự động nhận diện thanh toán (khoảng 2s)...</span>
                    </div>

                    <button
                      type="button"
                      className="btn-pay-secondary"
                      style={{ maxWidth: "260px", marginTop: "8px" }}
                      onClick={() => handleResetOrSwitch()}
                    >
                      Hủy và chọn phương thức khác
                    </button>
                  </div>
                ) : (
                  /* ============================================================== */
                  /* BƯỚC 1: CHỌN PHƯƠNG THỨC & NHẬP THÔNG TIN                      */
                  /* ============================================================== */
                  <>
                    {/* Segmented Tabs (3 phương thức) */}
                    <div className="method-tabs" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={selectedMethod === "CARD"}
                        className={`method-tab ${selectedMethod === "CARD" ? "is-active" : ""}`}
                        onClick={() => {
                          setSelectedMethod("CARD");
                          setFormErrors({});
                          setApiError("");
                        }}
                      >
                        <CreditCard size={18} weight={selectedMethod === "CARD" ? "bold" : "regular"} />
                        <span>Thẻ (Card)</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={selectedMethod === "MOMO"}
                        className={`method-tab ${selectedMethod === "MOMO" ? "is-active" : ""}`}
                        onClick={() => {
                          setSelectedMethod("MOMO");
                          setFormErrors({});
                          setApiError("");
                        }}
                      >
                        <Wallet size={18} weight={selectedMethod === "MOMO" ? "bold" : "regular"} />
                        <span>Ví MoMo</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={selectedMethod === "VNPAY"}
                        className={`method-tab ${selectedMethod === "VNPAY" ? "is-active" : ""}`}
                        onClick={() => {
                          setSelectedMethod("VNPAY");
                          setFormErrors({});
                          setApiError("");
                        }}
                      >
                        <QrCodeIcon size={18} weight={selectedMethod === "VNPAY" ? "bold" : "regular"} />
                        <span>VNPay QR</span>
                      </button>
                    </div>

                    {/* Form CARD */}
                    {selectedMethod === "CARD" && (
                      <form onSubmit={handleInitiatePayment} className="payment-form">
                        <div className="form-group">
                          <div className="form-label-row">
                            <label className="form-label" htmlFor="card-number">
                              Số thẻ thanh toán
                            </label>
                            <div className="card-logos">
                              <span className="card-logo-badge">VISA</span>
                              <span className="card-logo-badge">MC</span>
                            </div>
                          </div>
                          <div className="input-with-icon">
                            <CreditCard className="input-icon" />
                            <input
                              id="card-number"
                              type="text"
                              value={cardForm.number}
                              onChange={handleCardNumberChange}
                              placeholder="4242 4242 4242 4242"
                              className={`payment-input payment-input--mono ${
                                formErrors.number ? "has-error" : ""
                              }`}
                            />
                          </div>
                          {formErrors.number && (
                            <span className="field-error-text">{formErrors.number}</span>
                          )}
                        </div>

                        <div className="form-grid-2">
                          <div className="form-group">
                            <label className="form-label" htmlFor="card-expiry">
                              Hết hạn (MM / YY)
                            </label>
                            <input
                              id="card-expiry"
                              type="text"
                              value={cardForm.expiry}
                              onChange={handleExpiryChange}
                              placeholder="MM / YY"
                              className={`payment-input payment-input--mono ${
                                formErrors.expiry ? "has-error" : ""
                              }`}
                            />
                            {formErrors.expiry && (
                              <span className="field-error-text">{formErrors.expiry}</span>
                            )}
                          </div>

                          <div className="form-group">
                            <div className="form-label-row">
                              <label className="form-label" htmlFor="card-cvc">
                                CVC / CVV
                              </label>
                              <span
                                title="3 chữ số bảo mật ở mặt sau thẻ"
                                style={{ fontSize: "0.68rem", color: "#94a3b8", cursor: "help" }}
                              >
                                3 số mặt sau
                              </span>
                            </div>
                            <input
                              id="card-cvc"
                              type="password"
                              maxLength={4}
                              value={cardForm.cvc}
                              onChange={(e) => {
                                setCardForm((prev) => ({
                                  ...prev,
                                  cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                                }));
                                if (formErrors.cvc) setFormErrors((prev) => ({ ...prev, cvc: null }));
                              }}
                              placeholder="•••"
                              className={`payment-input payment-input--mono ${
                                formErrors.cvc ? "has-error" : ""
                              }`}
                            />
                            {formErrors.cvc && (
                              <span className="field-error-text">{formErrors.cvc}</span>
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="card-name">
                            Tên chủ thẻ
                          </label>
                          <input
                            id="card-name"
                            type="text"
                            value={cardForm.name}
                            onChange={(e) =>
                              setCardForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="NGUYEN THI LAN"
                            className="payment-input"
                          />
                        </div>

                        {/* Test Presets for Mock Gateway */}
                        <div className="test-presets-box">
                          <span className="test-presets-box__header">Kiểm thử Mock Gateway:</span>
                          <div className="test-preset-chips">
                            <button
                              type="button"
                              className="test-chip test-chip--success"
                              onClick={() => applyCardPreset("success")}
                            >
                              Thẻ test thành công (4242 4242 4242 4242)
                            </button>
                            <button
                              type="button"
                              className="test-chip test-chip--fail"
                              onClick={() => applyCardPreset("fail")}
                            >
                              Thẻ test từ chối (5555 5555 5555 5555)
                            </button>
                          </div>
                        </div>

                        <div className="security-notice">
                          <ShieldCheck size={16} />
                          <span>Mã hóa TLS 256-bit · Bảo mật chuẩn PCI-DSS · Cấp PIN tức thì</span>
                        </div>

                        <div className="payment-actions">
                          <button
                            type="submit"
                            className="btn-pay-primary"
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <CircleNotch size={18} className="spinner-icon" />
                                <span>Đang khởi tạo...</span>
                              </>
                            ) : (
                              <>
                                <Lock size={18} />
                                <span>Thanh toán {formatVND(reservation.depositAmount)}</span>
                              </>
                            )}
                          </button>
                          <div className="simulation-note">
                            Cổng thanh toán thử nghiệm (Mock Gateway) — Không trừ tiền thật.
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Form MOMO */}
                    {selectedMethod === "MOMO" && (
                      <form onSubmit={handleInitiatePayment} className="payment-form">
                        <div className="form-group">
                          <label className="form-label" htmlFor="momo-phone">
                            Số điện thoại ví MoMo
                          </label>
                          <div className="input-with-icon">
                            <Wallet className="input-icon" />
                            <input
                              id="momo-phone"
                              type="tel"
                              value={momoPhone}
                              onChange={(e) => {
                                setMomoPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
                                if (formErrors.momoPhone) setFormErrors({});
                              }}
                              placeholder="0901234567"
                              className={`payment-input payment-input--mono ${
                                formErrors.momoPhone ? "has-error" : ""
                              }`}
                            />
                          </div>
                          {formErrors.momoPhone && (
                            <span className="field-error-text">{formErrors.momoPhone}</span>
                          )}
                        </div>

                        <div
                          style={{
                            background: "#fdf2f8",
                            border: "1px solid #fbcfe8",
                            borderRadius: "6px",
                            padding: "12px 14px",
                            fontSize: "0.82rem",
                            color: "#9d174d",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          <Info size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                          <span>
                            Sau khi bấm tiếp tục, hệ thống sẽ gửi mã OTP 6 chữ số đến số MoMo này để bạn xác nhận giao dịch.
                          </span>
                        </div>

                        <div className="payment-actions">
                          <button
                            type="submit"
                            className="btn-pay-primary"
                            style={{ background: "#a21caf" }}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <CircleNotch size={18} className="spinner-icon" />
                                <span>Đang khởi tạo...</span>
                              </>
                            ) : (
                              <>
                                <Lock size={18} />
                                <span>Tiếp tục với MoMo ({formatVND(reservation.depositAmount)})</span>
                              </>
                            )}
                          </button>
                          <div className="simulation-note">
                            Cổng thanh toán thử nghiệm (Mock Gateway) — Không trừ tiền thật.
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Form VNPAY */}
                    {selectedMethod === "VNPAY" && (
                      <form onSubmit={handleInitiatePayment} className="payment-form">
                        <div
                          style={{
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            borderRadius: "6px",
                            padding: "16px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "9999px",
                              background: "#e0f2fe",
                              display: "grid",
                              placeItems: "center",
                              color: "#0284c7",
                            }}
                          >
                            <QrCodeIcon size={28} />
                          </div>
                          <h4 style={{ margin: 0, color: "#0369a1", fontSize: "0.95rem" }}>
                            Thanh toán nhanh qua mã VNPay-QR
                          </h4>
                          <p style={{ margin: 0, fontSize: "0.82rem", color: "#0284c7", maxWidth: "340px" }}>
                            Bấm nút bên dưới để tạo mã QR. Bạn có thể dùng bất kỳ ứng dụng ngân hàng nào (Vietcombank, MB, BIDV, Techcombank...) để quét mã.
                          </p>
                        </div>

                        <div className="payment-actions">
                          <button
                            type="submit"
                            className="btn-pay-primary"
                            style={{ background: "#0284c7" }}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <CircleNotch size={18} className="spinner-icon" />
                                <span>Đang tạo mã QR...</span>
                              </>
                            ) : (
                              <>
                                <QrCodeIcon size={18} />
                                <span>Tạo mã QR thanh toán {formatVND(reservation.depositAmount)}</span>
                              </>
                            )}
                          </button>
                          <div className="simulation-note">
                            Mock Gateway sẽ tự động xác nhận thanh toán sau ~2 giây khi render QR.
                          </div>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* CỘT PHẢI: THÔNG TIN THANH TOÁN (FINANCIAL LEDGER) */}
          <aside className="order-summary-panel">
            {/* Financial Ledger Card — Thông tin thanh toán */}
            <div className="financial-ledger-card">
              <div className="ledger-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Bảng kê thanh toán</h4>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Kho {reservation.unit.code} ({reservation.unit.typeName}) · {reservation.durationMonths} tháng
                  </span>
                </div>
                <span className="unit-code-badge">{reservation.code}</span>
              </div>

              {/* Cho phép chọn nhanh giữa các đơn đặt chỗ nếu có nhiều */}
              {myReservations.length > 1 && (
                <div style={{ margin: "10px 0 6px" }}>
                  <label htmlFor="select-reservation" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b" }}>
                    CHỌN ĐƠN ĐẶT CHỖ:
                  </label>
                  <select
                    id="select-reservation"
                    value={reservation.id}
                    onChange={(e) => handleSelectReservation(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      marginTop: "4px",
                      fontSize: "0.78rem",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    {myReservations.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.code} — Kho {res.unit?.code} ({res.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="ledger-list">
                <div className="ledger-row">
                  <span className="ledger-row__label">
                    Tiền thuê cơ sở ({reservation.durationMonths} tháng)
                  </span>
                  <span className="ledger-row__val">
                    {formatVND(reservation.unit.monthlyPrice * reservation.durationMonths)}
                  </span>
                </div>
                <div className="ledger-row">
                  <span className="ledger-row__label">Phí quản lý & hạ tầng an ninh</span>
                  <span className="ledger-row__val ledger-row__val--free">Đã bao gồm</span>
                </div>
                <div className="ledger-row">
                  <span className="ledger-row__label">Khóa số thông minh & Smart PIN</span>
                  <span className="ledger-row__val ledger-row__val--free">0 ₫</span>
                </div>
                <div className="ledger-row ledger-row--total">
                  <span className="ledger-row__label">Tổng cam kết hợp đồng</span>
                  <span className="ledger-row__val">
                    {formatVND(reservation.unit.monthlyPrice * reservation.durationMonths)}
                  </span>
                </div>
              </div>

              {/* Callout Tiền cọc cần thanh toán */}
              <div
                className="deposit-callout-box"
                style={{
                  background: isAlreadyPaid ? "#f0fdf4" : undefined,
                  border: isAlreadyPaid ? "1px solid #bbf7d0" : undefined,
                }}
              >
                <div className="deposit-callout-box__header">
                  <span
                    className="deposit-callout-box__title"
                    style={{ color: isAlreadyPaid ? "#15803d" : undefined }}
                  >
                    {isAlreadyPaid ? "Tiền cọc đã thanh toán (10%)" : "Tiền cọc cần thanh toán ngay (10%)"}
                  </span>
                  <span
                    className="deposit-callout-box__amount"
                    style={{ color: isAlreadyPaid ? "#15803d" : undefined }}
                  >
                    {formatVND(reservation.depositAmount)}
                  </span>
                </div>
                <p className="deposit-callout-box__note" style={{ color: isAlreadyPaid ? "#166534" : undefined }}>
                  {isAlreadyPaid
                    ? "Khoản cọc đã được xác nhận thành công và đang được lưu giữ an toàn đảm bảo nghĩa vụ hợp đồng."
                    : "Khoản cọc được lưu giữ đảm bảo nghĩa vụ hợp đồng, sẽ được hoàn trả khi kiểm tra kết thúc thuê (Move-out Inspection) hoặc cấn trừ vào kỳ thanh toán đầu tiên theo quy định StorageHub."}
                </p>
              </div>
            </div>

            {/* Nút hỗ trợ tạo reservation test */}
            {isAuthenticated && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleCreateTestReservation}
                  disabled={loadingReservation}
                  style={{
                    flex: 1,
                    background: "#ffffff",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "0.75rem",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <PlusCircle size={15} />
                  <span>Tạo đơn đặt chỗ PENDING_PAYMENT mới để test</span>
                </button>
              </div>
            )}

            {/* Khối Lịch sử thanh toán của đơn (FR-9) */}
            {paymentHistory.length > 0 && (
              <div className="payment-history-card">
                <div className="payment-history-card__header">
                  <h5>Lịch sử giao dịch ({paymentHistory.length})</h5>
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {showHistory ? "Thu gọn" : "Xem tất cả"}
                  </button>
                </div>

                <div className="payment-history-list">
                  {(showHistory ? paymentHistory : paymentHistory.slice(0, 2)).map((p) => (
                    <div key={p.id} className="history-item">
                      <div className="history-item__left">
                        <span className="history-item__code">
                          {p.receiptCode || `TXN-${p.id}`} · {p.method}
                        </span>
                        <span className="history-item__date">
                          {p.paidAt ? new Date(p.paidAt).toLocaleString("vi-VN") : "Đang giao dịch"}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontFamily: "monospace" }}>
                          {formatVND(p.amount)}
                        </div>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            color:
                              p.status === "SUCCEEDED"
                                ? "#059669"
                                : p.status === "FAILED"
                                ? "#dc2626"
                                : "#b45309",
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
