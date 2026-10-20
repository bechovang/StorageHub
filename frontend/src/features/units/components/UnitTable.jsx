import {
  Archive,
  NotePencil,
  CheckCircle,
  Wrench,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";
import { STATUS_LABELS } from "../constants.js";

export function UnitTable({
  units,
  onOpenDrawer,
  onFinishMaintenance,
  onInitiateMaintenance,
  onInitiateFixStatus,
  onInitiateRetire,
  onClearFilters,
}) {
  return (
    <div className="mgmt-table-container">
      <table className="mgmt-table">
        <thead>
          <tr>
            <th style={{ width: "90px" }}>MÃ KHO</th>
            <th>PHÂN LOẠI & DIỆN TÍCH</th>
            <th>VỊ TRÍ</th>
            <th>TRẠNG THÁI</th>
            <th>GIÁ NIÊM YẾT</th>
            <th>KHÁCH THUÊ & DIỄN BIẾN</th>
            <th style={{ textAlign: "right", width: "240px" }}>THAO TÁC QUẢN TRỊ</th>
          </tr>
        </thead>
        <tbody>
          {units.length === 0 ? (
            <tr>
              <td colSpan={7} className="mgmt-table-empty">
                <Archive size={32} className="text-muted mb-2" />
                <div>Không tìm thấy kho nào phù hợp với bộ lọc hiện tại.</div>
                <button
                  type="button"
                  className="btn btn--outline btn--sm mt-2"
                  onClick={onClearFilters}
                >
                  Xóa bộ lọc
                </button>
              </td>
            </tr>
          ) : (
            units.map((unit) => {
              const statusMeta = STATUS_LABELS[unit.status] || { text: unit.status, class: "" };
              return (
                <tr key={unit.id} className="mgmt-row">
                  <td>
                    <strong className="unit-code-badge">{unit.code}</strong>
                  </td>
                  <td>
                    <div className="unit-type-cell">
                      <span className="font-semibold">{unit.typeName}</span>
                      <span className="text-muted text-xs font-mono">{unit.sizeM2} m²</span>
                    </div>
                  </td>
                  <td>
                    <div className="unit-loc-cell">
                      <span>{unit.zone}</span>
                      <span className="text-muted text-xs">Tầng {unit.floor}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-chip ${statusMeta.class}`}>
                      {statusMeta.text}
                    </span>
                  </td>
                  <td className="font-mono">
                    {formatVND(unit.baseRentPrice)}
                    <span className="text-muted text-xs">/tháng</span>
                  </td>
                  <td>
                    <div className="tenant-info-cell">
                      {unit.tenant ? (
                        <div className="tenant-info-header">
                          <span className="tenant-name font-semibold">{unit.tenant}</span>
                          {unit.contractRef && (
                            <span className="contract-tag font-mono">{unit.contractRef}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted italic text-xs">Chưa có khách thuê</span>
                      )}
                      <div className="tenant-event text-xs text-muted">{unit.nextEvent}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn--secondary btn--xs"
                        onClick={() => onOpenDrawer(unit)}
                        title="Xem chi tiết & Sửa thông số"
                      >
                        <NotePencil size={13} />
                        <span>Sửa</span>
                      </button>

                      {unit.status === "MAINTENANCE" ? (
                        <button
                          type="button"
                          className="btn btn--success btn--xs"
                          onClick={() => onFinishMaintenance(unit)}
                          title="Hoàn tất bảo trì -> Chuyển sang Dọn dẹp"
                        >
                          <CheckCircle size={13} />
                          <span>Xong bảo trì</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--outline btn--xs"
                          onClick={() => onInitiateMaintenance(unit)}
                          disabled={unit.status === "RETIRED"}
                          title="Đưa vào bảo dưỡng kỹ thuật"
                        >
                          <Wrench size={13} />
                          <span>Bảo trì</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn--outline btn--xs"
                        onClick={() => onInitiateFixStatus(unit)}
                        title="Sửa trạng thái thủ công (Bắt buộc lý do)"
                      >
                        <SlidersHorizontal size={13} />
                        <span>Đổi trạng thái</span>
                      </button>

                      {unit.status !== "RETIRED" && (
                        <button
                          type="button"
                          className="btn btn--outline btn--xs btn--danger-outline"
                          onClick={() => onInitiateRetire(unit)}
                          title="Cho nghỉ kho (Kiểm tra Guard hợp đồng)"
                        >
                          <span>Cho nghỉ</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
