import { useState } from "react";
import { X, Plus, Trash, FloppyDisk, ArrowCounterClockwise } from "@phosphor-icons/react";

/**
 * LegalEditorModal — Form chỉnh sửa văn bản pháp lý trực quan dành cho Admin/Business Ops
 */
export default function LegalEditorModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  onReset,
}) {
  const [formData, setFormData] = useState(() => JSON.parse(JSON.stringify(initialData)));
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClauseChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedClauses = [...prev.clauses];
      updatedClauses[index] = { ...updatedClauses[index], [field]: value };
      return { ...prev, clauses: updatedClauses };
    });
  };

  const handleBulletsChange = (index, bulletsText) => {
    const bullets = bulletsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    handleClauseChange(index, "bullets", bullets);
  };

  const handleAddClause = () => {
    const nextIdx = formData.clauses.length + 1;
    const newClause = {
      id: `clause-${Date.now()}`,
      number: `ĐIỀU ${nextIdx}`,
      title: "TIÊU ĐỀ ĐIỀU KHOẢN MỚI",
      content: "Nội dung quy định chi tiết...",
      bullets: [],
    };
    setFormData((prev) => ({ ...prev, clauses: [...prev.clauses, newClause] }));
  };

  const handleDeleteClause = (index) => {
    if (formData.clauses.length <= 1) {
      alert("Văn bản pháp lý phải có ít nhất 1 điều khoản.");
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa điều khoản này không?`)) {
      setFormData((prev) => ({
        ...prev,
        clauses: prev.clauses.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Bạn có chắc muốn khôi phục toàn bộ văn bản về phiên bản gốc mặc định không? Mọi thay đổi sẽ bị ghi đè.")) {
      onReset();
      onClose();
    }
  };

  return (
    <div className="legal-modal-backdrop" onClick={onClose}>
      <div className="legal-editor-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="legal-editor-header">
          <div>
            <h3 className="legal-editor-header__title">
              Chỉnh sửa: {formData.title}
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "var(--font-mono)" }}>
              Khu vực Quản trị Pháp lý · StorageHub Admin
            </span>
          </div>
          <button
            type="button"
            className="legal-back-btn"
            style={{ padding: "4px 8px" }}
            onClick={onClose}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="legal-editor-body">
          {/* Thông tin chung */}
          <div className="legal-form-grid">
            <div className="legal-field-group">
              <label className="legal-field-label">Tiêu đề văn bản</label>
              <input
                className="legal-input"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                required
              />
            </div>

            <div className="legal-field-group">
              <label className="legal-field-label">Phiên bản (Version)</label>
              <input
                className="legal-input"
                value={formData.version}
                onChange={(e) => handleFieldChange("version", e.target.value)}
                required
              />
            </div>

            <div className="legal-field-group">
              <label className="legal-field-label">Ngày có hiệu lực</label>
              <input
                className="legal-input"
                value={formData.effectiveDate}
                onChange={(e) => handleFieldChange("effectiveDate", e.target.value)}
                required
              />
            </div>

            <div className="legal-field-group">
              <label className="legal-field-label">Đơn vị / Người cập nhật</label>
              <input
                className="legal-input"
                value={formData.updatedBy}
                onChange={(e) => handleFieldChange("updatedBy", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="legal-field-group">
            <label className="legal-field-label">Mô tả phụ (Subtitle)</label>
            <textarea
              rows={2}
              className="legal-textarea"
              value={formData.subtitle}
              onChange={(e) => handleFieldChange("subtitle", e.target.value)}
            />
          </div>

          {/* Danh sách các điều khoản */}
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="legal-field-label">Danh sách Điều khoản ({formData.clauses.length})</span>
              <button
                type="button"
                className="legal-action-btn"
                onClick={handleAddClause}
                style={{ fontSize: "0.72rem" }}
              >
                <Plus size={14} weight="bold" />
                Thêm Điều khoản
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {formData.clauses.map((clause, idx) => (
                <div key={clause.id || idx} className="legal-editor-clause-card">
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      style={{ width: "90px" }}
                      className="legal-input"
                      value={clause.number}
                      onChange={(e) => handleClauseChange(idx, "number", e.target.value)}
                      placeholder="ĐIỀU X"
                    />
                    <input
                      style={{ flex: 1 }}
                      className="legal-input"
                      value={clause.title}
                      onChange={(e) => handleClauseChange(idx, "title", e.target.value)}
                      placeholder="Tiêu đề điều khoản..."
                    />
                    <button
                      type="button"
                      className="legal-back-btn"
                      onClick={() => handleDeleteClause(idx)}
                      title="Xóa điều khoản này"
                      style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                    >
                      <Trash size={14} />
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    className="legal-textarea"
                    value={clause.content}
                    onChange={(e) => handleClauseChange(idx, "content", e.target.value)}
                    placeholder="Đoạn văn nội dung điều khoản..."
                  />

                  <div className="legal-field-group">
                    <label style={{ fontSize: "0.7rem", color: "#64748b" }}>
                      Các ý gạch đầu dòng (Mỗi dòng là một ý):
                    </label>
                    <textarea
                      rows={2}
                      className="legal-textarea"
                      value={(clause.bullets || []).join("\n")}
                      onChange={(e) => handleBulletsChange(idx, e.target.value)}
                      placeholder="- Điểm a: ...&#10;- Điểm b: ..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="legal-editor-footer">
          <button
            type="button"
            className="legal-action-btn"
            style={{ color: "#64748b" }}
            onClick={handleResetToDefault}
          >
            <ArrowCounterClockwise size={15} />
            Khôi phục mặc định
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="legal-action-btn"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="button"
              className="legal-action-btn"
              style={{ background: "var(--color-ink)", color: "#fff" }}
              onClick={handleSubmit}
              disabled={saving}
            >
              <FloppyDisk size={15} weight="bold" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
