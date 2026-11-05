import { useState } from "react";
import Modal from "../../../components/Modal/Modal.jsx";
import Button from "../../../components/Button/Button.jsx";
import { dispatchSupportTicket } from "../../../services/ticketService.js";
import { searchUnits } from "../../../services/unitService.js";

export default function ManagerDispatchModal({ ticket, onClose, onSuccess }) {
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState("INSTRUCT");
  const [managerPlan, setManagerPlan] = useState("");
  const [newUnitId, setNewUnitId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!ticket) return null;

  const loadUnits = async () => {
    setLoadingUnits(true);
    setError("");
    try {
      const data = await searchUnits({
        facilityId: ticket.facilityId || "",
        startDate,
        endDate,
        pageSize: 100,
      });
      const items = Array.isArray(data?.items) ? data.items : [];
      setUnits(items.filter((u) => (u.availability?.status || u.availability) === "AVAILABLE"));
    } catch (err) {
      setError(err.message || "Không thể tải kho trống.");
    } finally {
      setLoadingUnits(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!managerPlan.trim()) {
      setError("Vui lòng nhập chỉ đạo / lý do.");
      return;
    }
    if (mode === "RELOCATE" && (!newUnitId || !startDate || !endDate)) {
      setError("Chọn kho mới và khoảng ngày.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await dispatchSupportTicket({
        ticketId: ticket.id,
        mode,
        managerPlan: managerPlan.trim(),
        newUnitId: mode === "RELOCATE" ? Number(newUnitId) : null,
        newStartDate: mode === "RELOCATE" ? startDate : null,
        newEndDate: mode === "RELOCATE" ? endDate : null,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Không thể điều phối.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen title={`ĐIỀU PHỐI SỰ CỐ · ${ticket.code}`} onClose={onClose} showFooter={false}>
      <form onSubmit={submit} className="modal-form-grid">
        {error && (
          <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
            {error}
          </div>
        )}
        <div className="form-field">
          <label className="form-field__label">Hình thức xử lý</label>
          <select className="form-field__input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="INSTRUCT">Gửi chỉ đạo cho nhân viên</option>
            <option value="RELOCATE">Đổi kho cho khách</option>
            <option value="CHECKOUT_REFUND">Không có kho phù hợp — checkout hoàn tiền</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-field__label">Chỉ đạo / lý do *</label>
          <textarea rows={3} className="form-field__textarea" value={managerPlan} onChange={(e) => setManagerPlan(e.target.value)} required />
        </div>

        {mode === "RELOCATE" && (
          <>
            <div className="rd-form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-field__label">Từ ngày</label>
                <input type="date" className="form-field__input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-field__label">Đến ngày</label>
                <input type="date" className="form-field__input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button variant="secondary" onClick={loadUnits} disabled={loadingUnits}>
              {loadingUnits ? "Đang tải..." : "Tải kho trống"}
            </Button>
            <div className="form-field">
              <label className="form-field__label">Kho mới (cùng giá hoặc cao hơn)</label>
              <select className="form-field__input" value={newUnitId} onChange={(e) => setNewUnitId(e.target.value)}>
                <option value="">-- Chọn kho --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} · {u.typeName} · {u.sizeM2} m²
                  </option>
                ))}
              </select>
              <small style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
                Chọn kho cùng giá hoặc giá cao hơn. Chênh lệch công ty chịu; không thu tiền khách.
              </small>
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Xác nhận điều phối"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
