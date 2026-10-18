import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  Warehouse,
  MagnifyingGlass,
  Wrench,
  Warning,
  ShieldCheck,
  Clock,
  ArrowsClockwise,
  ArrowRight,
  WarningCircle,
  SlidersHorizontal,
  NotePencil,
  Archive,
  CheckCircle,
  X,
  FileText,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Drawer from "../../components/Drawer/Drawer.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import { formatVND } from "../../utils/formatters.js";
import {
  getFacilityUnits,
  updateUnitSpecs,
  checkRetireGuard,
  retireUnit,
  checkMaintenanceGuard,
  setUnitMaintenance,
  finishUnitMaintenance,
  fixUnitStatus,
  getUnitActivityLogs,
  resetFacilityUnits,
} from "../../services/unitService.js";
import "./UnitManagementPage.css";

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "AVAILABLE", label: "Trống" },
  { key: "RENTED", label: "Đang thuê" },
  { key: "RESERVED", label: "Đã đặt chỗ" },
  { key: "PREPARING", label: "Đang xử lý" },
  { key: "MAINTENANCE", label: "Bảo trì" },
  { key: "RETIRED", label: "Ngừng thuê" },
];

const STATUS_LABELS = {
  AVAILABLE: { text: "Trống", class: "status-chip--available" },
  RENTED: { text: "Đang thuê", class: "status-chip--rented" },
  RESERVED: { text: "Đã đặt chỗ", class: "status-chip--reserved" },
  PREPARING: { text: "Đang xử lý", class: "status-chip--preparing" },
  MAINTENANCE: { text: "Bảo trì", class: "status-chip--maintenance" },
  RETIRED: { text: "Ngừng thuê", class: "status-chip--retired" },
};

export default function UnitManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dữ liệu Units từ Storage/Service
  const [units, setUnits] = useState(() => getFacilityUnits());

  // Bộ lọc trạng thái lấy trực tiếp từ searchParams (Single Source of Truth)
  const activeStatusTab = searchParams.get("status") || "ALL";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");

  // Drawer chi tiết / chỉnh sửa
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [drawerTab, setDrawerTab] = useState("SPECS"); // "SPECS" | "LOGS"

  // Form edit specs trong drawer
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSizeM2, setEditSizeM2] = useState("");

  // Modals
  // 1. Blocker modal (khi vi phạm guard)
  const [blockerModalData, setBlockerModalData] = useState(null);
  // 2. Retire confirm modal (khi guard cho phép)
  const [retireTargetUnit, setRetireTargetUnit] = useState(null);
  // 3. Maintenance reason modal
  const [maintenanceTargetUnit, setMaintenanceTargetUnit] = useState(null);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  // 4. Fix status modal
  const [fixStatusTargetUnit, setFixStatusTargetUnit] = useState(null);
  const [fixStatusValue, setFixStatusValue] = useState("AVAILABLE");
  const [fixStatusReason, setFixStatusReason] = useState("");
  const [fixStatusError, setFixStatusError] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  // Khi chọn tab -> sync URL search params
  const handleSelectTab = (tabKey) => {
    if (tabKey === "ALL") {
      searchParams.delete("status");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: tabKey }, { replace: true });
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Thống kê số lượng
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: units.length,
      AVAILABLE: 0,
      RENTED: 0,
      RESERVED: 0,
      PREPARING: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
    };
    units.forEach((u) => {
      if (counts[u.status] !== undefined) counts[u.status]++;
    });
    return counts;
  }, [units]);

  // Danh sách lọc
  const filteredUnits = useMemo(() => {
    let result = [...units];
    if (activeStatusTab !== "ALL") {
      result = result.filter((u) => u.status === activeStatusTab);
    }
    if (selectedZone !== "ALL") {
      result = result.filter((u) => u.zone === selectedZone);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.code.toLowerCase().includes(q) ||
          u.typeName.toLowerCase().includes(q) ||
          (u.tenant && u.tenant.toLowerCase().includes(q)) ||
          (u.contractRef && u.contractRef.toLowerCase().includes(q))
      );
    }
    return result;
  }, [units, activeStatusTab, selectedZone, searchTerm]);

  // Mở Drawer chi tiết kho
  const handleOpenDrawer = (unit) => {
    setSelectedUnit(unit);
    setDrawerTab("SPECS");
    setEditPrice(String(unit.baseRentPrice));
    setEditNotes(unit.notes || "");
    setEditSizeM2(String(unit.sizeM2));
  };

  const handleCloseDrawer = () => {
    setSelectedUnit(null);
  };

  // Lưu thông số kho (Update Specs)
  const handleSaveSpecs = (e) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      const updated = updateUnitSpecs(selectedUnit.id, {
        baseRentPrice: Number(editPrice),
        notes: editNotes,
        sizeM2: Number(editSizeM2),
      });
      setSelectedUnit(updated);
      setUnits(getFacilityUnits());
      showToast(`Đã lưu thông số kho ${updated.code} thành công.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 1. Thao tác Cho nghỉ kho (Retire Unit) — Kèm Guard + Blocker + Confirm (FR-26)
  const handleInitiateRetire = (unit) => {
    const guard = checkRetireGuard(unit);
    if (!guard.allowed) {
      setBlockerModalData({
        unit,
        blocker: guard.blocker,
      });
      return;
    }
    // Hợp lệ -> Mở modal xác nhận
    setRetireTargetUnit(unit);
  };

  const handleConfirmRetire = () => {
    if (!retireTargetUnit) return;
    try {
      const updated = retireUnit(retireTargetUnit.id);
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      setRetireTargetUnit(null);
      showToast(`Kho ${updated.code} đã được chuyển sang trạng thái Ngừng thuê (RETIRED).`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 2. Thao tác Đưa vào Bảo trì (Set Maintenance) — Kèm Guard + Blocker (FR-26)
  const handleInitiateMaintenance = (unit) => {
    const guard = checkMaintenanceGuard(unit);
    if (!guard.allowed) {
      setBlockerModalData({
        unit,
        blocker: guard.blocker,
      });
      return;
    }
    setMaintenanceTargetUnit(unit);
    setMaintenanceReason("");
  };

  const handleConfirmMaintenance = () => {
    if (!maintenanceTargetUnit) return;
    try {
      const updated = setUnitMaintenance(maintenanceTargetUnit.id, maintenanceReason);
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      setMaintenanceTargetUnit(null);
      showToast(`Kho ${updated.code} đã được chuyển vào bảo trì.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Hoàn tất bảo trì -> Tự động sang PREPARING + Cleaning Task (Rule FR-26/20)
  const handleFinishMaintenance = (unit) => {
    try {
      const updated = finishUnitMaintenance(unit.id);
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      showToast(`Bảo trì hoàn tất. Kho ${updated.code} đã chuyển sang Đang xử lý (PREPARING) để dọn dẹp bàn giao.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. Sửa trạng thái trực tiếp (Fix Status) — Bắt buộc nhập lý do (FR-26 / Flow 4)
  const handleInitiateFixStatus = (unit) => {
    setFixStatusTargetUnit(unit);
    setFixStatusValue(unit.status === "RENTED" ? "PREPARING" : "AVAILABLE");
    setFixStatusReason("");
    setFixStatusError("");
  };

  const handleConfirmFixStatus = () => {
    if (!fixStatusTargetUnit) return;
    if (!fixStatusReason.trim() || fixStatusReason.trim().length < 5) {
      setFixStatusError("Lý do điều chỉnh là bắt buộc theo quy định kiểm toán (tối thiểu 5 ký tự).");
      return;
    }
    try {
      const updated = fixUnitStatus(
        fixStatusTargetUnit.id,
        fixStatusValue,
        fixStatusReason
      );
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      setFixStatusTargetUnit(null);
      showToast(`Đã điều chỉnh trạng thái kho ${updated.code} thành ${fixStatusValue}.`);
    } catch (err) {
      setFixStatusError(err.message);
    }
  };

  // Logs của kho đang chọn trong Drawer
  const unitLogs = useMemo(() => {
    if (!selectedUnit) return [];
    void units;
    return getUnitActivityLogs(selectedUnit.code);
  }, [selectedUnit, units]);

  return (
    <AppShell brandHref="/facility" roleLabel="FACILITY MANAGER">
      <div className="unit-mgmt-page">
        {/* ── 1. Telemetry Context Strip ── */}
        <section className="mgmt-telemetry" aria-label="Thông tin cơ sở & kiểm toán">
          <div className="mgmt-telemetry__inner">
            <div className="mgmt-telemetry__left">
              <div className="telemetry-item">
                <Warehouse size={16} className="text-muted" />
                <span className="telemetry-bold">Cơ sở:</span>
                <span>Tân Bình Gateway (VN-SGN-01)</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <ShieldCheck size={16} className="text-success" />
                <span>Quy chuẩn vận hành:</span>
                <span className="font-mono font-semibold">FR-26 / UJ-4 Guard Enforced</span>
              </div>
            </div>

            <div className="mgmt-telemetry__right">
              <div className="telemetry-item">
                <span className="telemetry-badge-count">
                  Tổng: <strong>{statusCounts.ALL} kho</strong>
                </span>
                <span className="telemetry-badge-count text-success">
                  Thuê: <strong>{statusCounts.RENTED}</strong> ({((statusCounts.RENTED / (statusCounts.ALL || 1)) * 100).toFixed(0)}%)
                </span>
                <span className="telemetry-badge-count">
                  Trống: <strong>{statusCounts.AVAILABLE}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => {
                  if (confirm("Khôi phục danh sách kho về dữ liệu mẫu ban đầu?")) {
                    resetFacilityUnits();
                    setUnits(getFacilityUnits());
                    showToast("Đã khôi phục dữ liệu danh mục kho về ban đầu.");
                  }
                }}
                title="Khôi phục dữ liệu ban đầu"
              >
                <ArrowsClockwise size={14} />
                <span>Reset demo</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 2. Header & Breadcrumbs ── */}
        <header className="mgmt-header">
          <div className="mgmt-header__titles">
            <span className="mgmt-header__eyebrow">FACILITY CONTROL ROOM · US-25 · FR-26</span>
            <h1 className="mgmt-header__title">QUẢN LÝ DANH MỤC KHO & TRẠNG THÁI</h1>
            <p className="mgmt-header__desc">
              Kiểm soát trạng thái vật lý, điều chỉnh thông số, đưa vào bảo trì hoặc cho nghỉ kho. Mọi thay đổi trạng thái đều được giám sát qua Guard và lưu nhật ký kiểm toán Activity Log.
            </p>
          </div>
        </header>

        {/* ── 3. Controls & Filter Bar ── */}
        <div className="mgmt-controls">
          <div className="mgmt-controls__search">
            <MagnifyingGlass size={16} className="mgmt-search-icon" />
            <input
              type="text"
              className="mgmt-search-input"
              placeholder="Tìm theo mã kho (S-1, M-2), loại kho, khách thuê, hợp đồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="mgmt-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mgmt-controls__filters">
            <div className="zone-select-wrap">
              <label htmlFor="zone-filter" className="zone-label">Khu vực:</label>
              <select
                id="zone-filter"
                className="zone-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="ALL">Tất cả khu vực</option>
                <option value="Zone A">Zone A (Tầng 1)</option>
                <option value="Zone B">Zone B (Tầng 2)</option>
                <option value="Zone C">Zone C (Locker)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 4. Status Tabs ── */}
        <nav className="mgmt-status-tabs" aria-label="Lọc theo trạng thái kho">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = activeStatusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`mgmt-status-tab ${isActive ? "mgmt-status-tab--active" : ""}`}
                onClick={() => handleSelectTab(tab.key)}
              >
                <span className="mgmt-tab-label">{tab.label}</span>
                <span className={`mgmt-tab-count ${isActive ? "mgmt-tab-count--active" : ""}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── 5. Main Table ── */}
        <div className="mgmt-table-container">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>MÃ KHO</th>
                <th>PHÂN LOẠI & DIỆN TÍCH</th>
                <th>VỊ TRÍ</th>
                <th>TRẠNG THÁI</th>
                <th>GIÁ NIÊM YẾT</th>
                <th>KHÁCH THUÊ & DIỄN BIẾN</th>
                <th style={{ textAlign: "right", width: "240px" }}>THAO TÁC QUẢN TRỊ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="mgmt-table-empty">
                    <Archive size={32} className="text-muted mb-2" />
                    <div>Không tìm thấy kho nào phù hợp với bộ lọc hiện tại.</div>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm mt-2"
                      onClick={() => {
                        setSelectedZone("ALL");
                        setSearchTerm("");
                        searchParams.delete("status");
                        setSearchParams(searchParams, { replace: true });
                      }}
                    >
                      Xóa bộ lọc
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => {
                  const statusMeta = STATUS_LABELS[unit.status] || { text: unit.status, class: "" };
                  return (
                    <tr key={unit.id} className="mgmt-row">
                      <td>
                        <strong className="unit-code-badge">{unit.code}</strong>
                      </td>
                      <td>
                        <div className="unit-type-cell">
                          <span className="font-semibold">{unit.typeName}</span>
                          <span className="text-muted text-xs font-mono">{unit.sizeM2} m²</span>
                        </div>
                      </td>
                      <td>
                        <div className="unit-loc-cell">
                          <span>{unit.zone}</span>
                          <span className="text-muted text-xs">Tầng {unit.floor}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-chip ${statusMeta.class}`}>
                          {statusMeta.text}
                        </span>
                      </td>
                      <td className="font-mono">
                        {formatVND(unit.baseRentPrice)}
                        <span className="text-muted text-xs">/tháng</span>
                      </td>
                      <td>
                        <div className="tenant-info-cell">
                          {unit.tenant ? (
                            <div className="tenant-info-header">
                              <span className="tenant-name font-semibold">{unit.tenant}</span>
                              {unit.contractRef && (
                                <span className="contract-tag font-mono">{unit.contractRef}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted italic text-xs">Chưa có khách thuê</span>
                          )}
                          <div className="tenant-event text-xs text-muted">{unit.nextEvent}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn--secondary btn--xs"
                            onClick={() => handleOpenDrawer(unit)}
                            title="Xem chi tiết & Sửa thông số"
                          >
                            <NotePencil size={13} />
                            <span>Sửa</span>
                          </button>

                          {unit.status === "MAINTENANCE" ? (
                            <button
                              type="button"
                              className="btn btn--success btn--xs"
                              onClick={() => handleFinishMaintenance(unit)}
                              title="Hoàn tất bảo trì -> Chuyển sang Dọn dẹp"
                            >
                              <CheckCircle size={13} />
                              <span>Xong bảo trì</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn--outline btn--xs"
                              onClick={() => handleInitiateMaintenance(unit)}
                              disabled={unit.status === "RETIRED"}
                              title="Đưa vào bảo dưỡng kỹ thuật"
                            >
                              <Wrench size={13} />
                              <span>Bảo trì</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn--outline btn--xs"
                            onClick={() => handleInitiateFixStatus(unit)}
                            title="Sửa trạng thái thủ công (Bắt buộc lý do)"
                          >
                            <SlidersHorizontal size={13} />
                            <span>Đổi trạng thái</span>
                          </button>

                          {unit.status !== "RETIRED" && (
                            <button
                              type="button"
                              className="btn btn--outline btn--xs btn--danger-outline"
                              onClick={() => handleInitiateRetire(unit)}
                              title="Cho nghỉ kho (Kiểm tra Guard hợp đồng)"
                            >
                              <span>Cho nghỉ</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 6. Drawer Chi tiết & Chỉnh sửa kho (FR-26) ── */}
        <Drawer
          isOpen={Boolean(selectedUnit)}
          onClose={handleCloseDrawer}
          title={`KHO ${selectedUnit?.code || ""} — CHI TIẾT & VẬN HÀNH`}
          size="lg"
        >
          {selectedUnit && (
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
                <form className="drawer-form" onSubmit={handleSaveSpecs}>
                  <div className="form-section-title">THÔNG TIN VẬN HÀNH HIỆN TẠI</div>

                  <div className="drawer-kv-grid">
                    <div className="drawer-kv-item">
                      <span className="drawer-kv-label">Khách thuê hiện tại:</span>
                      <span className="drawer-kv-value font-semibold">
                        {selectedUnit.tenant || "Không có (Kho trống)"}
                      </span>
                    </div>
                    <div className="drawer-kv-item">
                      <span className="drawer-kv-label">Mã hợp đồng:</span>
                      <span className="drawer-kv-value font-mono">
                        {selectedUnit.contractRef || "—"}
                      </span>
                    </div>
                    <div className="drawer-kv-item">
                      <span className="drawer-kv-label">Diễn biến kế tiếp:</span>
                      <span className="drawer-kv-value text-muted">
                        {selectedUnit.nextEvent || "—"}
                      </span>
                    </div>
                    <div className="drawer-kv-item">
                      <span className="drawer-kv-label">Trạng thái bảo vệ:</span>
                      <span className="drawer-kv-value text-success font-semibold">
                        Guard Active (FR-26)
                      </span>
                    </div>
                  </div>

                  <div className="form-section-title mt-4">CHỈNH SỬA THÔNG SỐ CƠ BẢN</div>

                  <div className="form-group">
                    <label htmlFor="edit-price" className="form-label">
                      Giá thuê niêm yết (VND / tháng):
                    </label>
                    <input
                      id="edit-price"
                      type="number"
                      className="form-input font-mono"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </div>

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
                      onClick={handleCloseDrawer}
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="form-section-title mt-6">HÀNH ĐỘNG ĐẶC BIỆT (CÓ GUARD GIÁM SÁT)</div>
                  <div className="drawer-special-actions">
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => handleInitiateMaintenance(selectedUnit)}
                      disabled={selectedUnit.status === "MAINTENANCE" || selectedUnit.status === "RETIRED"}
                    >
                      <Wrench size={14} />
                      <span>Chuyển vào bảo trì</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => handleInitiateFixStatus(selectedUnit)}
                    >
                      <SlidersHorizontal size={14} />
                      <span>Sửa trạng thái trực tiếp</span>
                    </button>

                    {selectedUnit.status !== "RETIRED" && (
                      <button
                        type="button"
                        className="btn btn--outline btn--danger-outline"
                        onClick={() => handleInitiateRetire(selectedUnit)}
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
                    Nhật ký kiểm toán ghi nhận mọi thao tác điều chỉnh trạng thái, thông số của kho {selectedUnit.code} theo quy định FR-26.
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
          )}
        </Drawer>

        {/* ── 7. Blocker Modal (Khi Guard từ chối thao tác) ── */}
        <Modal
          open={Boolean(blockerModalData)}
          title="HÀNH ĐỘNG BỊ CHẶN (GUARD ENFORCED)"
          confirmLabel="Đã hiểu & Đóng"
          cancelLabel=""
          onConfirm={() => setBlockerModalData(null)}
          onClose={() => setBlockerModalData(null)}
        >
          {blockerModalData && (
            <div className="blocker-modal-body">
              <div className="blocker-alert">
                <WarningCircle size={28} className="blocker-icon text-danger" />
                <div className="blocker-alert__text">
                  <h4 className="font-semibold text-danger">
                    {blockerModalData.blocker.title}
                  </h4>
                  <p>{blockerModalData.blocker.message}</p>
                </div>
              </div>

              <div className="blocker-details">
                <div className="blocker-row">
                  <span className="blocker-label">Mã kho:</span>
                  <span className="blocker-val font-bold font-mono">{blockerModalData.unit.code}</span>
                </div>
                {blockerModalData.blocker.tenant && (
                  <div className="blocker-row">
                    <span className="blocker-label">Khách hàng liên quan:</span>
                    <span className="blocker-val font-semibold">{blockerModalData.blocker.tenant}</span>
                  </div>
                )}
                {blockerModalData.blocker.contractRef && (
                  <div className="blocker-row">
                    <span className="blocker-label">Mã hợp đồng / Đơn đặt:</span>
                    <span className="blocker-val font-mono">{blockerModalData.blocker.contractRef}</span>
                  </div>
                )}
                {blockerModalData.blocker.nextEvent && (
                  <div className="blocker-row">
                    <span className="blocker-label">Diễn biến:</span>
                    <span className="blocker-val text-muted">{blockerModalData.blocker.nextEvent}</span>
                  </div>
                )}
              </div>

              <div className="blocker-advice">
                <Warning size={16} className="text-warning flex-shrink-0" />
                <span>{blockerModalData.blocker.actionAdvice}</span>
              </div>
            </div>
          )}
        </Modal>

        {/* ── 8. Retire Confirm Modal (Khi Guard cho phép) ── */}
        <Modal
          open={Boolean(retireTargetUnit)}
          title={`XÁC NHẬN CHO NGHỈ KHO ${retireTargetUnit?.code || ""}`}
          confirmLabel="Xác nhận Cho nghỉ"
          cancelLabel="Hủy bỏ"
          onConfirm={handleConfirmRetire}
          onClose={() => setRetireTargetUnit(null)}
        >
          {retireTargetUnit && (
            <div className="retire-confirm-body">
              <p>
                Bạn đang thực hiện đưa kho <strong>{retireTargetUnit.code}</strong> ({retireTargetUnit.typeName}) ra khỏi danh mục cho thuê.
              </p>
              <div className="retire-consequences">
                <strong>Hệ quả nghiệp vụ:</strong>
                <ul>
                  <li>Kho sẽ được chuyển sang trạng thái <strong>Ngừng thuê (RETIRED)</strong>.</li>
                  <li>Kho sẽ không còn hiển thị trên trang tìm kiếm (Browse Units) của khách hàng.</li>
                  <li>Thao tác này được đóng dấu vào Nhật ký kiểm toán hệ thống (Activity Log).</li>
                </ul>
              </div>
            </div>
          )}
        </Modal>

        {/* ── 9. Maintenance Reason Modal ── */}
        <Modal
          open={Boolean(maintenanceTargetUnit)}
          title={`ĐƯA KHO ${maintenanceTargetUnit?.code || ""} VÀO BẢO TRÌ`}
          confirmLabel="Xác nhận Bảo trì"
          cancelLabel="Hủy"
          onConfirm={handleConfirmMaintenance}
          onClose={() => setMaintenanceTargetUnit(null)}
        >
          {maintenanceTargetUnit && (
            <div className="maintenance-modal-body">
              <p>
                Kho <strong>{maintenanceTargetUnit.code}</strong> sẽ được tạm khóa khỏi danh mục khả dụng để tiến hành kiểm tra, sửa chữa hoặc nâng cấp.
              </p>
              <div className="form-group mt-3">
                <label htmlFor="maint-reason" className="form-label font-semibold">
                  Lý do đưa vào bảo trì (Bắt buộc):
                </label>
                <textarea
                  id="maint-reason"
                  className="form-textarea"
                  rows={3}
                  placeholder="Ví dụ: Thay pin khóa thông minh SmartLock, sửa tay nắm cửa, khử ẩm..."
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* ── 10. Fix Status Modal (Bắt buộc lý do kiểm toán) ── */}
        <Modal
          open={Boolean(fixStatusTargetUnit)}
          title={`ĐIỀU CHỈNH TRẠNG THÁI KHO ${fixStatusTargetUnit?.code || ""}`}
          confirmLabel="Lưu trạng thái"
          cancelLabel="Hủy"
          onConfirm={handleConfirmFixStatus}
          onClose={() => setFixStatusTargetUnit(null)}
        >
          {fixStatusTargetUnit && (
            <div className="fix-status-body">
              <div className="fix-status-current">
                <span>Trạng thái hiện tại:</span>
                <span className={`status-chip ${STATUS_LABELS[fixStatusTargetUnit.status]?.class}`}>
                  {STATUS_LABELS[fixStatusTargetUnit.status]?.text}
                </span>
              </div>

              <div className="form-group mt-3">
                <label htmlFor="fix-status-select" className="form-label font-semibold">
                  Trạng thái mới:
                </label>
                <select
                  id="fix-status-select"
                  className="form-input"
                  value={fixStatusValue}
                  onChange={(e) => setFixStatusValue(e.target.value)}
                >
                  <option value="AVAILABLE">Trống (AVAILABLE)</option>
                  <option value="PREPARING">Đang xử lý chuẩn bị (PREPARING)</option>
                  <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
                  <option value="RENTED">Đang thuê (RENTED)</option>
                  <option value="RETIRED">Ngừng thuê (RETIRED)</option>
                </select>
              </div>

              <div className="form-group mt-3">
                <label htmlFor="fix-status-reason" className="form-label font-semibold">
                  Lý do điều chỉnh (Bắt buộc kiểm toán FR-26):
                </label>
                <textarea
                  id="fix-status-reason"
                  className="form-textarea"
                  rows={3}
                  placeholder="Ví dụ: Khách đã bàn giao kho và dọn sạch đồ nhưng hệ thống chưa tự đổi; chuyển sang chuẩn bị..."
                  value={fixStatusReason}
                  onChange={(e) => {
                    setFixStatusReason(e.target.value);
                    if (fixStatusError) setFixStatusError("");
                  }}
                />
                {fixStatusError && (
                  <div className="text-danger text-xs mt-1 font-semibold">
                    {fixStatusError}
                  </div>
                )}
              </div>

              <div className="fix-status-audit-note">
                <ShieldCheck size={14} className="text-muted flex-shrink-0" />
                <span>Mọi thay đổi thủ công đều lưu lại tài khoản người thực hiện và đối chiếu khi kiểm toán.</span>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Toast Feedback ── */}
        {toastMessage && (
          <aside className="mgmt-toast" role="status" aria-live="polite">
            <CheckCircle size={18} className="text-success flex-shrink-0" />
            <span>{toastMessage}</span>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
