import { WarningCircle, Trash } from "@phosphor-icons/react";
import { DAYS_OF_WEEK } from "../../../services/shiftService.js";

export default function WeeklyScheduleTable({
  staffRoster,
  totalConflicts,
  onRemoveShift,
}) {
  return (
    <main className="shifts-schedule-col">
      <div className="schedule-header">
        <div>
          <h2 className="schedule-title">Lịch trực tuần này</h2>
          <span className="schedule-subtitle">(12/10 – 18/10/2026)</span>
        </div>
        <div className="schedule-meta-pill">
          <span className="dot-live" />
          <span>Tự động kiểm tra xung đột</span>
        </div>
      </div>

      <div className="schedule-table-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="th-staff">Nhân viên</th>
              {DAYS_OF_WEEK.map((d) => (
                <th
                  key={d.key}
                  className={`th-day ${
                    d.isToday && totalConflicts > 0 ? "th-day--conflict" : ""
                  }`}
                >
                  <div className="th-day__inner">
                    <span>{d.label}</span>
                    {d.isToday && (
                      <span className="today-badge">
                        {totalConflicts > 0 ? "1 Lỗi" : "Hôm nay"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffRoster.map((staff) => (
              <tr key={staff.id}>
                <td className="td-staff">
                  <strong className="td-staff__name">{staff.fullName}</strong>
                  <span className="td-staff__code">{staff.code}</span>
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const dayShifts = staff.shifts.filter(
                    (s) => s.date === day.key
                  );

                  if (dayShifts.length === 0) {
                    return (
                      <td key={day.key} className="td-day td-day--off">
                        <span className="off-label">Nghỉ ca</span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={day.key}
                      className={`td-day ${
                        dayShifts.some((s) => s.isConflict)
                          ? "td-day--conflict"
                          : ""
                      }`}
                    >
                      <div className="td-shifts-stack">
                        {dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`shift-pill ${
                              shift.isConflict ? "shift-pill--conflict" : ""
                            }`}
                          >
                            <div className="shift-pill__info">
                              <span className="shift-pill__title">
                                {shift.shiftWindow === "MORNING"
                                  ? "Sáng"
                                  : shift.shiftWindow === "AFTERNOON"
                                    ? "Chiều"
                                    : shift.shiftWindow === "FULL_DAY"
                                      ? "Cả ngày"
                                      : "Trực"}{" "}
                                · {shift.zone}
                              </span>
                              {shift.isConflict && (
                                <span className="shift-pill__warn">
                                  <WarningCircle size={12} weight="fill" />
                                  Trùng ca!
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="shift-pill__del"
                              onClick={() => onRemoveShift(shift.id)}
                              title="Xóa ca trực này để giải phóng lịch"
                              aria-label={`Xóa ca ${shift.zone}`}
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="schedule-legend">
        <span className="legend-label">CHÚ THÍCH:</span>
        <div className="legend-item">
          <span className="legend-box legend-box--morning" />
          <span>Ca sáng (07:00 – 15:00)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box--afternoon" />
          <span>Ca chiều (15:00 – 23:00)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box--fullday" />
          <span>Cả ngày / Giám sát</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box--conflict" />
          <span className="text-error font-semibold">Trùng ca / Xung đột</span>
        </div>
      </div>
    </main>
  );
}
