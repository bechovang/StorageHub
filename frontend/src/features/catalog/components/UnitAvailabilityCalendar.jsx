import { useState, useMemo } from "react";
import { CaretLeft, CaretRight, Info, CheckCircle } from "@phosphor-icons/react";
import "./UnitAvailabilityCalendar.css";
import { formatDate, getTomorrowDate } from "../../../utils/formatters.js";

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function UnitAvailabilityCalendar({
  selectedDate,
  onSelectDate,
  availableFromDate,
  isSoon = false,
  minDate,
}) {
  const tomorrowStr = getTomorrowDate();
  const effectiveMinDate = isSoon && availableFromDate ? availableFromDate : (minDate || tomorrowStr);

  // Khởi tạo tháng xem ban đầu theo ngày đã chọn hoặc ngày bắt đầu trống
  const [viewDate, setViewDate] = useState(() => {
    const initial = selectedDate ? new Date(selectedDate) : new Date(effectiveMinDate);
    return isNaN(initial.getTime()) ? new Date() : initial;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0 - 11

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Tính toán các ngày trong tháng
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

    const todayStr = new Date().toISOString().split("T")[0];

    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const isPast = dateStr < todayStr;
      // Ngày bị đặt: trước ngày availableFromDate (nếu kho đang bận hoặc sắp trống)
      const isBooked = !isPast && isSoon && availableFromDate && dateStr < availableFromDate;
      const isSelectable = !isPast && !isBooked && dateStr >= tomorrowStr;
      const isSelected = selectedDate === dateStr;

      list.push({
        type: "day",
        day,
        dateStr,
        isPast,
        isBooked,
        isSelectable,
        isSelected,
        key: `day-${dateStr}`,
      });
    }

    const mLabel = `Tháng ${month + 1} / ${year}`;
    return { days: list, monthLabel: mLabel };
  }, [year, month, isSoon, availableFromDate, tomorrowStr, selectedDate]);

  return (
    <div className="unit-calendar-container">
      <div className="unit-calendar-header">
        <span className="unit-calendar-title">{monthLabel}</span>
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

      {/* Tên các thứ trong tuần */}
      <div className="unit-calendar-weekdays">
        {DAY_NAMES.map((d) => (
          <span key={d} className="unit-calendar-weekday">
            {d}
          </span>
        ))}
      </div>

      {/* Lưới các ngày trong tháng */}
      <div className="unit-calendar-grid" role="grid" aria-label="Lịch chọn ngày nhận kho">
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
          } else if (item.isSelectable) {
            cellClass += " is-available";
          }

          if (item.isSelected) {
            cellClass += " is-selected";
            tooltip = "Ngày bạn đang chọn";
          }

          return (
            <button
              key={item.key}
              type="button"
              className={cellClass}
              disabled={!item.isSelectable}
              onClick={() => item.isSelectable && onSelectDate(item.dateStr)}
              title={`${formatDate(item.dateStr)}: ${tooltip}`}
              aria-label={`${item.day} ${monthLabel}, ${tooltip}`}
              aria-selected={item.isSelected}
            >
              <span className="unit-calendar-day-number">{item.day}</span>
              {item.isBooked && <span className="unit-calendar-dot is-red" aria-hidden="true" />}
              {item.isSelected && (
                <span className="unit-calendar-check" aria-hidden="true">
                  <CheckCircle size={10} weight="fill" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chú thích màu sắc (Legend) */}
      <div className="unit-calendar-legend">
        <div className="legend-item">
          <span className="legend-indicator is-booked-box" />
          <span>Đã bị đặt / Đang thuê</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator is-available-box" />
          <span>Còn trống</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator is-selected-box" />
          <span>Ngày bạn chọn</span>
        </div>
      </div>

      {/* Báo hiệu ngày đã chọn */}
      {selectedDate && (
        <div className="unit-calendar-selected-feedback">
          <Info size={14} weight="bold" />
          <span>
            Ngày bắt đầu thuê: <strong>{formatDate(selectedDate)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
