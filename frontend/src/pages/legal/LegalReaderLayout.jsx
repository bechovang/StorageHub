import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  CalendarCheck,
  ClockCounterClockwise,
  UserGear,
} from "@phosphor-icons/react";
import "./LegalPage.css";

/**
 * LegalReaderLayout — Bố cục đọc văn bản pháp lý công khai (Read-only) dành cho Khách hàng
 */
export default function LegalReaderLayout({
  activeType = "TERMS", // "TERMS" | "PRIVACY"
  docData,
}) {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="legal-reader-page">
      {/* ── Topbar tối giản ── */}
      <header className="legal-topbar no-print">
        <div className="legal-topbar__left">
          <button
            type="button"
            className="legal-back-btn"
            onClick={handleBack}
            title="Quay lại trang trước"
          >
            <ArrowLeft size={15} weight="bold" />
            <span>Quay lại</span>
          </button>

          <Link to="/" className="legal-brand" title="Trang chủ StorageHub">
            <span className="legal-brand__mark" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span>STORAGEHUB</span>
          </Link>
        </div>

        {/* Tab chuyển đổi nhanh giữa Điều khoản & Bảo mật */}
        <nav className="legal-tabs" aria-label="Điều hướng văn bản pháp lý">
          <Link
            to="/terms"
            className={`legal-tab-item ${activeType === "TERMS" ? "is-active" : ""}`}
          >
            Điều khoản Dịch vụ
          </Link>
          <Link
            to="/privacy"
            className={`legal-tab-item ${activeType === "PRIVACY" ? "is-active" : ""}`}
          >
            Chính sách Bảo mật
          </Link>
        </nav>

        {/* Topbar Actions (In ấn / Lưu PDF) */}
        <div className="legal-topbar__right">
          <button
            type="button"
            className="legal-action-btn"
            onClick={handlePrint}
            title="In văn bản hoặc Lưu dưới dạng file PDF"
          >
            <Printer size={15} weight="bold" />
            <span>In / Lưu PDF</span>
          </button>
        </div>
      </header>

      {/* ── Nội dung chính 2 Cột ── */}
      <main className="legal-main">
        {/* Cột trái: Mục lục neo nhanh (Sticky Table of Contents) */}
        <aside className="legal-toc no-print" aria-label="Mục lục điều khoản">
          <div className="legal-toc__title">Mục lục văn bản</div>
          <ul className="legal-toc__list">
            {(docData.clauses || []).map((clause) => (
              <li key={clause.id}>
                <a href={`#${clause.id}`} className="legal-toc__link">
                  <strong>{clause.number}:</strong> {clause.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Cột phải: Toàn văn tài liệu pháp lý */}
        <article className="legal-doc">
          {/* Header văn bản */}
          <header className="legal-doc__header">
            <div className="legal-doc__eyebrow">
              <ShieldCheck size={16} weight="bold" />
              <span>Văn bản Pháp lý Chính thức · StorageHub VN</span>
            </div>

            <h1 className="legal-doc__title">{docData.title}</h1>
            <p className="legal-doc__subtitle">{docData.subtitle}</p>

            {/* Metadata badges */}
            <div className="legal-meta-row">
              <span className="legal-badge legal-badge--version">
                Phiên bản {docData.version}
              </span>
              <span className="legal-badge legal-badge--effective">
                <CalendarCheck size={13} weight="bold" />
                Hiệu lực từ: {docData.effectiveDate}
              </span>
              <span className="legal-badge">
                <ClockCounterClockwise size={13} />
                Cập nhật: {new Date(docData.lastUpdated).toLocaleDateString("vi-VN")}
              </span>
              <span className="legal-badge">
                <UserGear size={13} />
                Ban hành: {docData.updatedBy}
              </span>
            </div>
          </header>

          {/* Danh sách các điều khoản */}
          <section className="legal-clauses-wrapper">
            {(docData.clauses || []).map((clause) => (
              <section key={clause.id} id={clause.id} className="legal-clause">
                <div className="legal-clause__header">
                  <span className="legal-clause__number">{clause.number}</span>
                  <h2 className="legal-clause__title">{clause.title}</h2>
                </div>

                <p className="legal-clause__content">{clause.content}</p>

                {clause.bullets && clause.bullets.length > 0 && (
                  <ul className="legal-clause__bullets">
                    {clause.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="legal-clause__bullet-item">
                        <span className="legal-clause__bullet-icon" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </section>

          {/* Footer thông báo cơ sở */}
          <footer className="legal-doc-footer">
            <div className="legal-doc-footer__title">
              StorageHub · Hệ thống Kho Tự quản Thông minh
            </div>
            <p className="legal-doc-footer__text">
              Depot Tân Bình Gateway, Số 12 Tân Bình, TP. Hồ Chí Minh · Tổng đài hỗ trợ 24/7:{" "}
              <strong>1900 6868</strong> · Thư điện tử: <strong>hotro@storagehub.vn</strong>
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
