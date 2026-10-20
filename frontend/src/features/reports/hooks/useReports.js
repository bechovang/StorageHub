import { useState, useMemo } from "react";
import {
  getFinancialSummary,
  getDrilldownItems,
  exportFinancialAuditCSV,
} from "../../../services/reportService.js";

export function useReports() {
  // 4 Tab báo cáo cốt lõi (US-31)
  const [activeTab, setActiveTab] = useState("REVENUE"); // REVENUE | DEPOSITS | SURCHARGES | OCCUPANCY
  // Kỳ báo cáo (Có sẵn hoặc Tự chọn khoảng ngày)
  const [selectedPeriod, setSelectedPeriod] = useState("THIS_QUARTER");
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [customRange, setCustomRange] = useState({
    startDate: "2026-07-01",
    endDate: "2026-09-30",
  });

  // State Drill-down Drawer khi click vào 4 KPI hoặc "Xem chi tiết"
  const [activeDrilldownKey, setActiveDrilldownKey] = useState(null);
  const [drilldownSearch, setDrilldownSearch] = useState("");

  // Dữ liệu tổng hợp theo kỳ được chọn
  const summary = useMemo(() => {
    return getFinancialSummary(selectedPeriod, customRange);
  }, [selectedPeriod, customRange]);

  // Dữ liệu Drill-down
  const drilldownData = useMemo(() => {
    if (!activeDrilldownKey) return null;
    return getDrilldownItems(activeDrilldownKey);
  }, [activeDrilldownKey]);

  // Lọc dòng trong drilldown
  const filteredDrilldownRows = useMemo(() => {
    if (!drilldownData || !drilldownData.rows) return [];
    if (!drilldownSearch.trim()) return drilldownData.rows;
    const q = drilldownSearch.toLowerCase();
    return drilldownData.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [drilldownData, drilldownSearch]);

  const handleExportCSV = () => {
    exportFinancialAuditCSV(summary.periodLabel);
  };

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    setSelectedPeriod("CUSTOM");
    setShowCustomRangeModal(false);
  };

  const handleCloseDrilldown = () => {
    setActiveDrilldownKey(null);
    setDrilldownSearch("");
  };

  return {
    activeTab,
    setActiveTab,
    selectedPeriod,
    setSelectedPeriod,
    showCustomRangeModal,
    setShowCustomRangeModal,
    customRange,
    setCustomRange,
    activeDrilldownKey,
    setActiveDrilldownKey,
    drilldownSearch,
    setDrilldownSearch,
    summary,
    drilldownData,
    filteredDrilldownRows,
    handleExportCSV,
    handleApplyCustomRange,
    handleCloseDrilldown,
  };
}
