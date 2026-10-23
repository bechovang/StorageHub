import { useState, useMemo } from "react";
import { getActivityLogs } from "../../../services/activityService.js";

/**
 * useActivityLogs — Custom hook managing audit activity logs, filtering and KPI metrics
 */
export function useActivityLogs({ isLoginHistory = false } = {}) {
  const [selectedEntity, setSelectedEntity] = useState(() =>
    isLoginHistory ? "USER" : "ALL"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Retrieve logs based on filter criteria
  const logs = useMemo(() => {
    return getActivityLogs({
      entityType: selectedEntity,
      searchTerm,
    });
  }, [selectedEntity, searchTerm]);

  // Aggregate metrics
  const totalEntries = logs.length;
  const statusChangeCount = useMemo(
    () =>
      logs.filter(
        (l) =>
          l.action.includes("STATUS") ||
          l.action.includes("MAINTENANCE") ||
          l.action.includes("RETIRE")
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
