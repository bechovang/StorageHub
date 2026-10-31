import { useState, useEffect, useCallback, useMemo } from "react";
import { listMyReservations } from "../../../services/rentalService.js";

/**
 * useMyRentals — Custom hook managing customer rental list, grouping, tabs, and filtering
 */
export function useMyRentals() {
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
    Promise.all([
      listMyReservations({ group: "active" }),
      listMyReservations({ group: "history" }),
    ])
      .then(([activePage, historyPage]) => {
        if (!ignore) {
          setActiveItems(activePage?.items || []);
          setHistoryItems(historyPage?.items || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err?.message || "Không thể tải danh sách đơn thuê.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Grouping and count calculations for each tab
  const counts = useMemo(() => {
    const all = activeItems.length + historyItems.length;
    const active = activeItems.filter((i) =>
      ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(i.status)
    ).length;
    const reserved = activeItems.filter((i) => i.status === "RESERVED").length;
    const history = historyItems.length;

    return { all, active, reserved, history };
  }, [activeItems, historyItems]);

  // Filter by selected tab
  const tabFilteredItems = useMemo(() => {
    switch (activeTab) {
      case "ACTIVE":
        return activeItems.filter((i) =>
          ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(i.status)
        );
      case "RESERVED":
        return activeItems.filter((i) => i.status === "RESERVED");
      case "HISTORY":
        return historyItems;
      case "ALL":
      default:
        return [...activeItems, ...historyItems];
    }
  }, [activeTab, activeItems, historyItems]);

  // Filter by search query (order code or unit code)
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

  return {
    activeItems,
    historyItems,
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
  };
}
