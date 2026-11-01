import {
  Users,
  CalendarCheck,
  WarningCircle,
  Clock,
  Check,
  ShieldCheck,
  Warehouse,
} from "@phosphor-icons/react";

export default function ShiftKpiGrid({
  totalConflicts = 0,
  staffRoster = [],
  allShifts = [],
}) {
  const staffNames = staffRoster.map((s) => s.fullName).filter(Boolean);
  const staffCount = staffRoster.length;
  const shiftCount = allShifts.length;
  const coveragePercent = Math.min(100, Math.round((shiftCount / 21) * 100));

  const countZoneA = allShifts.filter((s) => s.zone && s.zone.includes("A")).length;
  const countZoneB = allShifts.filter((s) => s.zone && s.zone.includes("B")).length;
  const countZoneC = allShifts.filter((s) => s.zone && s.zone.includes("C")).length;

  return (
    <div className="shifts-kpi-grid">
      {/* KPI 1 */}
      <article className="shifts-kpi-card">
        <div className="shifts-kpi-card__head">
          <span className="shifts-kpi-card__label">NHÂN SỰ VẬN HÀNH</span>
          <Users size={20} className="shifts-kpi-card__icon" />
        </div>
        <div className="shifts-kpi-card__val">{staffCount} Nhân sự</div>
        <p className="shifts-kpi-card__desc">
          {staffNames.length > 0 ? staffNames.join(", ") : "Đang tải dữ liệu nhân sự..."}
        </p>
        <div className="shifts-kpi-card__badge-row">
          <span className="badge badge--success">
            <Check size={12} weight="bold" /> 100% tài khoản đã kích hoạt
          </span>
        </div>
      </article>

      {/* KPI 2 */}
      <article className="shifts-kpi-card">
        <div className="shifts-kpi-card__head">
          <span className="shifts-kpi-card__label">ĐỘ PHỦ CA TUẦN NÀY</span>
          <CalendarCheck size={20} className="shifts-kpi-card__icon" />
        </div>
        <div className="shifts-kpi-card__val">{shiftCount} Ca trực</div>
        <p className="shifts-kpi-card__desc">
          {coveragePercent}% độ phủ khung giờ tiêu chuẩn trong tuần
        </p>
        <div className="shifts-kpi-card__badge-row">
          <span className="badge badge--warning">
            {shiftCount >= 7 ? "Đã bố trí ca các ngày" : "Đang hoàn thiện ca tuần"}
          </span>
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
            ? `Phát hiện ${totalConflicts} ca trực bị chồng lấn khung giờ`
            : "Toàn bộ lịch trực đạt chuẩn không trùng lặp"}
        </p>
        <div className="shifts-kpi-card__badge-row">
          {totalConflicts > 0 ? (
            <span className="badge badge--danger">
              Phát hiện phân công trùng giờ
            </span>
          ) : (
            <span className="badge badge--success">
              <ShieldCheck size={12} weight="bold" /> Lịch trực an toàn
            </span>
          )}
        </div>
      </article>

      {/* KPI 4 */}
      <article className="shifts-kpi-card">
        <div className="shifts-kpi-card__head">
          <span className="shifts-kpi-card__label">PHÂN BỔ THEO PHÂN KHU</span>
          <Warehouse size={20} className="shifts-kpi-card__icon" />
        </div>
        <div className="shifts-kpi-card__val">3 Phân khu (A, B, C)</div>
        <p className="shifts-kpi-card__desc">
          Zone A: {countZoneA} ca · Zone B: {countZoneB} ca · Zone C: {countZoneC} ca
        </p>
        <div className="shifts-kpi-card__badge-row">
          <span className="badge badge--neutral">Cơ sở Tân Bình</span>
        </div>
      </article>
    </div>
  );
}
