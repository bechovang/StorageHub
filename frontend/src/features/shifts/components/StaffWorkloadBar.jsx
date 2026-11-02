import { User } from "@phosphor-icons/react";

export default function StaffWorkloadBar({
  staffRoster = [],
  highlightedStaffId = null,
  onToggleHighlight,
}) {
  return (
    <div className="staff-workload-bar">
      <div className="workload-bar-header">
        <div className="workload-bar-title-group">
          <User size={18} weight="duotone" />
          <h3 className="workload-bar-title">Phân bổ tải công việc nhân sự trong tuần</h3>
          <span className="workload-bar-tip">
            (Bấm vào nhân viên để highlight vị trí ca trực trên bảng)
          </span>
        </div>
        {highlightedStaffId && (
          <button
            type="button"
            className="workload-clear-highlight"
            onClick={() => onToggleHighlight(null)}
          >
            Bỏ chọn highlight
          </button>
        )}
      </div>

      <div className="workload-staff-grid">
        {staffRoster.map((staff) => {
          const count = staff.shiftCount || 0;
          const target = 5; // Định mức chuẩn 5 ca / tuần
          const percent = Math.min(100, Math.round((count / target) * 100));
          const isSelected = highlightedStaffId && Number(highlightedStaffId) === staff.id;

          let statusBadgeClass = "badge--neutral";
          let statusLabel = `${count}/${target} ca`;

          if (count === 0) {
            statusBadgeClass = "badge--warning-subtle";
            statusLabel = "0 ca (Rảnh)";
          } else if (count >= 1 && count <= 4) {
            statusBadgeClass = "badge--info-subtle";
            statusLabel = `${count}/5 ca (Đang xếp)`;
          } else if (count === 5) {
            statusBadgeClass = "badge--success-subtle";
            statusLabel = "5/5 ca (Đủ chuẩn)";
          } else if (count > 5) {
            statusBadgeClass = "badge--danger-subtle";
            statusLabel = `${count}/5 ca (Quá tải)`;
          }

          return (
            <div
              key={staff.id}
              className={`workload-staff-card ${isSelected ? "is-selected" : ""}`}
              onClick={() =>
                onToggleHighlight(isSelected ? null : staff.id)
              }
              title="Bấm để highlight các ca làm việc của nhân viên này trên bảng lịch"
            >
              <div className="workload-staff-top">
                <div className="workload-staff-avatar">
                  {staff.fullName.charAt(0)}
                </div>
                <div className="workload-staff-info">
                  <strong className="workload-staff-name">{staff.fullName}</strong>
                  <span className="workload-staff-code">{staff.code}</span>
                </div>
                <span className={`workload-status-badge ${statusBadgeClass}`}>
                  {statusLabel}
                </span>
              </div>

              {/* Progress bar đo tải công việc */}
              <div className="workload-progress-wrap">
                <div
                  className={`workload-progress-bar ${
                    count > 5
                      ? "workload-progress-bar--overload"
                      : count === 5
                      ? "workload-progress-bar--full"
                      : ""
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
