export function ActivityStatsGrid({
  totalEntries,
  statusChangeCount,
  securityEventCount,
}) {
  return (
    <div className="activity-stats">
      <div className="stat-card">
        <span className="stat-card__label">Tổng số bản ghi</span>
        <span className="stat-card__value">{totalEntries}</span>
        <span className="stat-card__desc">Toàn bộ log được lưu trữ</span>
      </div>
      <div className="stat-card">
        <span className="stat-card__label">Chuyển trạng thái</span>
        <span className="stat-card__value">{statusChangeCount}</span>
        <span className="stat-card__desc">Kho, hợp đồng và đặt chỗ</span>
      </div>
      <div className="stat-card">
        <span className="stat-card__label">Sự kiện bảo mật</span>
        <span className="stat-card__value">{securityEventCount}</span>
        <span className="stat-card__desc">Đăng nhập và xác thực</span>
      </div>
    </div>
  );
}
