import { useState, useMemo, useEffect } from "react";
import {
  EMPTY_FINANCIAL_SUMMARY,
  getFinancialSummary,
  getDrilldownItems,
  exportFinancialAuditCSV,
  getMonthlyRevenueChartData,
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
  const [summary, setSummary] = useState(EMPTY_FINANCIAL_SUMMARY);
  // Dữ liệu Drill-down
  const [drilldownData, setDrilldownData] = useState(null);
  // Dữ liệu chuỗi thời gian doanh thu hàng tháng từ backend (FR-31)
  const [monthlyChartData, setMonthlyChartData] = useState([]);

  useEffect(() => {
    let ignore = false;
    getMonthlyRevenueChartData(6)
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setMonthlyChartData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch monthly chart data for reports:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    getFinancialSummary(selectedPeriod, customRange)
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch((err) => {
        console.error("Failed to fetch financial summary:", err);
      });
    return () => {
      ignore = true;
    };
  }, [selectedPeriod, customRange]);

  useEffect(() => {
    if (!activeDrilldownKey) return;
    let ignore = false;
    getDrilldownItems(activeDrilldownKey)
      .then((data) => {
        if (!ignore) setDrilldownData(data);
      })
      .catch((err) => {
        console.error("Failed to fetch report drilldown:", err);
      });
    return () => {
      ignore = true;
    };
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

  const handleExportCSV = async () => {
    try {
      await exportFinancialAuditCSV(selectedPeriod);
    } catch (err) {
      console.error("Failed to export financial CSV:", err);
    }
  };

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    setSelectedPeriod("CUSTOM");
    setShowCustomRangeModal(false);
  };

  const handleCloseDrilldown = () => {
    setActiveDrilldownKey(null);
    setDrilldownData(null);
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
    monthlyChartData,
  };
}
