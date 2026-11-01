import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import {
  FileText,
  ShieldCheck,
  FloppyDisk,
  ArrowCounterClockwise,
  ArrowSquareOut,
  Plus,
  Trash,
  CheckCircle,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getTermsContent,
  saveTermsContent,
  resetTermsContent,
  getPrivacyContent,
  savePrivacyContent,
  resetPrivacyContent,
} from "../../services/legalContentService.js";
import "./LegalManagementPage.css";

/**
 * LegalManagementPage — Trang Quản trị Điều khoản Dịch vụ & Chính sách Bảo mật nội bộ
 * Nằm trọn trong AppShell của Quản trị viên (SYSTEM_ADMIN) và Vận hành (BUSINESS_OPS).
 */
export default function LegalManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "privacy" ? "PRIVACY" : "TERMS";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { user } = useAuth();
  const [docData, setDocData] = useState(() =>
    initialTab === "PRIVACY" ? getPrivacyContent() : getTermsContent()
  );
  const [selectedClauseIndex, setSelectedClauseIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // Đồng bộ dữ liệu khi đổi tab
  useEffect(() => {
    if (activeTab === "TERMS") {
      setDocData(getTermsContent());
    } else {
      setDocData(getPrivacyContent());
    }
    setSelectedClauseIndex(0);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab.toLowerCase() });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cập nhật thông tin chung của tài liệu
  const handleDocFieldChange = (field, value) => {
    setDocData((prev) => ({ ...prev, [field]: value }));
  };

  // Cập nhật điều khoản đang chọn
  const handleClauseChange = (field, value) => {
    setDocData((prev) => {
      const updated = [...prev.clauses];
      if (!updated[selectedClauseIndex]) return prev;
      updated[selectedClauseIndex] = {
        ...updated[selectedClauseIndex],
        [field]: value,
      };
      return { ...prev, clauses: updated };
    });
  };

  const handleBulletsChange = (text) => {
    const bullets = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    handleClauseChange("bullets", bullets);
  };

  const handleAddClause = () => {
    const nextIdx = docData.clauses.length + 1;
    const newClause = {
      id: `clause-${Date.now()}`,
      number: `ĐIỀU ${nextIdx}`,
      title: "TIÊU ĐỀ ĐIỀU KHOẢN MỚI",
      content: "Nội dung quy định chi tiết...",
      bullets: [],
    };
    setDocData((prev) => ({
      ...prev,
      clauses: [...prev.clauses, newClause],
    }));
    setSelectedClauseIndex(docData.clauses.length);
  };

  const handleDeleteClause = (index) => {
    if (docData.clauses.length <= 1) {
      alert("Văn bản pháp lý phải có ít nhất 1 điều khoản.");
      return;
    }
    if (window.confirm("Bạn có chắc muốn xóa điều khoản này không?")) {
      setDocData((prev) => ({
        ...prev,
        clauses: prev.clauses.filter((_, i) => i !== index),
      }));
      setSelectedClauseIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSave = () => {
    const author = user?.fullName || user?.role || "Quản trị viên";
    if (activeTab === "TERMS") {
      saveTermsContent(docData, author);
      showToast("Đã lưu Điều khoản Dịch vụ thành công!");
    } else {
      savePrivacyContent(docData, author);
      showToast("Đã lưu Chính sách Bảo mật thành công!");
    }
  };

  const handleReset = () => {
    const docName = activeTab === "TERMS" ? "Điều khoản Dịch vụ" : "Chính sách Bảo mật";
    if (window.confirm(`Bạn có chắc muốn khôi phục ${docName} về bản gốc mặc định của hệ thống không?`)) {
      if (activeTab === "TERMS") {
        const def = resetTermsContent();
        setDocData(def);
      } else {
        const def = resetPrivacyContent();
        setDocData(def);
      }
      setSelectedClauseIndex(0);
      showToast(`Đã khôi phục ${docName} về bản gốc mặc định!`);
    }
  };

  const activeClause = docData.clauses?.[selectedClauseIndex] || docData.clauses?.[0] || {};
  const publicUrl = activeTab === "TERMS" ? "/terms" : "/privacy";

  return (
    <AppShell>
      <div className="legal-mgmt-page">
        {/* Toast thông báo */}
        {toastMessage && (
          <div className="legal-mgmt-toast" role="alert">
            <CheckCircle size={18} weight="fill" color="#16a34a" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="legal-mgmt-canvas">
          {/* Header */}
          <section className="legal-mgmt-header">
            <div>
              <div className="legal-mgmt-breadcrumb">
                <span>StorageHub VN</span>
                <span>/</span>
                <span>Quản trị vận hành</span>
                <span>/</span>
                <span style={{ color: "var(--color-ink)", fontWeight: 700 }}>
                  Điều khoản & Pháp lý
                </span>
              </div>
              <h1 className="legal-mgmt-title">Quản trị Văn bản Pháp lý & Quy chế</h1>
            </div>

            <div className="legal-mgmt-actions">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="policy-btn policy-btn--ghost"
                title="Xem văn bản hiển thị trực tiếp cho khách hàng trong tab mới"
              >
                <ArrowSquareOut size={16} weight="bold" />
                <span>Xem trang công khai ↗</span>
              </a>

              <button
                type="button"
                className="policy-btn policy-btn--secondary"
                onClick={handleReset}
                title="Khôi phục lại phiên bản gốc mặc định"
              >
                <ArrowCounterClockwise size={15} weight="bold" />
                <span>Mặc định gốc</span>
              </button>

              <button
                type="button"
                className="policy-btn policy-btn--primary"
                onClick={handleSave}
              >
                <FloppyDisk size={16} weight="bold" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </section>

          {/* Tab Selector */}
          <div className="legal-mgmt-tabs">
            <button
              type="button"
              className={`legal-mgmt-tab ${activeTab === "TERMS" ? "is-active" : ""}`}
              onClick={() => handleTabChange("TERMS")}
            >
              <FileText size={16} weight="bold" />
              <span>Điều khoản Dịch vụ (/terms)</span>
            </button>
            <button
              type="button"
              className={`legal-mgmt-tab ${activeTab === "PRIVACY" ? "is-active" : ""}`}
              onClick={() => handleTabChange("PRIVACY")}
            >
              <ShieldCheck size={16} weight="bold" />
              <span>Chính sách Bảo mật (/privacy)</span>
            </button>
          </div>

          {/* 2-Column Grid Editor */}
          <div className="legal-mgmt-grid">
            {/* ── CỘT TRÁI: THÔNG TIN CHUNG & DANH SÁCH ĐIỀU KHOẢN ── */}
            <div className="legal-mgmt-col-left">
              {/* Card 1: Thông tin văn bản */}
              <div className="legal-mgmt-card">
                <div className="legal-mgmt-card__header">
                  <h3 className="legal-mgmt-card__title">Thông tin Phiên bản</h3>
                </div>
                <div className="legal-mgmt-card__body">
                  <div className="legal-edit-group">
                    <label className="legal-edit-label">Tiêu đề văn bản</label>
                    <input
                      className="legal-edit-input"
                      value={docData.title || ""}
                      onChange={(e) => handleDocFieldChange("title", e.target.value)}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="legal-edit-group">
                      <label className="legal-edit-label">Phiên bản</label>
                      <input
                        className="legal-edit-input"
                        value={docData.version || ""}
                        onChange={(e) => handleDocFieldChange("version", e.target.value)}
                      />
                    </div>
                    <div className="legal-edit-group">
                      <label className="legal-edit-label">Ngày hiệu lực</label>
                      <input
                        className="legal-edit-input"
                        value={docData.effectiveDate || ""}
                        onChange={(e) => handleDocFieldChange("effectiveDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="legal-edit-group" style={{ marginBottom: 0 }}>
                    <label className="legal-edit-label">Mô tả phụ</label>
                    <textarea
                      rows={2}
                      className="legal-edit-textarea"
                      value={docData.subtitle || ""}
                      onChange={(e) => handleDocFieldChange("subtitle", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Danh sách các điều khoản */}
              <div className="legal-mgmt-card">
                <div className="legal-mgmt-card__header">
                  <h3 className="legal-mgmt-card__title">
                    Danh mục Điều khoản ({docData.clauses?.length || 0})
                  </h3>
                  <button
                    type="button"
                    className="policy-btn policy-btn--secondary policy-btn--sm"
                    onClick={handleAddClause}
                    style={{ fontSize: "0.72rem" }}
                  >
                    <Plus size={13} weight="bold" />
                    Thêm điều
                  </button>
                </div>
                <div className="legal-mgmt-card__body" style={{ padding: "8px" }}>
                  <div className="legal-clause-nav-list">
                    {(docData.clauses || []).map((clause, idx) => (
                      <div
                        key={clause.id || idx}
                        className={`legal-clause-nav-item ${
                          idx === selectedClauseIndex ? "is-selected" : ""
                        }`}
                        onClick={() => setSelectedClauseIndex(idx)}
                      >
                        <span className="legal-clause-nav-item__badge">
                          {clause.number || `ĐIỀU ${idx + 1}`}
                        </span>
                        <span className="legal-clause-nav-item__title">
                          {clause.title || "Chưa đặt tiêu đề"}
                        </span>
                        <button
                          type="button"
                          className="legal-back-btn"
                          style={{
                            padding: "2px 6px",
                            border: "none",
                            background: "transparent",
                            color: idx === selectedClauseIndex ? "#fca5a5" : "#dc2626",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClause(idx);
                          }}
                          title="Xóa điều khoản này"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CỘT PHẢI: KHUNG BIÊN TẬP CHI TIẾT ĐIỀU KHOẢN ĐANG CHỌN ── */}
            <div className="legal-mgmt-col-right">
              <div className="legal-mgmt-card">
                <div className="legal-mgmt-card__header">
                  <h3 className="legal-mgmt-card__title">
                    Biên tập: {activeClause.number || `Điều ${selectedClauseIndex + 1}`} —{" "}
                    {activeClause.title || ""}
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                    Điều {selectedClauseIndex + 1} / {docData.clauses?.length || 0}
                  </span>
                </div>

                <div className="legal-mgmt-card__body">
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px" }}>
                    <div className="legal-edit-group">
                      <label className="legal-edit-label">Số điều</label>
                      <input
                        className="legal-edit-input"
                        value={activeClause.number || ""}
                        onChange={(e) => handleClauseChange("number", e.target.value)}
                        placeholder="ĐIỀU 1"
                      />
                    </div>
                    <div className="legal-edit-group">
                      <label className="legal-edit-label">Tiêu đề điều khoản</label>
                      <input
                        className="legal-edit-input"
                        value={activeClause.title || ""}
                        onChange={(e) => handleClauseChange("title", e.target.value)}
                        placeholder="TIÊU ĐỀ..."
                      />
                    </div>
                  </div>

                  <div className="legal-edit-group">
                    <label className="legal-edit-label">Nội dung điều khoản</label>
                    <textarea
                      rows={5}
                      className="legal-edit-textarea"
                      value={activeClause.content || ""}
                      onChange={(e) => handleClauseChange("content", e.target.value)}
                      placeholder="Nhập nội dung quy định chi tiết của điều khoản..."
                    />
                  </div>

                  <div className="legal-edit-group">
                    <label className="legal-edit-label">
                      Các ý gạch đầu dòng (Mỗi dòng là một ý phụ):
                    </label>
                    <textarea
                      rows={4}
                      className="legal-edit-textarea"
                      value={(activeClause.bullets || []).join("\n")}
                      onChange={(e) => handleBulletsChange(e.target.value)}
                      placeholder="- Điểm a: ...&#10;- Điểm b: ..."
                    />
                  </div>

                  {/* Khung Live Preview */}
                  <div className="legal-clause-preview">
                    <div className="legal-clause-preview__header">Xem trước hiển thị thực tế:</div>
                    <h4 className="legal-clause-preview__title">
                      <span style={{ color: "var(--color-accent, #ea580c)", marginRight: "8px" }}>
                        {activeClause.number}
                      </span>
                      {activeClause.title}
                    </h4>
                    <p className="legal-clause-preview__content">{activeClause.content}</p>
                    {activeClause.bullets && activeClause.bullets.length > 0 && (
                      <ul className="legal-clause-preview__bullets">
                        {activeClause.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
