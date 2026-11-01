import {
  WarningCircle,
  CheckCircle,
  Lock,
  Plus,
} from "@phosphor-icons/react";
import {
  DAYS_OF_WEEK,
  UNIT_TYPES,
  } from "../../../services/shiftService.js";

export default function ShiftAssignmentForm({
  selectedStaffId,
  setSelectedStaffId,
  selectedTypeIds,
  setSelectedTypeIds,
  selectedShifts,
  setSelectedShifts,
  selectedDate,
  setSelectedDate,
  liveConflict,
  onSaveAssignment,
  onResetDefaults,
  staffList = [],
}) {
  return (
    <section className="shifts-form-panel">
      <div className="shifts-form-panel__head">
        <div className="shifts-form-panel__title-group">
          <h2 className="shifts-form-panel__title">Phân công ca trực mới</h2>
          <span className="badge badge--neutral">Trực tiếp lên bảng tuần</span>
        </div>
        <span className="shifts-form-panel__tip">
          Kiểm tra va chạm tự động theo quy tắc Staff × Loại kho × Ca × Ngày
        </span>
      </div>

      <form className="shifts-form-grid" onSubmit={onSaveAssignment}>
        {/* Nhân sự */}
        <div className="form-group">
          <label className="form-label" htmlFor="shift-staff">
            Nhân viên trực ca
          </label>
          <select
            id="shift-staff"
            className="form-select"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(Number(e.target.value))}
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Loại kho phân công — chọn nhiều */}
        <div className="form-group">
          <label className="form-label" htmlFor="shift-type">
            Loại kho phân công (chọn nhiều)
          </label>
          <select
            id="shift-type"
            className="form-select"
            multiple
            size={4}
            value={selectedTypeIds.map(String)}
            onChange={(e) =>
              setSelectedTypeIds(
                Array.from(e.target.selectedOptions).map((o) => Number(o.value))
              )
            }
          >
            {UNIT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Khung giờ ca — chọn nhiều */}
        <div className="form-group">
          <label className="form-label" htmlFor="shift-window">
            Khung ca trực (chọn nhiều)
          </label>
          <select
            id="shift-window"
            className="form-select"
            multiple
            size={3}
            value={selectedShifts}
            onChange={(e) =>
              setSelectedShifts(Array.from(e.target.selectedOptions).map((o) => o.value))
            }
          >
            <option value="MORNING">Ca sáng (07:00 – 15:00)</option>
            <option value="AFTERNOON">Ca chiều (15:00 – 23:00)</option>
            <option value="EVENING">Ca tối (19:00 – 07:00)</option>
          </select>
        </div>

        {/* Ngày áp dụng */}
        <div className="form-group">
          <label className="form-label" htmlFor="shift-date">
            Ngày làm việc
          </label>
          <select
            id="shift-date"
            className="form-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.key} value={d.key}>
                {d.dayName}, {d.fullDate} {d.isToday ? "· Hôm nay" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Trạng thái va chạm & Nút Submit */}
        <div className="shifts-form-footer">
          <div className="shifts-form-footer__alert">
            {liveConflict.hasConflict ? (
              <div className="conflict-badge-inline">
                <WarningCircle size={16} weight="fill" />
                <span>{liveConflict.reason}</span>
              </div>
            ) : (
              <div className="valid-badge-inline">
                <CheckCircle size={16} weight="fill" />
                <span>Khung giờ hợp lệ — không bị trùng lịch</span>
              </div>
            )}
          </div>

          <div className="shifts-form-footer__btns">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onResetDefaults}
            >
              Mặc định lại
            </button>
            <button
              type="submit"
              className={`btn ${
                liveConflict.hasConflict ? "btn--disabled" : "btn--primary"
              }`}
              disabled={liveConflict.hasConflict}
              title={
                liveConflict.hasConflict
                  ? "Hệ thống chặn lưu do phát hiện xung đột lịch làm việc"
                  : "Lưu phân công"
              }
            >
              {liveConflict.hasConflict ? (
                <>
                  <Lock size={16} weight="bold" />
                  <span>Bị khóa (Trùng lịch)</span>
                </>
              ) : (
                <>
                  <Plus size={16} weight="bold" />
                  <span>Lưu phân công ca trực</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
