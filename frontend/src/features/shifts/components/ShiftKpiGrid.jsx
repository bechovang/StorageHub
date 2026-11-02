import {
  Users,
  CalendarCheck,
  WarningCircle,
  CheckCircle,
  Warehouse,
} from "@phosphor-icons/react";

export default function ShiftKpiGrid({
  totalConflicts = 0,
  staffRoster = [],
  allShifts = [],
}) {
  const staffCount = staffRoster.length;
  const shiftCount = allShifts.length;
  const coveragePercent = Math.min(100, Math.round((shiftCount / 14) * 100)); // 2 ca x 7 ngày = 14 ca chuẩn

  const typeKey = (name) => {
    const normalized = String(name || "").toUpperCase();
    return normalized === "LOCKER" ? "LOCK" : normalized;
  };
  const countType = (key) =>
    allShifts.reduce(
      (sum, shift) =>
        sum + (shift.typeNames || []).filter((name) => typeKey(name) === key).length,
      0
    );
  const countLock = countType("LOCK");
  const countS = countType("S");
  const countM = countType("M");
  const countL = countType("L");

  return (
    <div className="shifts-stats-strip">
      {/* Stat 1: Nhân sự */}
      <div className="stats-item">
        <div className="stats-item__icon-wrap">
          <Users size={18} weight="duotone" />
        </div>
        <div className="stats-item__content">
          <span className="stats-item__label">Nhân sự vận hành</span>
          <div className="stats-item__value-row">
            <strong className="stats-item__val">{staffCount}</strong>
            <span className="stats-item__sub">Tối đa 4 nhân viên/ca</span>
          </div>
        </div>
      </div>

      <div className="stats-strip-divider" />

      {/* Stat 2: Ca trực & Độ phủ */}
      <div className="stats-item">
        <div className="stats-item__icon-wrap">
          <CalendarCheck size={18} weight="duotone" />
        </div>
        <div className="stats-item__content">
          <span className="stats-item__label">Tổng ca phân công</span>
          <div className="stats-item__value-row">
            <strong className="stats-item__val">{shiftCount} ca</strong>
            <span className="stats-item__badge stats-item__badge--info">
              {coveragePercent}% độ phủ
            </span>
          </div>
        </div>
      </div>

      <div className="stats-strip-divider" />

      {/* Stat 3: Phân bổ Loại kho */}
      <div className="stats-item">
        <div className="stats-item__icon-wrap">
          <Warehouse size={18} weight="duotone" />
        </div>
        <div className="stats-item__content">
          <span className="stats-item__label">Phân bổ 4 nhóm kho</span>
          <div className="stats-item__zones">
            <span className="zone-pill">LOCK: <strong>{countLock}</strong></span>
            <span className="zone-pill">S: <strong>{countS}</strong></span>
            <span className="zone-pill">M: <strong>{countM}</strong></span>
            <span className="zone-pill">L: <strong>{countL}</strong></span>
          </div>
        </div>
      </div>

      <div className="stats-strip-divider" />

      {/* Stat 4: Phân công (Rà soát xung đột) */}
      <div className={`stats-item ${totalConflicts > 0 ? "stats-item--conflict" : ""}`}>
        <div className="stats-item__icon-wrap">
          {totalConflicts > 0 ? (
            <WarningCircle size={18} weight="fill" className="text-error" />
          ) : (
            <CheckCircle size={18} weight="fill" className="text-success" />
          )}
        </div>
        <div className="stats-item__content">
          <span className="stats-item__label">Phân công</span>
          <div className="stats-item__value-row">
            {totalConflicts > 0 ? (
              <strong className="stats-item__val text-error">
                {totalConflicts} ca trùng lịch
              </strong>
            ) : (
              <strong className="stats-item__val text-success">
                Lịch trực an toàn
              </strong>
            )}
            <span
              className={`stats-item__badge ${
                totalConflicts > 0
                  ? "stats-item__badge--error"
                  : "stats-item__badge--success"
              }`}
            >
              {totalConflicts > 0 ? "Cần điều chỉnh" : "Không xung đột"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
