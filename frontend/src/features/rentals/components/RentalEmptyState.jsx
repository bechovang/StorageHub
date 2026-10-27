import { Package, ArrowCounterClockwise } from "@phosphor-icons/react";

export default function RentalEmptyState({
  hasAnyRentals,
  hasSearchQuery,
  onResetSearch,
  onResetFilter,
}) {
  if (hasSearchQuery) {
    return (
      <div className="rental-empty-state">
        <div className="rental-empty-state__icon-wrap">
          <Package size={40} weight="light" />
        </div>
        <h3 className="rental-empty-state__title">Không tìm thấy kết quả</h3>
        <p className="rental-empty-state__desc">
          Không có đơn thuê nào khớp với từ khóa tìm kiếm của bạn.
        </p>
        <button
          type="button"
          className="rental-btn rental-btn--secondary"
          onClick={onResetSearch}
        >
          <ArrowCounterClockwise size={14} weight="bold" />
          Xóa tìm kiếm
        </button>
      </div>
    );
  }

  if (hasAnyRentals) {
    return (
      <div className="rental-empty-state">
        <div className="rental-empty-state__icon-wrap">
          <Package size={40} weight="light" />
        </div>
        <h3 className="rental-empty-state__title">Không có đơn trong mục này</h3>
        <p className="rental-empty-state__desc">
          Hiện tại không có đơn thuê nào ở trạng thái đã chọn.
        </p>
        <button
          type="button"
          className="rental-btn rental-btn--secondary"
          onClick={onResetFilter}
        >
          Xem tất cả đơn
        </button>
      </div>
    );
  }

  return (
    <div className="rental-empty-state">
      <div className="rental-empty-state__icon-wrap">
        <Package size={40} weight="light" />
      </div>
      <h3 className="rental-empty-state__title">Bạn chưa có đơn thuê nào</h3>
      <p className="rental-empty-state__desc">
        Khám phá các kho tự quản an ninh, tiện lợi tại cơ sở Tân Bình và chọn kho phù hợp với nhu cầu của bạn ngay hôm nay.
      </p>
    </div>
  );
}
