import { MagnifyingGlass } from "@phosphor-icons/react";

export default function BrowseFilterForm({
  filterOptions,
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedSize,
  setSelectedSize,
  selectedFacility,
  setSelectedFacility,
  onSearchSubmit,
}) {
  return (
    <section className="browse-filter-card" aria-label="Bộ lọc tìm kiếm kho">
      <form className="browse-filter-grid" onSubmit={onSearchSubmit}>
        {/* 1. Tìm theo mã kho (A+X): "s7", "S-7" đều khớp S-7 */}
        <div className="browse-filter-field">
          <label className="browse-filter-field__label" htmlFor="filter-query">
            Tìm mã kho
          </label>
          <input
            id="filter-query"
            type="text"
            className="browse-filter-field__input"
            placeholder="Ví dụ: S-7"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 2. Loại kho */}
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

        {/* 3. Kích thước (m²) */}
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
            {(filterOptions.facilities || []).map((f) => (
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
