import { X, Funnel } from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { UnitCard, Pagination } from "../../components/index.jsx";
import { useAuth } from "../../context/AuthContext";
import {
  useBrowseUnits,
  BrowseFilterForm,
  BrowseUnitDrawer,
} from "../../features/catalog/index.js";
import "./BrowsePage.css";

export default function BrowsePage() {
  const { user } = useAuth();
  const {
    filterOptions,
    selectedType,
    setSelectedType,
    selectedSize,
    setSelectedSize,
    startDate,
    setStartDate,
    selectedFacility,
    setSelectedFacility,
    activeFilters,
    sortOrder,
    units,
    loading,
    page,
    pageSize,
    total,
    totalPages,
    handlePageChange,
    selectedUnitForDrawer,
    setSelectedUnitForDrawer,
    handleSearchSubmit,
    handleSortChange,
    handleRemoveFilter,
    handleOpenDrawer,
    handleViewDetails,
    handleBook,
    activeTypeName,
    activeFacilityName,
  } = useBrowseUnits();

  return (
    <AppShell showFooter={true}>
      <div className="browse-page-inner">
        <main className="browse-container">
          {/* ── Banner tiêu đề trang ── */}
          <section className="browse-banner">
            <div>
              <h1 className="browse-banner__headline">
                Tìm thuê kho
                <span className="browse-banner__zone-tag">Khu A & B</span>
              </h1>
              <p className="browse-banner__desc">
                Kho tự quản sạch sẽ, an ninh 24/7, ra vào chủ động bằng mã PIN
                riêng tại cơ sở Tân Bình.
              </p>
            </div>
          </section>

        {/* ── Thẻ bộ lọc (Filter Card) ── */}
        <BrowseFilterForm
          filterOptions={filterOptions}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          startDate={startDate}
          setStartDate={setStartDate}
          selectedFacility={selectedFacility}
          setSelectedFacility={setSelectedFacility}
          onSearchSubmit={handleSearchSubmit}
        />

        {/* ── Thanh thông tin trạng thái & sắp xếp ── */}
        <div className="browse-summary-bar">
          <div className="browse-summary-left">
            <div className="browse-live-pill">
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-status-success)",
                  display: "inline-block",
                }}
                aria-hidden="true"
              />
              <span>{total || units.length} kho đang sẵn sàng</span>
            </div>

            {/* Active filter chips */}
            <div className="browse-active-chips">
              {activeTypeName && (
                <span className="browse-chip">
                  Loại: {activeTypeName}
                  <button
                    type="button"
                    className="browse-chip__remove"
                    onClick={() => handleRemoveFilter("typeId")}
                    aria-label={`Xóa lọc loại ${activeTypeName}`}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              )}

              {activeFilters.sizeM2 && (
                <span className="browse-chip">
                  Diện tích: {activeFilters.sizeM2} m²
                  <button
                    type="button"
                    className="browse-chip__remove"
                    onClick={() => handleRemoveFilter("sizeM2")}
                    aria-label={`Xóa lọc diện tích ${activeFilters.sizeM2} m²`}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              )}

              {activeFacilityName && (
                <span className="browse-chip">
                  Cơ sở: {activeFacilityName}
                  <button
                    type="button"
                    className="browse-chip__remove"
                    onClick={() => handleRemoveFilter("facilityId")}
                    aria-label={`Xóa lọc cơ sở ${activeFacilityName}`}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="browse-sort-cluster">
            <label htmlFor="browse-sort">Sắp xếp theo:</label>
            <select
              id="browse-sort"
              className="browse-sort-select"
              value={sortOrder}
              onChange={handleSortChange}
            >
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* ── Lưới danh sách kho (Cards Grid) ── */}
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ color: "var(--color-secondary)" }}>
              Đang tải danh sách kho lưu trữ...
            </p>
          </div>
        ) : units.length === 0 ? (
          <section className="browse-empty">
            <Funnel size={36} color="var(--color-muted)" aria-hidden="true" />
            <h2 className="browse-empty__title">Không tìm thấy kho phù hợp</h2>
            <p className="browse-empty__desc">
              Không có kho nào khớp với tiêu chí tìm kiếm hiện tại. Vui lòng thử
              thay đổi loại kho, kích thước hoặc ngày bắt đầu thuê.
            </p>
          </section>
        ) : (
          <>
            <div className="browse-grid">
              {units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  onOpenDrawer={handleOpenDrawer}
                  onViewDetails={handleViewDetails}
                  onBook={handleBook}
                />
              ))}
            </div>

            {/* Phân trang danh sách kho (US-6, FR-4) */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
      </div>

      {/* ── Drawer xem chi tiết kho ── */}
      <BrowseUnitDrawer
        selectedUnit={selectedUnitForDrawer}
        onClose={() => setSelectedUnitForDrawer(null)}
        onViewDetails={handleViewDetails}
        onBook={handleBook}
      />
    </AppShell>
  );
}
