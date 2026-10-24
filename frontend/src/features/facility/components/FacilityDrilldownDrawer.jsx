import Drawer from "../../../components/Drawer/Drawer.jsx";
import { formatVND } from "../../../utils/formatters.js";

export default function FacilityDrilldownDrawer({
  drilldownStatus,
  onClose,
  searchUnitTerm,
  setSearchUnitTerm,
  drilldownUnits,
  statusConfigs,
  onNavigateUnits,
}) {
  return (
    <Drawer
      isOpen={Boolean(drilldownStatus)}
      onClose={onClose}
      title={`Chi tiết danh sách kho — ${statusConfigs[drilldownStatus]?.label || "Toàn bộ kho"}`}
      size="lg"
    >
      <div className="drilldown-drawer">
        <div className="drilldown-search-bar">
          <input
            type="text"
            className="drilldown-input"
            placeholder="Lọc theo mã kho, loại kho, khách thuê..."
            value={searchUnitTerm}
            onChange={(e) => setSearchUnitTerm(e.target.value)}
          />
          <span className="drilldown-count">{drilldownUnits.length} kết quả</span>
        </div>

        <div className="drilldown-table-wrap">
          <table className="drilldown-table">
            <thead>
              <tr>
                <th>Mã kho</th>
                <th>Loại kho</th>
                <th>Khu vực</th>
                <th>Trạng thái</th>
                <th>Giá thuê/tháng</th>
                <th>Khách thuê & Diễn biến</th>
              </tr>
            </thead>
            <tbody>
              {drilldownUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px 16px" }}>
                    <div style={{ color: "var(--color-secondary)", fontWeight: 600, fontSize: "0.95rem" }}>
                      Không tìm thấy ô kho nào
                    </div>
                    <div style={{ color: "var(--color-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                      Không có kho nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.
                    </div>
                  </td>
                </tr>
              ) : (
                drilldownUnits.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong className="unit-code-box">{u.code}</strong>
                  </td>
                  <td>{u.type}</td>
                  <td>{u.zone}</td>
                  <td>
                    <span className={`status-chip status-chip--${u.status.toLowerCase()}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="font-mono">{formatVND(u.rentPrice)}</td>
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
              )))}
            </tbody>
          </table>
        </div>

        <div className="drilldown-footer">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onNavigateUnits}
          >
            <span>Mở trong Quản lý kho (Unit Management) →</span>
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
    </Drawer>
  );
}
