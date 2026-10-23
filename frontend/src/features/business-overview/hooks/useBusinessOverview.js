import { useState, useMemo, useEffect } from "react";
import {
  EMPTY_FINANCIAL_SUMMARY,
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
  const [summary, setSummary] = useState(EMPTY_FINANCIAL_SUMMARY);
  // Dữ liệu biểu đồ 6 tháng
  const [monthlyData, setMonthlyData] = useState([]);
  // Dữ liệu danh sách drill-down khi bấm KPI
  const [drilldownData, setDrilldownData] = useState(null);

  useEffect(() => {
    let ignore = false;
    getFinancialSummary(selectedPeriod)
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch((err) => {
        console.error("Failed to fetch business overview summary:", err);
      });
    return () => {
      ignore = true;
    };
  }, [selectedPeriod]);

  useEffect(() => {
    let ignore = false;
    getMonthlyRevenueChartData(6)
      .then((data) => {
        if (!ignore) setMonthlyData(data);
      })
      .catch((err) => {
        console.error("Failed to fetch monthly revenue chart:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeDrilldownKey) return;
    let ignore = false;
    getDrilldownItems(activeDrilldownKey)
      .then((data) => {
        if (!ignore) setDrilldownData(data);
      })
      .catch((err) => {
        console.error("Failed to fetch drilldown items:", err);
      });
    return () => {
      ignore = true;
    };
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

  const handleExportCSV = async () => {
    try {
      await exportFinancialAuditCSV(selectedPeriod);
    } catch (err) {
      console.error("Failed to export financial CSV:", err);
    }
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
