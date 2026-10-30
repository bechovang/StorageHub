import Modal from "../../../components/Modal/Modal.jsx";
import { INCIDENT_TYPES } from "../../../services/ticketService.js";

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit,
  rentedUnits = [],
  unitCode,
  setUnitCode,
  incidentType,
  setIncidentType,
  description,
  setDescription,
  createError,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GỬI YÊU CẦU HỖ TRỢ SỰ CỐ"
    >
      <form onSubmit={onSubmit} className="modal-form-grid">
        {createError && (
          <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
            {createError}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="ticket-unit-select" className="form-field__label">
            Kho đang thuê gặp sự cố *
          </label>
          {rentedUnits.length > 0 ? (
            <select
              id="ticket-unit-select"
              required
              className="form-field__select"
              value={unitCode}
              onChange={(e) => setUnitCode(e.target.value)}
            >
              <option value="" disabled>-- Chọn kho bạn đang thuê --</option>
              {rentedUnits.map((u) => (
                <option key={u.code} value={u.code}>
                  Kho {u.code} · {u.typeName || "Tiêu chuẩn"} ({u.sizeM2 || 5} m²) · {u.facilityName || "Cơ sở Tân Bình"}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              required
              className="form-field__input"
              placeholder="Ví dụ: S-3, M-2..."
              value={unitCode}
              onChange={(e) => setUnitCode(e.target.value)}
            />
          )}
          <span style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>
            Chọn trực tiếp từ danh sách các kho đang hoạt động của bạn.
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
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn--primary">
            Gửi yêu cầu tới nhân viên ca trực
          </button>
        </div>
      </form>
    </Modal>
  );
}
