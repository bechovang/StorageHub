import { useState, useEffect, useCallback, useRef } from "react";
import { fetchActivityLogs } from "../../../services/activityService.js";
import { getLoginHistory } from "../../../services/userService.js";

const PAGE_SIZE = 25;

const EMPTY_SUMMARY = { totalEntries: 0, statusChanges: 0, securityEvents: 0 };

/**
 * useActivityLogs — Custom hook managing audit activity logs from backend API.
 * Phân trang server-side; KPI lấy từ summary của server (không phụ thuộc trang).
 */
export function useActivityLogs({ isLoginHistory = false } = {}) {
  const [selectedEntity, setSelectedEntity] = useState(() =>
    isLoginHistory ? "USER" : "ALL"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  useEffect(() => {
    setSelectedEntity(isLoginHistory ? "USER" : "ALL");
    setPage(1);
  }, [isLoginHistory]);

  useEffect(() => {
    setPage(1);
  }, [selectedEntity, searchTerm]);

  const abortControllerRef = useRef(null);

  const loadLogs = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      if (isLoginHistory) {
        const res = await getLoginHistory({
          query: searchTerm,
          page,
          pageSize: PAGE_SIZE,
          signal,
        });
        const items = Array.isArray(res.items) ? res.items : [];
        const mapped = items.map((item) => ({
          id: item.logId,
          timestamp: item.timestamp,
          actor: item.fullName || "Hệ thống",
          actorEmail: item.email,
          actorRole: item.role || "SYSTEM_ADMIN",
          entityType: "USER",
          entityId: String(item.userId || item.logId),
          entityCode: item.email || `USER #${item.userId}`,
          action: item.action,
          fromValue: null,
          toValue: item.status,
          reason: item.reason || (item.status === "SUCCESS" ? "Đăng nhập thành công" : "Đăng nhập thất bại"),
        }));
        const total = res.totalItems ?? res.total ?? mapped.length;
        setLogs(mapped);
        setTotalCount(total);
        setTotalPages(res.totalPages ?? 1);
        setSummary({
          totalEntries: total,
          statusChanges: 0,
          securityEvents: total,
        });
      } else {
        const res = await fetchActivityLogs({
          entityType: selectedEntity,
          searchTerm,
          page,
          pageSize: PAGE_SIZE,
          signal,
        });
        setLogs(res.items);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setSummary(res.summary || EMPTY_SUMMARY);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Failed to fetch activity logs:", err);
      setError(err.message || "Không thể tải nhật ký hoạt động.");
      setLogs([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [isLoginHistory, selectedEntity, searchTerm, page]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(() => {
      loadLogs(controller.signal);
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadLogs]);

  return {
    loading,
    error,
    refreshLogs: () => loadLogs(),
    selectedEntity,
    setSelectedEntity,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalPages,
    logs,
    totalEntries: summary.totalEntries || totalCount || logs.length,
    statusChangeCount: summary.statusChanges,
    securityEventCount: summary.securityEvents,
  };
}
