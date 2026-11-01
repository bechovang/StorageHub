import {
  CalendarCheck,
  ShieldCheck,
  Lock,
  Clock,
} from "@phosphor-icons/react";
import { formatVND, formatDate, getTomorrowDate } from "../../../utils/formatters.js";
import UnitAvailabilityCalendar from "./UnitAvailabilityCalendar.jsx";

export default function UnitPricingCalculator({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  durationDays,
  dailyRent,
  totalRent,
  depositAmount,
  dueNow,
  policyVersion,
  quoteLoading,
  quoteError,
  isSoon,
  availableDate,
  onBookNow,
}) {
  const today = getTomorrowDate();
  const invalidRange = Boolean(endDate && startDate && endDate < startDate);

  return (
    <div className="unit-detail-pricing-panel">
      {/* Header bảng giá */}
      <div className="pricing-panel-header">
        <div>
          <h2 className="pricing-panel-title">DỰ TOÁN CHI PHÍ THUÊ</h2>
          <p className="pricing-panel-sub">
            Giá thuê rõ ràng, không phụ phí ẩn
          </p>
        </div>
      </div>

      {/* ── BỘ CHỌN KHOẢNG NGÀY THUÊ: NGÀY NHẬN & TRẢ TRÊN Ô LỊCH ── */}
      <div className="pricing-selector-group">
        <label className="pricing-selector-label">
          LỊCH CHỌN NGÀY NHẬN & TRẢ KHO (CHỌN TRÊN Ô LỊCH)
        </label>

        <UnitAvailabilityCalendar
          startDate={startDate}
          onSelectStartDate={setStartDate}
          endDate={endDate}
          onSelectEndDate={setEndDate}
          durationDays={durationDays}
          availableFromDate={availableDate}
          isSoon={isSoon}
          minDate={isSoon && availableDate ? availableDate : getTomorrowDate()}
        />

        {invalidRange && (
          <span className="field-error-text" style={{ marginTop: "8px" }}>
            Ngày trả kho phải bằng hoặc sau ngày nhận kho.
          </span>
        )}
      </div>

      <div className="pricing-divider" />

      {/* ── TỪNG DÒNG CHI PHÍ THEO RENTAL POLICY ĐANG HIỆU LỰC ── */}
      <div className="pricing-breakdown-list">
        <span className="pricing-breakdown-heading">CHI TIẾT CHI PHÍ</span>

        {/* 1. Dòng tiền thuê cơ bản: Giá ngày × Số ngày */}
        <div className="pricing-breakdown-row">
          <div className="pricing-row-left">
            <span className="pricing-row-label">Tiền thuê kho</span>
            <span className="pricing-row-hint">
              {formatVND(dailyRent)} / ngày × {durationDays} ngày
            </span>
          </div>
          <strong className="pricing-row-val">{formatVND(totalRent)}</strong>
        </div>

        {/* 2. Tiền đặt cọc giữ chỗ: 10% (tối thiểu 5.000 ₫) theo Rental Policy */}
        <div className="pricing-breakdown-row">
          <div className="pricing-row-left">
            <span className="pricing-row-label">Tiền đặt cọc giữ chỗ</span>
            <span className="pricing-row-hint">
              10% tổng tiền thuê (tối thiểu 5.000 ₫) · Hoàn lại 100% khi trả kho
            </span>
          </div>
          <strong className="pricing-row-val">{formatVND(depositAmount)}</strong>
        </div>

        {/* 3. Phí dịch vụ bảo dưỡng & hạ tầng */}
        <div className="pricing-breakdown-row">
          <div className="pricing-row-left">
            <span className="pricing-row-label">Phí bảo trì & Quản lý cơ sở</span>
            <span className="pricing-row-hint">
              Bao gồm camera CCTV 24/7 & vệ sinh hành lang định kỳ
            </span>
          </div>
          <strong className="pricing-row-val pricing-free">MIỄN PHÍ</strong>
        </div>
      </div>

      {/* Báo hiệu chính sách cọc minh bạch */}
      <div className="pricing-policy-badge">
        <ShieldCheck size={16} weight="bold" />
        <div>
          <span>Áp dụng Quy chế thuê: <strong>{policyVersion}</strong></span>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#64748b" }}>
            Cọc 10% được lưu trữ an toàn và hoàn trả ngay khi kết thúc thuê kho.
          </p>
        </div>
      </div>

      {/* ── TỔNG CỘNG THANH TOÁN HÔM NAY (TIỀN CỌC GIỮ CHỖ) ── */}
      <div className="pricing-due-now-box">
        <div className="due-now-row">
          <div>
            <span className="due-now-label">THANH TOÁN HÔM NAY:</span>
            <span className="due-now-sub">Tiền cọc để khóa giữ chỗ kho (10%)</span>
          </div>
          <strong className="due-now-amount">{formatVND(dueNow)}</strong>
        </div>
        <p className="due-now-subnote">
          (Tiền thuê còn lại {formatVND(totalRent)} sẽ thanh toán vào ngày nhận kho)
        </p>
      </div>

      {/* ── NÚT HÀNH ĐỘNG ĐẶT KHO ── */}
      <button
        type="button"
        className="pricing-submit-btn"
        onClick={onBookNow}
        disabled={quoteLoading || invalidRange || !endDate}
      >
        <span>Đặt kho & Thanh toán cọc giữ chỗ</span>
        <span className="pricing-submit-btn__arrow">→</span>
      </button>
      {quoteError && (
        <p className="field-error-text" style={{ marginTop: "8px" }}>
          {quoteError}
        </p>
      )}

      {/* Cam kết bảo mật & Hủy miễn phí */}
      <div className="pricing-guarantees">
        <div className="guarantee-item">
          <Lock size={15} weight="bold" />
          <span>
            Cổng thanh toán mã hóa an toàn · Thanh toán qua mã QR PayOS
          </span>
        </div>
        <div className="guarantee-item">
          <Clock size={15} weight="bold" />
          <span>
            Hủy miễn phí trong vòng 24 giờ trước ngày nhận kho, hoàn 100% cọc
          </span>
        </div>
      </div>
    </div>
  );
}
