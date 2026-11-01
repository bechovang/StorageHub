import { WarningCircle, Trash } from "@phosphor-icons/react";
import { getWeekDays } from "../../../services/shiftService.js";

export default function WeeklyScheduleTable({
  staffRoster,
  totalConflicts,
  onRemoveShift,
}) {
  const days = getWeekDays();
  const weekLabel = `${days[0].fullDate} – ${days[6].fullDate}`;
  return (
    <section className="shifts-schedule-col">
      <div className="schedule-header">
        <div>
          <h2 className="schedule-title">Lịch trực tuần này</h2>
          <span className="schedule-subtitle">({weekLabel})</span>
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
              {days.map((d) => (
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
                {days.map((day) => {
                  const dayShifts = staff.shifts.filter(
                    (s) => s.date === day.key
                  );

                  if (dayShifts.length === 0) {
                    return (
                      <td key={day.key} className="td-day td-day--off">
                        <span className="off-pill">Nghỉ</span>
                      </td>
                    );
                  }

                  return (
                    <td key={day.key} className="td-day">
                      <div className="shifts-cell-stack">
                        {dayShifts.map((s) => {
                          const isMorning = s.shiftWindow === "MORNING";
                          const isAfternoon = s.shiftWindow === "AFTERNOON";
                          const isFullDay = s.shiftWindow === "FULL_DAY";

                          let badgeType = "badge--neutral";
                          if (isMorning) badgeType = "badge--morning";
                          if (isAfternoon) badgeType = "badge--afternoon";
                          if (isFullDay) badgeType = "badge--fullday";
                          if (s.hasConflict) badgeType = "badge--conflict";

                          return (
                            <div
                              key={s.id}
                              className={`shift-pill ${badgeType}`}
                              title={
                                s.hasConflict
                                  ? `Trùng lịch trực: ${s.conflictReason}`
                                  : `${s.typeName || "Kho"} · ${s.timeWindow || s.shiftWindow}`
                              }
                            >
                              <div className="shift-pill__meta">
                                <span className="shift-pill__zone">
                                  {s.typeName || "Kho"}
                                </span>
                                <span className="shift-pill__time">
                                  {s.shiftWindow === "MORNING"
                                    ? "Sáng"
                                    : s.shiftWindow === "AFTERNOON"
                                    ? "Chiều"
                                    : "Cả ngày"}
                                </span>
                              </div>

                              {s.hasConflict && (
                                <WarningCircle
                                  size={14}
                                  weight="fill"
                                  className="shift-pill__conflict-icon"
                                />
                              )}

                              <button
                                type="button"
                                className="shift-pill__remove-btn"
                                onClick={() => onRemoveShift(s.id)}
                                title="Xóa ca này"
                                aria-label="Xóa ca trực"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="schedule-legend">
        <span className="legend-title">Chú giải:</span>
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
    </section>
  );
}
