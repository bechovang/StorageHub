import { MagnifyingGlass } from "@phosphor-icons/react";

const TABS = [
  { key: "ALL", label: "Tất cả", countKey: "all" },
  { key: "ACTIVE", label: "Đang thuê", countKey: "active" },
  { key: "RESERVED", label: "Chờ nhận kho", countKey: "reserved" },
  { key: "PENDING", label: "Chờ cọc", countKey: "pending" },
  { key: "HISTORY", label: "Lịch sử", countKey: "history" },
];

export default function RentalFilters({
  activeTab,
  onTabChange,
  counts = {},
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="rental-filters">
      {/* Segmented Tab Bar */}
      <div className="rental-filters__tabs" role="tablist" aria-label="Bộ lọc đơn thuê">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey] || 0;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`rental-filters__tab ${isActive ? "is-active" : ""}`}
              onClick={() => onTabChange(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="rental-filters__tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Search */}
      <div className="rental-filters__search-wrap">
        <MagnifyingGlass size={16} weight="bold" className="rental-filters__search-icon" />
        <input
          type="text"
          className="rental-filters__search-input"
          placeholder="Tìm mã đơn hoặc mã ô kho..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Tìm kiếm đơn thuê"
        />
      </div>
    </div>
  );
}
