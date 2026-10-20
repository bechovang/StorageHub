import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowClockwise,
  WarningCircle,
  Plus,
  ArrowLeft,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { listMyReservations } from "../../services/rentalService.js";
import RentalTelemetry from "./RentalTelemetry.jsx";
import RentalFilters from "./RentalFilters.jsx";
import RentalCard from "./RentalCard.jsx";
import RentalEmptyState from "./RentalEmptyState.jsx";
import "./MyRentalsPage.css";

export default function MyRentalsPage() {
  const [activeItems, setActiveItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadRentals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activePage, historyPage] = await Promise.all([
        listMyReservations({ group: "active" }),
        listMyReservations({ group: "history" }),
      ]);
      setActiveItems(activePage?.items || []);
      setHistoryItems(historyPage?.items || []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách đơn thuê.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchInitial() {
      try {
        const [activePage, historyPage] = await Promise.all([
          listMyReservations({ group: "active" }),
          listMyReservations({ group: "history" }),
        ]);
        if (!ignore) {
          setActiveItems(activePage?.items || []);
          setHistoryItems(historyPage?.items || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || "Không thể tải danh sách đơn thuê.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchInitial();

    return () => {
      ignore = true;
    };
  }, []);

  // Nhóm và tính toán số lượng cho từng tab
  const counts = useMemo(() => {
    const all = activeItems.length + historyItems.length;
    const active = activeItems.filter((i) =>
      ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(i.status)
    ).length;
    const reserved = activeItems.filter((i) => i.status === "RESERVED").length;
    const pending = activeItems.filter(
      (i) => i.status === "PENDING_PAYMENT"
    ).length;
    const history = historyItems.length;

    return { all, active, reserved, pending, history };
  }, [activeItems, historyItems]);

  // Lọc theo Tab đã chọn
  const tabFilteredItems = useMemo(() => {
    switch (activeTab) {
      case "ACTIVE":
        return activeItems.filter((i) =>
          ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(i.status)
        );
      case "RESERVED":
        return activeItems.filter((i) => i.status === "RESERVED");
      case "PENDING":
        return activeItems.filter((i) => i.status === "PENDING_PAYMENT");
      case "HISTORY":
        return historyItems;
      case "ALL":
      default:
        return [...activeItems, ...historyItems];
    }
  }, [activeTab, activeItems, historyItems]);

  // Lọc tiếp theo từ khóa tìm kiếm (mã đơn hoặc mã kho)
  const displayItems = useMemo(() => {
    if (!searchQuery.trim()) return tabFilteredItems;
    const q = searchQuery.trim().toLowerCase();
    return tabFilteredItems.filter((item) => {
      const codeMatch = item.code?.toLowerCase().includes(q);
      const unitMatch = item.unit?.code?.toLowerCase().includes(q);
      const typeMatch = item.unit?.typeName?.toLowerCase().includes(q);
      return codeMatch || unitMatch || typeMatch;
    });
  }, [tabFilteredItems, searchQuery]);

  const hasAnyRentals = activeItems.length > 0 || historyItems.length > 0;

  return (
    <AppShell>
      <div className="my-rentals-page">
        {/* Breadcrumb Navigation */}
        <nav className="my-rentals-page__breadcrumb" aria-label="Breadcrumb">
          <Link to="/browse" className="my-rentals-back-link">
            <ArrowLeft size={14} weight="bold" />
            <span>Khám phá kho</span>
          </Link>
          <span className="my-rentals-page__breadcrumb-sep">/</span>
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
