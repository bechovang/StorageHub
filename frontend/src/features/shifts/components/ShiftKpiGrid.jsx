import {
  Users,
  CalendarCheck,
  WarningCircle,
  Clock,
  Check,
  ShieldCheck,
} from "@phosphor-icons/react";

export default function ShiftKpiGrid({ totalConflicts }) {
  return (
    <div className="shifts-kpi-grid">
      {/* KPI 1 */}
      <article className="shifts-kpi-card">
        <div className="shifts-kpi-card__head">
          <span className="shifts-kpi-card__label">ĐANG TRỰC CA HÔM NAY</span>
          <Users size={20} className="shifts-kpi-card__icon" />
        </div>
        <div className="shifts-kpi-card__val">3 Nhân sự</div>
        <p className="shifts-kpi-card__desc">Minh Nguyễn, Mai Trần, Hùng Lê</p>
        <div className="shifts-kpi-card__badge-row">
          <span className="badge badge--success">
            <Check size={12} weight="bold" /> 100% đúng vị trí phân công
          </span>
        </div>
      </article>

      {/* KPI 2 */}
      <article className="shifts-kpi-card">
        <div className="shifts-kpi-card__head">
          <span className="shifts-kpi-card__label">ĐỘ PHỦ CA TUẦN NÀY</span>
          <CalendarCheck size={20} className="shifts-kpi-card__icon" />
        </div>
        <div className="shifts-kpi-card__val">94.2%</div>
        <p className="shifts-kpi-card__desc">33/35 khung giờ đã được lấp đầy</p>
        <div className="shifts-kpi-card__badge-row">
          <span className="badge badge--warning">2 vị trí dự phòng cuối tuần</span>
        </div>
      </article>

      {/* KPI 3: Zone Bottleneck / Conflict */}
      <article
        className={`shifts-kpi-card ${
          totalConflicts > 0 ? "shifts-kpi-card--conflict" : ""
        }`}
      >
        <div className="shifts-kpi-card__head">
          <span
            className={`shifts-kpi-card__label ${
              totalConflicts > 0 ? "text-error" : ""
            }`}
          >
            XUNG ĐỘT PHÂN CÔNG
          </span>
          <WarningCircle
            size={20}
            className={`shifts-kpi-card__icon ${
              totalConflicts > 0 ? "text-error" : ""
            }`}
          />
        </div>
        <div
          className={`shifts-kpi-card__val ${
            totalConflicts > 0 ? "text-error" : "text-success"
          }`}
        >
          {totalConflicts > 0 ? `${totalConflicts} Xung đột` : "0 Xung đột"}
        </div>
        <p className="shifts-kpi-card__desc">
          {totalConflicts > 0
            ? "Zone B · Thứ 2, 12/10/2026 (Minh Nguyễn)"
            : "Toàn bộ lịch trực đạt chuẩn không trùng lặp"}
        </p>
        <div className="shifts-kpi-card__badge-row">
          {totalConflicts > 0 ? (
            <span className="badge badge--danger">
              Phát hiện phân công trùng giờ
            </span>
          ) : (
            <span className="badge badge--success">
              <ShieldCheck size={12} weight="bold" /> Lịch trực đã an toàn
            </span>
          )}
        </div>
      </article>

      {/* KPI 4 */}
      <article className="shifts-kpi-card">
        <div className="shifts-kpi-card__head">
          <span className="shifts-kpi-card__label">BÀN GIAO CA TIẾP THEO</span>
          <Clock size={20} className="shifts-kpi-card__icon" />
        </div>
        <div className="shifts-kpi-card__val">15:00 ICT</div>
        <p className="shifts-kpi-card__desc">Ca chiều — Phụ trách Zone C & Cổng</p>
        <div className="shifts-kpi-card__badge-row">
          <span className="badge badge--neutral">Còn 3h 18m trong ca hiện tại</span>
        </div>
      </article>
    </div>
  );
}
