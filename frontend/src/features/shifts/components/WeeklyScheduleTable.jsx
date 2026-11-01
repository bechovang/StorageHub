import { WarningCircle, Trash } from "@phosphor-icons/react";
import { getWeekDays } from "../../../services/shiftService.js";

const TYPE_COLORS = {
  LOCK: "#7c3aed",
  S: "#0284c7",
  M: "#ea580c",
  L: "#16a34a",
  LOCKER: "#7c3aed",
};
const SHIFT_LABEL = {
  MORNING: "Sáng",
  AFTERNOON: "Tối",
  FULL_DAY: "Full",
  EVENING: "Tối",
};
const typeColor = (name) => TYPE_COLORS[String(name || "").toUpperCase()] || "#64748b";
const typeNamesOf = (s) => (s.typeNames?.length ? s.typeNames : String(s.typeName || "Kho").split(", "));

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
                      {/* Một ô / nhân viên / ngày: các vạch màu = loại kho,
                          nhãn ngắn = Sáng / Tối / Full. */}
                      <div className="shift-day-box">
                        {dayShifts.map((s) => {
                          const names = typeNamesOf(s);
                          return (
                            <div
                              key={s.id}
                              className={`shift-day-row ${s.hasConflict ? "is-conflict" : ""}`}
                              title={
                                s.hasConflict
                                  ? `Trùng lịch trực: ${s.conflictReason}`
                                  : `${names.join(", ")} · ${SHIFT_LABEL[s.shiftWindow] || s.shiftWindow}`
                              }
                            >
                              <div className="shift-day-bars">
                                {names.map((name) => (
                                  <span
                                    key={name}
                                    className="shift-type-bar"
                                    style={{ backgroundColor: typeColor(name) }}
                                    title={name}
                                  />
                                ))}
                              </div>
                              <span className="shift-day-shift">
                                {SHIFT_LABEL[s.shiftWindow] || s.shiftWindow}
                              </span>
                              {s.hasConflict && (
                                <WarningCircle size={13} weight="fill" className="text-error" />
                              )}
                              <button
                                type="button"
                                className="shift-day-remove"
                                onClick={() => onRemoveShift(s.id)}
                                title="Xóa ca này"
                                aria-label="Xóa ca trực"
                              >
                                <Trash size={11} />
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
          <span>Ca tối (15:00 – 23:00)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box--fullday" />
          <span>Full (07:00 – 23:00)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box--conflict" />
          <span className="text-error font-semibold">Trùng ca / Xung đột</span>
        </div>
      </div>
    </section>
  );
}
