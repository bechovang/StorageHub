import { useState, useMemo } from "react";
import {
  POLICY_VERSIONS,
  getFinancialSummary,
  getMonthlyRevenueChartData,
  getDrilldownItems,
  exportFinancialAuditCSV,
} from "../../../services/reportService.js";

export function useBusinessOverview() {
  // State lọc kỳ báo cáo
  const [selectedPeriod, setSelectedPeriod] = useState("THIS_QUARTER");
  // State drill-down drawer khi click vào 4 KPI
  const [activeDrilldownKey, setActiveDrilldownKey] = useState(null);
  const [drilldownSearch, setDrilldownSearch] = useState("");
  // State diff modal cho Rental Policy
  const [diffModalVersion, setDiffModalVersion] = useState(null);

  // Dữ liệu tài chính theo kỳ
  const summary = useMemo(() => {
    return getFinancialSummary(selectedPeriod);
  }, [selectedPeriod]);

  // Dữ liệu biểu đồ 6 tháng
  const monthlyData = useMemo(() => {
    return getMonthlyRevenueChartData();
  }, []);

  // Dữ liệu danh sách drill-down khi bấm KPI
  const drilldownData = useMemo(() => {
    if (!activeDrilldownKey) return null;
    return getDrilldownItems(activeDrilldownKey);
  }, [activeDrilldownKey]);

  // Lọc dữ liệu trong drill-down drawer theo ô tìm kiếm
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

  return {
    selectedPeriod,
    setSelectedPeriod,
    activeDrilldownKey,
    setActiveDrilldownKey,
    drilldownSearch,
    setDrilldownSearch,
    diffModalVersion,
    setDiffModalVersion,
    summary,
    monthlyData,
    drilldownData,
    filteredDrilldownRows,
    policyVersions: POLICY_VERSIONS,
    handleExportCSV,
  };
}
