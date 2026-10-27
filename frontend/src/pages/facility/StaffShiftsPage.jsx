import {
  Clock,
  WarningCircle,
  CheckCircle,
  X,
  ArrowLeft,
} from "@phosphor-icons/react";
import { Link } from "react-router";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  DAYS_OF_WEEK,
  ZONES,
  INITIAL_STAFF,
} from "../../services/shiftService.js";
import {
  useStaffShifts,
  ShiftKpiGrid,
  ShiftAssignmentForm,
  ShiftRosterList,
  WeeklyScheduleTable,
} from "../../features/shifts/index.js";
import "./StaffShiftsPage.css";

export default function StaffShiftsPage() {
  const {
    selectedStaffId,
    setSelectedStaffId,
    selectedZone,
    setSelectedZone,
    selectedWindow,
    setSelectedWindow,
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    toast,
    setToast,
    staffRoster,
    staffList,
    totalConflicts,
    liveConflict,
    filteredRoster,
    handleSaveAssignment,
    handleRemoveShift,
  } = useStaffShifts();

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
            <span className="telemetry-facility">Cơ sở Tân Bình (VN-SGN-01)</span>
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
                <Link to="/facility" className="mgmt-back-link">
                  <ArrowLeft size={14} weight="bold" />
                  <span>Tổng quan cơ sở</span>
                </Link>
                <span className="shifts-breadcrumb__sep">/</span>
                <span className="shifts-breadcrumb__curr">Lịch trực nhân viên</span>
              </div>
              <h1 className="shifts-title">Phân công ca trực & Rà soát xung đột</h1>
              <p className="shifts-subtitle">
                Phân công ca trực theo khu vực và tự động phát hiện lịch trực bị trùng.
              </p>
            </div>
          </header>

          {/* ── Row 4 KPI Summary Cards ── */}
          <ShiftKpiGrid totalConflicts={totalConflicts} />

          {/* ── Top Assignment Form Bar ── */}
          <ShiftAssignmentForm
            selectedStaffId={selectedStaffId}
            setSelectedStaffId={setSelectedStaffId}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            selectedWindow={selectedWindow}
            setSelectedWindow={setSelectedWindow}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            liveConflict={liveConflict}
            staffList={staffList}
            onSaveAssignment={handleSaveAssignment}
            onResetDefaults={() => {
              setSelectedStaffId(INITIAL_STAFF[0].id);
              setSelectedZone(ZONES[0].code);
              setSelectedWindow("MORNING");
              setSelectedDate(DAYS_OF_WEEK[0].key);
            }}
          />

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
            <ShiftRosterList
              filteredRoster={filteredRoster}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />

            {/* Cột phải (60%): Weekly Schedule Table */}
            <WeeklyScheduleTable
              staffRoster={staffRoster}
              totalConflicts={totalConflicts}
              onRemoveShift={handleRemoveShift}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
