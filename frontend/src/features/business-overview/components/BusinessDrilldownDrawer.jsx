import { ShieldCheck, MagnifyingGlass, X, DownloadSimple } from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import { formatVND } from "../../../utils/formatters.js";

export default function BusinessDrilldownDrawer({
  activeDrilldownKey,
  onClose,
  drilldownData,
  drilldownSearch,
  setDrilldownSearch,
  filteredDrilldownRows,
  onExportCSV,
}) {
  return (
    <Drawer
      open={Boolean(activeDrilldownKey)}
      headerLabel={drilldownData?.title || "CHI TIẾT CHỈ SỐ"}
      onClose={onClose}
    >
      {drilldownData && (
        <div className="drilldown-drawer-content">
          {/* Alert nếu xem Tiền cọc */}
          {drilldownData.warningNotice && (
            <div className="drilldown-warning-banner">
              <ShieldCheck size={20} weight="duotone" className="text-primary flex-shrink-0" />
              <div>
                <strong>Quy định kiểm toán tài chính:</strong> {drilldownData.warningNotice}
              </div>
            </div>
          )}

          {/* Toolbar: Tìm kiếm & Đếm số dòng */}
          <div className="drilldown-toolbar">
            <div className="search-box">
              <MagnifyingGlass size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo mã, tên khách hàng, unit..."
                value={drilldownSearch}
                onChange={(e) => setDrilldownSearch(e.target.value)}
              />
              {drilldownSearch && (
                <button
                  type="button"
                  aria-label="Xóa bộ lọc tìm kiếm"
                  className="btn-clear-search"
                  onClick={() => setDrilldownSearch("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="drilldown-count">
              Hiển thị <strong>{filteredDrilldownRows.length}</strong> chứng từ
            </div>
          </div>

          {/* Bảng dữ liệu chi tiết */}
          <div className="drilldown-table-wrapper">
            <table className="drilldown-table">
              <thead>
                <tr>
                  {drilldownData.columns.map((col) => (
                    <th
                      key={col.key}
                      className={col.isMoney ? "text-right" : "text-left"}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDrilldownRows.map((row, idx) => (
                  <tr key={row.id || row.unitCode || idx}>
                    {drilldownData.columns.map((col) => {
                      const val = row[col.key];
                      if (col.isMoney) {
                        return (
                          <td
                            key={col.key}
                            className={`text-right font-mono ${col.isHighlight ? "font-bold text-ink" : "text-secondary"}`}
                          >
                            {formatVND(val)}
                          </td>
                        );
                      }
                      if (col.key === "vaultStatus") {
                        return (
                          <td key={col.key}>
                            <span className={`badge-vault ${val === "ESCROW_LOCKED" ? "badge-vault--locked" : "badge-vault--pending"}`}>
                              {val === "ESCROW_LOCKED" ? "Đã khóa Escrow" : "Chờ tất toán"}
                            </span>
                          </td>
                        );
                      }
                      if (col.key === "status") {
                        return (
                          <td key={col.key}>
                            <span className={`badge-unit-status badge-unit-status--${String(val).toLowerCase()}`}>
                              {val}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} className="text-ink">
                          {val || "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Drawer Footer Actions */}
          <div className="drilldown-footer">
            <div className="drilldown-meta">
              Dữ liệu được cập nhật từ sổ cái cơ sở VN-SGN-01
            </div>
            <button
              type="button"
              className="btn-export-sub-csv"
              onClick={onExportCSV}
            >
              <DownloadSimple size={14} weight="bold" />
              <span>Xuất file chi tiết</span>
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
