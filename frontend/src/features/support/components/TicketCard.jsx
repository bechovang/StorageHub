import { CheckCircle, ShieldWarning } from "@phosphor-icons/react";
import {
  parseStaffInfo,
  INCIDENT_TYPES,
  TICKET_STATUSES,
} from "../../../services/ticketService.js";

export default function TicketCard({
  ticket,
  isStaffOrAdmin,
  onResolve,
  onEscalate,
}) {
  const t = ticket;
  const statusInfo = TICKET_STATUSES[t.status] || TICKET_STATUSES.OPEN;
  const incidentInfo = INCIDENT_TYPES[t.incidentType] || INCIDENT_TYPES.OTHER;
  const staffInfo = parseStaffInfo(t);

  return (
    <div className="ticket-card">
      <div className="ticket-card__header">
        <div>
          <span className="ticket-card__code">{t.code}</span>
          <span className="ticket-card__unit-tag">Ô KHO: {t.unitCode}</span>
          <span style={{ fontSize: "0.78rem", color: "var(--color-muted)", marginLeft: "10px" }}>
            ({t.zoneCode})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="incident-badge">{incidentInfo.label}</span>
          <span className={`status-ticket-chip ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="ticket-card__body">{t.description}</div>

      {t.resolutionNote && (
        <div className="ticket-resolution-box">
          <strong>Kết quả xử lý từ nhân viên:</strong> {t.resolutionNote}
        </div>
      )}

      {t.escalationReason && (
        <div className="ticket-escalate-box">
          <strong>Lý do chuyển Quản lý:</strong> {t.escalationReason}
        </div>
      )}

      <div className="ticket-card__meta">
        <div className="ticket-meta-info">
          <div className="ticket-meta-party">
            <span className="ticket-meta-label">Người gửi:</span>
            <strong className="ticket-meta-name">{t.customerName}</strong>
            {t.customerPhone && (
              <span className="ticket-meta-sub">({t.customerPhone})</span>
            )}
          </div>

          <span className="ticket-meta-divider">|</span>

          <div className="ticket-meta-party">
            <span className="ticket-meta-label">Tiếp nhận:</span>
            <strong className="ticket-meta-name">{staffInfo.name}</strong>
            <span className={`staff-role-chip ${staffInfo.roleBadgeClass}`}>
              {staffInfo.roleLabel}
            </span>
          </div>
        </div>

        {/* Staff actions */}
        {isStaffOrAdmin && t.status !== "RESOLVED" && (
          <div className="ticket-card__actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => onResolve(t)}
            >
              <CheckCircle size={15} weight="bold" />
              <span>Đã xử lý xong</span>
            </button>
            {t.status !== "ESCALATED" && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => onEscalate(t)}
              >
                <ShieldWarning size={15} weight="bold" />
                <span>Chuyển cấp Quản lý</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
