import { Link } from "react-router";
import { Plus, ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useMyRentals,
  RentalCard,
  RentalEmptyState,
  RentalFilters,
  RentalTelemetry,
} from "../../features/rentals/index.js";
import "./MyRentalsPage.css";

export default function MyRentalsPage() {
  const {
    loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    loadRentals,
    counts,
    displayItems,
    hasAnyRentals,
  } = useMyRentals();

  return (
    <AppShell>
      <div className="my-rentals-page">
        {/* Breadcrumb Navigation */}
        <nav className="my-rentals-page__breadcrumb" aria-label="Breadcrumb">
          <span>StorageHub VN</span>
          <span className="my-rentals-page__breadcrumb-sep">/</span>
          <span>Depot SGN-01 (Tân Bình)</span>
          <span className="my-rentals-page__breadcrumb-sep">/</span>
          <span className="my-rentals-page__breadcrumb-current">
            Đơn thuê của tôi
          </span>
        </nav>

        {/* Page Header */}
        <header className="my-rentals-page__header">
          <div className="my-rentals-page__header-main">
            <div className="my-rentals-page__title-wrap">
              <h1 className="my-rentals-page__title">Đơn thuê của tôi</h1>
              <span className="my-rentals-page__count-badge font-mono">
                {counts.all} đơn
              </span>
            </div>
            <p className="my-rentals-page__subtitle">
              Theo dõi hợp đồng thuê kho, mã nhận chỗ và lịch sử thanh toán tại
              Depot Tân Bình.
            </p>
          </div>

          <div className="my-rentals-page__header-actions">
            <Link
              to="/browse"
              className="rental-btn rental-btn--primary"
            >
              <Plus size={15} weight="bold" />
              Thuê kho mới
            </Link>

            <button
              type="button"
              className="my-rentals-page__refresh-btn"
              onClick={loadRentals}
              disabled={loading}
              title="Tải lại danh sách"
              aria-label="Tải lại"
            >
              <ArrowClockwise
                size={16}
                weight="bold"
                className={loading ? "is-spinning" : ""}
              />
            </button>
          </div>
        </header>

        {/* Operational Telemetry Context Bar */}
        <RentalTelemetry />

        {/* Pending Deposit Warning Banner */}
        {counts.pending > 0 && (
          <div className="my-rentals-page__alert" role="alert">
            <WarningCircle size={18} weight="fill" className="my-rentals-page__alert-icon" />
            <div className="my-rentals-page__alert-content">
              Bạn có <strong>{counts.pending}</strong> đơn đang chờ thanh toán
              tiền cọc (10%). Vui lòng hoàn tất thanh toán trước khi hết hạn để
              bảo lưu quyền sử dụng kho.
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="my-rentals-page__error" role="alert">
            <WarningCircle size={18} weight="fill" />
            <span>{error}</span>
            <button
              type="button"
              onClick={loadRentals}
              className="my-rentals-page__retry-btn"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Tab & Search Filter Bar */}
        <RentalFilters
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Loading Skeletons */}
        {loading && (
          <div className="my-rentals-page__skeleton-list" aria-label="Đang tải dữ liệu">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="rental-skeleton-card" />
            ))}
          </div>
        )}

        {/* Main Content List / Empty State */}
        {!loading && !error && (
          <>
            {displayItems.length > 0 ? (
              <div className="my-rentals-page__list">
                {displayItems.map((item) => (
                  <RentalCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <RentalEmptyState
                hasAnyRentals={hasAnyRentals}
                hasSearchQuery={Boolean(searchQuery.trim())}
                onResetSearch={() => setSearchQuery("")}
                onResetFilter={() => {
                  setActiveTab("ALL");
                  setSearchQuery("");
                }}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
