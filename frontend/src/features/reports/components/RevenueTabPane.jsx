import {
  ShieldCheck,
  CheckCircle,
  DownloadSimple,
} from "@phosphor-icons/react";

export function RevenueTabPane({ onDrilldown, onExportCSV }) {
  return (
    <div className="tab-pane space-y-6">
      {/* Bento Grid: Chart & Settlement Status */}
      <div className="bento-grid">
        {/* SVG Revenue Curve Chart (8 Cols) */}
        <div className="bento-chart-card">
          <div className="bento-chart-header">
            <div>
              <div className="bento-title-cluster">
                <h2 className="bento-title">Biểu đồ đối soát doanh thu</h2>
                <span className="badge-audited">Đã kiểm toán</span>
              </div>
              <p className="bento-subtitle">
                Phân tích chi tiết tiền thuê cơ bản, tiền cọc ký quỹ và phụ thu phát sinh
              </p>
            </div>
            <div className="bento-legend">
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--primary" />
                <span>Tiền thuê kho</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--deposit" />
                <span>Tiền cọc (Ký quỹ)</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--surcharge" />
                <span>Phụ thu</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="svg-chart-container">
            <div className="svg-y-labels">
              <span>15M ₫</span>
              <span>12M ₫</span>
              <span>9M ₫</span>
              <span>6M ₫</span>
              <span>3M ₫</span>
              <span>0 ₫</span>
            </div>
            <div className="svg-chart-plot">
              <svg className="svg-curves" viewBox="0 0 600 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area */}
                <path d="M 60,58 L 300,66 L 540,75 L 540,220 L 60,220 Z" fill="url(#primaryAreaGrad)" />
                {/* Gross Rent Line */}
                <path d="M 60,58 C 180,62 180,62 300,66 C 420,70 420,70 540,75" fill="none" stroke="#DC2626" strokeWidth="2.5" />
                {/* Deposits Line (Dashed) */}
                <path d="M 60,193 C 180,193 180,193 300,193 C 420,193 420,198 540,201" fill="none" stroke="#0284C7" strokeDasharray="4,4" strokeWidth="2" />
                {/* Surcharges Line */}
                <path d="M 60,213 C 180,212 180,212 300,212 C 420,212 420,214 540,215" fill="none" stroke="#F59E0B" strokeWidth="2" />

                {/* Jul Data Points */}
                <circle cx="60" cy="58" r="4" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
                <circle cx="60" cy="193" r="3" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                <circle cx="60" cy="213" r="3" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />

                {/* Aug Data Points */}
                <circle cx="300" cy="66" r="4" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
                <circle cx="300" cy="193" r="3" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                <circle cx="300" cy="212" r="3" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />

                {/* Sep Data Points */}
                <circle cx="540" cy="75" r="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="540" cy="201" r="4" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="540" cy="215" r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
              </svg>

              {/* Month X Labels */}
              <div className="svg-x-labels">
                <span>Tháng 7/2026</span>
                <span>Tháng 8/2026</span>
                <span className="text-primary font-bold">Tháng 9/2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Gateway & VAS Compliance (4 Cols) */}
        <div className="bento-side-column">
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Cổng thanh toán & Đối soát</span>
              <span className="badge-sync">
                <span className="dot-pulse-green" /> Đã đồng bộ
              </span>
            </div>
            <div className="side-card-body">
              <div className="side-metric-row">
                <span className="side-metric-label">VietQR / NAPAS</span>
                <span className="side-metric-val">92.4% (34.60M ₫)</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: "92.4%" }} />
              </div>
              <div className="side-metric-row side-metric-row--sub">
                <span className="side-metric-label">Chuyển khoản trực tiếp</span>
                <span className="side-metric-val">7.6% (2.85M ₫)</span>
              </div>
            </div>
            <div className="side-card-footer">
              <span className="side-card-footer-label">Lần quét tự động gần nhất:</span>
              <span className="side-card-footer-val">23:59:58 UTC+7</span>
            </div>
          </div>

          <div className="side-card">
            <div className="side-card-header">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" weight="duotone" />
                <span className="side-card-title">Tuân thủ kiểm toán VN VAS</span>
              </div>
              <span className="compliance-badge">
                <CheckCircle size={13} weight="fill" /> 100% VAT
              </span>
            </div>
            <div className="side-card-body">
              <p className="side-card-desc">
                Toàn bộ hóa đơn điện tử được ký số VNPT-CA và đồng bộ trực tiếp lên hệ thống Tổng cục Thuế.
              </p>
            </div>
            <div className="side-card-footer-action">
              <button
                type="button"
                className="btn-cert-download"
                onClick={onExportCSV}
              >
                <DownloadSimple size={14} weight="bold" />
                <span>Tải chứng thư kiểm toán (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Ledger Summary Table */}
      <div className="reports-table-card">
        <div className="reports-table-header">
          <div>
            <h2 className="reports-table-title">Sổ cái tổng hợp theo tháng (Monthly Ledger)</h2>
            <p className="reports-table-subtitle">
              Đối soát tài chính từng tháng đã được chốt sổ kiểm toán
            </p>
          </div>
          <button
            type="button"
            className="reports-btn reports-btn--secondary reports-btn--sm"
            onClick={onExportCSV}
          >
            <DownloadSimple size={14} weight="bold" />
            <span>Xuất CSV</span>
          </button>
        </div>

        <div className="reports-table-responsive">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th className="text-right">Tiền thuê</th>
                <th className="text-right">Cọc giữ (Escrow)</th>
                <th className="text-right">Phụ thu</th>
                <th className="text-right">Tổng thực thu</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="period-cell">
                    <span className="dot-period-active" />
                    <span className="font-semibold text-ink">Tháng 9/2026</span>
                    <span className="period-tag-closed">(Chốt sổ)</span>
                  </div>
                </td>
                <td className="text-right font-mono text-secondary">9.860.000 ₫</td>
                <td className="text-right font-mono text-secondary">1.240.000 ₫</td>
                <td className="text-right font-mono text-secondary">310.000 ₫</td>
                <td className="text-right font-mono font-bold text-ink">11.410.000 ₫</td>
                <td className="text-center">
                  <span className="badge-reconciled">
                    <CheckCircle size={12} weight="fill" /> Đã đối soát
                  </span>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="reports-btn-breakdown"
                    onClick={() => onDrilldown("revenue")}
                  >
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="period-cell">
                    <span className="dot-period-past" />
                    <span className="font-semibold text-ink">Tháng 8/2026</span>
                  </div>
                </td>
                <td className="text-right font-mono text-secondary">10.450.000 ₫</td>
                <td className="text-right font-mono text-secondary">1.820.000 ₫</td>
                <td className="text-right font-mono text-secondary">480.000 ₫</td>
                <td className="text-right font-mono font-bold text-ink">12.750.000 ₫</td>
                <td className="text-center">
                  <span className="badge-reconciled">
                    <CheckCircle size={12} weight="fill" /> Đã đối soát
                  </span>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="reports-btn-breakdown"
                    onClick={() => onDrilldown("revenue")}
                  >
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="period-cell">
                    <span className="dot-period-past" />
                    <span className="font-semibold text-ink">Tháng 7/2026</span>
                  </div>
                </td>
                <td className="text-right font-mono text-secondary">11.010.000 ₫</td>
                <td className="text-right font-mono text-secondary">1.830.000 ₫</td>
                <td className="text-right font-mono text-secondary">450.000 ₫</td>
                <td className="text-right font-mono font-bold text-ink">13.290.000 ₫</td>
                <td className="text-center">
                  <span className="badge-reconciled">
                    <CheckCircle size={12} weight="fill" /> Đã đối soát
                  </span>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="reports-btn-breakdown"
                    onClick={() => onDrilldown("revenue")}
                  >
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="tfoot-summary">
                <td className="font-bold">Tổng cộng Q3 2026</td>
                <td className="text-right font-mono font-bold">31.320.000 ₫</td>
                <td className="text-right font-mono font-bold text-secondary">4.890.000 ₫</td>
                <td className="text-right font-mono font-bold text-secondary">1.240.000 ₫</td>
                <td className="text-right font-mono font-bold text-primary text-base">37.450.000 ₫</td>
                <td className="text-center text-xs text-muted">Đã kiểm toán & khóa sổ</td>
                <td className="text-right text-xs text-muted">3/3 tháng chốt</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
