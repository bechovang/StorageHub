import { Link } from "react-router";

export default function PolicyVersionsTable({
  policyVersions,
  onNavigatePolicy,
  onOpenDiff,
}) {
  return (
    <section className="biz-table-card">
      <div className="biz-table-header">
        <div>
          <h2 className="biz-table-title">Chính sách vận hành & Biểu giá</h2>
          <p className="biz-table-subtitle">
            Lịch sử các phiên bản chính sách thuê, mức cọc và biểu phí quy định
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            to="/terms"
            className="biz-btn biz-btn--secondary biz-btn--sm"
            title="Xem và chỉnh sửa Điều khoản & Chính sách bảo mật"
          >
            Văn bản pháp lý →
          </Link>
          <button
            type="button"
            className="biz-btn biz-btn--primary biz-btn--sm"
            onClick={onNavigatePolicy}
          >
            Quản lý chính sách →
          </button>
        </div>
      </div>

      <div className="biz-table-responsive">
        <table className="biz-table">
          <thead>
            <tr>
              <th className="th-version">Phiên bản</th>
              <th className="th-date">Ngày hiệu lực</th>
              <th className="th-author">Người sửa đổi</th>
              <th className="th-status">Trạng thái</th>
              <th className="th-scope">Nội dung thay đổi (Changelog)</th>
              <th className="th-action text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {policyVersions.map((pv) => (
              <tr key={pv.version}>
                <td>
                  <span className="badge-version">{pv.version}</span>
                </td>
                <td className="text-secondary whitespace-nowrap">{pv.effectiveDate}</td>
                <td className="td-author">
                  <div className="author-cell">
                    <div className="author-avatar">{pv.changedBy.slice(0, 1)}</div>
                    <span className="author-name font-medium text-ink">{pv.changedBy}</span>
                  </div>
                </td>
                <td className="td-status">
                  {pv.status === "ACTIVE" && (
                    <span className="badge-status badge-status--active">
                      <span className="dot dot-active" />
                      Đang áp dụng
                    </span>
                  )}
                  {pv.status === "DEPRECATED" && (
                    <span className="badge-status badge-status--deprecated">
                      Hết hiệu lực
                    </span>
                  )}
                </td>
                <td className="td-scope">
                  <span className="text-secondary text-xs">{pv.scope}</span>
                </td>
                <td className="td-action text-right">
                  <button
                    type="button"
                    className="biz-link-diff"
                    onClick={() => onOpenDiff(pv)}
                  >
                    Xem thay đổi →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
