import {
  Clock,
  WarningCircle,
  CheckCircle,
  X,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  DAYS_OF_WEEK,
  UNIT_TYPES,
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
    selectedType,
    setSelectedType,
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
    allShifts,
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
                Phân công ca trực theo loại kho và tự động phát hiện lịch trực bị trùng.
              </p>
            </div>
          </header>

          {/* ── Row 4 KPI Summary Cards ── */}
          <ShiftKpiGrid
            totalConflicts={totalConflicts}
            staffRoster={staffRoster}
            allShifts={allShifts}
          />

          {/* ── Top Assignment Form Bar ── */}
          <ShiftAssignmentForm
            selectedStaffId={selectedStaffId}
            setSelectedStaffId={setSelectedStaffId}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedWindow={selectedWindow}
            setSelectedWindow={setSelectedWindow}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            liveConflict={liveConflict}
            staffList={staffList}
            onSaveAssignment={handleSaveAssignment}
            onResetDefaults={() => {
              if (staffList && staffList.length > 0) setSelectedStaffId(staffList[0].id);
              setSelectedType(UNIT_TYPES[0].id);
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
                    Có ca trực bị trùng khung giờ hoặc nhân sự trong tuần. Vui lòng kiểm tra các ô màu cam trên bảng lịch bên dưới để điều chỉnh.
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
