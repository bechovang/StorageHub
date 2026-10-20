import { useState, useMemo } from "react";
import { INITIAL_FACILITY_UNITS, TURNOVER_QUEUE, STATUS_CONFIGS } from "../constants.js";

export function useFacilityOverview() {
  // Drilldown Drawer State
  const [drilldownStatus, setDrilldownStatus] = useState(null);
  const [searchUnitTerm, setSearchUnitTerm] = useState("");

  // Lọc danh sách units khi drilldown
  const drilldownUnits = useMemo(() => {
    let list = INITIAL_FACILITY_UNITS;
    if (drilldownStatus && drilldownStatus !== "ALL") {
      list = list.filter((u) => u.status === drilldownStatus);
    }
    if (searchUnitTerm.trim()) {
      const q = searchUnitTerm.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.code.toLowerCase().includes(q) ||
          u.type.toLowerCase().includes(q) ||
          (u.tenant && u.tenant.toLowerCase().includes(q))
      );
    }
    return list;
  }, [drilldownStatus, searchUnitTerm]);

  // Thống kê phân bố kho
  const statusStats = useMemo(() => {
    const counts = {
      TOTAL: INITIAL_FACILITY_UNITS.length,
      AVAILABLE: 0,
      RESERVED: 0,
      RENTED: 0,
      PREPARING: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
    };
    INITIAL_FACILITY_UNITS.forEach((u) => {
      if (counts[u.status] !== undefined) counts[u.status]++;
    });
    return counts;
  }, []);

  const occupancyRate = ((statusStats.RENTED / statusStats.TOTAL) * 100).toFixed(0);

  // Mở drilldown với status tương ứng (FR-32)
  const handleOpenDrilldown = (status) => {
    setDrilldownStatus(status);
    setSearchUnitTerm("");
  };

  const handleExportCSV = () => {
    const csv = INITIAL_FACILITY_UNITS.map(
      (u) => `${u.code},${u.type},${u.zone},${u.status},${u.rentPrice},${u.tenant || ""}`
    ).join("\n");
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
    drilldownStatus,
    setDrilldownStatus,
    searchUnitTerm,
    setSearchUnitTerm,
    drilldownUnits,
    statusStats,
    occupancyRate,
    turnoverQueue: TURNOVER_QUEUE,
    statusConfigs: STATUS_CONFIGS,
    handleOpenDrilldown,
    handleExportCSV,
  };
}
