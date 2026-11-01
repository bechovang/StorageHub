import Modal from "../../../components/Modal/Modal.jsx";
import {
  parseStaffInfo,
  INCIDENT_TYPES,
  TICKET_STATUSES,
} from "../../../services/ticketService.js";

function fmtDateTime(raw) {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

/**
 * Chi tiết yêu cầu hỗ trợ (US-23/FR-24): toàn bộ thông tin ticket theo
 * shape TicketResponse của BE — mô tả, người gửi, người tiếp nhận, phương án
 * điều phối (managerPlan + kho thay thế khi SEVERE), kết quả xử lý, lý do
 * chuyển cấp và mốc thời gian tạo/resolve.
 */
export default function TicketDetailModal({ ticket, onClose }) {
  if (!ticket) return null;

  const t = ticket;
  const statusInfo = TICKET_STATUSES[t.status] || TICKET_STATUSES.OPEN;
  const incidentInfo = INCIDENT_TYPES[t.incidentType] || INCIDENT_TYPES.OTHER;
  const staffInfo = parseStaffInfo(t);

  return (
    <Modal isOpen={Boolean(ticket)} onClose={onClose} title={`CHI TIẾT YÊU CẦU HỖ TRỢ ${t.code || ""}`}>
      <div className="ticket-detail">
        {/* Tổng quan trạng thái */}
        <div className="ticket-detail__status-row">
          <span className={`status-ticket-chip ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
          <span className="incident-badge">{incidentInfo.label}</span>
        </div>

        {/* Mô tả sự cố */}
        <section className="ticket-detail__section">
          <h4 className="ticket-detail__heading">Mô tả sự cố</h4>
          <p className="ticket-detail__text">
            {t.description || "(Không có mô tả)"}
          </p>
        </section>

        {/* Thông tin chung */}
        <section className="ticket-detail__section">
          <h4 className="ticket-detail__heading">Thông tin</h4>
          <dl className="ticket-detail__grid">
            <div>
              <dt>Mã phiếu</dt>
              <dd className="font-mono">{t.code}</dd>
            </div>
            <div>
              <dt>Kho</dt>
              <dd className="font-mono">{t.unitCode}</dd>
            </div>
            <div>
              <dt>Người gửi</dt>
              <dd>
                {t.customerName}
                {t.customerPhone ? ` · ${t.customerPhone}` : ""}
              </dd>
            </div>
            <div>
              <dt>Ngày gửi</dt>
              <dd>{fmtDateTime(t.createdAt)}</dd>
            </div>
            <div>
              <dt>Người tiếp nhận</dt>
              <dd>
                {staffInfo.name || "— Chưa tiếp nhận —"}
                {staffInfo.name ? ` (${staffInfo.roleLabel})` : ""}
              </dd>
            </div>
            <div>
              <dt>Thời gian xử lý xong</dt>
              <dd>{t.resolvedAt ? fmtDateTime(t.resolvedAt) : "—"}</dd>
            </div>
          </dl>
        </section>

        {/* Phương án điều phối của quản lý */}
        {(t.managerPlan || t.relocatedToUnit) && (
          <section className="ticket-detail__section">
            <h4 className="ticket-detail__heading">Phương án xử lý từ Quản lý</h4>
            {t.managerPlan && <p className="ticket-detail__text">{t.managerPlan}</p>}
            {t.severityMode === "SEVERE" && t.relocatedToUnit && (
              <p className="ticket-detail__text ticket-detail__text--warn">
                Di dời khẩn cấp sang kho thay thế:{" "}
                <strong className="font-mono">{t.relocatedToUnit}</strong>
              </p>
            )}
          </section>
        )}

        {/* Kết quả xử lý */}
        {t.resolutionNote && (
          <section className="ticket-detail__section">
            <h4 className="ticket-detail__heading">Kết quả xử lý</h4>
            <p className="ticket-detail__text">{t.resolutionNote}</p>
          </section>
        )}

        {/* Lý do chuyển cấp */}
        {t.escalationReason && (
          <section className="ticket-detail__section">
            <h4 className="ticket-detail__heading">Lý do chuyển Quản lý</h4>
            <p className="ticket-detail__text ticket-detail__text--warn">
              {t.escalationReason}
            </p>
          </section>
        )}
      </div>
    </Modal>
  );
}
