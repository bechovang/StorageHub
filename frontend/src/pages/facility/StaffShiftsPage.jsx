import {
  WarningCircle,
  CheckCircle,
  X,
  FloppyDisk,
  ArrowCounterClockwise,
  Spinner,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useStaffShifts,
  ShiftKpiGrid,
  ShiftToolbar,
  ShiftFirstScheduleTable,
  ShiftFillPopover,
  StaffWorkloadBar,
} from "../../features/shifts/index.js";
import "./StaffShiftsPage.css";

export default function StaffShiftsPage() {
  const {
    error,
    saving,
    weekOffset,
    weekDays,
    weekLabel,
    handlePrevWeek,
    handleNextWeek,
    handleCurrentWeek,
    searchTerm,
    setSearchTerm,
    selectedTypeFilter,
    setSelectedTypeFilter,
    highlightedStaffId,
    setHighlightedStaffId,
    toast,
    setToast,
    staffRoster,
    staffList,
    allShifts,
    totalConflicts,
    shiftGrid,
    activeFillPopover,
    handleOpenFillPopover,
    handleCloseFillPopover,
    handleSaveFill,
    handleRemoveShift,
    handleCopyPreviousWeek,
    copying,
    hasPendingChanges,
    pendingCount,
    handleConfirmSave,
    handleRevertChanges,
  } = useStaffShifts();

  return (
    <AppShell>
      <div className="staff-shifts-page">
        {/* Toast thông báo */}
        {error && (
          <div className="shifts-toast shifts-toast--error" role="alert" style={{ top: "76px" }}>
            <WarningCircle size={20} weight="fill" />
            <span>{error}</span>
          </div>
        )}
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

        <div className="shifts-container">
          {/* Header & Title */}
          <header className="shifts-header">
            <div>
              <div className="shifts-breadcrumb">
                <span>Vận hành cơ sở</span>
                <span className="shifts-breadcrumb__sep">/</span>
                <span className="shifts-breadcrumb__curr">Lịch phân ca</span>
              </div>
              <h1 className="shifts-title">Phân công ca trực & Rà soát xung đột</h1>
              <p className="shifts-subtitle">
                Điều phối ca làm việc cơ sở theo tuần, đảm bảo tối đa 4 nhân viên/ca trông coi các nhóm kho và rà soát chồng chéo lịch trực.
              </p>
            </div>
          </header>

          {/* 1. Dải thống kê mỏng (Compact Stats Strip) */}
          <ShiftKpiGrid
            totalConflicts={totalConflicts}
            staffRoster={staffRoster}
            allShifts={allShifts}
          />

          {/* 2. Toolbar điều hướng tuần, tìm kiếm, lọc loại kho & sao chép */}
          <ShiftToolbar
            weekOffset={weekOffset}
            weekLabel={weekLabel}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onCurrentWeek={handleCurrentWeek}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTypeFilter={selectedTypeFilter}
            onTypeFilterChange={setSelectedTypeFilter}
            onCopyPreviousWeek={handleCopyPreviousWeek}
            copying={copying}
            hasPendingChanges={hasPendingChanges}
            pendingCount={pendingCount}
            onConfirmSave={handleConfirmSave}
            onRevertChanges={handleRevertChanges}
            saving={saving}
          />

          {/* 3. Dải banner thông báo thay đổi chưa lưu (Staged / Draft Mode) */}
          {hasPendingChanges && (
            <div className="shifts-staged-banner" role="status">
              <div className="staged-banner__left">
                <span className="staged-banner__pulse-dot" />
                <div>
                  <strong className="staged-banner__title">
                    Có {pendingCount} thay đổi phân ca chưa lưu trên bảng tuần này
                  </strong>
                  <p className="staged-banner__desc">
                    Các thao tác xếp ca, gỡ người và cập nhật loại kho đang ở chế độ nháp. Bấm "Xác nhận lưu ca" để lưu vào cơ sở dữ liệu.
                  </p>
                </div>
              </div>
              <div className="staged-banner__actions">
                <button
                  type="button"
                  className="btn btn--secondary staged-banner__btn-revert"
                  onClick={handleRevertChanges}
                  disabled={saving}
                  title="Hủy toàn bộ thay đổi chưa lưu và khôi phục lịch gốc"
                >
                  <ArrowCounterClockwise size={16} />
                  <span>Hoàn tác</span>
                </button>
                <button
                  type="button"
                  className="btn btn--primary staged-banner__btn-save"
                  onClick={handleConfirmSave}
                  disabled={saving}
                  title="Xác nhận và lưu toàn bộ thay đổi vào cơ sở dữ liệu"
                >
                  {saving ? (
                    <>
                      <Spinner size={16} className="shifts-spinner" />
                      <span>Đang lưu {pendingCount} ca...</span>
                    </>
                  ) : (
                    <>
                      <FloppyDisk size={16} weight="bold" />
                      <span>Xác nhận lưu ca ({pendingCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 4. Cảnh báo nổi bật nếu phát hiện xung đột lịch */}
          {totalConflicts > 0 && (
            <div className="conflict-banner" role="alert">
              <div className="conflict-banner__left">
                <div className="conflict-banner__icon-box">
                  <WarningCircle size={22} weight="fill" />
                </div>
                <div>
                  <strong className="conflict-banner__title">
                    Phát hiện {totalConflicts} ca trực bị xung đột thời gian:
                  </strong>
                  <p className="conflict-banner__msg">
                    Có nhân viên đang bị phân công 2 ca trùng nhau trong ngày. Vui lòng bấm vào thẻ nhân viên có viền đỏ bên dưới để điều chỉnh hoặc hủy ca.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Bảng phân ca theo Ca làm việc (Shift-First Weekly Matrix) */}
          <ShiftFirstScheduleTable
            weekDays={weekDays}
            shiftGrid={shiftGrid}
            highlightedStaffId={highlightedStaffId}
            onOpenFillPopover={handleOpenFillPopover}
            onRemoveShift={handleRemoveShift}
          />

          {/* 6. Thanh tải công việc nhân sự trong tuần (Staff Workload Bar) */}
          <StaffWorkloadBar
            staffRoster={staffRoster}
            highlightedStaffId={highlightedStaffId}
            onToggleHighlight={setHighlightedStaffId}
          />
        </div>

        {/* 7. Quick Fill Popover Modal */}
        <ShiftFillPopover
          activePopover={activeFillPopover}
          staffList={staffList}
          allShifts={allShifts}
          onClose={handleCloseFillPopover}
          onSaveFill={handleSaveFill}
          onRemoveShift={handleRemoveShift}
        />
      </div>
    </AppShell>
  );
}
