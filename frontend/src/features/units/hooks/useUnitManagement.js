import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { matchSearch } from "../../../utils/formatters.js";
import { getUnitStatusLabel } from "../../../utils/statusLabels.js";
import {
  fetchFacilityUnits,
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

  // Dữ liệu Units từ API (GET /api/v1/units/admin)
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitsError, setUnitsError] = useState("");

  const loadUnits = useCallback(async (signalIgnore) => {
    setUnitsLoading(true);
    setUnitsError("");
    try {
      const list = await fetchFacilityUnits();
      if (!signalIgnore) setUnits(list);
    } catch (err) {
      if (!signalIgnore) setUnitsError(err.message || "Không thể tải danh mục kho.");
    } finally {
      if (!signalIgnore) setUnitsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loadUnits(ignore);
    return () => {
      ignore = true;
    };
  }, [loadUnits]);

  // Sau mỗi thao tác ghi (PATCH/POST/DELETE) -> tải lại danh sách từ API
  const refreshUnits = async () => {
    try {
      const list = await fetchFacilityUnits();
      setUnits(list);
      return list;
    } catch (err) {
      setUnitsError(err.message || "Không thể tải lại danh mục kho.");
      return [];
    }
  };

  // Bộ lọc trạng thái lấy trực tiếp từ searchParams (Single Source of Truth)
  const activeStatusTab = searchParams.get("status") || "ALL";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");

  // Drawer chi tiết / chỉnh sửa
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [drawerTab, setDrawerTab] = useState("SPECS"); // "SPECS" | "LOGS"

  // Form edit specs trong drawer (đã bỏ giá thuê — giá thuộc Policy page)
  const [editNotes, setEditNotes] = useState("");
  const [editSizeM2, setEditSizeM2] = useState("");
  const [editFloor, setEditFloor] = useState("");

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

  // Danh sách khu vực duy nhất (từ dữ liệu thật thay vì hardcode)
  const zoneOptions = useMemo(() => {
    const set = new Set();
    units.forEach((u) => {
      if (u.zone) set.add(u.zone);
    });
    return [...set].sort();
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
        (u) => matchSearch(u.code, q) || matchSearch(u.typeName, q) || matchSearch(u.zone, q)
      );
    }
    return result;
  }, [units, activeStatusTab, selectedZone, searchTerm]);

  // Đồng bộ selectedUnit với dữ liệu mới nhất sau refresh
  const syncSelectedUnit = (updatedList, unitId) => {
    if (!unitId) return;
    const fresh = updatedList.find((u) => Number(u.id) === Number(unitId));
    if (fresh) setSelectedUnit(fresh);
  };

  // Mở Drawer chi tiết kho
  const handleOpenDrawer = (unit) => {
    setSelectedUnit(unit);
    setDrawerTab("SPECS");
    setEditNotes(unit.notes || "");
    setEditSizeM2(String(unit.sizeM2));
    setEditFloor(String(unit.floor ?? 1));
  };

  const handleCloseDrawer = () => {
    setSelectedUnit(null);
  };

  // Lưu thông số kho (PATCH /api/v1/units/{id} — không còn giá thuê)
  const handleSaveSpecs = async (e) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      await updateUnitSpecs(selectedUnit.id, {
        notes: editNotes,
        sizeM2: editSizeM2,
        floor: editFloor,
      });
      const list = await refreshUnits();
      syncSelectedUnit(list, selectedUnit.id);
      showToast(`Đã lưu thông số kho ${selectedUnit.code} thành công.`);
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

  const handleConfirmRetire = async () => {
    if (!retireTargetUnit) return;
    try {
      await retireUnit(retireTargetUnit.id, "Ngừng khai thác kho, tạm rút khỏi danh mục cho thuê");
      const list = await refreshUnits();
      syncSelectedUnit(list, retireTargetUnit.id);
      showToast(`Kho ${retireTargetUnit.code} đã được chuyển sang trạng thái Ngừng khai thác.`);
      setRetireTargetUnit(null);
    } catch (err) {
      // Backend từ chối (kho RENTED / có đơn giữ chỗ) — surface message
      setRetireTargetUnit(null);
      setBlockerModalData({
        unit: retireTargetUnit,
        blocker: {
          title: "Không thể ngừng khai thác kho",
          message: err.message,
          actionAdvice: "Vui lòng kiểm tra lại trạng thái hợp đồng / đơn giữ chỗ của kho này.",
        },
      });
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

  const handleConfirmMaintenance = async () => {
    if (!maintenanceTargetUnit) return;
    try {
      await setUnitMaintenance(maintenanceTargetUnit.id, maintenanceReason);
      const list = await refreshUnits();
      syncSelectedUnit(list, maintenanceTargetUnit.id);
      showToast(`Kho ${maintenanceTargetUnit.code} đã được chuyển vào bảo trì.`);
      setMaintenanceTargetUnit(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Hoàn tất bảo trì -> Mở kho cho thuê lại (AVAILABLE)
  const handleFinishMaintenance = async (unit) => {
    try {
      await finishUnitMaintenance(unit.id);
      const list = await refreshUnits();
      syncSelectedUnit(list, unit.id);
      showToast(`Bảo trì hoàn tất. Kho ${unit.code} đã sẵn sàng cho thuê trở lại.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. Sửa trạng thái trực tiếp (Fix Status) — Bắt buộc nhập lý do (FR-26 / Flow 4)
  const handleInitiateFixStatus = (unit) => {
    setFixStatusTargetUnit(unit);
    setFixStatusValue("AVAILABLE");
    setFixStatusReason("");
    setFixStatusError("");
  };

  const handleConfirmFixStatus = async () => {
    if (!fixStatusTargetUnit) return;
    if (!fixStatusReason.trim() || fixStatusReason.trim().length < 5) {
      setFixStatusError("Lý do điều chỉnh là bắt buộc theo quy định kiểm toán (tối thiểu 5 ký tự).");
      return;
    }
    try {
      await fixUnitStatus(fixStatusTargetUnit.id, fixStatusValue, fixStatusReason);
      const list = await refreshUnits();
      syncSelectedUnit(list, fixStatusTargetUnit.id);
      showToast(`Đã điều chỉnh trạng thái kho ${fixStatusTargetUnit.code} thành "${getUnitStatusLabel(fixStatusValue)}".`);
      setFixStatusTargetUnit(null);
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
    unitsLoading,
    unitsError,
    zoneOptions,
    activeStatusTab,
    searchTerm,
    setSearchTerm,
    selectedZone,
    setSelectedZone,
    selectedUnit,
    drawerTab,
    setDrawerTab,
    editNotes,
    setEditNotes,
    editSizeM2,
    setEditSizeM2,
    editFloor,
    setEditFloor,
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
