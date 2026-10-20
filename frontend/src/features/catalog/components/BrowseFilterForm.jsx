import { MagnifyingGlass } from "@phosphor-icons/react";

export default function BrowseFilterForm({
  filterOptions,
  selectedType,
  setSelectedType,
  selectedSize,
  setSelectedSize,
  startDate,
  setStartDate,
  selectedFacility,
  setSelectedFacility,
  onSearchSubmit,
}) {
  return (
    <section className="browse-filter-card" aria-label="Bộ lọc tìm kiếm kho">
      <form className="browse-filter-grid" onSubmit={onSearchSubmit}>
        {/* 1. Loại kho */}
        <div className="browse-filter-field">
          <label className="browse-filter-field__label" htmlFor="filter-type">
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
          <label className="browse-filter-field__label" htmlFor="filter-size">
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
          <label className="browse-filter-field__label" htmlFor="filter-date">
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
          <label className="browse-filter-field__label" htmlFor="filter-facility">
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
        <button id="browse-search-btn" type="submit" className="browse-filter-btn">
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
          <span>Tìm kiếm</span>
        </button>
      </form>
    </section>
  );
}
