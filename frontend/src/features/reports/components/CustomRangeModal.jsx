import { X } from "@phosphor-icons/react";

export function CustomRangeModal({
  isOpen,
  onClose,
  customRange,
  setCustomRange,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="custom-range-backdrop" onClick={onClose}>
      <div className="custom-range-card" onClick={(e) => e.stopPropagation()}>
        <div className="custom-range-header">
          <h3 className="font-bold text-ink text-base">Tự chọn khoảng ngày báo cáo</h3>
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className="btn-close-modal"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="custom-range-body">
            <div className="form-group">
              <label htmlFor="custom-start-date" className="form-label">
                Từ ngày (Start Date)
              </label>
              <input
                id="custom-start-date"
                type="date"
                className="form-input"
                value={customRange.startDate}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="custom-end-date" className="form-label">
                Đến ngày (End Date)
              </label>
              <input
                id="custom-end-date"
                type="date"
                className="form-input"
                value={customRange.endDate}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="custom-range-footer">
            <button
              type="button"
              className="reports-btn reports-btn--secondary"
              onClick={onClose}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="reports-btn reports-btn--primary">
              Áp dụng kỳ báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
