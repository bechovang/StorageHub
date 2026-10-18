import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Warehouse,
  Clock,
  TrendUp,
  Wrench,
  Warning,
  ArrowsClockwise,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  Car,
  FileArrowDown,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Drawer from "../../components/Drawer/Drawer.jsx";
import { formatVND } from "../../utils/formatters.js";
import "./FacilityOverviewPage.css";

// Dữ liệu mock chuẩn cơ sở Tân Bình (khớp F5-01 và seed DB)
const INITIAL_FACILITY_UNITS = [
  { id: 1, code: "S-1", type: "Small (5m²)", zone: "Zone A", status: "AVAILABLE", rentPrice: 345000, tenant: null, nextEvent: "Khách hẹn xem kho 14:30" },
  { id: 2, code: "S-2", type: "Small (5m²)", zone: "Zone A", status: "AVAILABLE", rentPrice: 345000, tenant: null, nextEvent: "Sẵn sàng bàn giao" },
  { id: 3, code: "S-3", type: "Small (5m²)", zone: "Zone A", status: "RENTED", rentPrice: 345000, tenant: "Nguyễn Thị Lan", contractRef: "CT-1042", nextEvent: "Hạn hợp đồng 18/10/2026" },
  { id: 4, code: "S-4", type: "Small (5m²)", zone: "Zone A", status: "RENTED", rentPrice: 345000, tenant: "Lê Minh Trí", contractRef: "CT-1038", nextEvent: "Sự cố SR-0032 (Cửa kẹt)" },
  { id: 5, code: "M-1", type: "Medium (8m²)", zone: "Zone A", status: "RENTED", rentPrice: 380000, tenant: "Đỗ Mai Hương", contractRef: "CT-1040", nextEvent: "Vừa nhận kho ca sáng" },
  { id: 6, code: "M-2", type: "Medium (8m²)", zone: "Zone B", status: "PREPARING", rentPrice: 380000, tenant: "Hoàng Nam", contractRef: "CT-0988", nextEvent: "Đang kiểm tra checkout RT-0871" },
  { id: 7, code: "M-3", type: "Medium (8m²)", zone: "Zone B", status: "RENTED", rentPrice: 380000, tenant: "Công ty Alpha Logistics", contractRef: "CT-0941", nextEvent: "Gia hạn thêm 6 tháng" },
  { id: 8, code: "M-4", type: "Medium (8m²)", zone: "Zone B", status: "MAINTENANCE", rentPrice: 380000, tenant: null, nextEvent: "Đang sửa khóa thông minh SmartLock" },
  { id: 9, code: "M-5", type: "Medium (8m²)", zone: "Zone B", status: "RESERVED", rentPrice: 380000, tenant: "Phạm Thị Trang", contractRef: "BK-1044", nextEvent: "Hẹn check-in 19/10/2026" },
  { id: 10, code: "L-1", type: "Large (15m²)", zone: "Zone B", status: "RENTED", rentPrice: 890000, tenant: "Trần Anh Quân", contractRef: "CT-0912", nextEvent: "Hợp đồng dài hạn 12 tháng" },
  { id: 11, code: "L-2", type: "Large (15m²)", zone: "Zone B", status: "RENTED", rentPrice: 890000, tenant: "Vũ Bảo Long", contractRef: "CT-0925", nextEvent: "Đóng tiền kỳ kế tiếp 01/11" },
  { id: 12, code: "L-3", type: "Large (15m²)", zone: "Zone B", status: "PREPARING", rentPrice: 890000, tenant: null, nextEvent: "Đang vệ sinh khử ẩm (Task CL-0102)" },
  { id: 13, code: "LOCK-1", type: "Locker (1.5m²)", zone: "Zone C", status: "AVAILABLE", rentPrice: 100000, tenant: null, nextEvent: "Trống sẵn sàng" },
  { id: 14, code: "LOCK-2", type: "Locker (1.5m²)", zone: "Zone C", status: "RENTED", rentPrice: 100000, tenant: "Trịnh Gia Huy", contractRef: "CT-1011", nextEvent: "Gia hạn theo quý" },
  { id: 15, code: "LOCK-3", type: "Locker (1.5m²)", zone: "Zone C", status: "RESERVED", rentPrice: 100000, tenant: "Bùi Tuyết Mai", contractRef: "BK-1046", nextEvent: "Hạn thanh toán cọc" },
  { id: 16, code: "LOCK-4", type: "Locker (1.5m²)", zone: "Zone C", status: "RETIRED", rentPrice: 100000, tenant: null, nextEvent: "Tạm dừng cho thuê quy hoạch lại" },
];

const TURNOVER_QUEUE = [
  {
    id: 1,
    unitCode: "M-2",
    spec: "Medium · 8 m² (Zone B)",
    fromStatus: "RENTED",
    toStatus: "PREPARING",
    taskName: "Nghiệm thu trả kho (Checkout)",
    refCode: "RT-0871",
    staffName: "Minh (Staff Tân Bình)",
    dueTime: "14:00",
  },
  {
    id: 2,
    unitCode: "S-1",
    spec: "Small · 5 m² (Zone A)",
    fromStatus: "PREPARING",
    toStatus: "AVAILABLE",
    taskName: "Dọn dẹp khử ẩm bàn giao (Cleaning)",
    refCode: "CL-0101",
    staffName: "Mai (Staff Tân Bình)",
    dueTime: "16:00",
  },
];

const STATUS_CONFIGS = {
  ALL: { label: "Tất cả kho", color: "#475569", bg: "#f1f5f9" },
  AVAILABLE: { label: "Trống (Available)", color: "#059669", bg: "#ecfdf5", barWidth: "22%" },
  RESERVED: { label: "Đã đặt chỗ (Reserved)", color: "#1e40af", bg: "#f1f5f9", barWidth: "12%" },
  RENTED: { label: "Đang thuê (Rented)", color: "#334155", bg: "#f1f5f9", barWidth: "50%" },
  PREPARING: { label: "Đang xử lý (Preparing)", color: "#0284c7", bg: "#f0f9ff", barWidth: "8%" },
  MAINTENANCE: { label: "Bảo trì (Maintenance)", color: "#c2410c", bg: "#fff7ed", barWidth: "4%" },
  RETIRED: { label: "Ngừng thuê (Retired)", color: "#767676", bg: "#f5f5f5", barWidth: "4%" },
};

export default function FacilityOverviewPage() {
  const navigate = useNavigate();

  // Drilldown Drawer State
  const [drilldownStatus, setDrilldownStatus] = useState(null); // null hoặc status key (RENTED, AVAILABLE, etc.)
  const [searchUnitTerm, setSearchUnitTerm] = useState("");

  // Lọc danh sách units khi drilldown
  const drilldownUnits = useMemo(() => {
    let list = INITIAL_FACILITY_UNITS;
    if (drilldownStatus && drilldownStatus !== "ALL") {
      list = list.filter((u) => u.status === drilldownStatus);
    }
    if (searchUnitTerm.trim()) {
      const q = searchUnitTerm.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.code.toLowerCase().includes(q) ||
          u.type.toLowerCase().includes(q) ||
          (u.tenant && u.tenant.toLowerCase().includes(q))
      );
    }
    return list;
  }, [drilldownStatus, searchUnitTerm]);

  // Thống kê phân bố kho
  const statusStats = useMemo(() => {
    const counts = {
      TOTAL: INITIAL_FACILITY_UNITS.length,
      AVAILABLE: 0,
      RESERVED: 0,
      RENTED: 0,
      PREPARING: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
    };
    INITIAL_FACILITY_UNITS.forEach((u) => {
      if (counts[u.status] !== undefined) counts[u.status]++;
    });
    return counts;
  }, []);

  const occupancyRate = ((statusStats.RENTED / statusStats.TOTAL) * 100).toFixed(0);

  // Mở drilldown với status tương ứng (FR-32)
  const handleOpenDrilldown = (status) => {
    setDrilldownStatus(status);
    setSearchUnitTerm("");
  };

  return (
    <AppShell>
      <div className="facility-overview-page">
        {/* ── Subheader Telemetry Context Bar ── */}
        <section className="facility-telemetry" aria-label="Thông tin cơ sở & telemetry">
          <div className="facility-telemetry__inner">
            <div className="facility-telemetry__left">
              <div className="telemetry-item">
                <Warehouse size={16} className="text-muted" />
                <span className="telemetry-bold">Depot:</span>
                <span>Tân Bình Gateway</span>
                <span className="tag-facility">VN-SGN-01</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <span className="dot-pulse-green" />
                <span className="text-success font-semibold">Hệ thống ổn định</span>
                <span className="text-muted">· Cổng ra vào hoạt động tốt</span>
              </div>
            </div>

            <div className="facility-telemetry__right">
              <div className="telemetry-item">
                <Clock size={15} className="text-muted" />
                <span className="tabular-clock font-mono">11:42:08</span>
                <span>(UTC+07 ICT)</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <ShieldCheck size={16} className="text-primary" />
                <span className="telemetry-bold">Ca trực:</span>
                <span>Tuấn (Quản lý trực ca)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Canvas ── */}
        <div className="facility-canvas">
          {/* Page Title & Operational Actions */}
          <header className="facility-header">
            <div>
              <div className="facility-breadcrumb">
                <span>Vận hành cơ sở</span>
                <span className="facility-breadcrumb__sep">/</span>
                <span className="facility-breadcrumb__curr">Tổng quan kho</span>
              </div>
              <h1 className="facility-title">Tổng quan vận hành cơ sở</h1>
              <p className="facility-subtitle">
                Theo dõi tỷ lệ lấp đầy, tình trạng từng kho và các lượt bàn giao trong ngày.
              </p>
            </div>

            <div className="facility-actions">
              <div className="time-selector-pill">
                <Clock size={16} className="text-muted" />
                <span>Hôm nay — Ca sáng</span>
              </div>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  const csv = INITIAL_FACILITY_UNITS.map(
                    (u) => `${u.code},${u.type},${u.zone},${u.status},${u.rentPrice},${u.tenant || ""}`
                  ).join("\n");
                  const blob = new Blob([`Mã kho,Loại,Khu vực,Trạng thái,Giá thuê,Khách thuê\n${csv}`], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `storagehub_facility_units_${Date.now()}.csv`;
                  a.click();
                }}
              >
                <FileArrowDown size={16} weight="bold" />
                <span>Xuất file CSV kiểm kê</span>
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate("/facility/shifts")}
              >
                <span>Xem lịch ca trực →</span>
              </button>
            </div>
          </header>

          {/* ── 4 KPI Summary Cards (Bấm vào để xem chi tiết) ── */}
          <section className="facility-kpi-grid">
            {/* KPI 1: Occupancy */}
            <article
              className="kpi-card kpi-card--interactive"
              onClick={() => handleOpenDrilldown("RENTED")}
              title="Nhấp để xem danh sách các phòng đang được thuê"
              tabIndex={0}
              role="button"
            >
              <div className="kpi-card__head">
                <span className="kpi-card__label">TỶ LỆ LẤP ĐẦY KHO</span>
                <span className="badge badge--success">
                  <TrendUp size={12} weight="bold" /> +1.4%
                </span>
              </div>
              <div className="kpi-card__main-metric">
                <span className="kpi-card__val">{occupancyRate}%</span>
                <span className="kpi-card__meta">
                  {statusStats.RENTED} / {statusStats.TOTAL} kho đã thuê
                </span>
              </div>
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar-fill progress-bar-fill--primary"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <div className="kpi-card__footer-hint">
                <span>Xem danh sách kho đang thuê →</span>
              </div>
            </article>

            {/* KPI 2: Units in Service */}
            <article
              className="kpi-card kpi-card--interactive"
              onClick={() => handleOpenDrilldown("ALL")}
              title="Nhấp để xem toàn bộ danh mục kho vận hành (Drill-down)"
              tabIndex={0}
              role="button"
            >
              <div className="kpi-card__head">
                <span className="kpi-card__label">KHO ĐANG VẬN HÀNH</span>
                <span className="dot-pulse-green" />
              </div>
              <div className="kpi-card__main-metric">
                <span className="kpi-card__val">
                  {statusStats.TOTAL - statusStats.RETIRED} / {statusStats.TOTAL}
                </span>
                <span className="kpi-card__meta">93.8% sẵn sàng</span>
              </div>
              <div className="kpi-card__alert-line text-warning">
                <Wrench size={14} weight="bold" />
                <span>{statusStats.MAINTENANCE} kho đang bảo trì khóa (Unit M-4)</span>
              </div>
              <div className="kpi-card__footer-hint">
                <span>Xem danh mục toàn bộ kho →</span>
              </div>
            </article>

            {/* KPI 3: Turnover Tasks Today */}
            <article
              className="kpi-card kpi-card--interactive"
              onClick={() => navigate("/facility/shifts")}
              title="Nhấp để xem phân bổ ca trực và nhiệm vụ (Drill-down)"
              tabIndex={0}
              role="button"
            >
              <div className="kpi-card__head">
                <span className="kpi-card__label">NHIỆM VỤ CA TRỰC HÔM NAY</span>
                <span className="badge badge--primary">Mục tiêu ca: 8</span>
              </div>
              <div className="kpi-card__main-metric">
                <span className="kpi-card__val">8</span>
                <span className="kpi-card__meta">ca đang phụ trách</span>
              </div>
              <div className="kpi-card__breakdown">
                <span className="text-success">3 hoàn thành</span> ·{" "}
                <span className="text-info">2 đang làm</span> ·{" "}
                <span className="text-warning">3 chờ nhận</span>
              </div>
              <div className="kpi-card__footer-hint">
                <span>Điều phối bảng phân ca →</span>
              </div>
            </article>

            {/* KPI 4: Open Escalations */}
            <article
              className="kpi-card kpi-card--alert"
              onClick={() => handleOpenDrilldown("MAINTENANCE")}
              title="Nhấp để xem chi tiết sự cố cần xử lý (Drill-down)"
              tabIndex={0}
              role="button"
            >
              <div className="kpi-card__head">
                <span className="kpi-card__label text-error">SỰ CỐ KHẨN CẤP</span>
                <span className="badge badge--danger">Ưu tiên cao</span>
              </div>
              <div className="kpi-card__main-metric">
                <span className="kpi-card__val text-error">1</span>
                <span className="kpi-card__meta">cần quản lý can thiệp</span>
              </div>
              <div className="kpi-card__alert-line text-error">
                <Warning size={14} weight="fill" />
                <span className="font-mono font-bold">SR-0032:</span>
                <span>Cửa cuốn bị kẹt tại Unit S-4</span>
              </div>
              <div className="kpi-card__footer-hint text-error">
                <span>Xem chi tiết kho bị sự cố →</span>
              </div>
            </article>
          </section>

          {/* ── Units by Status Distribution (Biểu đồ & Thanh tỷ trọng - FR-32) ── */}
          <section className="facility-status-panel">
            <div className="facility-status-panel__head">
              <div>
                <h2 className="facility-status-panel__title">Phân bổ trạng thái kho</h2>
                <p className="facility-status-panel__desc">
                  Tỷ lệ kho trống, đã cọc và đang thuê tại cơ sở. Bấm vào từng nhóm để xem danh sách chi tiết.
                </p>
              </div>
              <div className="facility-status-panel__total">
                <span className="text-muted">Tổng quy mô depot:</span>
                <strong className="tag-total-units">{statusStats.TOTAL} kho vật lý</strong>
              </div>
            </div>

            {/* Stacked Proportional Bar */}
            <div className="stacked-status-bar" role="meter" aria-label="Tỷ trọng trạng thái kho">
              <div
                className="status-segment status-segment--available"
                style={{ width: `${(statusStats.AVAILABLE / statusStats.TOTAL) * 100}%` }}
                title={`Trống: ${statusStats.AVAILABLE} kho`}
                onClick={() => handleOpenDrilldown("AVAILABLE")}
              />
              <div
                className="status-segment status-segment--reserved"
                style={{ width: `${(statusStats.RESERVED / statusStats.TOTAL) * 100}%` }}
                title={`Đã đặt cọc: ${statusStats.RESERVED} kho`}
                onClick={() => handleOpenDrilldown("RESERVED")}
              />
              <div
                className="status-segment status-segment--rented"
                style={{ width: `${(statusStats.RENTED / statusStats.TOTAL) * 100}%` }}
                title={`Đang thuê: ${statusStats.RENTED} kho`}
                onClick={() => handleOpenDrilldown("RENTED")}
              />
              <div
                className="status-segment status-segment--preparing"
                style={{ width: `${(statusStats.PREPARING / statusStats.TOTAL) * 100}%` }}
                title={`Đang vệ sinh/bàn giao: ${statusStats.PREPARING} kho`}
                onClick={() => handleOpenDrilldown("PREPARING")}
              />
              <div
                className="status-segment status-segment--maintenance"
                style={{ width: `${(statusStats.MAINTENANCE / statusStats.TOTAL) * 100}%` }}
                title={`Bảo trì: ${statusStats.MAINTENANCE} kho`}
                onClick={() => handleOpenDrilldown("MAINTENANCE")}
              />
              <div
                className="status-segment status-segment--retired"
                style={{ width: `${(statusStats.RETIRED / statusStats.TOTAL) * 100}%` }}
                title={`Ngừng thuê: ${statusStats.RETIRED} kho`}
                onClick={() => handleOpenDrilldown("RETIRED")}
              />
            </div>

            {/* Interactive Status Pills Row */}
            <div className="status-legend-grid">
              {Object.keys(STATUS_CONFIGS)
                .filter((k) => k !== "ALL")
                .map((key) => {
                  const cfg = STATUS_CONFIGS[key];
                  const count = statusStats[key] || 0;
                  const pct = ((count / statusStats.TOTAL) * 100).toFixed(1);

                  return (
                    <button
                      key={key}
                      type="button"
                      className="status-pill-btn"
                      onClick={() => handleOpenDrilldown(key)}
                    >
                      <div className="status-pill-btn__dot" style={{ backgroundColor: cfg.color }} />
                      <div className="status-pill-btn__info">
                        <span className="status-pill-btn__label">{cfg.label.split(" ")[0]}</span>
                        <span className="status-pill-btn__nums">
                          <strong>{count}</strong> ({pct}%)
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Zone Telemetry Sub-strip */}
            <div className="zone-telemetry-bar">
              <div className="zone-telemetry-item">
                <Thermometer size={16} className="text-primary" />
                <span className="font-medium text-ink">Khu điều hòa khí (Zone A & B):</span>
                <span className="text-success font-semibold">88% lấp đầy</span>
                <span className="text-muted">(7/8 kho đã thuê)</span>
              </div>
              <div className="zone-telemetry-item">
                <Car size={16} className="text-primary" />
                <span className="font-medium text-ink">Hành lang Locker (Zone C):</span>
                <span className="text-rented font-semibold">50% lấp đầy</span>
                <span className="text-muted">(2/4 locker hoạt động)</span>
              </div>
            </div>
          </section>

          {/* ── Operational Turnover Queue (Lịch bàn giao & vệ sinh kho hôm nay) ── */}
          <section className="turnover-section">
            <div className="turnover-section__head">
              <div className="turnover-section__title-group">
                <h2 className="turnover-section__title">Lịch bàn giao & vệ sinh kho hôm nay</h2>
                <span className="badge badge--info">{TURNOVER_QUEUE.length} ca chuyển trạng thái</span>
              </div>
              <div className="turnover-section__refresh">
                <ArrowsClockwise size={15} />
                <span>Tự động cập nhật mỗi ca trực</span>
              </div>
            </div>

            <div className="turnover-table-wrap">
              <table className="turnover-table">
                <thead>
                  <tr>
                    <th>MÃ KHO</th>
                    <th>CHUYỂN ĐỔI TRẠNG THÁI</th>
                    <th>NHIỆM VỤ & REF</th>
                    <th>NHÂN VIÊN PHỤ TRÁCH</th>
                    <th>HẠN CHÓT (ICT)</th>
                    <th className="text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {TURNOVER_QUEUE.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="unit-cell">
                          <span className="unit-code-box">{item.unitCode}</span>
                          <span className="unit-spec-sub">{item.spec}</span>
                        </div>
                      </td>
                      <td>
                        <div className="transition-cell">
                          <span className="status-chip status-chip--rented">{item.fromStatus}</span>
                          <ArrowRight size={14} className="text-muted" />
                          <span className="status-chip status-chip--preparing">{item.toStatus}</span>
                        </div>
                      </td>
                      <td>
                        <div className="task-cell">
                          <strong className="task-name">{item.taskName}</strong>
                          <span className="task-ref font-mono">{item.refCode}</span>
                        </div>
                      </td>
                      <td>
                        <div className="staff-cell">
                          <span className="avatar-mini">M</span>
                          <span>{item.staffName}</span>
                        </div>
                      </td>
                      <td>
                        <div className="due-cell font-mono">
                          <Clock size={14} className="text-muted" />
                          <span>{item.dueTime}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => navigate("/tasks")}
                        >
                          <span>Xem Task Board</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── Interactive Drill-down Drawer (FR-32) ── */}
        <Drawer
          isOpen={!!drilldownStatus}
          onClose={() => setDrilldownStatus(null)}
          title={`Chi tiết danh sách kho — ${STATUS_CONFIGS[drilldownStatus]?.label || "Toàn bộ kho"}`}
          size="lg"
        >
          <div className="drilldown-drawer">
            <div className="drilldown-search-bar">
              <input
                type="text"
                className="drilldown-input"
                placeholder="Lọc theo mã kho, loại kho, khách thuê..."
                value={searchUnitTerm}
                onChange={(e) => setSearchUnitTerm(e.target.value)}
              />
              <span className="drilldown-count">{drilldownUnits.length} kết quả</span>
            </div>

            <div className="drilldown-table-wrap">
              <table className="drilldown-table">
                <thead>
                  <tr>
                    <th>Mã kho</th>
                    <th>Loại kho</th>
                    <th>Khu vực</th>
                    <th>Trạng thái</th>
                    <th>Giá thuê/tháng</th>
                    <th>Khách thuê & Diễn biến</th>
                  </tr>
                </thead>
                <tbody>
                  {drilldownUnits.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong className="unit-code-box">{u.code}</strong>
                      </td>
                      <td>{u.type}</td>
                      <td>{u.zone}</td>
                      <td>
                        <span className={`status-chip status-chip--${u.status.toLowerCase()}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="font-mono">{formatVND(u.rentPrice)}</td>
                      <td>
                        <div className="tenant-cell">
                          {u.tenant ? (
                            <strong className="tenant-name">{u.tenant}</strong>
                          ) : (
                            <span className="text-muted italic">Chưa có khách thuê</span>
                          )}
                          <span className="tenant-event">{u.nextEvent}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="drilldown-footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setDrilldownStatus(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </Drawer>
      </div>
    </AppShell>
  );
}
