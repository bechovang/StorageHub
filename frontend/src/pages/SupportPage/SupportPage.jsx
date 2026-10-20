import { useState, useMemo } from "react";
import {
  PlusCircle,
  CheckCircle,
  ShieldWarning,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getTickets,
  createSupportTicket,
  resolveSupportTicket,
  escalateSupportTicket,
  parseStaffInfo,
  INCIDENT_TYPES,
  TICKET_STATUSES,
} from "../../services/ticketService.js";
import "./SupportPage.css";

export default function SupportPage() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const isStaffOrAdmin = user?.role === "STAFF" || user?.role === "SYSTEM_ADMIN" || user?.role === "FACILITY_MANAGER";

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tickets, setTickets] = useState(() =>
    getTickets(isCustomer ? { customerId: user?.id } : {})
  );

  // Modal tạo ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unitCode, setUnitCode] = useState("S-3");
  const [incidentType, setIncidentType] = useState("DEVICE_ISSUE");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");

  // Modal xử lý (RESOLVE)
  const [resolveTargetTicket, setResolveTargetTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolveError, setResolveError] = useState("");

  // Modal chuyển tiếp (ESCALATE)
  const [escalateTargetTicket, setEscalateTargetTicket] = useState(null);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateError, setEscalateError] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (statusFilter !== "ALL") {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [statusFilter, tickets]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      const created = createSupportTicket({
        customerId: user?.id || 1,
        customerName: user?.fullName || "Khách thuê",
        customerPhone: user?.phone || "0901234567",
        unitCode,
        incidentType,
        description,
      });
      setTickets(getTickets(isCustomer ? { customerId: user?.id } : {}));
      setShowCreateModal(false);
      setDescription("");
      showToast(`Đã gửi yêu cầu hỗ trợ mã ${created.code}. Nhân viên trực ca sẽ xử lý ngay.`);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    setResolveError("");
    try {
      resolveSupportTicket({
        ticketId: resolveTargetTicket.ticketId,
        resolutionNote,
        staffName: user?.fullName || "Trần Minh (Staff)",
      });
      setTickets(getTickets(isCustomer ? { customerId: user?.id } : {}));
      setResolveTargetTicket(null);
      setResolutionNote("");
      showToast(`Đã hoàn tất xử lý sự cố ${resolveTargetTicket.code}.`);
    } catch (err) {
      setResolveError(err.message);
    }
  };

  const handleEscalateSubmit = (e) => {
    e.preventDefault();
    setEscalateError("");
    try {
      escalateSupportTicket({
        ticketId: escalateTargetTicket.ticketId,
        escalationReason: escalateReason,
        staffName: user?.fullName || "Trần Minh (Staff)",
      });
      setTickets(getTickets(isCustomer ? { customerId: user?.id } : {}));
      setEscalateTargetTicket(null);
      setEscalateReason("");
      showToast(`Đã chuyển tiếp sự cố ${escalateTargetTicket.code} lên Quản lý cơ sở.`);
    } catch (err) {
      setEscalateError(err.message);
    }
  };

  return (
    <AppShell>
      <div className="support-page">
        {/* Status Bar */}
        <div className="mgmt-telemetry">
          <div className="mgmt-telemetry__left">
            <span className="mgmt-telemetry__dot" />
            <span style={{ fontWeight: 600 }}>Bộ phận hỗ trợ kỹ thuật & vận hành:</span>
            <span>Tân Bình Depot</span>
            <span>|</span>
            <span>Hotline trực ca: 1900 8888</span>
          </div>
          <div className="mgmt-telemetry__right">
            <span>RESPONSE_WINDOW_15M</span>
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
              filteredTickets.map((t) => {
                const statusInfo = TICKET_STATUSES[t.status] || TICKET_STATUSES.OPEN;
                const incidentInfo = INCIDENT_TYPES[t.incidentType] || INCIDENT_TYPES.OTHER;
                const staffInfo = parseStaffInfo(t);

                return (
                  <div key={t.ticketId} className="ticket-card">
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

                    <div className="ticket-card__body">
                      {t.description}
                    </div>

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
                            onClick={() => {
                              setResolveTargetTicket(t);
                              setResolutionNote("");
                              setResolveError("");
                            }}
                          >
                            <CheckCircle size={15} weight="bold" />
                            <span>Đã xử lý xong</span>
                          </button>
                          {t.status !== "ESCALATED" && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => {
                                setEscalateTargetTicket(t);
                                setEscalateReason("");
                                setEscalateError("");
                              }}
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
              })
            )}
          </div>
        </div>

        {/* ── Modal tạo ticket mới ── */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="GỬI YÊU CẦU HỖ TRỢ SỰ CỐ"
          >
            <form onSubmit={handleCreateSubmit} className="modal-form-grid">
              {createError && (
                <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
                  {createError}
                </div>
              )}

              <div className="form-field">
                <label className="form-field__label">Ô kho gặp sự cố *</label>
                <input
                  type="text"
                  required
                  className="form-field__input"
                  placeholder="Ví dụ: S-3, M-2..."
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>
                  Yêu cầu hỗ trợ bắt buộc phải gắn với kho hợp lệ bạn đang thuê.
                </span>
              </div>

              <div className="form-field">
                <label className="form-field__label">Loại sự cố *</label>
                <select
                  className="form-field__select"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                >
                  {Object.values(INCIDENT_TYPES).map((inc) => (
                    <option key={inc.key} value={inc.key}>
                      {inc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-field__label">Mô tả cụ thể sự cố bạn đang gặp phải *</label>
                <textarea
                  required
                  rows={4}
                  className="form-field__textarea"
                  placeholder="Vui lòng mô tả chi tiết: tình trạng cửa, đèn báo khóa, hoặc vị trí cần dọn dẹp..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="btn btn--outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  Gửi yêu cầu tới nhân viên ca trực
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Modal Resolve Ticket ── */}
        {resolveTargetTicket && (
          <Modal
            isOpen={!!resolveTargetTicket}
            onClose={() => setResolveTargetTicket(null)}
            title="XỬ LÝ HOÀN TẤT SỰ CỐ"
          >
            <form onSubmit={handleResolveSubmit} className="modal-form-grid">
              {resolveError && (
                <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
                  {resolveError}
                </div>
              )}
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                Ghi nhận kết quả xử lý cho yêu cầu <strong>{resolveTargetTicket.code}</strong> (Ô kho {resolveTargetTicket.unitCode} - {resolveTargetTicket.customerName}):
              </p>

              <div className="form-field">
                <label className="form-field__label">Ghi chú giải quyết cho khách hàng *</label>
                <textarea
                  required
                  rows={3}
                  className="form-field__textarea"
                  placeholder="Đã tra dầu bản lề / Cấp lại mã PIN mới / Vệ sinh sàn sạch sẽ..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="btn btn--outline" onClick={() => setResolveTargetTicket(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  Xác nhận xử lý xong
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Modal Escalate Ticket ── */}
        {escalateTargetTicket && (
          <Modal
            isOpen={!!escalateTargetTicket}
            onClose={() => setEscalateTargetTicket(null)}
            title="CHUYỂN TIẾP LÊN QUẢN LÝ CƠ SỞ (ESCALATE)"
          >
            <form onSubmit={handleEscalateSubmit} className="modal-form-grid">
              {escalateError && (
                <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
                  {escalateError}
                </div>
              )}
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-accent)" }}>
                Sự cố nghiêm trọng vượt thẩm quyền xử lý của nhân viên ca trực tại kho {escalateTargetTicket.unitCode} sẽ được chuyển tiếp thẳng vào hộp thư của Facility Manager.
              </p>

              <div className="form-field">
                <label className="form-field__label">Lý do chuyển tiếp (Bắt buộc) *</label>
                <textarea
                  required
                  rows={3}
                  className="form-field__textarea"
                  placeholder="Ví dụ: Rò rỉ nước từ mái, nguy cơ ảnh hưởng hàng hóa cần duyệt di dời khẩn cấp..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="btn btn--outline" onClick={() => setEscalateTargetTicket(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--danger">
                  Xác nhận chuyển Quản lý
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Toast notification nổi ── */}
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
