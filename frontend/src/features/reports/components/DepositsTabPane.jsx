import { ShieldCheck } from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";
import { getDrilldownItems } from "../../../services/reportService.js";

export function DepositsTabPane({ onDrilldown }) {
  const depositRows = getDrilldownItems("deposits").rows;

  return (
    <div className="tab-pane space-y-6">
      <div className="drilldown-warning-banner">
        <ShieldCheck size={20} weight="duotone" className="text-primary flex-shrink-0" />
        <div>
          <strong>Nguyên tắc Kế toán StorageHub:</strong> Tiền cọc (Security Deposits) được quản lý trong tài khoản Escrow phong tỏa,
          tuyệt đối <strong>KHÔNG</strong> tính gộp vào doanh thu kinh doanh. Tiền cọc chỉ được giải phóng hoặc cấn trừ hư hại khi có biên bản tất toán hợp đồng (Checkout Task).
        </div>
      </div>

      <div className="reports-table-card">
        <div className="reports-table-header">
          <div>
            <h2 className="reports-table-title">Danh bạ quỹ tiền cọc (Escrow Deposit Vault)</h2>
            <p className="reports-table-subtitle">
              Chi tiết {depositRows.length} khoản cọc bảo lãnh đang được phong tỏa bảo đảm tài sản kho
            </p>
          </div>
          <button
            type="button"
            className="reports-btn reports-btn--secondary reports-btn--sm"
            onClick={() => onDrilldown("deposits")}
          >
            Xem toàn màn hình →
          </button>
        </div>

        <div className="reports-table-responsive">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Mã cọc</th>
                <th>Hợp đồng</th>
                <th>Khách hàng</th>
                <th>Kho</th>
                <th className="text-right">Số tiền cọc</th>
                <th>Mã Escrow</th>
                <th>Trạng thái</th>
                <th>Dự kiến hoàn trả</th>
              </tr>
            </thead>
            <tbody>
              {depositRows.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono font-semibold text-ink">{row.id}</td>
                  <td className="font-mono text-secondary">{row.contractRef}</td>
                  <td className="font-medium text-ink">{row.tenant}</td>
                  <td>
                    <span className="badge-unit">{row.unitCode}</span>
                  </td>
                  <td className="text-right font-mono font-bold text-ink">
                    {formatVND(row.depositAmount)}
                  </td>
                  <td className="font-mono text-xs text-muted">{row.escrowRef}</td>
                  <td>
                    <span className={`badge-vault ${row.vaultStatus === "ESCROW_LOCKED" ? "badge-vault--locked" : "badge-vault--pending"}`}>
                      {row.vaultStatus === "ESCROW_LOCKED" ? "Đã khóa Escrow" : "Chờ tất toán"}
                    </span>
                  </td>
                  <td className="text-secondary">{row.expectedRelease}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
