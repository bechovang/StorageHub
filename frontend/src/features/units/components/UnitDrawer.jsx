import { useState } from "react";
import {
  FileText,
  Clock,
  Wrench,
  SlidersHorizontal,
  Archive,
  ArrowRight,
  Copy,
  Check,
  User,
  ShieldCheck,
  FloppyDisk,
  CalendarBlank,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import { STATUS_LABELS } from "../constants.js";
import { formatVND } from "../../../utils/formatters.js";
import { getUnitStatusLabel, getAuditActionLabel } from "../../../utils/statusLabels.js";

export function UnitDrawer({
  selectedUnit,
  drawerTab,
  setDrawerTab,
  editSizeM2,
  setEditSizeM2,
  editFloor,
  setEditFloor,
  editNotes,
  setEditNotes,
  unitLogs,
  onSaveSpecs,
  onClose,
  onInitiateMaintenance,
  onInitiateFixStatus,
  onInitiateRetire,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  if (!selectedUnit) return null;

  const handleCopyCode = async () => {
    if (!selectedUnit.code) return;
    try {
      await navigator.clipboard.writeText(selectedUnit.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1600);
    } catch {
      // Fallback ignore
    }
  };

  const handleCopyContract = async () => {
    if (!selectedUnit.contractRef) return;
    try {
      await navigator.clipboard.writeText(selectedUnit.contractRef);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 1600);
    } catch {
      // Fallback ignore
    }
  };

  return (
    <Drawer
      isOpen={Boolean(selectedUnit)}
      onClose={onClose}
      headerLabel={`KHO ${selectedUnit?.code || ""}`}
      subtitle={`${selectedUnit.typeName || "Kho tiêu chuẩn"} · Khu ${selectedUnit.zone} · Tầng ${selectedUnit.floor}`}
      badge={
        <span className={`status-chip ${STATUS_LABELS[selectedUnit.status]?.class || ""}`}>
          {getUnitStatusLabel(selectedUnit.status)}
        </span>
      }
      size="lg"
    >
      <div className="mgmt-drawer-content">
        {/* Unit Hero Quick-Bar */}
        <div className="drawer-unit-hero">
          <div className="drawer-unit-hero__left">
            <div className="drawer-unit-hero__code-row">
              <span className="drawer-unit-hero__code font-mono">{selectedUnit.code}</span>
              <button
                type="button"
                className={`drawer-copy-btn ${copiedCode ? "is-copied" : ""}`}
                onClick={handleCopyCode}
                title="Sao chép mã kho nhanh"
                aria-label="Sao chép mã kho nhanh"
              >
                {copiedCode ? <Check size={13} weight="bold" /> : <Copy size={13} />}
                <span>{copiedCode ? "ĐÃ CHÉP" : "COPY MÃ"}</span>
              </button>
            </div>
            <div className="drawer-unit-hero__meta">
              <span className="drawer-unit-hero__type">{selectedUnit.typeName}</span>
              <span className="drawer-unit-hero__sep">/</span>
              <span className="drawer-unit-hero__dims font-mono">
                {selectedUnit.sizeM2 || editSizeM2 || "—"} m²
              </span>
            </div>
          </div>
          <div className="drawer-unit-hero__right">
            <div className="drawer-unit-hero__loc font-mono">
              KHU {selectedUnit.zone} · TẦNG {selectedUnit.floor}
            </div>
            <div className="drawer-unit-hero__price font-mono">
              {formatVND(selectedUnit.rentPrice || editPrice || 0)}
              <span className="drawer-unit-hero__price-sub">/tháng</span>
            </div>
          </div>
        </div>

        {/* Drawer Nav Tabs */}
        <div className="drawer-tabs">
          <button
            type="button"
            className={`drawer-tab ${drawerTab === "SPECS" ? "drawer-tab--active" : ""}`}
            onClick={() => setDrawerTab("SPECS")}
          >
            <FileText size={15} />
            <span>Thông số & Cấu hình</span>
          </button>
          <button
            type="button"
            className={`drawer-tab ${drawerTab === "LOGS" ? "drawer-tab--active" : ""}`}
            onClick={() => setDrawerTab("LOGS")}
          >
            <Clock size={15} />
            <span>Nhật ký kiểm toán ({unitLogs.length})</span>
          </button>
        </div>

        {drawerTab === "SPECS" ? (
          <form className="drawer-form" onSubmit={onSaveSpecs}>
            <div className="form-section-header">
              <span className="form-section-title">THÔNG TIN VẬN HÀNH HIỆN TẠI</span>
              <span className="form-section-sub">Dữ liệu thời gian thực từ hệ thống cơ sở</span>
            </div>

            {/* 4 Cards Bố cục thông số vận hành */}
            <div className="unit-op-cards-grid">
              {/* Card 1: Khách thuê */}
              <div className="unit-op-card">
                <div className="unit-op-card__header">
                  <User size={15} className="unit-op-card__icon" />
                  <span className="unit-op-card__label">KHÁCH THUÊ HIỆN TẠI</span>
                </div>
                <div className="unit-op-card__body">
                  <span className="unit-op-card__val font-semibold">
                    {selectedUnit.tenant || "Không có (Kho trống)"}
                  </span>
                  <span className="unit-op-card__hint">
                    {selectedUnit.tenant ? "Hợp đồng đang có hiệu lực" : "Sẵn sàng đón khách mới"}
                  </span>
                </div>
              </div>

              {/* Card 2: Hợp đồng */}
              <div className="unit-op-card">
                <div className="unit-op-card__header">
                  <FileText size={15} className="unit-op-card__icon" />
                  <span className="unit-op-card__label">MÃ HỢP ĐỒNG LIÊN KẾT</span>
                </div>
                <div className="unit-op-card__body">
                  <div className="unit-op-card__row">
                    <span className="unit-op-card__val font-mono">
                      {selectedUnit.contractRef || "—"}
                    </span>
                    {selectedUnit.contractRef && (
                      <button
                        type="button"
                        className={`drawer-copy-btn drawer-copy-btn--compact ${copiedContract ? "is-copied" : ""}`}
                        onClick={handleCopyContract}
                        title="Sao chép mã hợp đồng"
                        aria-label="Sao chép mã hợp đồng"
                      >
                        {copiedContract ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                        <span>{copiedContract ? "ĐÃ CHÉP" : "CHÉP HĐ"}</span>
                      </button>
                    )}
                  </div>
                  <span className="unit-op-card__hint">
                    {selectedUnit.contractRef ? "Chứng từ pháp lý được lưu ký" : "Chưa phát sinh hợp đồng"}
                  </span>
                </div>
              </div>

              {/* Card 3: Diễn biến kế tiếp */}
              <div className="unit-op-card">
                <div className="unit-op-card__header">
                  <CalendarBlank size={15} className="unit-op-card__icon" />
                  <span className="unit-op-card__label">DIỄN BIẾN KẾ TIẾP</span>
                </div>
                <div className="unit-op-card__body">
                  <span className="unit-op-card__val text-secondary">
                    {selectedUnit.nextEvent || "Chưa có sự kiện kế tiếp"}
                  </span>
                  <span className="unit-op-card__hint">Lịch thu phí / bàn giao tự động</span>
                </div>
              </div>

              {/* Card 4: Trạng thái bảo vệ */}
              <div className="unit-op-card">
                <div className="unit-op-card__header">
                  <ShieldCheck size={15} className="unit-op-card__icon text-success" />
                  <span className="unit-op-card__label">TRẠNG THÁI BẢO VỆ</span>
                </div>
                <div className="unit-op-card__body">
                  <div className="security-status-indicator">
                    <span className="status-dot-pulse" />
                    <span className="security-status-text">Đang bảo vệ (Tự động khóa)</span>
                  </div>
                  <span className="unit-op-card__hint">Cảm biến cửa cuốn & chốt từ IoT hoạt động</span>
                </div>
              </div>
            </div>

            <div className="drawer-kv-grid mt-4">
              <div className="drawer-kv-item">
                <span className="drawer-kv-label">Khu vực:</span>
                <span className="drawer-kv-value font-semibold">{selectedUnit.zone || "—"}</span>
              </div>
              <div className="drawer-kv-item">
                <span className="drawer-kv-label">Loại kho:</span>
                <span className="drawer-kv-value font-mono">{selectedUnit.typeName || "—"}</span>
              </div>
              <div className="drawer-kv-item">
                <span className="drawer-kv-label">Kiểu ra vào:</span>
                <span className="drawer-kv-value text-muted">
                  {selectedUnit.accessType || "—"}
                </span>
              </div>
              <div className="drawer-kv-item">
                <span className="drawer-kv-label">Trạng thái:</span>
                <span className="drawer-kv-value text-success font-semibold">
                  {getUnitStatusLabel(selectedUnit.status) || STATUS_LABELS[selectedUnit.status]?.text || selectedUnit.status}
                </span>
              </div>
            </div>

            <div className="form-section-header mt-4">
              <span className="form-section-title">CHỈNH SỬA THÔNG SỐ CƠ BẢN</span>
              <span className="form-section-sub">Cập nhật diện tích và thông tin vị trí</span>
            </div>
            <p className="text-muted text-xs mb-3">
              Lưu ý: Đơn giá thuê kho được quản lý tập trung tại trang Chính sách thuê (Policy) — không chỉnh tại đây.
            </p>

            <div className="drawer-form-row">
              <div className="form-group">
                <label htmlFor="edit-size" className="form-label">
                  Diện tích sử dụng (m²):
                </label>
                <div className="input-group-addon">
                  <input
                    id="edit-size"
                    type="number"
                    step="0.5"
                    className="form-input font-mono"
                    value={editSizeM2}
                    onChange={(e) => setEditSizeM2(e.target.value)}
                    required
                  />
                  <span className="input-addon font-mono">m²</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-floor" className="form-label">
                  Tầng:
                </label>
                <input
                  id="edit-floor"
                  type="number"
                  className="form-input font-mono"
                  value={editFloor}
                  onChange={(e) => setEditFloor(e.target.value)}
                />
              </div>
            </div>

<div className="form-group">
              <label htmlFor="edit-notes" className="form-label">
                Ghi chú vận hành cơ sở:
              </label>
              <textarea
                id="edit-notes"
                className="form-textarea"
                rows={3}
                placeholder="Ghi chú về tình trạng kỹ thuật, lối ra vào, vị trí thuận lợi..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <div className="drawer-actions">
              <button type="submit" className="btn btn--primary">
                <FloppyDisk size={16} weight="bold" />
                <span>Lưu thông số kho</span>
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onClose}
              >
                Đóng
              </button>
            </div>

            <div className="form-section-header mt-6">
              <span className="form-section-title">HÀNH ĐỘNG ĐẶC BIỆT (CÓ GUARD GIÁM SÁT)</span>
              <span className="form-section-sub">Yêu cầu xác thực nghiệp vụ trước khi chuyển trạng thái</span>
            </div>

            <div className="drawer-special-actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onInitiateMaintenance(selectedUnit)}
                disabled={selectedUnit.status === "MAINTENANCE" || selectedUnit.status === "RETIRED"}
              >
                <Wrench size={15} />
                <span>Chuyển vào bảo trì</span>
              </button>

              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onInitiateFixStatus(selectedUnit)}
              >
                <SlidersHorizontal size={15} />
                <span>Sửa trạng thái trực tiếp</span>
              </button>

              {selectedUnit.status !== "RETIRED" && (
                <button
                  type="button"
                  className="btn btn--outline btn--danger-outline"
                  onClick={() => onInitiateRetire(selectedUnit)}
                >
                  <Archive size={15} />
                  <span>Ngừng khai thác (Retire)</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="drawer-logs-tab">
            <div className="logs-header-note">
              <strong>Quy chuẩn kiểm toán:</strong> Mọi thao tác điều chỉnh thông số, chuyển trạng thái kho {selectedUnit.code} đều được ký số và lưu vĩnh viễn trên sổ nhật ký giám sát cơ sở.
            </div>

            {unitLogs.length === 0 ? (
              <div className="logs-empty">Chưa có bản ghi nhật ký nào cho kho này.</div>
            ) : (
              <div className="audit-timeline">
                {unitLogs.map((log) => {
                  const actorInitial = log.actor ? String(log.actor).trim().charAt(0).toUpperCase() : "S";
                  return (
                    <div key={log.id} className="audit-node">
                      <div className="audit-node__marker">
                        <span className="audit-node__dot" />
                      </div>
                      <div className="audit-node__content">
                        <div className="audit-node__header">
                          <div className="audit-node__actor">
                            <span className="audit-actor-badge font-mono">{actorInitial}</span>
                            <span className="audit-actor-name">{log.actor}</span>
                          </div>
                          <span className="audit-node__time font-mono">
                            {new Date(log.timestamp).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="audit-node__action">
                          <span className="log-badge font-mono">{getAuditActionLabel(log.action)}</span>
                          {log.fromStatus && log.toStatus && (
                            <span className="log-transition">
                              <span className={`status-chip status-chip--${String(log.fromStatus).toLowerCase()}`}>
                                {getUnitStatusLabel(log.fromStatus)}
                              </span>
                              <ArrowRight size={12} className="mx-1 text-muted" />
                              <span className={`status-chip status-chip--${String(log.toStatus).toLowerCase()}`}>
                                {getUnitStatusLabel(log.toStatus)}
                              </span>
                            </span>
                          )}
                        </div>

                        {log.reason && (
                          <div className="audit-node__reason">
                            <span className="audit-reason-label">Giải trình:</span> {log.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
