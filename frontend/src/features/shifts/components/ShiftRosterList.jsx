import {
  MagnifyingGlass,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";

export default function ShiftRosterList({
  filteredRoster,
  searchTerm,
  setSearchTerm,
}) {
  return (
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
  );
}
