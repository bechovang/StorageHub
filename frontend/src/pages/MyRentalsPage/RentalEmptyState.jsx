import { Link } from "react-router";
import { Package, ArrowRight, ArrowCounterClockwise } from "@phosphor-icons/react";

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
        <Package size={48} weight="thin" />
      </div>
      <h3 className="rental-empty-state__title">Chưa có đơn thuê nào</h3>
      <p className="rental-empty-state__desc">
        Bạn chưa có đơn thuê nào. Hãy dạo xem danh sách kho để chọn không gian lưu trữ phù hợp với bạn nhé.
      </p>
      <Link to="/browse" className="rental-btn rental-btn--primary">
        Xem danh sách kho
        <ArrowRight size={14} weight="bold" />
      </Link>
    </div>
  );
}
