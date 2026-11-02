import { useState, useMemo } from "react";
import {
  X,
  User,
  WarningCircle,
  CheckCircle,
  Trash,
  Plus,
  Warehouse,
  Check,
} from "@phosphor-icons/react";
import { UNIT_TYPES } from "../../../services/shiftService.js";

const TYPE_COLORS = {
  LOCK: "#7c3aed",
  S: "#0284c7",
  M: "#ea580c",
  L: "#16a34a",
  LOCKER: "#7c3aed",
};

export default function ShiftFillPopover({
  activePopover,
  staffList = [],
  allShifts = [],
  onClose,
  onSaveFill,
  onRemoveShift,
}) {
  if (!activePopover) return null;

  const {
    shiftKey,
    shiftInfo,
    day,
    existingAssignment,
    currentSlotStaffIds = [],
  } = activePopover;

  const isEditMode = Boolean(existingAssignment);
  const isMaxCapacity = !isEditMode && currentSlotStaffIds.length >= 4;

  // Lọc ra các nhân viên chưa có trong slot này để chọn mặc định
  const availableCandidate = staffList.find(
    (s) => !currentSlotStaffIds.includes(s.id)
  );

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState(
    existingAssignment?.staffId || availableCandidate?.id || staffList[0]?.id || ""
  );

  const [selectedTypeIds, setSelectedTypeIds] = useState(
    existingAssignment?.unitTypeIds?.length
      ? existingAssignment.unitTypeIds
      : [UNIT_TYPES[0].id, UNIT_TYPES[1].id] // Mặc định chọn LOCK + S
  );

  const [errorMsg, setErrorMsg] = useState(null);

  // Tính toán trạng thái khả dụng của từng nhân viên trong ngày này
  const staffAvailability = useMemo(() => {
    return staffList.map((staff) => {
      const isAlreadyInThisSlot = currentSlotStaffIds.includes(staff.id);

      const todayOtherShifts = allShifts.filter(
        (s) =>
          s.staffId === staff.id &&
          s.date === day.key &&
          s.shiftWindow !== shiftKey
      );

      let status = "AVAILABLE";
      let statusText = "Khả dụng";
      let isBlocked = false;

      if (isAlreadyInThisSlot) {
        status = "BUSY_SAME";
        statusText = "Đã trong ca";
        isBlocked = true;
      } else if (todayOtherShifts.length > 0) {
        status = "BUSY_OTHER";
        statusText = `Đã có ca ${
          todayOtherShifts[0].shiftWindow === "MORNING" ? "Sáng" : "Tối"
        }`;
      }

      return {
        ...staff,
        status,
        statusText,
        isBlocked,
      };
    });
  }, [staffList, allShifts, day, shiftKey, currentSlotStaffIds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTypeIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 loại kho.");
      return;
    }

    if (isMaxCapacity) {
      setErrorMsg("Ca trực này đã đạt giới hạn tối đa 4 nhân viên/ca.");
      return;
    }

    const staffId = isEditMode
      ? existingAssignment.staffId
      : Number(selectedStaffId);

    if (!staffId) return;

    onSaveFill({
      staffId,
      unitTypeIds: selectedTypeIds,
      shiftKey,
      workDate: day.key,
    });
  };

  const handleDelete = () => {
    if (!existingAssignment) return;
    onRemoveShift(existingAssignment);
  };

  return (
    <div
      className="shift-popover-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="shift-popover-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shift-popover-header">
          <div>
            <div className="shift-popover-badge-group">
              <span className="shift-popover-badge">
                {isEditMode ? "Chỉnh sửa phân công" : "Phân công nhân sự vào ca"}
              </span>
              <span className="shift-popover-guideline">
                Tối đa 4 nhân viên/ca
              </span>
            </div>
            <h3 className="shift-popover-title">
              {shiftInfo.name} ({shiftInfo.hours})
            </h3>
            <p className="shift-popover-meta">
              <span>{day.dayName}</span>
              <span className="dot-sep">·</span>
              <span>{day.fullDate}</span>
            </p>
          </div>
          <button
            type="button"
            className="shift-popover-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="shift-popover-error" role="alert">
            <WarningCircle size={16} weight="fill" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isMaxCapacity && (
          <div className="shift-popover-error" role="alert">
            <WarningCircle size={16} weight="fill" />
            <span>
              Ca trực này đã đủ tối đa 4 nhân viên/ca. Vui lòng gỡ bớt nhân sự trước khi phân công thêm.
            </span>
          </div>
        )}

        {/* ── Chế độ CHỈNH SỬA PHÂN CÔNG (Edit Mode) ── */}
        {isEditMode ? (
          <form onSubmit={handleSubmit} className="shift-popover-body">
            <div className="shift-detail-box">
              <div className="shift-detail-row">
                <span className="detail-label">
                  <User size={16} /> Nhân viên đang trực:
                </span>
                <strong className="detail-value">
                  {existingAssignment.staffName} ({existingAssignment.staffCode})
                </strong>
              </div>

              {existingAssignment.isConflict && (
                <div className="conflict-badge-inline" style={{ marginTop: "10px" }}>
                  <WarningCircle size={16} weight="fill" />
                  <span>
                    Phát hiện trùng lịch trực ca khác trong ngày trên nhân viên này!
                  </span>
                </div>
              )}
            </div>

            {/* Chọn Loại kho phụ trách (Gom các phân khu) */}
            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label">
                <Warehouse size={15} /> Các loại kho phụ trách trong ca:
              </label>
              <div className="shift-check-grid">
                {UNIT_TYPES.map((t) => {
                  const checked = selectedTypeIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`shift-check-chip ${checked ? "is-checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedTypeIds((prev) =>
                            prev.includes(t.id)
                              ? prev.filter((id) => id !== t.id)
                              : [...prev, t.id]
                          );
                        }}
                      />
                      <span
                        className="shift-type-dot"
                        style={{
                          backgroundColor: TYPE_COLORS[t.code] || "#475569",
                        }}
                      />
                      <span>{t.name}</span>
                    </label>
                  );
                })}
              </div>
              {selectedTypeIds.length === 0 && (
                <span
                  className="text-error"
                  style={{ fontSize: "0.74rem", marginTop: "4px", display: "block" }}
                >
                  * Vui lòng chọn ít nhất 1 loại kho.
                </span>
              )}
            </div>

            {/* Nút hành động */}
            <div className="shift-popover-actions">
              <button
                type="button"
                className="btn btn--danger-outline"
                onClick={handleDelete}
                title="Gỡ nhân viên khỏi ca này trong bản nháp"
              >
                <Trash size={16} />
                <span>Gỡ khỏi ca</span>
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={onClose}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className={`btn ${
                    selectedTypeIds.length === 0 ? "btn--disabled" : "btn--primary"
                  }`}
                  disabled={selectedTypeIds.length === 0}
                >
                  <Check size={16} weight="bold" />
                  <span>Cập nhật phân công</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ── Chế độ THÊM NHÂN VIÊN VÀO CA (Add Mode) ── */
          <form onSubmit={handleSubmit} className="shift-popover-body">
            {/* Bước 1: Chọn nhân viên */}
            <div className="form-group">
              <label className="form-label" htmlFor="popover-select-staff">
                Chọn nhân viên trực ca (Hiện có {currentSlotStaffIds.length}/4 người)
              </label>
              <div className="staff-selection-list">
                {staffAvailability.map((staff) => (
                  <label
                    key={staff.id}
                    className={`staff-radio-card ${
                      Number(selectedStaffId) === staff.id ? "is-selected" : ""
                    } ${staff.isBlocked ? "is-blocked" : ""}`}
                  >
                    <input
                      type="radio"
                      name="shift-staff"
                      value={staff.id}
                      checked={Number(selectedStaffId) === staff.id}
                      disabled={staff.isBlocked || isMaxCapacity}
                      onChange={() => setSelectedStaffId(staff.id)}
                    />
                    <div className="staff-radio-content">
                      <div className="staff-radio-main">
                        <strong className="staff-radio-name">{staff.fullName}</strong>
                        <span className="staff-radio-code">{staff.code}</span>
                      </div>
                      <span
                        className={`staff-status-badge ${
                          staff.isBlocked
                            ? "staff-status-badge--neutral"
                            : staff.status === "BUSY_OTHER"
                            ? "staff-status-badge--warning"
                            : "staff-status-badge--success"
                        }`}
                      >
                        {staff.statusText}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Bước 2: Chọn Loại kho phụ trách */}
            <div className="form-group">
              <label className="form-label">
                Loại kho phụ trách trong ca (chọn nhiều để gom vào 1 thẻ)
              </label>
              <div className="shift-check-grid">
                {UNIT_TYPES.map((t) => {
                  const checked = selectedTypeIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`shift-check-chip ${checked ? "is-checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isMaxCapacity}
                        onChange={() => {
                          setSelectedTypeIds((prev) =>
                            prev.includes(t.id)
                              ? prev.filter((id) => id !== t.id)
                              : [...prev, t.id]
                          );
                        }}
                      />
                      <span
                        className="shift-type-dot"
                        style={{ backgroundColor: TYPE_COLORS[t.code] || "#475569" }}
                      />
                      <span>{t.name}</span>
                    </label>
                  );
                })}
              </div>
              {selectedTypeIds.length === 0 && (
                <span
                  className="text-error"
                  style={{ fontSize: "0.74rem", marginTop: "4px", display: "block" }}
                >
                  * Vui lòng chọn ít nhất 1 loại kho.
                </span>
              )}
            </div>

            {/* Trạng thái xác thực */}
            <div className="shift-popover-conflict-status">
              {isMaxCapacity ? (
                <div className="conflict-badge-inline">
                  <WarningCircle size={16} weight="fill" />
                  <span>Đã đạt tối đa 4 nhân viên/ca</span>
                </div>
              ) : (
                <div className="valid-badge-inline">
                  <CheckCircle size={16} weight="fill" />
                  <span>Sẵn sàng thêm nhân viên vào ca (Bản nháp)</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="shift-popover-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`btn ${
                  isMaxCapacity || selectedTypeIds.length === 0 || !selectedStaffId
                    ? "btn--disabled"
                    : "btn--primary"
                }`}
                disabled={isMaxCapacity || selectedTypeIds.length === 0 || !selectedStaffId}
              >
                <Plus size={16} weight="bold" />
                <span>Thêm vào ca</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
