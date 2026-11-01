import { useState, useEffect, useMemo } from "react";
import {
  EMPTY_FINANCIAL_SUMMARY,
  getFinancialSummary,
  getMonthlyRevenueChartData,
  getDrilldownItems,
  exportFinancialAuditCSV,
} from "../../../services/reportService.js";
import { getCurrentPolicy } from "../../../services/policyService.js";
import { fetchActivityLogs } from "../../../services/activityService.js";

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
  const [policyVersions, setPolicyVersions] = useState([]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getCurrentPolicy().catch(() => null),
      fetchActivityLogs({ entityType: "POLICY", pageSize: 5 }).catch(() => ({ items: [] })),
    ]).then(([activePol, logsRes]) => {
      if (ignore) return;
      const versions = [];
      if (activePol) {
        const ratesSummary = (activePol.baseRates || [])
          .map((r) => `${r.typeName}: ${Number(r.rateVnd).toLocaleString('vi-VN')} ₫`)
          .join(" · ");
        versions.push({
          version: activePol.version || "v3",
          effectiveDate: activePol.effectiveDate || "01/10/2026",
          changedBy: activePol.updatedBy || "Lê Thị Hằng (Business Ops)",
          status: "ACTIVE",
          scope: `Đơn giá ${activePol.baseRates?.length || 4} phân loại kho, phí phạt trễ ${activePol.surcharges?.lateCheckoutPercent}%, cọc ${activePol.surcharges?.depositPercent}%, buffer ${activePol.surcharges?.turnoverBufferDays} ngày`,
          diff: [
            { field: "Đơn giá cơ sở", oldVal: "Biểu giá trước đó", newVal: ratesSummary || "Theo cấu hình niêm yết" },
            { field: "Phụ thu trả trễ", oldVal: "Theo quy chế cũ", newVal: `${activePol.surcharges?.lateCheckoutPercent}% / ngày` },
            { field: "Tỷ lệ cọc bảo đảm", oldVal: "Theo quy chế cũ", newVal: `${activePol.surcharges?.depositPercent}% tổng tiền thuê` },
            { field: "Thời gian đệm vệ sinh", oldVal: "Theo quy chế cũ", newVal: `${activePol.surcharges?.turnoverBufferDays} ngày` },
          ],
        });
      }

      const logItems = logsRes?.items || [];
      logItems.forEach((log, idx) => {
        versions.push({
          version: `v${Math.max(1, (activePol ? 2 : 1) - idx)}`,
          effectiveDate: log.timestamp ? log.timestamp.slice(0, 10) : "Trước đó",
          changedBy: log.actor || "Quản trị viên",
          status: "SUPERSEDED",
          scope: log.reason || "Cập nhật chính sách vận hành và biểu giá cơ sở",
          diff: [
            { field: "Hành động ghi nhận", oldVal: log.fromValue || "—", newVal: log.toValue || log.reason || "Đã lưu bản mới" },
          ],
        });
      });

      setPolicyVersions(versions);
    });
    return () => {
      ignore = true;
    };
  }, []);

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
    policyVersions,
    handleExportCSV,
  };
}
