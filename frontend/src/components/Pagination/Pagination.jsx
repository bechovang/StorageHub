import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import "./Pagination.css";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize = 12,
  className = "",
}) {
  if (totalPages <= 1) return null;

  // Tính khoảng hiển thị (vd: 1-12 trong 40 kho)
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || totalPages * pageSize);

  // Tạo mảng số trang hiển thị
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // Luôn hiện trang đầu, cuối, và các trang quanh trang hiện tại
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className={`pagination-bar ${className}`} aria-label="Phân trang danh sách kho">
      <div className="pagination-info">
        {totalItems ? (
          <span>
            Hiển thị <strong>{startItem} – {endItem}</strong> trong tổng số <strong>{totalItems}</strong> kho
          </span>
        ) : (
          <span>
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn pagination-btn--nav"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          <CaretLeft size={14} weight="bold" />
          <span>Trước</span>
        </button>

        <div className="pagination-pages">
          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`dots-${idx}`} className="pagination-dots">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                className={`pagination-btn pagination-btn--page ${currentPage === p ? "is-active" : ""}`}
                onClick={() => onPageChange(p)}
                aria-current={currentPage === p ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="pagination-btn pagination-btn--nav"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang tiếp theo"
        >
          <span>Sau</span>
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </nav>
  );
}
