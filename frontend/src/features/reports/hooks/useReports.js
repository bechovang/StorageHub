import { fetchFacilityUnits } from "../../../services/unitService.js";
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
  const [zonePerformance, setZonePerformance] = useState([]);

  useEffect(() => {
    let ignore = false;
    fetchFacilityUnits()
      .then((units) => {
        if (ignore || !Array.isArray(units)) return;
        const zonesMap = {
          A: { zone: "Zone A (Small)", zoneCode: "A", unitCount: 0, rentedCount: 0, baseRev: 0, surcharge: 0, total: 0, avgDuration: "3.2 tháng", status: "HEALTHY" },
          B: { zone: "Zone B (Medium & Large)", zoneCode: "B", unitCount: 0, rentedCount: 0, baseRev: 0, surcharge: 0, total: 0, avgDuration: "5.5 tháng", status: "HIGH_DEMAND" },
          C: { zone: "Zone C (Lockers)", zoneCode: "C", unitCount: 0, rentedCount: 0, baseRev: 0, surcharge: 0, total: 0, avgDuration: "2.0 tháng", status: "STABLE" },
        };
        units.forEach((u) => {
          const zCode = String(u.zone || u.zoneCode || "A").toUpperCase();
          const target = zonesMap[zCode] || zonesMap.A;
          target.unitCount += 1;
          if (u.status === "RENTED") {
            target.rentedCount += 1;
            const unitPrice = u.typeName === "Locker" ? 3000 : u.typeName === "S" ? 5000 : u.typeName === "M" ? 8000 : 15000;
            target.baseRev += unitPrice;
            target.total += unitPrice;
          }
        });
        const list = Object.values(zonesMap).map((z) => {
          const rateNum = z.unitCount > 0 ? ((z.rentedCount / z.unitCount) * 100).toFixed(1) : "0.0";
          return {
            ...z,
            rate: `${rateNum}%`,
            status: Number(rateNum) >= 80 ? "HIGH_DEMAND" : "STABLE",
          };
        });
        setZonePerformance(list);
      })
      .catch((err) => {
        console.error("Failed to calculate real zone performance:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

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
    getDrilldownItems(activeDrilldownKey, "", selectedPeriod, customRange)
      .then((data) => {
        if (!ignore) setDrilldownData(data);
      })
      .catch((err) => {
        console.error("Failed to fetch report drilldown:", err);
      });
    return () => {
      ignore = true;
    };
  }, [activeDrilldownKey, selectedPeriod, customRange]);

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
    zonePerformance,
  };
}
