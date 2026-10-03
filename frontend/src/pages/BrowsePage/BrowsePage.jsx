import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  MagnifyingGlass,
  SignOut,
  X,
  Funnel,
  Package,
} from "@phosphor-icons/react";
import {
  Header,
  Footer,
  UnitCard,
  Drawer,
  Badge,
  Button,
} from "../../components";
import { useAuth } from "../../context/AuthContext";
import { getUnitFilterOptions, searchUnits } from "../../services/unitService";
import "./BrowsePage.css";

function DrawerVisual({ unit }) {
  const sizeM2 = unit?.sizeM2 || 3.5;
  const volumeM3 = (sizeM2 * 2.8).toFixed(1);
  const photo = unit?.photoUrls?.[0] || unit?.photoUrl || "/placeholder.svg";

  return (
    <div className="browse-drawer-visual" aria-label={`Hình ảnh không gian kho ${sizeM2} m²`}>
      <img
        src={photo}
        alt={`Kho ${unit?.typeName || "Tiêu chuẩn"} ${sizeM2} m²`}
        className="browse-drawer-visual__img"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/placeholder.svg";
        }}
        loading="lazy"
      />

      {/* Thông số kích thước trực quan ghim trên ảnh */}
      <div className="browse-drawer-visual__badges">
        <span className="browse-drawer-visual__pill">
          Diện tích <strong>{sizeM2} m²</strong>
        </span>
        <span className="browse-drawer-visual__pill">
          Thể tích <strong>~{volumeM3} m³</strong>
        </span>
        <span className="browse-drawer-visual__pill">
          Trần cao <strong>2.8m</strong>
        </span>
      </div>
    </div>
  );
}

function getCapacityHint(sizeM2) {
  const size = Number(sizeM2) || 0;
  if (size <= 2) {
    return {
      title: "Phù hợp lưu trữ cá nhân hoặc ít đồ đạc",
      detail:
        "Sức chứa tương đương 10 - 15 thùng carton tiêu chuẩn, 1 xe máy hoặc 4 - 5 vali lớn cùng các vật dụng cá nhân theo mùa.",
    };
  }
  if (size <= 5) {
    return {
      title: "Phù hợp đồ đạc căn hộ 1 phòng ngủ",
      detail:
        "Sức chứa tương đương 20 - 30 thùng đồ, tủ lạnh mini, máy giặt, bàn ghế làm việc, đệm giường và đồ dùng gia đình cần bảo quản.",
    };
  }
  return {
    title: "Phù hợp chuyển nhà 2-3 phòng ngủ hoặc kho hàng",
    detail:
      "Không gian rộng rãi chứa trọn vẹn nội thất căn hộ gia đình, tủ lớn, sofa, giường ngủ hoặc 3-4 pallet hàng hóa kinh doanh.",
  };
}

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

  // Hàm kiểm tra kho có đang trống không (AVAILABLE / "Còn trống")
  const isUnitAvailable = (u) => {
    const rawStatus =
      typeof u.availability === "object"
        ? u.availability?.status
        : u.availability;
    const availableDate =
      typeof u.availability === "object"
        ? u.availability?.availableFromDate
        : u.availableFrom;
    const isUnavailable =
      rawStatus === "AVAILABLE_SOON" ||
      rawStatus === "soon" ||
      rawStatus === "PREPARING" ||
      rawStatus === "RENTED" ||
      Boolean(availableDate);
    return !isUnavailable;
  };

  // Sắp xếp danh sách kho: Luôn luôn xếp kho còn trống (AVAILABLE) lên đầu, tiếp đến theo giá
  const sortUnitsWithAvailableFirst = (items, sort) => {
    return [...items].sort((a, b) => {
      const aAvail = isUnitAvailable(a);
      const bAvail = isUnitAvailable(b);
      if (aAvail !== bAvail) {
        return aAvail ? -1 : 1; // Kho còn trống luôn lên đầu
      }
      const aPrice = a.baseMonthlyRent ?? a.monthlyPrice ?? 0;
      const bPrice = b.baseMonthlyRent ?? b.monthlyPrice ?? 0;
      return sort === "price-desc" ? bPrice - aPrice : aPrice - bPrice;
    });
  };

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
      const sorted = sortUnitsWithAvailableFirst(data.items || [], sort);
      setUnits(sorted);
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

  // Xử lý đổi thứ tự sắp xếp: Giữ nguyên kho trống ở đầu và áp dụng thứ tự giá
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOrder(newSort);
    setUnits((prev) => sortUnitsWithAvailableFirst(prev, newSort));
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

  // Mở Drawer xem nhanh tóm tắt gói kho
  const handleOpenDrawer = (unit) => {
    setSelectedUnitForDrawer(unit);
  };

  // Điều hướng đến trang chi tiết kho (Unit Detail)
  const handleViewDetails = (unit) => {
    navigate(`/units/${unit.id}`);
  };

  const handleBook = (unit) => {
    navigate(`/units/${unit.id}/book`);
  };

  // Lấy tên loại kho đang được lọc để hiển thị trên chip
  const activeTypeName = filterOptions.types.find(
    (t) => String(t.id) === String(activeFilters.typeId),
  )?.name;

  // Lấy tên cơ sở đang được lọc để hiển thị trên chip
  const activeFacilityName = filterOptions.facilities?.find(
    (f) => String(f.id) === String(activeFilters.facilityId),
  )?.name;

  return (
    <div className="browse-page">
      {/* ── Header điều hướng dùng chung ── */}
      <Header
        brandName="STORAGEHUB"
        brandHref="/browse"
        roleLabel="KHÁCH HÀNG"
        avatarText={
          user?.fullName ? user.fullName.trim().charAt(0).toUpperCase() : "KH"
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
        <section
          className="browse-filter-card"
          aria-label="Bộ lọc tìm kiếm kho"
        >
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
                {(filterOptions.facilities &&
                filterOptions.facilities.length > 0
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
                onOpenDrawer={handleOpenDrawer}
                onViewDetails={handleViewDetails}
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Drawer xem chi tiết kho ── */}
      <Drawer
        open={Boolean(selectedUnitForDrawer)}
        headerLabel={
          selectedUnitForDrawer
            ? `CHI TIẾT GÓI KHO · ${(selectedUnitForDrawer.typeName || selectedUnitForDrawer.type || "TIÊU CHUẨN").toUpperCase()} (${selectedUnitForDrawer.sizeM2} M²)`
            : ""
        }
        onClose={() => setSelectedUnitForDrawer(null)}
        footer={
          selectedUnitForDrawer ? (
            <div className="browse-drawer-footer">
              <div className="browse-drawer-footer__price">
                <div className="browse-drawer-footer__price-val">
                  <strong>
                    {new Intl.NumberFormat("vi-VN").format(
                      selectedUnitForDrawer.baseMonthlyRent ||
                        selectedUnitForDrawer.monthlyPrice ||
                        0,
                    )}{" "}
                    ₫
                  </strong>
                  <span className="browse-drawer-footer__price-period">
                    / tháng
                  </span>
                </div>
              </div>
              <div className="browse-drawer-footer__actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const u = selectedUnitForDrawer;
                    setSelectedUnitForDrawer(null);
                    navigate(`/units/${u.id}`);
                  }}
                >
                  Chi tiết
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
          ) : null
        }
      >
        {selectedUnitForDrawer &&
          (() => {
            const typeName =
              selectedUnitForDrawer.typeName ||
              selectedUnitForDrawer.type ||
              "Tiêu chuẩn";
            const facilityName =
              selectedUnitForDrawer.facilityName || "Cơ sở Tân Bình (TP.HCM)";
            const price =
              selectedUnitForDrawer.baseMonthlyRent ||
              selectedUnitForDrawer.monthlyPrice ||
              0;
            const capacity = getCapacityHint(selectedUnitForDrawer.sizeM2);
            const isSoon =
              (typeof selectedUnitForDrawer.availability === "object"
                ? selectedUnitForDrawer.availability?.status
                : selectedUnitForDrawer.availability) === "AVAILABLE_SOON" ||
              selectedUnitForDrawer.availability === "soon";
            const availableDate =
              typeof selectedUnitForDrawer.availability === "object"
                ? selectedUnitForDrawer.availability?.availableFromDate
                : selectedUnitForDrawer.availableFrom;

            return (
              <div className="browse-drawer-body">
                {/* Tiêu đề & Giá gói thuê */}
                <div className="browse-drawer-header">
                  <p className="browse-drawer-eyebrow">
                    {facilityName.toUpperCase()}
                  </p>
                  <h2 className="browse-drawer-title">
                    {selectedUnitForDrawer.sizeM2} m² · Kho {typeName}
                  </h2>
                  <div className="browse-drawer-status-bar">
                    <Badge tone={isSoon ? "warning" : "success"}>
                      {isSoon ? "Sắp khả dụng" : "Còn trống · Nhận kho ngay"}
                    </Badge>
                    <span className="browse-drawer-rent-pill">
                      {new Intl.NumberFormat("vi-VN").format(price)} ₫ / tháng
                    </span>
                  </div>
                </div>

                {/* Hình ảnh trực quan không gian kho */}
                <DrawerVisual unit={selectedUnitForDrawer} />

                {/* Gợi ý sức chứa thực tế cho khách thuê */}
                <div className="browse-drawer-capacity">
                  <div className="browse-drawer-capacity__header">
                    <Package size={17} weight="bold" />
                    <span>{capacity.title}</span>
                  </div>
                  <p className="browse-drawer-capacity__desc">
                    {capacity.detail}
                  </p>
                </div>

                {/* Thông số không gian thiết thực */}
                <h3 className="browse-drawer-section-title">
                  THÔNG SỐ KHÔNG GIAN
                </h3>
                <dl className="spec-list">
                  <div className="spec-row">
                    <dt>Diện tích sàn sử dụng</dt>
                    <dd style={{ fontWeight: 700 }}>
                      {selectedUnitForDrawer.sizeM2} m²
                    </dd>
                  </div>
                  <div className="spec-row">
                    <dt>Chiều cao trần</dt>
                    <dd>2.8 m (tối đa xếp chồng thùng đồ)</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Thể tích chứa đồ ước tính</dt>
                    <dd>
                      ~{(selectedUnitForDrawer.sizeM2 * 2.8).toFixed(1)} m³
                    </dd>
                  </div>
                  <div className="spec-row">
                    <dt>Cơ chế truy cập</dt>
                    <dd>Mã PIN bảo mật riêng 24/7</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Địa điểm cơ sở</dt>
                    <dd>{facilityName}</dd>
                  </div>
                </dl>

                {/* Tiện ích an ninh & bảo vệ tài sản */}
                {selectedUnitForDrawer.features &&
                  selectedUnitForDrawer.features.length > 0 && (
                    <div style={{ marginTop: "20px" }}>
                      <h3 className="browse-drawer-section-title">
                        TIỆN ÍCH KHO
                      </h3>
                      <div className="browse-drawer-features">
                        {selectedUnitForDrawer.features.map((feat) => (
                          <span
                            key={feat}
                            className="browse-drawer-feature-tag"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Chi phí & Chính sách thuê minh bạch */}
                <div style={{ marginTop: "20px" }}>
                  <h3 className="browse-drawer-section-title">
                    CHI PHÍ & CHÍNH SÁCH THUÊ
                  </h3>
                  <dl className="spec-list">
                    <div className="spec-row">
                      <dt>Giá thuê niêm yết</dt>
                      <dd
                        style={{ color: "var(--color-ink)", fontWeight: 700 }}
                      >
                        {new Intl.NumberFormat("vi-VN").format(price)} ₫ / tháng
                      </dd>
                    </div>
                    <div className="spec-row">
                      <dt>Tiền đặt cọc (hoàn lại khi trả kho)</dt>
                      <dd>
                        {new Intl.NumberFormat("vi-VN").format(price)} ₫ (1
                        tháng)
                      </dd>
                    </div>
                    <div className="spec-row">
                      <dt>Thời gian bàn giao</dt>
                      <dd>
                        {isSoon && availableDate
                          ? `Bàn giao từ ${availableDate}`
                          : "Sẵn sàng bàn giao ngay"}
                      </dd>
                    </div>
                    <div className="spec-row">
                      <dt>Thời hạn thuê</dt>
                      <dd>Linh hoạt theo tháng · Gia hạn tự động</dd>
                    </div>
                  </dl>
                </div>
              </div>
            );
          })()}
      </Drawer>

      {/* ── Footer ── */}
      <Footer
        leftText="STORAGEHUB / CƠ SỞ TÂN BÌNH — HỆ THỐNG KHO TỰ QUẢN"
        rightText="PHIÊN BẢN 1.0 · 2026"
      />
    </div>
  );
}
