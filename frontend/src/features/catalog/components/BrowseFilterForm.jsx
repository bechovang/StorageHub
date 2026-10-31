import { MagnifyingGlass } from "@phosphor-icons/react";

export default function BrowseFilterForm({
  filterOptions,
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedSize,
  setSelectedSize,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
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

        {/* 4. Ngày kết thúc (thuê theo ngày) */}
        <div className="browse-filter-field">
          <label className="browse-filter-field__label" htmlFor="filter-end-date">
            Ngày kết thúc
          </label>
          <input
            id="filter-end-date"
            type="date"
            className="browse-filter-field__input"
            value={endDate || ""}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* 6. Nút tìm kiếm */}
        <button id="browse-search-btn" type="submit" className="browse-filter-btn">
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
          <span>Tìm kiếm</span>
        </button>
      </form>
    </section>
  );
}
