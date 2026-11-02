import {
  WarningCircle,
  Trash,
  Plus,
  Clock,
} from "@phosphor-icons/react";
import { STANDARD_SHIFTS } from "../hooks/useStaffShifts.js";

const TYPE_COLORS = {
  LOCK: "#7c3aed",
  S: "#0284c7",
  M: "#ea580c",
  L: "#16a34a",
  LOCKER: "#7c3aed",
};

export default function ShiftFirstScheduleTable({
  weekDays = [],
  shiftGrid = {},
  highlightedStaffId = null,
  onOpenFillPopover,
  onRemoveShift,
}) {
  return (
    <section className="shift-first-schedule-wrap">
      <div className="schedule-table-container">
        <table className="shift-first-table">
          <thead>
            <tr>
              <th className="th-shift-col">
                <div className="th-shift-col__title">Khung ca vận hành</div>
              </th>
              {weekDays.map((d) => (
                <th
                  key={d.key}
                  className={`th-day-col ${d.isToday ? "th-day-col--today" : ""}`}
                >
                  <div className="th-day-col__inner">
                    <span className="day-name">{d.dayName}</span>
                    <span className="day-date">{d.dayNum}/{d.monthNum}</span>
                    {d.isToday && (
                      <span className="day-today-tag">Hôm nay</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STANDARD_SHIFTS.map((shift) => (
              <tr key={shift.key} className="shift-matrix-row">
                {/* Cột 1: Thông tin ca trực */}
                <td className="td-shift-info" style={{ borderLeftColor: shift.color }}>
                  <div className="shift-info-card">
                    <span className="shift-info-tag" style={{ color: shift.color }}>
                      Ca vận hành
                    </span>
                    <strong className="shift-info-name">{shift.name}</strong>
                    <div className="shift-info-hours">
                      <Clock size={14} />
                      <span>{shift.hours}</span>
                    </div>
                  </div>
                </td>

                {/* 7 Cột ngày */}
                {weekDays.map((day) => {
                  const assignments = shiftGrid[shift.key]?.[day.key] || [];
                  const isEmpty = assignments.length === 0;
                  const isMaxStaff = assignments.length >= 4;

                  // Ô CA CHƯA CÓ NGƯỜI TRỰC
                  if (isEmpty) {
                    return (
                      <td
                        key={day.key}
                        className="td-slot td-slot--empty"
                        onClick={() => onOpenFillPopover(shift.key, day, null)}
                        title={`Bấm để fill nhân viên vào ${shift.name} (${day.dayName} ${day.fullDate})`}
                      >
                        <div className="empty-slot-card">
                          <span className="empty-slot-badge">
                            Chưa có người trực
                          </span>
                          <button
                            type="button"
                            className="btn-quick-fill"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenFillPopover(shift.key, day, null);
                            }}
                          >
                            <Plus size={13} weight="bold" />
                            <span>Fill nhân viên</span>
                          </button>
                        </div>
                      </td>
                    );
                  }

                  // Ô CA ĐÃ CÓ NHÂN VIÊN TRỰC (Đã gom 1 thẻ duy nhất / 1 nhân viên)
                  return (
                    <td key={day.key} className="td-slot td-slot--filled">
                      <div className="filled-slot-stack">
                        {assignments.map((s) => {
                          const isHighlighted =
                            highlightedStaffId && Number(highlightedStaffId) === s.staffId;

                          return (
                            <div
                              key={`${s.staffId}-${s.shiftWindow}-${s.date}`}
                              className={`shift-worker-card ${
                                s.isConflict ? "shift-worker-card--conflict" : ""
                              } ${isHighlighted ? "shift-worker-card--highlighted" : ""} ${
                                s.isDraftNew ? "shift-worker-card--draft" : ""
                              }`}
                              onClick={() => onOpenFillPopover(shift.key, day, s)}
                              title={
                                s.isConflict
                                  ? "Phát hiện trùng ca trong ngày! Bấm để sửa hoặc hủy"
                                  : `Bấm để sửa phân khu/hủy: ${s.staffName} · ${s.typeName}`
                              }
                            >
                              <div className="worker-card-header">
                                <strong className="worker-card-name">
                                  {s.staffName}
                                </strong>
                                <button
                                  type="button"
                                  className="worker-card-del-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveShift(s);
                                  }}
                                  title="Gỡ nhân viên khỏi ca này"
                                  aria-label="Xóa ca trực"
                                >
                                  <Trash size={12} />
                                </button>
                              </div>

                              <div className="worker-card-meta">
                                <span className="worker-card-code">{s.staffCode}</span>
                                {s.isConflict && (
                                  <WarningCircle
                                    size={13}
                                    weight="fill"
                                    className="text-error"
                                    title="Trùng ca trong ngày"
                                  />
                                )}
                                {s.isDraftNew && (
                                  <span className="badge-draft-tag" title="Chưa lưu vào DB">
                                    Mới
                                  </span>
                                )}
                              </div>

                              {/* Chip màu các loại kho phụ trách (Gom các phân khu lại) */}
                              <div className="worker-card-types">
                                {(s.typeNames || []).map((t) => (
                                  <span
                                    key={t}
                                    className="worker-type-chip"
                                    style={{
                                      backgroundColor: TYPE_COLORS[t.toUpperCase()] || "#475569",
                                    }}
                                    title={`Phụ trách ${t}`}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Ràng buộc: Tối đa 4 nhân viên/ca */}
                        {isMaxStaff ? (
                          <div className="slot-max-cap-badge" title="Đã đạt giới hạn tối đa 4 nhân viên/ca">
                            Tối đa 4 nhân viên/ca
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn-add-extra-worker"
                            onClick={() => onOpenFillPopover(shift.key, day, null)}
                            title="Phân công thêm nhân viên cùng trực ca này (Tối đa 4 nhân viên/ca)"
                          >
                            <Plus size={11} weight="bold" />
                            <span>Thêm người</span>
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend Chú giải Loại kho & Trạng thái */}
      <div className="shift-first-legend">
        <div className="legend-group">
          <span className="legend-label">Loại kho:</span>
          {Object.entries(TYPE_COLORS).filter(([k]) => k !== "LOCKER").map(([code, color]) => (
            <div key={code} className="legend-pill">
              <span className="legend-dot" style={{ backgroundColor: color }} />
              <span>Kho {code}</span>
            </div>
          ))}
        </div>

        <div className="legend-divider" />

        <div className="legend-group">
          <span className="legend-label">Quy định & Độ phủ:</span>
          <div className="legend-pill">
            <span className="legend-dot" style={{ backgroundColor: "#0284c7" }} />
            <span>Tối đa 4 nhân viên/ca</span>
          </div>
          <div className="legend-pill">
            <span className="legend-box-empty" />
            <span>Chưa có người trực (Cần fill)</span>
          </div>
          <div className="legend-pill">
            <span className="legend-box-conflict" />
            <span className="text-error font-semibold">Trùng ca / Cần xử lý</span>
          </div>
        </div>
      </div>
    </section>
  );
}
