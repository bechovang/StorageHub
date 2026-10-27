import {
  CalendarCheck,
  ShieldCheck,
  Lock,
  Clock,
} from "@phosphor-icons/react";
import { formatVND, formatDate, getTomorrowDate } from "../../../utils/formatters.js";

export default function UnitPricingCalculator({
  durationMonths,
  setDurationMonths,
  startDate,
  setStartDate,
  endDate,
  monthlyRent,
  totalRent,
  depositAmount,
  dueNow,
  policyVersion,
  quoteLoading,
  isSoon,
  availableDate,
  onBookNow,
}) {
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

      {/* Bộ chọn thời gian thuê (Lease Duration Selector) */}
      <div className="pricing-selector-group">
        <label htmlFor="duration-select" className="pricing-selector-label">
          THỜI HẠN THUÊ CAM KẾT
        </label>
        <div className="pricing-duration-buttons">
          {[
            { months: 1, label: "1 tháng", hint: "Linh hoạt" },
            { months: 3, label: "3 tháng", hint: "Phổ biến" },
            { months: 6, label: "6 tháng", hint: "Tiết kiệm 5%" },
            { months: 12, label: "12 tháng", hint: "Ưu đãi 10%" },
          ].map((item) => (
            <button
              key={item.months}
              type="button"
              className={`pricing-duration-btn ${durationMonths === item.months ? "is-selected" : ""}`}
              onClick={() => setDurationMonths(item.months)}
            >
              <span className="pricing-duration-btn__months">
                {item.label}
              </span>
              <span className="pricing-duration-btn__hint">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bộ chọn ngày nhận kho (Start Date) */}
      <div className="pricing-selector-group">
        <label htmlFor="start-date-input" className="pricing-selector-label">
          NGÀY BẮT ĐẦU THUÊ DỰ KIẾN
        </label>
        <input
          id="start-date-input"
          type="date"
          className="pricing-date-input"
          value={startDate}
          min={isSoon && availableDate ? availableDate : getTomorrowDate()}
          onChange={(e) => setStartDate(e.target.value)}
        />
        {endDate && (
          <p className="pricing-cycle-hint">
            <CalendarCheck size={14} weight="bold" />
            <span>
              Chu kỳ thuê: <strong>{formatDate(startDate)}</strong> →{" "}
              <strong>{formatDate(endDate)}</strong> ({durationMonths}{" "}
              tháng)
            </span>
          </p>
        )}
      </div>

      <div className="pricing-divider" />

      {/* ── TỪNG DÒNG CHI PHÍ THEO RENTAL POLICY ĐANG HIỆU LỰC ── */}
      <div className="pricing-breakdown-list">
        <span className="pricing-breakdown-heading">CHI TIẾT CHI PHÍ</span>

        {/* 1. Dòng tiền thuê cơ bản: Rent × Duration */}
        <div className="pricing-breakdown-row">
          <div className="pricing-row-left">
            <span className="pricing-row-label">Tiền thuê kho</span>
            <span className="pricing-row-sub">
              {formatVND(monthlyRent)}/tháng × {durationMonths} tháng
            </span>
          </div>
          <strong className="pricing-row-amount">
            {formatVND(totalRent)}
          </strong>
        </div>

        {/* 2. Dòng phụ thu: Phí quản lý cơ sở & bảo trì */}
        <div className="pricing-breakdown-row">
          <div className="pricing-row-left">
            <span className="pricing-row-label">
              Phí dịch vụ & giám sát an ninh 24/7
            </span>
            <span className="pricing-row-sub">
              Rental Policy {policyVersion}
            </span>
          </div>
          <span className="pricing-row-status is-included">
            Bao gồm (0 ₫)
          </span>
        </div>

        {/* 3. Dòng phụ thu: Bảo hiểm tài sản lưu trữ */}
        <div className="pricing-breakdown-row">
          <div className="pricing-row-left">
            <span className="pricing-row-label">
              Bảo hiểm tài sản tiêu chuẩn
            </span>
            <span className="pricing-row-sub">
              Gói bảo vệ hàng hóa cơ bản
            </span>
          </div>
          <span className="pricing-row-status is-included">
            Bao gồm (0 ₫)
          </span>
        </div>

        {/* 4. Dòng phụ thu: Cấp mã số PIN khoá điện tử */}
        <div className="pricing-breakdown-row">
          <div className="pricing-row-left">
            <span className="pricing-row-label">
              Khởi tạo mã PIN vào kho
            </span>
            <span className="pricing-row-sub">Cấp mã PIN miễn phí</span>
          </div>
          <div className="pricing-row-waived">
            <del>50.000 ₫</del>
            <span className="pricing-row-status is-included">
              Miễn phí (0 ₫)
            </span>
          </div>
        </div>

        {/* 5. Tổng giá trị hợp đồng thuê */}
        <div className="pricing-total-contract-row">
          <span>Tổng giá trị tiền thuê ({durationMonths} tháng):</span>
          <strong>{formatVND(totalRent)}</strong>
        </div>
      </div>

      {/* ── HỘP TẬP TRUNG TIỀN CỌC KÈM NHÃN REFUNDABLE (HOÀN LẠI) ── */}
      <div className="pricing-deposit-box">
        <div className="deposit-box-header">
          <div className="deposit-box-title-wrap">
            <ShieldCheck size={20} color="#16a34a" weight="bold" />
            <div>
              <span className="deposit-box-title">
                Tiền đặt cọc giữ kho (10%)
              </span>
              <span className="deposit-box-badge-refundable">
                HOÀN TRẢ KHI TRẢ KHO
              </span>
            </div>
          </div>
          <strong className="deposit-box-amount">
            {formatVND(depositAmount)}
          </strong>
        </div>

        <p className="deposit-box-explanation">
          ✓ Khoản cọc 10% là điều kiện bắt buộc để <strong>khóa giữ chỗ chính thức (RESERVED)</strong> cho ô kho. Trong thời gian chưa thanh toán, ô kho vẫn khả dụng cho khách hàng khác đặt. Tiền cọc sẽ được{" "}
          <strong>hoàn trả 100%</strong> vào tài khoản của bạn ngay khi kết
          thúc hợp đồng.
        </p>
      </div>

      {/* ── SỐ TIỀN PHẢI THANH TOÁN NGAY HÔM NAY (DUE NOW) ── */}
      <div className="pricing-due-now-box">
        <div className="due-now-row">
          <div>
            <span className="due-now-label">THANH TOÁN HÔM NAY:</span>
            <span className="due-now-sub">Tiền cọc để khóa giữ chỗ kho</span>
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
        disabled={quoteLoading}
      >
        <span>Đặt kho & Thanh toán cọc giữ chỗ</span>
        <span className="pricing-submit-btn__arrow">→</span>
      </button>

      {/* Cam kết bảo mật & Hủy miễn phí */}
      <div className="pricing-guarantees">
        <div className="guarantee-item">
          <Lock size={15} weight="bold" />
          <span>
            Cổng thanh toán mã hóa an toàn · Hỗ trợ Thẻ / MoMo / VNPay
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
