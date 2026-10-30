import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { getUnitDetail, getUnitQuote } from "../../../services/unitService.js";
import { getTomorrowDate } from "../../../utils/formatters.js";

export function useUnitDetailView() {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Bộ chọn thời gian thuê (chọn theo ngày, mặc định 30 ngày)
  const [durationDays, setDurationDays] = useState(30);
  const [startDate, setStartDate] = useState(getTomorrowDate());

  // Bảng giá minh bạch tính từ PricingEngine theo Rental Policy v3
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // 1. Tải thông tin chi tiết của kho
  useEffect(() => {
    let isMounted = true;

    getUnitDetail(unitId)
      .then((data) => {
        if (isMounted) {
          setUnit(data);
          if (data.availability?.availableFromDate) {
            setStartDate(data.availability.availableFromDate);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch unit details:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [unitId]);

  // 2. Tính toán bảng giá minh bạch khi thay đổi ngày hoặc số ngày thuê
  useEffect(() => {
    if (!unit?.id) return;
    let active = true;
    setQuoteLoading(true);
    getUnitQuote(unit.id, {
      startDate,
      durationDays,
    })
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch((err) => {
        console.error("Failed to calculate rental price:", err);
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [unit?.id, startDate, durationDays]);

  // Xử lý sao chép liên kết chia sẻ
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Điều hướng sang trang thanh toán / đặt kho
  const handleBookNow = () => {
    const params = new URLSearchParams({
      startDate,
      durationDays: String(durationDays),
      durationMonths: String(Math.max(1, Math.round(durationDays / 30))),
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
  const monthlyRent = unit?.baseMonthlyRent || unit?.monthlyPrice || 345000;
  const dailyRent = quote?.dailyRent || Math.max(1, Math.round(monthlyRent / 30));
  const volumeM3 = unit?.sizeM2 ? (unit.sizeM2 * 2.8).toFixed(1) : "14.0";

  // Dữ liệu bảng giá minh bạch
  const totalRent = quote
    ? quote.totalRent
    : (durationDays % 30 === 0 ? monthlyRent * (durationDays / 30) : dailyRent * durationDays);
  const depositAmount = quote
    ? quote.depositAmount
    : Math.round((totalRent * 10) / 100);
  const dueNow = quote ? quote.dueNow : depositAmount;
  const endDate = quote ? quote.endDate : "";
  const policyVersion = quote?.policyVersion || "v3";
  const durationMonths = Math.max(1, Math.round(durationDays / 30));

  return {
    unitId,
    unit,
    loading,
    copiedLink,
    durationDays,
    setDurationDays,
    durationMonths,
    setDurationMonths: (m) => setDurationDays(Number(m) * 30),
    dailyRent,
    startDate,
    setStartDate,
    quote,
    quoteLoading,
    handleCopyLink,
    handleBookNow,
    rawStatus,
    isSoon,
    availableDate,
    typeLabel,
    facilityLabel,
    monthlyRent,
    volumeM3,
    totalRent,
    depositAmount,
    dueNow,
    endDate,
    policyVersion,
  };
}
