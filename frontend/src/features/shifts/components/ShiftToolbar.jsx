import {
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Copy,
  FloppyDisk,
  ArrowCounterClockwise,
  Spinner,
} from "@phosphor-icons/react";
import { UNIT_TYPES } from "../../../services/shiftService.js";

export default function ShiftToolbar({
  weekOffset,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  searchTerm,
  onSearchChange,
  selectedTypeFilter,
  onTypeFilterChange,
  onCopyPreviousWeek,
  copying,
  hasPendingChanges = false,
  pendingCount = 0,
  onConfirmSave,
  onRevertChanges,
  saving = false,
}) {
  return (
    <div className="shifts-toolbar">
      {/* ── Left: Week Switcher ── */}
      <div className="shifts-toolbar__nav">
        <div className="week-nav-group">
          <button
            type="button"
            className="week-nav-btn"
            onClick={onPrevWeek}
            title="Xem tuần trước"
            aria-label="Tuần trước"
          >
            <CaretLeft size={16} weight="bold" />
            <span className="nav-btn-text">Tuần trước</span>
          </button>

          <div className="week-nav-display">
            <span className="week-nav-range">{weekLabel}</span>
            {weekOffset === 0 ? (
              <span className="badge badge--success-subtle">Tuần này</span>
            ) : (
              <button
                type="button"
                className="week-nav-today-jump"
                onClick={onCurrentWeek}
                title="Quay lại tuần này"
              >
                Về tuần này
              </button>
            )}
          </div>

          <button
            type="button"
            className="week-nav-btn"
            onClick={onNextWeek}
            title="Xem tuần sau"
            aria-label="Tuần sau"
          >
            <span className="nav-btn-text">Tuần sau</span>
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* ── Right: Search, Unit Type Filters & Actions ── */}
      <div className="shifts-toolbar__actions">
        {/* Tìm kiếm */}
        <div className="shifts-search-box">
          <MagnifyingGlass size={15} className="shifts-search-icon" />
          <input
            type="text"
            className="shifts-search-input"
            placeholder="Tìm nhân sự, mã KC..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Lọc theo Loại kho */}
        <div className="shifts-zone-filter">
          <select
            className="shifts-zone-select"
            value={selectedTypeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            aria-label="Lọc theo loại kho"
          >
            <option value="ALL">Tất cả loại kho</option>
            {UNIT_TYPES.map((t) => (
              <option key={t.id} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sao chép từ tuần trước */}
        <button
          type="button"
          className="btn btn--secondary shifts-copy-btn"
          onClick={onCopyPreviousWeek}
          disabled={copying || saving}
          title="Sao chép toàn bộ ca trực từ tuần liền trước vào bản nháp"
        >
          <Copy size={16} />
          <span>{copying ? "Đang sao chép..." : "Sao chép tuần trước"}</span>
        </button>

        {/* Nút Xác nhận lưu ca & Hoàn tác nhanh trên Toolbar nếu có thay đổi */}
        {hasPendingChanges && (
          <div className="shifts-toolbar-staged-actions">
            <button
              type="button"
              className="btn btn--ghost shifts-btn-revert"
              onClick={onRevertChanges}
              disabled={saving}
              title="Hủy bỏ tất cả thay đổi chưa lưu"
            >
              <ArrowCounterClockwise size={15} />
              <span>Hoàn tác</span>
            </button>

            <button
              type="button"
              className="btn btn--primary shifts-btn-save-confirm"
              onClick={onConfirmSave}
              disabled={saving}
              title="Lưu tất cả thay đổi vào cơ sở dữ liệu"
            >
              {saving ? (
                <>
                  <Spinner size={15} className="shifts-spinner" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <FloppyDisk size={15} weight="bold" />
                  <span>Xác nhận lưu ({pendingCount})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
