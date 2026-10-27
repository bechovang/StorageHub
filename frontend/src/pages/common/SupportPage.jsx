import { PlusCircle, CheckCircle } from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { TICKET_STATUSES } from "../../services/ticketService.js";
import {
  useSupportTickets,
  TicketCard,
  CreateTicketModal,
  ResolveTicketModal,
  EscalateTicketModal,
} from "../../features/support/index.js";
import "./SupportPage.css";

export default function SupportPage() {
  const {
    isCustomer,
    isStaffOrAdmin,
    statusFilter,
    setStatusFilter,
    tickets,
    filteredTickets,
    showCreateModal,
    setShowCreateModal,
    unitCode,
    setUnitCode,
    incidentType,
    setIncidentType,
    description,
    setDescription,
    createError,
    resolveTargetTicket,
    setResolveTargetTicket,
    resolutionNote,
    setResolutionNote,
    resolveError,
    setResolveError,
    escalateTargetTicket,
    setEscalateTargetTicket,
    escalateReason,
    setEscalateReason,
    escalateError,
    setEscalateError,
    toastMessage,
    handleCreateSubmit,
    handleResolveSubmit,
    handleEscalateSubmit,
  } = useSupportTickets();

  return (
    <AppShell>
      <div className="support-page">
        {/* Status Bar */}
        <div className="mgmt-telemetry">
          <div className="mgmt-telemetry__left">
            <span className="mgmt-telemetry__dot" />
            <span style={{ fontWeight: 600 }}>Bộ phận hỗ trợ kỹ thuật & vận hành:</span>
            <span>Cơ sở Tân Bình (VN-SGN-01)</span>
            <span>|</span>
            <span>Hotline trực ca: 1900 8888</span>
          </div>
          <div className="mgmt-telemetry__right">
            <span>PHẢN HỒI TRONG 15 PHÚT</span>
          </div>
        </div>

        <div className="support-container">
          {/* Header */}
          <header className="support-header">
            <div>
              <span className="support-header__super">DỊCH VỤ KHÁCH HÀNG & TRỢ GIÚP KHO BÃI</span>
              <h1 className="support-header__title">TRUNG TÂM HỖ TRỢ SỰ CỐ</h1>
              <p className="support-header__desc">
                Tiếp nhận và giải quyết trực tiếp các vấn đề liên quan đến mã khóa, thiết bị, vệ sinh kho bãi hoặc an ninh.
              </p>
            </div>
            {isCustomer && (
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusCircle size={16} weight="bold" />
                <span>Gửi yêu cầu hỗ trợ</span>
              </button>
            )}
          </header>

          {/* KPI Stats */}
          <div className="support-stats">
            <div className="support-stat-card">
              <span className="support-stat-card__label">Tổng yêu cầu</span>
              <span className="support-stat-card__val">{filteredTickets.length}</span>
            </div>
            <div className="support-stat-card">
              <span className="support-stat-card__label">Chờ tiếp nhận</span>
              <span className="support-stat-card__val" style={{ color: "#1d4ed8" }}>
                {tickets.filter((t) => t.status === "OPEN").length}
              </span>
            </div>
            <div className="support-stat-card">
              <span className="support-stat-card__label">Đã xử lý xong</span>
              <span className="support-stat-card__val" style={{ color: "var(--color-status-success)" }}>
                {tickets.filter((t) => t.status === "RESOLVED").length}
              </span>
            </div>
            <div className="support-stat-card">
              <span className="support-stat-card__label">Chuyển quản lý</span>
              <span className="support-stat-card__val" style={{ color: "var(--color-accent)" }}>
                {tickets.filter((t) => t.status === "ESCALATED").length}
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="support-toolbar">
            <div className="support-tabs">
              <button
                type="button"
                className={`support-tab-btn ${statusFilter === "ALL" ? "support-tab-btn--active" : ""}`}
                onClick={() => setStatusFilter("ALL")}
              >
                Tất cả ({tickets.length})
              </button>
              {Object.values(TICKET_STATUSES).map((st) => (
                <button
                  key={st.key}
                  type="button"
                  className={`support-tab-btn ${statusFilter === st.key ? "support-tab-btn--active" : ""}`}
                  onClick={() => setStatusFilter(st.key)}
                >
                  {st.label} ({tickets.filter((t) => t.status === st.key).length})
                </button>
              ))}
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
              Thời gian trực ca: 07:00 – 23:00 hàng ngày
            </div>
          </div>

          {/* Ticket Cards List */}
          <div className="ticket-list">
            {filteredTickets.length === 0 ? (
              <div style={{ background: "#ffffff", border: "1px solid #d7d7d7", padding: "48px 24px", textAlign: "center" }}>
                <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem" }}>
                  Không có yêu cầu hỗ trợ nào trong danh mục này.
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <TicketCard
                  key={t.ticketId}
                  ticket={t}
                  isStaffOrAdmin={isStaffOrAdmin}
                  onResolve={(ticket) => {
                    setResolveTargetTicket(ticket);
                    setResolutionNote("");
                    setResolveError("");
                  }}
                  onEscalate={(ticket) => {
                    setEscalateTargetTicket(ticket);
                    setEscalateReason("");
                    setEscalateError("");
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Modal tạo ticket mới */}
        <CreateTicketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
          unitCode={unitCode}
          setUnitCode={setUnitCode}
          incidentType={incidentType}
          setIncidentType={setIncidentType}
          description={description}
          setDescription={setDescription}
          createError={createError}
        />

        {/* Modal Resolve Ticket */}
        <ResolveTicketModal
          ticket={resolveTargetTicket}
          onClose={() => setResolveTargetTicket(null)}
          onSubmit={handleResolveSubmit}
          resolutionNote={resolutionNote}
          setResolutionNote={setResolutionNote}
          resolveError={resolveError}
        />

        {/* Modal Escalate Ticket */}
        <EscalateTicketModal
          ticket={escalateTargetTicket}
          onClose={() => setEscalateTargetTicket(null)}
          onSubmit={handleEscalateSubmit}
          escalateReason={escalateReason}
          setEscalateReason={setEscalateReason}
          escalateError={escalateError}
        />

        {/* Toast notification nổi */}
        {toastMessage && (
          <div className="toast-banner toast-banner--success" role="status">
            <CheckCircle size={18} weight="bold" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
