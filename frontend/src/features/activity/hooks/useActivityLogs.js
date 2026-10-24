import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchActivityLogs } from "../../../services/activityService.js";
import { getLoginHistory } from "../../../services/userService.js";

/**
 * useActivityLogs — Custom hook managing audit activity logs from backend API
 */
export function useActivityLogs({ isLoginHistory = false } = {}) {
  const [selectedEntity, setSelectedEntity] = useState(() =>
    isLoginHistory ? "USER" : "ALL"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const abortControllerRef = useRef(null);

  const loadLogs = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      if (isLoginHistory) {
        const res = await getLoginHistory({
          query: searchTerm,
          pageSize: 100,
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
        setLogs(mapped);
        setTotalCount(res.total || mapped.length);
      } else {
        const res = await fetchActivityLogs({
          entityType: selectedEntity,
          searchTerm,
          pageSize: 100,
          signal,
        });
        setLogs(res.items);
        setTotalCount(res.total);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Failed to fetch activity logs:", err);
      setError(err.message || "Không thể tải nhật ký hoạt động.");
    } finally {
      setLoading(false);
    }
  }, [isLoginHistory, selectedEntity, searchTerm]);

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

  // Aggregate metrics
  const totalEntries = totalCount || logs.length;
  const statusChangeCount = useMemo(
    () =>
      logs.filter(
        (l) =>
          l.action.includes("STATUS") ||
          l.action.includes("MAINTENANCE") ||
          l.action.includes("RETIRE") ||
          l.action.includes("UPDATED")
      ).length,
    [logs]
  );

  const securityEventCount = useMemo(
    () =>
      logs.filter(
        (l) => l.action.includes("LOGIN") || l.action.includes("FAIL")
      ).length,
    [logs]
  );

  return {
    loading,
    error,
    refreshLogs: () => loadLogs(),
    selectedEntity,
    setSelectedEntity,
    searchTerm,
    setSearchTerm,
    logs,
    totalEntries,
    statusChangeCount,
    securityEventCount,
  };
}
