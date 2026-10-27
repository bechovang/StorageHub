import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import QRCode from "qrcode";
import { getCheckInPass } from "../../../services/rentalService.js";
import { daysUntil } from "../../../utils/formatters.js";

function parsePassError(err, setError, setErrorCode, navigate) {
  setErrorCode(err?.code || null);
  if (err?.status === 409) {
    setError(
      "Check-in Pass chỉ khả dụng khi đặt chỗ đã xác nhận (đã thanh toán cọc)."
    );
  } else if (err?.status === 403) {
    navigate("/403", { replace: true });
  } else if (err?.status === 404) {
    setError("Không tìm thấy đơn thuê này.");
  } else {
    setError(err?.message || "Không thể tải Check-in Pass.");
  }
}

/**
 * useCheckInPass — Custom hook for check-in pass retrieval and QR code generation
 */
export function useCheckInPass(reservationId) {
  const navigate = useNavigate();
  const [pass, setPass] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const load = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const data = await getCheckInPass(reservationId);
      setPass(data);
    } catch (err) {
      parsePassError(err, setError, setErrorCode, navigate);
    } finally {
      setLoading(false);
    }
  }, [reservationId, navigate]);

  useEffect(() => {
    if (!reservationId) return;
    let ignore = false;

    getCheckInPass(reservationId)
      .then((data) => {
        if (!ignore) setPass(data);
      })
      .catch((err) => {
        if (!ignore) parsePassError(err, setError, setErrorCode, navigate);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reservationId, navigate]);

  useEffect(() => {
    if (!pass?.code) return;
    let active = true;
    QRCode.toDataURL(pass.code, {
      width: 180,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate check-in QR code:", err);
      });
    return () => {
      active = false;
    };
  }, [pass?.code]);

  const days = pass ? daysUntil(pass.checkInDeadline) : null;
  const isUrgent = days !== null && days >= 0 && days <= 3;
  const isOverdue = days !== null && days < 0;

  return {
    pass,
    qrDataUrl,
    loading,
    error,
    errorCode,
    reload: load,
    days,
    isUrgent,
    isOverdue,
  };
}
