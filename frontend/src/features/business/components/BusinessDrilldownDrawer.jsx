import {
  ShieldCheck,
  MagnifyingGlass,
  X,
  DownloadSimple,
  CaretUp,
  CaretDown,
  CaretUpDown,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import { formatVND } from "../../../utils/formatters.js";
import { getUnitStatusLabel } from "../../../utils/statusLabels.js";
import { useTableSort } from "../../../hooks/useTableSort.js";

export default function BusinessDrilldownDrawer({
  activeDrilldownKey,
  onClose,
  drilldownData,
  drilldownSearch,
  setDrilldownSearch,
  filteredDrilldownRows = [],
  onExportCSV,
}) {
  const { sortedItems, sortConfig, requestSort } = useTableSort(filteredDrilldownRows);

  return (
    <Drawer
      open={Boolean(activeDrilldownKey)}
      headerLabel={drilldownData?.title || "CHI TIẾT CHỈ SỐ"}
      subtitle="Bảng kê đối soát chứng từ & phân bổ dòng tiền cơ sở VN-SGN-01"
      onClose={onClose}
      size="xl"
    >
      {drilldownData && (
        <div className="drilldown-drawer-content">
          {/* Alert nếu xem Tiền cọc */}
          {drilldownData.warningNotice && (
            <div className="drilldown-warning-banner">
              <ShieldCheck size={22} weight="duotone" className="text-primary flex-shrink-0" />
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
                placeholder="Tìm theo mã, tên khách hàng, kho..."
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
              Hiển thị <strong>{sortedItems.length}</strong> / {drilldownData.rows?.length || sortedItems.length} chứng từ
            </div>
          </div>

          {/* Bảng dữ liệu chi tiết với Sticky Header & Cột có thể Sort */}
          <div className="drilldown-table-wrapper">
            <table className="drilldown-table">
              <thead>
                <tr>
                  {drilldownData.columns.map((col) => {
                    const isSorted = sortConfig.key === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`${col.isMoney ? "text-right" : "text-left"} is-sortable ${isSorted ? "is-sorted" : ""}`}
                        onClick={() => requestSort(col.key)}
                        title={`Nhấn để sắp xếp theo ${col.label}`}
                      >
                        <span className="drilldown-th-content">
                          <span>{col.label}</span>
                          {isSorted ? (
                            sortConfig.direction === "asc" ? (
                              <CaretUp size={13} weight="bold" className="drilldown-sort-icon" />
                            ) : (
                              <CaretDown size={13} weight="bold" className="drilldown-sort-icon" />
                            )
                          ) : (
                            <CaretUpDown size={13} className="drilldown-sort-icon" />
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={drilldownData.columns.length}
                      style={{ textAlign: "center", padding: "48px 16px" }}
                    >
                      <div style={{ color: "var(--color-ink, #000)", fontWeight: 700, fontSize: "0.95rem" }}>
                        Không tìm thấy chứng từ phù hợp
                      </div>
                      <div style={{ color: "var(--color-muted, #71717a)", fontSize: "0.82rem", marginTop: "4px" }}>
                        Không có bản ghi nào khớp với từ khóa tìm kiếm "{drilldownSearch}".
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((row, idx) => (
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
                                {val === "ESCROW_LOCKED" ? "Đã khóa ký quỹ Escrow" : "Chờ tất toán cọc"}
                              </span>
                            </td>
                          );
                        }
                        if (col.key === "status") {
                          return (
                            <td key={col.key}>
                              <span className={`badge-unit-status badge-unit-status--${String(val).toLowerCase()}`}>
                                {getUnitStatusLabel(val)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Drawer Footer Actions */}
          <div className="drilldown-footer">
            <div className="drilldown-meta">
              Sổ cái tự quản cơ sở VN-SGN-01 · Dữ liệu đối soát tự động
            </div>
            <button
              type="button"
              className="btn-export-sub-csv"
              onClick={onExportCSV}
              title="Xuất danh sách bảng kê chi tiết ra file CSV"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Xuất file chi tiết (CSV)</span>
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
