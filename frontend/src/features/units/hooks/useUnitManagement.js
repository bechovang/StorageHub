import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { matchSearch } from "../../../utils/formatters.js";
import {
  getFacilityUnits,
  updateUnitSpecs,
  checkRetireGuard,
  retireUnit,
  checkMaintenanceGuard,
  setUnitMaintenance,
  finishUnitMaintenance,
  fixUnitStatus,
  getUnitActivityLogs,
} from "../../../services/unitService.js";

export function useUnitManagement() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dữ liệu Units từ Storage/Service
  const [units, setUnits] = useState(() => getFacilityUnits());

  // Bộ lọc trạng thái lấy trực tiếp từ searchParams (Single Source of Truth)
  const activeStatusTab = searchParams.get("status") || "ALL";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");

  // Drawer chi tiết / chỉnh sửa
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [drawerTab, setDrawerTab] = useState("SPECS"); // "SPECS" | "LOGS"

  // Form edit specs trong drawer
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSizeM2, setEditSizeM2] = useState("");

  // Modals
  // 1. Blocker modal (khi vi phạm guard)
  const [blockerModalData, setBlockerModalData] = useState(null);
  // 2. Retire confirm modal (khi guard cho phép)
  const [retireTargetUnit, setRetireTargetUnit] = useState(null);
  // 3. Maintenance reason modal
  const [maintenanceTargetUnit, setMaintenanceTargetUnit] = useState(null);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  // 4. Fix status modal
  const [fixStatusTargetUnit, setFixStatusTargetUnit] = useState(null);
  const [fixStatusValue, setFixStatusValue] = useState("AVAILABLE");
  const [fixStatusReason, setFixStatusReason] = useState("");
  const [fixStatusError, setFixStatusError] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  // Khi chọn tab -> sync URL search params
  const handleSelectTab = (tabKey) => {
    if (tabKey === "ALL") {
      searchParams.delete("status");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: tabKey }, { replace: true });
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Thống kê số lượng
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: units.length,
      AVAILABLE: 0,
      RENTED: 0,
      RESERVED: 0,
      PREPARING: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
    };
    units.forEach((u) => {
      if (counts[u.status] !== undefined) counts[u.status]++;
    });
    return counts;
  }, [units]);

  // Danh sách lọc
  const filteredUnits = useMemo(() => {
    let result = [...units];
    if (activeStatusTab !== "ALL") {
      result = result.filter((u) => u.status === activeStatusTab);
    }
    if (selectedZone !== "ALL") {
      result = result.filter((u) => u.zone === selectedZone);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim();
      result = result.filter(
        (u) =>
          matchSearch(u.code, q) ||
          matchSearch(u.typeName, q) ||
          matchSearch(u.zone, q) ||
          matchSearch(u.tenant, q) ||
          matchSearch(u.contractRef, q)
      );
    }
    return result;
  }, [units, activeStatusTab, selectedZone, searchTerm]);

  // Mở Drawer chi tiết kho
  const handleOpenDrawer = (unit) => {
    setSelectedUnit(unit);
    setDrawerTab("SPECS");
    setEditPrice(String(unit.baseRentPrice));
    setEditNotes(unit.notes || "");
    setEditSizeM2(String(unit.sizeM2));
  };

  const handleCloseDrawer = () => {
    setSelectedUnit(null);
  };

  // Lưu thông số kho (Update Specs)
  const handleSaveSpecs = (e) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      const updated = updateUnitSpecs(selectedUnit.id, {
        baseRentPrice: Number(editPrice),
        notes: editNotes,
        sizeM2: Number(editSizeM2),
      });
      setSelectedUnit(updated);
      setUnits(getFacilityUnits());
      showToast(`Đã lưu thông số kho ${updated.code} thành công.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 1. Thao tác Cho nghỉ kho (Retire Unit) — Kèm Guard + Blocker + Confirm (FR-26)
  const handleInitiateRetire = (unit) => {
    const guard = checkRetireGuard(unit);
    if (!guard.allowed) {
      setBlockerModalData({
        unit,
        blocker: guard.blocker,
      });
      return;
    }
    setRetireTargetUnit(unit);
  };

  const handleConfirmRetire = () => {
    if (!retireTargetUnit) return;
    try {
      const updated = retireUnit(retireTargetUnit.id);
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      setRetireTargetUnit(null);
      showToast(`Kho ${updated.code} đã được chuyển sang trạng thái Ngừng thuê (RETIRED).`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 2. Thao tác Đưa vào Bảo trì (Set Maintenance) — Kèm Guard + Blocker (FR-26)
  const handleInitiateMaintenance = (unit) => {
    const guard = checkMaintenanceGuard(unit);
    if (!guard.allowed) {
      setBlockerModalData({
        unit,
        blocker: guard.blocker,
      });
      return;
    }
    setMaintenanceTargetUnit(unit);
    setMaintenanceReason("");
  };

  const handleConfirmMaintenance = () => {
    if (!maintenanceTargetUnit) return;
    try {
      const updated = setUnitMaintenance(maintenanceTargetUnit.id, maintenanceReason);
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      setMaintenanceTargetUnit(null);
      showToast(`Kho ${updated.code} đã được chuyển vào bảo trì.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Hoàn tất bảo trì -> Tự động sang PREPARING + Cleaning Task (Rule FR-26/20)
  const handleFinishMaintenance = (unit) => {
    try {
      const updated = finishUnitMaintenance(unit.id);
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      showToast(`Bảo trì hoàn tất. Kho ${updated.code} đã chuyển sang Đang xử lý (PREPARING) để dọn dẹp bàn giao.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. Sửa trạng thái trực tiếp (Fix Status) — Bắt buộc nhập lý do (FR-26 / Flow 4)
  const handleInitiateFixStatus = (unit) => {
    setFixStatusTargetUnit(unit);
    setFixStatusValue(unit.status === "RENTED" ? "PREPARING" : "AVAILABLE");
    setFixStatusReason("");
    setFixStatusError("");
  };

  const handleConfirmFixStatus = () => {
    if (!fixStatusTargetUnit) return;
    if (!fixStatusReason.trim() || fixStatusReason.trim().length < 5) {
      setFixStatusError("Lý do điều chỉnh là bắt buộc theo quy định kiểm toán (tối thiểu 5 ký tự).");
      return;
    }
    try {
      const updated = fixUnitStatus(
        fixStatusTargetUnit.id,
        fixStatusValue,
        fixStatusReason
      );
      setUnits(getFacilityUnits());
      if (selectedUnit && selectedUnit.id === updated.id) {
        setSelectedUnit(updated);
      }
      setFixStatusTargetUnit(null);
      showToast(`Đã điều chỉnh trạng thái kho ${updated.code} thành ${fixStatusValue}.`);
    } catch (err) {
      setFixStatusError(err.message);
    }
  };

  const handleClearFilters = () => {
    setSelectedZone("ALL");
    setSearchTerm("");
    searchParams.delete("status");
    setSearchParams(searchParams, { replace: true });
  };

  // Logs của kho đang chọn trong Drawer
  const unitLogs = useMemo(() => {
    if (!selectedUnit) return [];
    void units;
    return getUnitActivityLogs(selectedUnit.code);
  }, [selectedUnit, units]);

  return {
    units,
    activeStatusTab,
    searchTerm,
    setSearchTerm,
    selectedZone,
    setSelectedZone,
    selectedUnit,
    drawerTab,
    setDrawerTab,
    editPrice,
    setEditPrice,
    editNotes,
    setEditNotes,
    editSizeM2,
    setEditSizeM2,
    blockerModalData,
    setBlockerModalData,
    retireTargetUnit,
    setRetireTargetUnit,
    maintenanceTargetUnit,
    setMaintenanceTargetUnit,
    maintenanceReason,
    setMaintenanceReason,
    fixStatusTargetUnit,
    setFixStatusTargetUnit,
    fixStatusValue,
    setFixStatusValue,
    fixStatusReason,
    setFixStatusReason,
    fixStatusError,
    toastMessage,
    statusCounts,
    filteredUnits,
    unitLogs,
    handleSelectTab,
    handleOpenDrawer,
    handleCloseDrawer,
    handleSaveSpecs,
    handleInitiateRetire,
    handleConfirmRetire,
    handleInitiateMaintenance,
    handleConfirmMaintenance,
    handleFinishMaintenance,
    handleInitiateFixStatus,
    handleConfirmFixStatus,
    handleClearFilters,
  };
}
