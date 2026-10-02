import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MagnifyingGlass, SignOut, X, Funnel } from "@phosphor-icons/react";
import { Header, Footer, UnitCard, Drawer, Badge, Button } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { getUnitFilterOptions, searchUnits } from "../../services/unitService";
import "./BrowsePage.css";

export default function BrowsePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Danh mục dữ liệu cho dropdown filter
  const [filterOptions, setFilterOptions] = useState({
    types: [],
    sizesM2: [],
    facilities: [],
  });

  // State các giá trị trong form bộ lọc
  const [selectedType, setSelectedType] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedFacility, setSelectedFacility] = useState("");

  // State bộ lọc đang có hiệu lực (active filters) sau khi bấm Tìm kiếm
  const [activeFilters, setActiveFilters] = useState({
    typeId: "",
    sizeM2: "",
    startDate: "",
    facilityId: "",
  });

  // Thứ tự sắp xếp
  const [sortOrder, setSortOrder] = useState("price-asc");

  // Kết quả tìm kiếm kho
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tải danh mục loại kho và kích thước khi trang khởi tạo
  useEffect(() => {
    async function loadOptions() {
      const options = await getUnitFilterOptions();
      setFilterOptions(options);
    }
    loadOptions();
  }, []);

  // Hàm thực thi tìm kiếm
  const fetchUnits = async (filters, sort) => {
    setLoading(true);
    try {
      const data = await searchUnits({
        typeId: filters.typeId,
        sizeM2: filters.sizeM2,
        startDate: filters.startDate,
        facilityId: filters.facilityId,
        sort,
      });
      setUnits(data.items || []);
    } catch {
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách kho mặc định ban đầu
  useEffect(() => {
    fetchUnits(activeFilters, sortOrder);
  }, []);

  // Xử lý submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newFilters = {
      typeId: selectedType,
      sizeM2: selectedSize,
      startDate,
      facilityId: selectedFacility,
    };
    setActiveFilters(newFilters);
    fetchUnits(newFilters, sortOrder);
  };

  // Xử lý đổi thứ tự sắp xếp
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOrder(newSort);
    fetchUnits(activeFilters, newSort);
  };

  // Xóa từng bộ lọc riêng lẻ từ chip
  const handleRemoveFilter = (filterKey) => {
    const updated = { ...activeFilters };
    if (filterKey === "typeId") {
      updated.typeId = "";
      setSelectedType("");
    } else if (filterKey === "sizeM2") {
      updated.sizeM2 = "";
      setSelectedSize("");
    } else if (filterKey === "facilityId") {
      updated.facilityId = "";
      setSelectedFacility("");
    }
    setActiveFilters(updated);
    fetchUnits(updated, sortOrder);
  };


  // Quản lý Drawer xem chi tiết kho
  const [selectedUnitForDrawer, setSelectedUnitForDrawer] = useState(null);

  // Xử lý điều hướng khi bấm Xem chi tiết hoặc Đặt kho
  const handleViewDetails = (unit) => {
    setSelectedUnitForDrawer(unit);
  };

  const handleBook = (unit) => {
    navigate(`/units/${unit.id}/book`);
  };

  // Lấy tên loại kho đang được lọc để hiển thị trên chip
  const activeTypeName = filterOptions.types.find(
    (t) => String(t.id) === String(activeFilters.typeId)
  )?.name;

  // Lấy tên cơ sở đang được lọc để hiển thị trên chip
  const activeFacilityName = filterOptions.facilities?.find(
    (f) => String(f.id) === String(activeFilters.facilityId)
  )?.name;

  return (
    <div className="browse-page">
      {/* ── Header điều hướng dùng chung ── */}
      <Header
        brandName="STORAGEHUB"
        brandHref="/browse"
        roleLabel="KHÁCH HÀNG"
        avatarText={
          user?.fullName
            ? user.fullName.trim().charAt(0).toUpperCase()
            : "KH"
        }
        navLinks={[
          { label: "Tìm thuê kho", href: "/browse", active: true },
          { label: "Kho của tôi", href: "/rentals" },
          { label: "Hỗ trợ", href: "#support" },
        ]}
        rightContent={
          <button
            type="button"
            onClick={logout}
            className="browse-logout-btn"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <SignOut size={16} weight="bold" />
          </button>
        }
      />

      <main className="browse-container">
        {/* ── Banner tiêu đề trang ── */}
        <section className="browse-banner">
          <div>
            <h1 className="browse-banner__headline">
              Tìm thuê kho
              <span className="browse-banner__zone-tag">Khu A & B</span>
            </h1>
            <p className="browse-banner__desc">
              Lựa chọn và đặt chỗ kho tự quản thông minh, bảo mật cao với mã PIN
              24/7 và kiểm soát nhiệt độ tại cơ sở Tân Bình.
            </p>
          </div>
        </section>

        {/* ── Thẻ bộ lọc (Filter Card) ── */}
        <section className="browse-filter-card" aria-label="Bộ lọc tìm kiếm kho">
          <form className="browse-filter-grid" onSubmit={handleSearchSubmit}>
            {/* 1. Loại kho */}
            <div className="browse-filter-field">
              <label
                className="browse-filter-field__label"
                htmlFor="filter-type"
              >
                Loại kho
              </label>
              <select
                id="filter-type"
                className="browse-filter-field__select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Tất cả loại kho</option>
                {filterOptions.types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Kích thước (m²) */}
            <div className="browse-filter-field">
              <label
                className="browse-filter-field__label"
                htmlFor="filter-size"
              >
                Kích thước (m²)
              </label>
              <select
                id="filter-size"
                className="browse-filter-field__select"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">Tất cả kích thước</option>
                {filterOptions.sizesM2.map((s) => (
                  <option key={s} value={s}>
                    {s} m²
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Ngày bắt đầu */}
            <div className="browse-filter-field">
              <label
                className="browse-filter-field__label"
                htmlFor="filter-date"
              >
                Ngày bắt đầu
              </label>
              <input
                id="filter-date"
                type="date"
                className="browse-filter-field__input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* 4. Chọn cơ sở */}
            <div className="browse-filter-field">
              <label
                className="browse-filter-field__label"
                htmlFor="filter-facility"
              >
                Chọn cơ sở
              </label>
              <select
                id="filter-facility"
                className="browse-filter-field__select"
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
              >
                <option value="">Tất cả cơ sở</option>
                {(filterOptions.facilities && filterOptions.facilities.length > 0
                  ? filterOptions.facilities
                  : [
                      { id: 1, name: "Cơ sở Tân Bình (VN-SGN-01)" },
                      { id: 2, name: "Cơ sở Quận 7 (Sắp mở)" },
                    ]
                ).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Nút tìm kiếm */}
            <button
              id="browse-search-btn"
              type="submit"
              className="browse-filter-btn"
            >
              <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
              <span>Tìm kiếm</span>
            </button>
          </form>
        </section>

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
              <span>{units.length} kho khả dụng · trực tiếp</span>
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
          <div className="browse-grid">
            {units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onViewDetails={handleViewDetails}
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Drawer xem chi tiết kho ── */}
      {selectedUnitForDrawer && (
        <Drawer
          open={Boolean(selectedUnitForDrawer)}
          headerLabel={`CHI TIẾT KHO · ${selectedUnitForDrawer.code}`}
          onClose={() => setSelectedUnitForDrawer(null)}
        >
          <div className="browse-drawer-body">
            <div className="browse-drawer-header">
              <p className="browse-drawer-eyebrow">
                {selectedUnitForDrawer.code} /{" "}
                {selectedUnitForDrawer.facilityName || "CƠ SỞ TÂN BÌNH (VN-SGN-01)"}
              </p>
              <h2 className="browse-drawer-title">
                {selectedUnitForDrawer.sizeM2} m² ·{" "}
                {selectedUnitForDrawer.typeName || selectedUnitForDrawer.type || "Tiêu chuẩn"}
              </h2>
              <div className="browse-drawer-status-bar">
                <Badge
                  tone={
                    (typeof selectedUnitForDrawer.availability === "object"
                      ? selectedUnitForDrawer.availability?.status
                      : selectedUnitForDrawer.availability) === "AVAILABLE_SOON" ||
                    selectedUnitForDrawer.availability === "soon"
                      ? "warning"
                      : "success"
                  }
                >
                  {(typeof selectedUnitForDrawer.availability === "object"
                    ? selectedUnitForDrawer.availability?.status
                    : selectedUnitForDrawer.availability) === "AVAILABLE_SOON" ||
                  selectedUnitForDrawer.availability === "soon"
                    ? "Đang được thuê"
                    : "Còn trống"}
                </Badge>
                <span className="browse-drawer-rent-pill">
                  {new Intl.NumberFormat("vi-VN").format(
                    selectedUnitForDrawer.baseMonthlyRent ||
                      selectedUnitForDrawer.monthlyPrice ||
                      0
                  )}{" "}
                  ₫ / tháng
                </span>
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <h3 className="browse-drawer-section-title">THÔNG SỐ KHO</h3>
            <dl className="spec-list">
              <div className="spec-row">
                <dt>Mã định danh kho</dt>
                <dd style={{ fontFamily: "var(--font-mono)" }}>
                  {selectedUnitForDrawer.code}
                </dd>
              </div>
              <div className="spec-row">
                <dt>Vị trí</dt>
                <dd>
                  Khu {selectedUnitForDrawer.zoneCode || selectedUnitForDrawer.zone || "A"} · Tầng{" "}
                  {selectedUnitForDrawer.floor || 1}
                </dd>
              </div>
              <div className="spec-row">
                <dt>Diện tích thực tế</dt>
                <dd>{selectedUnitForDrawer.sizeM2} m²</dd>
              </div>
              <div className="spec-row">
                <dt>Thể tích quy ước</dt>
                <dd>
                  {(selectedUnitForDrawer.sizeM2 * 2.8).toFixed(1)} m³ (Trần cao 2.8m)
                </dd>
              </div>
              <div className="spec-row">
                <dt>Cơ chế truy cập</dt>
                <dd>
                  {selectedUnitForDrawer.accessType === "PIN"
                    ? "Mã PIN 24/7"
                    : selectedUnitForDrawer.accessType === "QR"
                    ? "Quét mã QR"
                    : selectedUnitForDrawer.accessType || "Mã PIN 24/7"}
                </dd>
              </div>
              <div className="spec-row">
                <dt>Cơ sở quản lý</dt>
                <dd>
                  {selectedUnitForDrawer.facilityName || "Tân Bình Depot (VN-SGN-01)"}
                </dd>
              </div>
            </dl>

            {/* Tiện ích nổi bật */}
            {selectedUnitForDrawer.features &&
              selectedUnitForDrawer.features.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h3 className="browse-drawer-section-title">TIỆN ÍCH KHO</h3>
                  <div className="browse-drawer-features">
                    {selectedUnitForDrawer.features.map((feat) => (
                      <span key={feat} className="browse-drawer-feature-tag">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Chính sách thuê & Giá */}
            <div style={{ marginTop: "24px" }}>
              <h3 className="browse-drawer-section-title">CHÍNH SÁCH THUÊ & GIÁ</h3>
              <dl className="spec-list">
                <div className="spec-row">
                  <dt>Giá thuê mỗi tháng</dt>
                  <dd style={{ color: "var(--color-ink)", fontWeight: 700 }}>
                    {new Intl.NumberFormat("vi-VN").format(
                      selectedUnitForDrawer.baseMonthlyRent ||
                        selectedUnitForDrawer.monthlyPrice ||
                        0
                    )}{" "}
                    ₫
                  </dd>
                </div>
                <div className="spec-row">
                  <dt>Tiền đặt cọc (1 tháng)</dt>
                  <dd>
                    {new Intl.NumberFormat("vi-VN").format(
                      selectedUnitForDrawer.baseMonthlyRent ||
                        selectedUnitForDrawer.monthlyPrice ||
                        0
                    )}{" "}
                    ₫
                  </dd>
                </div>
                <div className="spec-row">
                  <dt>Chính sách áp dụng</dt>
                  <dd>Chính sách giá v3</dd>
                </div>
                <div className="spec-row">
                  <dt>Thời gian sẵn sàng</dt>
                  <dd>
                    {selectedUnitForDrawer.availability?.availableFromDate
                      ? `Nhận kho từ ${selectedUnitForDrawer.availability.availableFromDate}`
                      : "Sẵn sàng bàn giao ngay"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Thao tác hành động */}
            <div className="browse-drawer-footer">
              <Button
                variant="secondary"
                onClick={() => setSelectedUnitForDrawer(null)}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const u = selectedUnitForDrawer;
                  setSelectedUnitForDrawer(null);
                  handleBook(u);
                }}
              >
                Đặt kho ngay
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* ── Footer ── */}
      <Footer
        leftText="STORAGEHUB / CƠ SỞ TÂN BÌNH — HỆ THỐNG KHO TỰ QUẢN"
        rightText="PHIÊN BẢN 1.0 · 2026"
      />
    </div>
  );
}
