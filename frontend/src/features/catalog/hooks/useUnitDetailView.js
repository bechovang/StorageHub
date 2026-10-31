import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { getUnitDetail, getUnitQuote } from "../../../services/unitService.js";
import { getTomorrowDate } from "../../../utils/formatters.js";

/** Số ngày thuê (inclusive) giữa 2 chuỗi ngày yyyy-MM-dd */
export function diffDaysInclusive(start, end) {
  if (!start || !end) return 0;
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  return Math.floor((b - a) / 86400000) + 1;
}

export function useUnitDetailView() {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unitError, setUnitError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Bộ chọn khoảng thời gian thuê (mô hình thuê theo ngày)
  const [startDate, setStartDate] = useState(getTomorrowDate());
  const [endDate, setEndDate] = useState("");

  // Bảng giá minh bạch tính từ PricingEngine theo Rental Policy
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  // 1. Tải thông tin chi tiết của kho
  useEffect(() => {
    let isMounted = true;

    getUnitDetail(unitId)
      .then((data) => {
        if (isMounted) {
          setUnit(data);
          const from =
            (typeof data.availability === "object"
              ? data.availability?.availableFromDate
              : data.availableFrom) || getTomorrowDate();
          setStartDate(from);
          setEndDate((prev) => prev || from);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch unit details:", err);
        if (isMounted) setUnitError(err.message || "Không thể tải thông tin kho.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [unitId]);

  // 2. Tính toán bảng giá minh bạch khi thay đổi khoảng ngày thuê
  useEffect(() => {
    if (!unit?.id || !startDate || !endDate || endDate < startDate) {
      if (!endDate) setQuote(null);
      return;
    }
    let active = true;
    setQuoteLoading(true);
    setQuoteError("");
    getUnitQuote(unit.id, { startDate, endDate })
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch((err) => {
        console.error("Failed to calculate rental price:", err);
        if (active) {
          setQuote(null);
          setQuoteError(err.message || "Không thể tính bảng giá cho khoảng ngày đã chọn.");
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [unit?.id, startDate, endDate]);

  // Xử lý sao chép liên kết chia sẻ
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Điều hướng sang trang thanh toán / đặt kho
  const handleBookNow = () => {
    if (!endDate || endDate < startDate) return;
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    navigate(`/units/${unitId}/book?${params.toString()}`);
  };

  const rawStatus =
    typeof unit?.availability === "object"
      ? unit?.availability?.status
      : unit?.availability;
  const isSoon =
    rawStatus === "AVAILABLE_SOON" ||
    rawStatus === "soon" ||
    rawStatus === "PREPARING";
  const availableDate =
    typeof unit?.availability === "object"
      ? unit?.availability?.availableFromDate
      : unit?.availableFrom;

  const typeLabel = unit?.typeName || unit?.type || "Tiêu chuẩn";
  const facilityLabel = unit?.facilityName || "Cơ sở Tân Bình (VN-SGN-01)";
  const dailyRent = unit?.baseDailyRent || 0;
  const volumeM3 = unit?.sizeM2 ? (unit.sizeM2 * 2.8).toFixed(1) : null;

  // Số ngày thuê hiển thị (end inclusive)
  const durationDays = quote?.durationDays ?? diffDaysInclusive(startDate, endDate);

  // Dữ liệu bảng giá minh bạch (chỉ tin nguồn từ API quote)
  const totalRent = quote?.totalRent ?? 0;
  const depositAmount = quote?.depositAmount ?? 0;
  const dueNow = quote?.dueNow ?? 0;
  const quoteEndDate = quote?.endDate || endDate;
  const policyVersion = quote?.policyVersion || "";

  return {
    unitId,
    unit,
    loading,
    unitError,
    copiedLink,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    durationDays,
    quote,
    quoteLoading,
    quoteError,
    handleCopyLink,
    handleBookNow,
    rawStatus,
    isSoon,
    availableDate,
    typeLabel,
    facilityLabel,
    dailyRent,
    volumeM3,
    totalRent,
    depositAmount,
    dueNow,
    endDate: quoteEndDate,
    policyVersion,
  };
}
