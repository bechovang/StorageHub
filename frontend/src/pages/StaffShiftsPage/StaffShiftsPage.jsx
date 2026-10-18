import { useState, useMemo } from "react";
import {
  Users,
  CalendarCheck,
  WarningCircle,
  Clock,
  CheckCircle,
  Lock,
  Plus,
  Trash,
  ArrowsClockwise,
  MagnifyingGlass,
  Check,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  DAYS_OF_WEEK,
  ZONES,
  INITIAL_STAFF,
  detectShiftConflict,
  addShiftAssignment,
  removeShiftAssignment,
  resetLocalShifts,
  getRosterWithShifts,
} from "../../services/shiftService.js";
import "./StaffShiftsPage.css";

export default function StaffShiftsPage() {
  // Trạng thái dữ liệu lịch trực
  const [dataVersion, setDataVersion] = useState(0);

  // Form phân công mới
  const [selectedStaffId, setSelectedStaffId] = useState(INITIAL_STAFF[0].id);
  const [selectedZone, setSelectedZone] = useState(ZONES[0].code);
  const [selectedWindow, setSelectedWindow] = useState("MORNING");
  const [selectedDate, setSelectedDate] = useState(DAYS_OF_WEEK[0].key);

  // Bộ lọc danh sách Roster
  const [searchTerm, setSearchTerm] = useState("");

  // Toast thông báo
  const [toast, setToast] = useState(null);

  // Lấy dữ liệu phân công đã đồng bộ
  const { staffRoster, totalConflicts } = useMemo(() => {
    // dataVersion trigger re-computation
    void dataVersion;
    return getRosterWithShifts();
  }, [dataVersion]);

  // Kiểm tra xung đột thời gian thực trên form hiện tại
  const liveConflict = useMemo(() => {
    return detectShiftConflict({
      staffId: selectedStaffId,
      date: selectedDate,
      shiftWindow: selectedWindow,
    });
  }, [selectedStaffId, selectedDate, selectedWindow]);

  // Xử lý lưu phân công mới
  const handleSaveAssignment = (e) => {
    e.preventDefault();
    try {
      addShiftAssignment({
        staffId: selectedStaffId,
        date: selectedDate,
        shiftWindow: selectedWindow,
        zone: selectedZone,
      });

      setDataVersion((v) => v + 1);
      setToast({
        type: "success",
        message: "Đã lưu phân công ca trực thành công vào hệ thống!",
      });

      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Không thể lưu ca trực do xung đột!",
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Xử lý xóa/gỡ ca trực
  const handleRemoveShift = (shiftId) => {
    removeShiftAssignment(shiftId);
    setDataVersion((v) => v + 1);
    setToast({
      type: "info",
      message: "Đã hủy ca trực và cập nhật lại tiến độ rà soát xung đột.",
    });
    setTimeout(() => setToast(null), 4000);
  };

  // Reset về dữ liệu mẫu chuẩn demo
  const handleReset = () => {
    resetLocalShifts();
    setDataVersion((v) => v + 1);
    setToast({
      type: "info",
      message: "Đã khôi phục lịch phân công ca trực mẫu của cơ sở Tân Bình.",
    });
    setTimeout(() => setToast(null), 3000);
  };

  // Lọc roster theo tìm kiếm
  const filteredRoster = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staffRoster;
    return staffRoster.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.roleLabel.toLowerCase().includes(q)
    );
  }, [staffRoster, searchTerm]);

  return (
    <AppShell>
      <div className="staff-shifts-page">
        {/* Toast thông báo */}
        {toast && (
          <div className={`shifts-toast shifts-toast--${toast.type}`} role="alert">
            {toast.type === "error" ? (
              <WarningCircle size={20} weight="fill" />
            ) : (
              <CheckCircle size={20} weight="fill" />
            )}
            <span>{toast.message}</span>
            <button
              className="shifts-toast__close"
              onClick={() => setToast(null)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Subheader Telemetry Bar ── */}
        <section className="shifts-telemetry" aria-label="Thông tin cơ sở & ca trực">
          <div className="shifts-telemetry__left">
            <span className="telemetry-dot" aria-hidden="true" />
            <span className="telemetry-facility">VN-SGN-01 (Tân Bình Gateway)</span>
            <span className="telemetry-sep">•</span>
            <span className="telemetry-status">Hệ thống bình thường</span>
            <span className="telemetry-sep">•</span>
            <span className="telemetry-online">Cổng tự động: Online</span>
          </div>
          <div className="shifts-telemetry__right">
            <div className="telemetry-shift-window">
              <Clock size={15} weight="bold" className="telemetry-icon" />
              <span>
                Khung ca hiện tại: <strong>Morning (07:00 – 15:00)</strong>
              </span>
            </div>
            <span className="telemetry-clock">11:42 ICT (UTC+7)</span>
          </div>
        </section>

        {/* ── Main Canvas ── */}
        <div className="shifts-container">
          {/* Header & Controls */}
          <header className="shifts-header">
            <div>
              <div className="shifts-breadcrumb">
                <span>Vận hành cơ sở</span>
                <span className="shifts-breadcrumb__sep">/</span>
                <span className="shifts-breadcrumb__curr">Lịch trực nhân viên</span>
              </div>
              <h1 className="shifts-title">Phân công ca trực & Rà soát xung đột</h1>
              <p className="shifts-subtitle">
                Phân công ca trực theo khu vực và tự động phát hiện lịch trực bị trùng.
              </p>
            </div>
            <div className="shifts-header__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleReset}
                title="Khôi phục trạng thái mẫu ban đầu để test lại"
              >
                <ArrowsClockwise size={16} weight="bold" />
                <span>Đặt lại dữ liệu mẫu</span>
              </button>
            </div>
          </header>

          {/* ── Row 4 KPI Summary Cards ── */}
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

          {/* ── Top Assignment Form Bar ── */}
          <section className="shifts-form-panel">
            <div className="shifts-form-panel__head">
              <div className="shifts-form-panel__title-group">
                <h2 className="shifts-form-panel__title">Phân công ca trực mới</h2>
                <span className="badge badge--neutral">Trực tiếp lên bảng tuần</span>
              </div>
              <span className="shifts-form-panel__tip">
                Kiểm tra va chạm tự động theo quy tắc Staff × Zone × Ca × Ngày
              </span>
            </div>

            <form className="shifts-form-grid" onSubmit={handleSaveAssignment}>
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
                  {INITIAL_STAFF.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Khu vực Zone */}
              <div className="form-group">
                <label className="form-label" htmlFor="shift-zone">
                  Khu vực phân công (Zone)
                </label>
                <select
                  id="shift-zone"
                  className="form-select"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  {ZONES.map((z) => (
                    <option key={z.id} value={z.code}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Khung giờ ca */}
              <div className="form-group">
                <label className="form-label" htmlFor="shift-window">
                  Khung ca trực
                </label>
                <select
                  id="shift-window"
                  className="form-select"
                  value={selectedWindow}
                  onChange={(e) => setSelectedWindow(e.target.value)}
                >
                  <option value="MORNING">Ca sáng (07:00 – 15:00)</option>
                  <option value="AFTERNOON">Ca chiều (15:00 – 23:00)</option>
                  <option value="FULL_DAY">Cả ngày (07:00 – 23:00)</option>
                  <option value="ON_CALL">Trực khẩn cấp / On-call</option>
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
                      {d.dayName}, {d.label} (Tháng 10/2026) {d.isToday ? "· Hôm nay" : ""}
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
                    onClick={() => {
                      setSelectedStaffId(INITIAL_STAFF[0].id);
                      setSelectedZone(ZONES[0].code);
                      setSelectedWindow("MORNING");
                      setSelectedDate(DAYS_OF_WEEK[0].key);
                    }}
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

          {/* ── Prominent Conflict Alert Banner (Nếu có xung đột trong lịch hiện hành) ── */}
          {totalConflicts > 0 && (
            <div className="conflict-banner" role="alert">
              <div className="conflict-banner__left">
                <div className="conflict-banner__icon-box">
                  <WarningCircle size={22} weight="fill" />
                </div>
                <div>
                  <strong className="conflict-banner__title">
                    Phát hiện trùng lịch trực ({totalConflicts} ca):
                  </strong>
                  <p className="conflict-banner__msg">
                    Minh Nguyễn hiện đang có 2 ca trùng vào Thứ 2 (12/10). Bấm vào biểu tượng thùng rác ở bảng lịch bên dưới để điều chỉnh lại.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Two-Zone Split Layout ── */}
          <div className="shifts-split-layout">
            {/* Cột trái (40%): Roster nhân sự */}
            <aside className="shifts-roster-col">
              <div className="roster-header">
                <div>
                  <h2 className="roster-title">Danh sách nhân sự trực ca</h2>
                  <span className="roster-count">{filteredRoster.length} nhân viên</span>
                </div>
                <div className="roster-search">
                  <MagnifyingGlass size={16} className="roster-search__icon" />
                  <input
                    type="text"
                    className="roster-search__input"
                    placeholder="Tìm theo tên, RFID, khu vực..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="roster-list">
                {filteredRoster.map((staff) => (
                  <article
                    key={staff.id}
                    className={`staff-card ${
                      staff.hasConflict ? "staff-card--conflict" : ""
                    }`}
                  >
                    <div className="staff-card__accent" aria-hidden="true" />
                    <div className="staff-card__content">
                      <div className="staff-card__header">
                        <div>
                          <h3 className="staff-card__name">{staff.fullName}</h3>
                          <p className="staff-card__role">{staff.roleLabel}</p>
                          <div className="staff-card__meta">
                            <span className="tag-code">{staff.rfid}</span>
                            <span>{staff.station}</span>
                          </div>
                        </div>
                        <div className="staff-card__badges">
                          <span
                            className={`badge ${
                              staff.status === "ON_DUTY"
                                ? "badge--success"
                                : staff.status === "SCHEDULED"
                                ? "badge--primary"
                                : "badge--neutral"
                            }`}
                          >
                            {staff.statusText}
                          </span>
                          {staff.hasConflict ? (
                            <span className="badge badge--danger">
                              {staff.shiftCount}/5 ca (1 va chạm)
                            </span>
                          ) : (
                            <span className="badge badge--neutral">
                              {staff.shiftCount}/5 ca (Chuẩn)
                            </span>
                          )}
                        </div>
                      </div>

                      {staff.hasConflict && (
                        <div className="staff-card__conflict-note">
                          <WarningCircle size={15} weight="fill" />
                          <span>Cần xử lý xung đột vào Thứ 2 (12/10) ca sáng</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="roster-footer">
                <ShieldCheck size={16} />
                <span>Thời lượng ca chuẩn 8 tiếng, tuân thủ Bộ luật Lao động VN.</span>
              </div>
            </aside>

            {/* Cột phải (60%): Weekly Schedule Table */}
            <main className="shifts-schedule-col">
              <div className="schedule-header">
                <div>
                  <h2 className="schedule-title">Lịch trực tuần này</h2>
                  <span className="schedule-subtitle">(12/10 – 18/10/2026)</span>
                </div>
                <div className="schedule-meta-pill">
                  <span className="dot-live" />
                  <span>Tự động kiểm tra xung đột</span>
                </div>
              </div>

              <div className="schedule-table-wrap">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th className="th-staff">Nhân viên</th>
                      {DAYS_OF_WEEK.map((d) => (
                        <th
                          key={d.key}
                          className={`th-day ${
                            d.isToday && totalConflicts > 0 ? "th-day--conflict" : ""
                          }`}
                        >
                          <div className="th-day__inner">
                            <span>{d.label}</span>
                            {d.isToday && (
                              <span className="today-badge">
                                {totalConflicts > 0 ? "1 Lỗi" : "Hôm nay"}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffRoster.map((staff) => (
                      <tr key={staff.id}>
                        <td className="td-staff">
                          <strong className="td-staff__name">{staff.fullName}</strong>
                          <span className="td-staff__code">{staff.code}</span>
                        </td>
                        {DAYS_OF_WEEK.map((day) => {
                          const dayShifts = staff.shifts.filter(
                            (s) => s.date === day.key
                          );

                          if (dayShifts.length === 0) {
                            return (
                              <td key={day.key} className="td-day td-day--off">
                                <span className="off-label">Nghỉ ca</span>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={day.key}
                              className={`td-day ${
                                dayShifts.some((s) => s.isConflict)
                                  ? "td-day--conflict"
                                  : ""
                              }`}
                            >
                              <div className="td-shifts-stack">
                                {dayShifts.map((shift) => (
                                  <div
                                    key={shift.id}
                                    className={`shift-pill ${
                                      shift.isConflict ? "shift-pill--conflict" : ""
                                    }`}
                                  >
                                    <div className="shift-pill__info">
                                      <span className="shift-pill__title">
                                        {shift.shiftWindow === "MORNING"
                                          ? "Sáng"
                                          : shift.shiftWindow === "AFTERNOON"
                                          ? "Chiều"
                                          : shift.shiftWindow === "FULL_DAY"
                                          ? "Cả ngày"
                                          : "Trực"}{" "}
                                        · {shift.zone}
                                      </span>
                                      {shift.isConflict && (
                                        <span className="shift-pill__warn">
                                          <WarningCircle size={12} weight="fill" />
                                          Trùng ca!
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      className="shift-pill__del"
                                      onClick={() => handleRemoveShift(shift.id)}
                                      title="Xóa ca trực này để giải phóng lịch"
                                      aria-label={`Xóa ca ${shift.zone}`}
                                    >
                                      <Trash size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="schedule-legend">
                <span className="legend-label">CHÚ THÍCH:</span>
                <div className="legend-item">
                  <span className="legend-box legend-box--morning" />
                  <span>Ca sáng (07:00 – 15:00)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box legend-box--afternoon" />
                  <span>Ca chiều (15:00 – 23:00)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box legend-box--fullday" />
                  <span>Cả ngày / Giám sát</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box legend-box--conflict" />
                  <span className="text-error font-semibold">Trùng ca / Xung đột</span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
