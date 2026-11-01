import { useState, useMemo, useEffect } from "react";
import {
  CaretLeft,
  CaretRight,
  Info,
  CalendarCheck,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react";
import "./UnitAvailabilityCalendar.css";
import {
  formatDate,
  getTomorrowDate,
  getTodayDate,
  addDaysToDateStr,
} from "../../../utils/formatters.js";

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function UnitAvailabilityCalendar({
  // Dual range props
  startDate: propStartDate,
  onSelectStartDate,
  endDate: propEndDate,
  onSelectEndDate,
  durationDays,
  // Backward compatibility props
  selectedDate,
  onSelectDate,
  availableFromDate,
  isSoon = false,
  minDate,
}) {
  const tomorrowStr = getTomorrowDate();
  const effectiveMinDate =
    isSoon && availableFromDate ? availableFromDate : minDate || tomorrowStr;

  const resolvedStartDate = propStartDate || selectedDate || tomorrowStr;
  const resolvedEndDate = propEndDate || resolvedStartDate || tomorrowStr;

  const handleSelectStart = onSelectStartDate || onSelectDate || (() => {});
  const handleSelectEnd = onSelectEndDate || onSelectDate || (() => {});

  // Chế độ chọn ô lịch: "START" (Ngày nhận kho) | "END" (Ngày trả kho)
  const [activeMode, setActiveMode] = useState("START");

  // Tháng/năm đang xem
  const [viewDate, setViewDate] = useState(() => {
    const initial = resolvedStartDate ? new Date(resolvedStartDate) : new Date(effectiveMinDate);
    return isNaN(initial.getTime()) ? new Date() : initial;
  });

  // Khi chuyển chế độ, nếu ngày đích ở tháng khác thì tự động chuyển view sang tháng đó
  const handleSwitchMode = (mode) => {
    setActiveMode(mode);
    const targetDateStr = mode === "START" ? resolvedStartDate : resolvedEndDate;
    if (targetDateStr) {
      const parts = targetDateStr.split("-").map(Number);
      if (parts.length === 3) {
        setViewDate(new Date(parts[0], parts[1] - 1, 1));
      }
    }
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0 - 11

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Tính toán các ngày trong tháng hiện tại
  const { days, monthLabel } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Thứ hai là 0, Chủ nhật là 6
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    const list = [];
    // Ô trống đầu tháng
    for (let i = 0; i < startingDay; i++) {
      list.push({ type: "empty", key: `empty-${i}` });
    }

    const todayStr = getTodayDate();

    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const isPast = dateStr < todayStr;
      // Ngày bị kín trước availableFromDate
      const isBooked = !isPast && isSoon && availableFromDate && dateStr < availableFromDate;

      // Kiểm tra tính hợp lệ tuỳ theo mode đang chọn
      let isSelectable = false;
      let isBeforeStart = false;

      if (activeMode === "START") {
        isSelectable = !isPast && !isBooked && dateStr >= effectiveMinDate;
      } else {
        // Mode END (Chọn ngày trả kho)
        isBeforeStart = resolvedStartDate ? dateStr < resolvedStartDate : dateStr < effectiveMinDate;
        isSelectable = !isPast && !isBeforeStart;
      }

      const isStartDate = dateStr === resolvedStartDate;
      const isEndDate = dateStr === resolvedEndDate;
      const isSingleDay = isStartDate && isEndDate;
      const isInRange =
        resolvedStartDate &&
        resolvedEndDate &&
        dateStr > resolvedStartDate &&
        dateStr < resolvedEndDate;

      list.push({
        type: "day",
        day,
        dateStr,
        isPast,
        isBooked,
        isBeforeStart,
        isSelectable,
        isStartDate,
        isEndDate,
        isSingleDay,
        isInRange,
        key: `day-${dateStr}`,
      });
    }

    const mLabel = `Tháng ${month + 1} / ${year}`;
    return { days: list, monthLabel: mLabel };
  }, [
    year,
    month,
    activeMode,
    isSoon,
    availableFromDate,
    effectiveMinDate,
    resolvedStartDate,
    resolvedEndDate,
  ]);

  // Xử lý khi click vào 1 ô lịch (ngày)
  const handleDayClick = (dateStr) => {
    if (activeMode === "START") {
      handleSelectStart(dateStr);
      // Nếu ngày trả đang nhỏ hơn ngày nhận mới, tự động đẩy ngày trả lên bằng ngày nhận
      if (resolvedEndDate && resolvedEndDate < dateStr) {
        handleSelectEnd(dateStr);
      }
      // Tự động chuyển focus sang chọn Ngày trả kho
      setActiveMode("END");
    } else {
      // activeMode === "END"
      if (resolvedStartDate && dateStr < resolvedStartDate) {
        // Bấm trước ngày nhận -> chuyển thành ngày nhận mới
        handleSelectStart(dateStr);
        setActiveMode("END");
      } else {
        handleSelectEnd(dateStr);
      }
    }
  };

  // Tính số ngày hiển thị
  const displayDuration = durationDays || 1;

  return (
    <div className="unit-calendar-container" aria-label="Bộ chọn ngày thuê kho">
      {/* ── 1. Hai ô chọn Ngày Nhận Kho & Ngày Trả Kho (Kiểu app đặt vé xem phim) ── */}
      <div className="unit-cal-tabs" role="tablist">
        {/* Tab 1: Ngày nhận kho */}
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "START"}
          className={`unit-cal-tab ${activeMode === "START" ? "is-active" : ""}`}
          onClick={() => handleSwitchMode("START")}
        >
          <div className="unit-cal-tab__tag">
            <span className="unit-cal-tab__dot is-start" />
            <span className="unit-cal-tab__label">1. NGÀY NHẬN KHO</span>
            {activeMode === "START" && (
              <span className="unit-cal-tab__badge">Đang chọn</span>
            )}
          </div>
          <div className="unit-cal-tab__date">
            <CalendarCheck size={18} weight="bold" />
            <strong>{formatDate(resolvedStartDate)}</strong>
          </div>
          <span className="unit-cal-tab__sub">Nhận kho từ 08:00</span>
        </button>

        {/* Mũi tên & Thời lượng thuê */}
        <div className="unit-cal-connector">
          <ArrowRight size={16} weight="bold" />
          <span className="unit-cal-duration-chip">
            {displayDuration} ngày
          </span>
        </div>

        {/* Tab 2: Ngày trả kho */}
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "END"}
          className={`unit-cal-tab ${activeMode === "END" ? "is-active" : ""}`}
          onClick={() => handleSwitchMode("END")}
        >
          <div className="unit-cal-tab__tag">
            <span className="unit-cal-tab__dot is-end" />
            <span className="unit-cal-tab__label">2. NGÀY TRẢ KHO</span>
            {activeMode === "END" && (
              <span className="unit-cal-tab__badge">Đang chọn</span>
            )}
          </div>
          <div className="unit-cal-tab__date">
            <CheckCircle size={18} weight="bold" />
            <strong>{formatDate(resolvedEndDate)}</strong>
          </div>
          <span className="unit-cal-tab__sub">Bàn giao trước 20:00</span>
        </button>
      </div>

      {/* ── 3. Header Lịch & Điều hướng Tháng ── */}
      <div className="unit-calendar-header">
        <span className="unit-calendar-title">
          {activeMode === "START" ? "LỊCH CHỌN NGÀY NHẬN · " : "LỊCH CHỌN NGÀY TRẢ · "}
          {monthLabel}
        </span>
        <div className="unit-calendar-nav">
          <button
            type="button"
            className="unit-calendar-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Tháng trước"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <button
            type="button"
            className="unit-calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Tháng kế tiếp"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* ── 4. Tên các thứ trong tuần ── */}
      <div className="unit-calendar-weekdays">
        {DAY_NAMES.map((d) => (
          <span key={d} className="unit-calendar-weekday">
            {d}
          </span>
        ))}
      </div>

      {/* ── 5. Lưới các ô lịch ngày (Interactive Calendar Grid) ── */}
      <div
        className="unit-calendar-grid"
        role="grid"
        aria-label={
          activeMode === "START"
            ? "Lưới ô lịch chọn ngày nhận kho"
            : "Lưới ô lịch chọn ngày trả kho"
        }
      >
        {days.map((item) => {
          if (item.type === "empty") {
            return <div key={item.key} className="unit-calendar-cell is-empty" />;
          }

          let cellClass = "unit-calendar-cell unit-calendar-day";
          let tooltip = "Ngày trống sẵn sàng";

          if (item.isPast) {
            cellClass += " is-past";
            tooltip = "Ngày trong quá khứ";
          } else if (item.isBooked) {
            cellClass += " is-booked";
            tooltip = "Đã có người đặt / Đang sử dụng";
          } else if (item.isBeforeStart) {
            cellClass += " is-before-start";
            tooltip = "Trước ngày nhận kho";
          } else if (item.isSelectable) {
            cellClass += " is-available";
          }

          // Đánh dấu ngày nhận / ngày trả / dải ngày
          if (item.isSingleDay) {
            cellClass += " is-selected is-start-date is-end-date";
            tooltip = "Ngày nhận & trả kho trong ngày";
          } else if (item.isStartDate) {
            cellClass += " is-selected is-start-date";
            tooltip = "Ngày bắt đầu nhận kho";
          } else if (item.isEndDate) {
            cellClass += " is-selected is-end-date";
            tooltip = "Ngày bàn giao trả kho";
          } else if (item.isInRange) {
            cellClass += " is-in-range";
            tooltip = "Trong chu kỳ thuê kho";
          }

          return (
            <button
              key={item.key}
              type="button"
              className={cellClass}
              disabled={!item.isSelectable}
              onClick={() => item.isSelectable && handleDayClick(item.dateStr)}
              title={`${formatDate(item.dateStr)}: ${tooltip}`}
              aria-label={`${item.day} ${monthLabel}, ${tooltip}`}
              aria-selected={item.isStartDate || item.isEndDate}
            >
              <span className="unit-calendar-day-number">{item.day}</span>
              {item.isBooked && (
                <span className="unit-calendar-dot is-red" aria-hidden="true" />
              )}
              {item.isSingleDay ? (
                <span className="unit-cal-badge-pill">Nhận & Trả</span>
              ) : item.isStartDate ? (
                <span className="unit-cal-badge-pill is-start-pill">Nhận</span>
              ) : item.isEndDate ? (
                <span className="unit-cal-badge-pill is-end-pill">Trả</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── 6. Phím tắt chọn nhanh ngày trả kho (Combo thời hạn giống app đặt vé) ── */}
      <div className="unit-cal-shortcuts">
        <span className="unit-cal-shortcuts__label">Chọn nhanh ngày trả:</span>
        <div className="unit-cal-shortcuts__list">
          {[
            { label: "1 ngày", days: 1 },
            { label: "3 ngày", days: 3 },
            { label: "7 ngày (1 tuần)", days: 7 },
            { label: "14 ngày (2 tuần)", days: 14 },
            { label: "30 ngày (1 tháng)", days: 30 },
          ].map((sc) => {
            const targetDate = addDaysToDateStr(
              resolvedStartDate || tomorrowStr,
              sc.days - 1
            );
            const isActive = resolvedEndDate === targetDate;
            return (
              <button
                key={sc.days}
                type="button"
                className={`unit-cal-shortcut-btn ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  handleSelectEnd(targetDate);
                  setActiveMode("END");
                }}
              >
                +{sc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 7. Chú thích màu sắc (Legend) ── */}
      <div className="unit-calendar-legend">
        <div className="legend-item">
          <span className="legend-indicator is-booked-box" />
          <span>Đã kín lịch</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator is-available-box" />
          <span>Còn trống</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator is-start-box" />
          <span>Nhận kho</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator is-end-box" />
          <span>Trả kho</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator is-range-box" />
          <span>Khoảng thuê</span>
        </div>
      </div>

      {/* ── 8. Báo hiệu chu kỳ thuê hoàn chỉnh ── */}
      {resolvedStartDate && resolvedEndDate && (
        <div className="unit-calendar-selected-feedback">
          <Info size={15} weight="bold" />
          <span>
            Chu kỳ thuê đã chọn: <strong>{formatDate(resolvedStartDate)}</strong> →{" "}
            <strong>{formatDate(resolvedEndDate)}</strong> ({displayDuration} ngày)
          </span>
        </div>
      )}
    </div>
  );
}
