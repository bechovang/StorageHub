import {
  MagnifyingGlass,
  X,
  DownloadSimple,
  ArrowSquareOut,
  CaretUp,
  CaretDown,
  CaretUpDown,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import { formatVND } from "../../../utils/formatters.js";
import { getUnitStatusLabel } from "../../../utils/statusLabels.js";
import { useTableSort } from "../../../hooks/useTableSort.js";

const FACILITY_COLUMNS = [
  { key: "code", label: "Mã kho", align: "text-left" },
  { key: "type", label: "Loại kho", align: "text-left" },
  { key: "zone", label: "Khu vực", align: "text-left" },
  { key: "status", label: "Trạng thái", align: "text-left" },
  { key: "rentPrice", label: "Giá thuê/tháng", align: "text-right" },
  { key: "tenant", label: "Khách thuê & Diễn biến", align: "text-left" },
];

export default function FacilityDrilldownDrawer({
  drilldownStatus,
  onClose,
  searchUnitTerm,
  setSearchUnitTerm,
  drilldownUnits = [],
  statusConfigs,
  onNavigateUnits,
  onExportCSV,
}) {
  const { sortedItems, sortConfig, requestSort } = useTableSort(drilldownUnits);

  const handleExportUnits = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    const headers = ["Mã kho", "Loại kho", "Khu vực", "Trạng thái", "Giá thuê", "Khách thuê", "Diễn biến"];
    const rows = sortedItems.map((u) => [
      u.code,
      `"${u.type || ""}"`,
      `"${u.zone || ""}"`,
      `"${u.status || ""}"`,
      u.rentPrice || 0,
      `"${u.tenant || ""}"`,
      `"${u.nextEvent || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh-sach-kho-${drilldownStatus || "tat-ca"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusLabel = statusConfigs?.[drilldownStatus]?.label || "Toàn bộ kho cơ sở";

  return (
    <Drawer
      isOpen={Boolean(drilldownStatus)}
      onClose={onClose}
      headerLabel={`DANH SÁCH KHO · ${statusLabel.toUpperCase()}`}
      subtitle={`Cơ sở VN-SGN-01 · Bộ lọc trạng thái: ${drilldownStatus || "TẤT CẢ"}`}
      size="xl"
    >
      <div className="drilldown-drawer-content">
        {/* Toolbar: Tìm kiếm & Đếm số kho */}
        <div className="drilldown-toolbar">
          <div className="search-box">
            <MagnifyingGlass size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Lọc theo mã kho, loại kho, khách thuê..."
              value={searchUnitTerm}
              onChange={(e) => setSearchUnitTerm(e.target.value)}
            />
            {searchUnitTerm && (
              <button
                type="button"
                aria-label="Xóa bộ lọc tìm kiếm"
                className="btn-clear-search"
                onClick={() => setSearchUnitTerm("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="drilldown-count">
            Hiển thị <strong>{sortedItems.length}</strong> kho
          </div>
        </div>

        {/* Bảng dữ liệu chi tiết với Sticky Header & Cột có thể Sort */}
        <div className="drilldown-table-wrapper">
          <table className="drilldown-table">
            <thead>
              <tr>
                {FACILITY_COLUMNS.map((col) => {
                  const isSorted = sortConfig.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`${col.align} is-sortable ${isSorted ? "is-sorted" : ""}`}
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
                  <td colSpan={FACILITY_COLUMNS.length} style={{ textAlign: "center", padding: "48px 16px" }}>
                    <div style={{ color: "var(--color-ink, #000)", fontWeight: 700, fontSize: "0.95rem" }}>
                      Không tìm thấy kho nào
                    </div>
                    <div style={{ color: "var(--color-muted, #71717a)", fontSize: "0.82rem", marginTop: "4px" }}>
                      Không có kho nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm "{searchUnitTerm}".
                    </div>
                  </td>
                </tr>
              ) : (
                sortedItems.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="unit-code-box font-mono">{u.code}</span>
                    </td>
                    <td>{u.type}</td>
                    <td>{u.zone}</td>
                    <td>
                      <span className={`status-chip status-chip--${String(u.status).toLowerCase()}`}>
                        {getUnitStatusLabel(u.status)}
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold">
                      {formatVND(u.rentPrice)}
                    </td>
                    <td>
                      <div className="tenant-cell">
                        {u.tenant ? (
                          <strong className="tenant-name">{u.tenant}</strong>
                        ) : (
                          <span className="text-muted italic">Chưa có khách thuê</span>
                        )}
                        <span className="tenant-event">{u.nextEvent}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="drilldown-footer">
          <div className="drilldown-meta">
            Cơ sở Tân Bình (VN-SGN-01) · Trực thuộc StorageHub
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-export-sub-csv"
              onClick={handleExportUnits}
              title="Xuất bảng kê các kho ra file CSV"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Xuất CSV</span>
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onNavigateUnits}
            >
              <span>Mở trong Quản lý kho</span>
              <ArrowSquareOut size={15} weight="bold" />
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
