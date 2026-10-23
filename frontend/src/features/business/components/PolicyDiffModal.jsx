import { X } from "@phosphor-icons/react";

export default function PolicyDiffModal({
  diffModalVersion,
  onClose,
}) {
  if (!diffModalVersion) return null;

  return (
    <div className="diff-modal-backdrop" onClick={onClose}>
      <div className="diff-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="diff-modal-header">
          <div>
            <h3 className="diff-modal-title">
              Chi tiết thay đổi chính sách — {diffModalVersion.version}
            </h3>
            <p className="diff-modal-subtitle">
              Hiệu lực từ ngày {diffModalVersion.effectiveDate} · Thực hiện bởi {diffModalVersion.changedBy}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng bảng so sánh"
            className="diff-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="diff-modal-body">
          <div className="diff-scope-box">
            <strong>Phạm vi sửa đổi:</strong> {diffModalVersion.scope}
          </div>

          <div className="diff-table-wrapper">
            <table className="diff-table">
              <thead>
                <tr>
                  <th>Hạng mục quy định</th>
                  <th>Nội dung trước đây</th>
                  <th>Nội dung mới có hiệu lực</th>
                </tr>
              </thead>
              <tbody>
                {diffModalVersion.diff.map((item, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-ink">{item.field}</td>
                    <td className="diff-old-val">{item.oldVal}</td>
                    <td className="diff-new-val">{item.newVal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="diff-modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
