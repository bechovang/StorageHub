import { useState, useEffect, useMemo } from "react";
import { getFacilityOverview, getFacilityDrilldown } from "../../../services/facilityService.js";
import { STATUS_CONFIGS } from "../constants.js";

export function useFacilityOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drilldown Drawer State
  const [drilldownStatus, setDrilldownStatus] = useState(null);
  const [searchUnitTerm, setSearchUnitTerm] = useState("");
  const [drilldownUnits, setDrilldownUnits] = useState([]);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);

  // Load facility overview on mount
  useEffect(() => {
    let ignore = false;
    getFacilityOverview()
      .then((data) => {
        if (!ignore) {
          setOverview(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load facility overview:", err);
          setError(err.message || "Không thể tải dữ liệu tổng quan cơ sở.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Load drilldown units whenever drilldownStatus or searchUnitTerm changes
  useEffect(() => {
    if (!drilldownStatus) {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      setLoadingDrilldown(true);
      getFacilityDrilldown({
        status: drilldownStatus,
        query: searchUnitTerm,
        pageSize: 100,
      })
        .then((data) => {
          if (isMounted && data && Array.isArray(data.items)) {
            const mapped = data.items.map((u) => ({
              id: u.unitId,
              code: u.code,
              type: `${u.unitType || "Kho"} (${u.sizeM2 || 0}m²)`,
              zone: u.zoneCode ? `Zone ${u.zoneCode}` : `Tầng ${u.floor || 1}`,
              status: u.status,
              rentPrice: Number(u.rentPrice || 0),
              tenant: u.tenantName || null,
              nextEvent: u.rentalCode
                ? `Hợp đồng: ${u.rentalCode}`
                : u.status === "MAINTENANCE"
                ? "Bảo trì thiết bị / khóa"
                : u.status === "PREPARING"
                ? "Đang dọn dẹp vệ sinh"
                : "Sẵn sàng bàn giao",
            }));
            setDrilldownUnits(mapped);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch drilldown units:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingDrilldown(false);
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [drilldownStatus, searchUnitTerm]);

  // Thống kê phân bố kho từ Backend overview
  const statusStats = useMemo(() => {
    const counts = {
      TOTAL: overview?.occupancy?.totalUnits || 0,
      AVAILABLE: 0,
      RESERVED: 0,
      RENTED: overview?.occupancy?.rentedUnits || 0,
      PREPARING: 0,
      MAINTENANCE: overview?.unitsInService?.maintenanceUnits || 0,
      RETIRED: 0,
    };

    if (overview?.statusDistribution && Array.isArray(overview.statusDistribution)) {
      overview.statusDistribution.forEach((s) => {
        if (counts[s.status] !== undefined) {
          counts[s.status] = s.count;
        }
      });
      const calculatedTotal = Object.entries(counts).reduce(
        (sum, [key, val]) => (key !== "TOTAL" ? sum + val : sum),
        0
      );
      if (calculatedTotal > 0) counts.TOTAL = calculatedTotal;
    }

    return counts;
  }, [overview]);

  const occupancyRate = useMemo(() => {
    if (overview?.occupancy?.rate != null) {
      return Number(overview.occupancy.rate).toFixed(0);
    }
    if (statusStats.TOTAL > 0) {
      return ((statusStats.RENTED / statusStats.TOTAL) * 100).toFixed(0);
    }
    return "0";
  }, [overview, statusStats]);

  // Map turnover queue
  const turnoverQueue = useMemo(() => {
    if (!overview?.turnoverQueue || !Array.isArray(overview.turnoverQueue)) {
      return [];
    }
    return overview.turnoverQueue.map((item) => ({
      id: item.taskId,
      unitCode: item.unitCode,
      spec: `${item.unitType || "Kho"} (Zone ${item.zoneCode || "A"})`,
      fromStatus: item.taskType === "CHECKOUT" ? "RENTED" : "PREPARING",
      toStatus: item.taskType === "CHECKOUT" ? "PREPARING" : "AVAILABLE",
      taskName:
        item.taskType === "CHECKOUT"
          ? "Nghiệm thu trả kho (Checkout)"
          : "Dọn dẹp khử ẩm bàn giao (Cleaning)",
      refCode: `TSK-${item.taskId}`,
      staffName: item.staffName || "Chưa phân công",
      dueTime: item.workDate ? item.workDate : "Hôm nay",
    }));
  }, [overview]);

  // Mở drilldown với status tương ứng (FR-32)
  const handleOpenDrilldown = (status) => {
    setDrilldownStatus(status);
    setSearchUnitTerm("");
  };

  const handleExportCSV = () => {
    const itemsToExport = drilldownUnits.length > 0 ? drilldownUnits : [];
    const csv = itemsToExport
      .map((u) => `${u.code},${u.type},${u.zone},${u.status},${u.rentPrice},${u.tenant || ""}`)
      .join("\n");
    const blob = new Blob([`Mã kho,Loại,Khu vực,Trạng thái,Giá thuê,Khách thuê\n${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storagehub_facility_units_${Date.now()}.csv`;
    a.click();
  };

  return {
    overview,
    loading,
    error,
    drilldownStatus,
    setDrilldownStatus,
    searchUnitTerm,
    setSearchUnitTerm,
    drilldownUnits: drilldownStatus ? drilldownUnits : [],
    loadingDrilldown,
    statusStats,
    occupancyRate,
    turnoverQueue,
    statusConfigs: STATUS_CONFIGS,
    handleOpenDrilldown,
    handleExportCSV,
  };
}
