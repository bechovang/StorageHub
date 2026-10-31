import {
  FileText,
  Clock,
  Wrench,
  SlidersHorizontal,
  Archive,
  ArrowRight,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import { STATUS_LABELS } from "../constants.js";

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
  if (!selectedUnit) return null;

  return (
    <Drawer
      isOpen={Boolean(selectedUnit)}
      onClose={onClose}
      title={`KHO ${selectedUnit?.code || ""} — CHI TIẾT & VẬN HÀNH`}
      size="lg"
    >
      <div className="mgmt-drawer-content">
        {/* Drawer status bar */}
        <div className="drawer-unit-banner">
          <div className="drawer-unit-banner__left">
            <span className="drawer-code font-mono">{selectedUnit.code}</span>
            <span className="drawer-type">{selectedUnit.typeName}</span>
            <span className={`status-chip ${STATUS_LABELS[selectedUnit.status]?.class}`}>
              {STATUS_LABELS[selectedUnit.status]?.text}
            </span>
          </div>
          <div className="drawer-unit-banner__right">
            <span className="drawer-zone">{selectedUnit.zone} · Tầng {selectedUnit.floor}</span>
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
            <div className="form-section-title">THÔNG TIN VẬN HÀNH HIỆN TẠI</div>

            <div className="drawer-kv-grid">
              <div className="drawer-kv-item">
                <span className="drawer-kv-label">Khu vực:</span>
                <span className="drawer-kv-value font-semibold">{selectedUnit.zone}</span>
              </div>
              <div className="drawer-kv-item">
                <span className="drawer-kv-label">Loại kho:</span>
                <span className="drawer-kv-value font-mono">{selectedUnit.typeName}</span>
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
                  {STATUS_LABELS[selectedUnit.status]?.text || selectedUnit.status}
                </span>
              </div>
            </div>

            <div className="form-section-title mt-4">CHỈNH SỬA THÔNG SỐ CƠ BẢN</div>
            <p className="text-muted text-xs mb-2">
              Lưu ý: Đơn giá thuê kho được quản lý tập trung tại trang Chính sách thuê (Policy) — không chỉnh tại đây.
            </p>

            <div className="form-group">
              <label htmlFor="edit-size" className="form-label">
                Diện tích sử dụng (m²):
              </label>
              <input
                id="edit-size"
                type="number"
                step="0.5"
                className="form-input font-mono"
                value={editSizeM2}
                onChange={(e) => setEditSizeM2(e.target.value)}
                required
              />
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
                Lưu thông số kho
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onClose}
              >
                Đóng
              </button>
            </div>

            <div className="form-section-title mt-6">HÀNH ĐỘNG ĐẶC BIỆT (CÓ GUARD GIÁM SÁT)</div>
            <div className="drawer-special-actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onInitiateMaintenance(selectedUnit)}
                disabled={selectedUnit.status === "MAINTENANCE" || selectedUnit.status === "RETIRED"}
              >
                <Wrench size={14} />
                <span>Chuyển vào bảo trì</span>
              </button>

              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onInitiateFixStatus(selectedUnit)}
              >
                <SlidersHorizontal size={14} />
                <span>Sửa trạng thái trực tiếp</span>
              </button>

              {selectedUnit.status !== "RETIRED" && (
                <button
                  type="button"
                  className="btn btn--outline btn--danger-outline"
                  onClick={() => onInitiateRetire(selectedUnit)}
                >
                  <Archive size={14} />
                  <span>Cho nghỉ kho (Retire)</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="drawer-logs-tab">
            <div className="logs-header-note">
              Nhật ký kiểm toán ghi nhận mọi thao tác điều chỉnh trạng thái, thông số của kho {selectedUnit.code} vào hệ thống giám sát.
            </div>
            {unitLogs.length === 0 ? (
              <div className="logs-empty">Chưa có bản ghi nhật ký nào cho kho này.</div>
            ) : (
              <div className="logs-timeline">
                {unitLogs.map((log) => (
                  <div key={log.id} className="log-entry">
                    <div className="log-entry__meta">
                      <span className="log-timestamp font-mono">
                        {new Date(log.timestamp).toLocaleString("vi-VN")}
                      </span>
                      <span className="log-actor">{log.actor}</span>
                    </div>
                    <div className="log-entry__action">
                      <span className="log-badge font-mono">{log.action}</span>
                      {log.fromStatus && log.toStatus && (
                        <span className="log-transition">
                          <span className={`status-chip status-chip--${log.fromStatus.toLowerCase()}`}>
                            {log.fromStatus}
                          </span>
                          <ArrowRight size={12} className="mx-1" />
                          <span className={`status-chip status-chip--${log.toStatus.toLowerCase()}`}>
                            {log.toStatus}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="log-entry__reason">
                      <strong>Lý do:</strong> {log.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
