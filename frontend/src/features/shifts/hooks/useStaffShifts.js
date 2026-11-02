import { useState, useEffect, useMemo, useCallback } from "react";
import { matchSearch } from "../../../utils/formatters.js";
import {
  getWeekDays,
  getWeekRange,
  getStaffRoster,
  getShifts,
  createShiftAssignment,
  deleteShiftAssignment,
  UNIT_TYPES,
} from "../../../services/shiftService.js";

export const STANDARD_SHIFTS = [
  {
    key: "MORNING",
    name: "Ca sáng",
    hours: "07:00 – 15:00",
    color: "#4f46e5",
    bg: "#f5f7ff",
    border: "#c7d2fe",
  },
  {
    key: "AFTERNOON",
    name: "Ca tối",
    hours: "15:00 – 23:00",
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
];

export function useStaffShifts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [rawRoster, setRawRoster] = useState([]);

  // Điều hướng tuần
  const [weekOffset, setWeekOffset] = useState(0);

  // Bộ lọc tìm kiếm & loại kho
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");

  // Highlight nhân viên khi click vào Staff Workload Bar
  const [highlightedStaffId, setHighlightedStaffId] = useState(null);

  // Popover điền nhân viên vào ca
  const [activeFillPopover, setActiveFillPopover] = useState(null);

  // Trạng thái sao chép ca tuần
  const [copying, setCopying] = useState(false);

  // Toast thông báo
  const [toast, setToast] = useState(null);

  // Tính toán khoảng tuần hiện hành
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);
  const { startDate, endDate, weekLabel } = weekRange;

  // Tải danh sách nhân sự & ca trực theo tuần từ backend
  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStaffRoster({ startDate, endDate });
      setRawRoster(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load staff roster:", err);
      setError(err.message || "Không thể tải danh sách ca trực.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getStaffRoster({ startDate, endDate })
      .then((data) => {
        if (!ignore) {
          setRawRoster(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load staff roster:", err);
          setError(err.message || "Không thể tải danh sách ca trực.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [startDate, endDate]);

  // Danh sách nhân sự cơ sở
  const staffList = useMemo(() => {
    if (!rawRoster || rawRoster.length === 0) return [];
    return rawRoster.map((r) => ({
      id: r.staffId,
      fullName: r.fullName,
      code: r.code || `KC-${r.staffId}`,
    }));
  }, [rawRoster]);

  // Chuẩn hóa danh sách ca trực từ database (server baseline)
  const serverShifts = useMemo(() => {
    if (!rawRoster || rawRoster.length === 0) return [];
    const collected = [];
    for (const member of rawRoster) {
      for (const s of member.shifts || []) {
        collected.push({
          id: s.assignmentId,
          serverId: s.assignmentId,
          staffId: s.staffId || member.staffId,
          staffName: member.fullName,
          staffCode: member.code || `KC-${member.staffId}`,
          date: s.workDate,
          shiftWindow: s.shift,
          typeName: (s.unitTypeNames || []).join(", ") || "Kho",
          typeNames: s.unitTypeNames || [],
          unitTypeIds: s.unitTypeIds || [],
          isConflict: false,
        });
      }
    }
    return collected;
  }, [rawRoster]);

  // Bản nháp làm việc cục bộ (Local working draft)
  const [workingShifts, setWorkingShifts] = useState([]);

  // Đồng bộ workingShifts khi serverShifts thay đổi
  useEffect(() => {
    setWorkingShifts(serverShifts);
  }, [serverShifts]);

  // Tính toán diff giữa serverShifts và workingShifts để hỗ trợ Draft/Confirm Mode
  const { pendingDiff, pendingCount, hasPendingChanges } = useMemo(() => {
    // 1. Map serverShifts theo key: `${staffId}_${date}_${shiftWindow}`
    const serverMap = new Map();
    for (const s of serverShifts) {
      const key = `${s.staffId}_${s.date}_${s.shiftWindow}`;
      if (!serverMap.has(key)) {
        serverMap.set(key, {
          key,
          staffId: s.staffId,
          date: s.date,
          shiftWindow: s.shiftWindow,
          serverIds: s.id ? [s.id] : [],
          unitTypeIds: new Set(s.unitTypeIds || []),
        });
      } else {
        const item = serverMap.get(key);
        if (s.id && !item.serverIds.includes(s.id)) item.serverIds.push(s.id);
        for (const uid of s.unitTypeIds || []) item.unitTypeIds.add(uid);
      }
    }

    // 2. Map workingShifts theo key: `${staffId}_${date}_${shiftWindow}`
    const workingMap = new Map();
    for (const s of workingShifts) {
      const key = `${s.staffId}_${s.date}_${s.shiftWindow}`;
      if (!workingMap.has(key)) {
        workingMap.set(key, {
          key,
          staffId: s.staffId,
          staffName: s.staffName,
          staffCode: s.staffCode,
          date: s.date,
          shiftWindow: s.shiftWindow,
          unitTypeIds: new Set(s.unitTypeIds || []),
        });
      } else {
        const item = workingMap.get(key);
        for (const uid of s.unitTypeIds || []) item.unitTypeIds.add(uid);
      }
    }

    const toDelete = [];
    const toAdd = [];
    const toModify = [];

    // Kiểm tra ca bị xóa
    for (const [key, srv] of serverMap.entries()) {
      if (!workingMap.has(key)) {
        toDelete.push(srv);
      }
    }

    // Kiểm tra ca mới hoặc ca đã chỉnh sửa loại kho
    for (const [key, wrk] of workingMap.entries()) {
      if (!serverMap.has(key)) {
        toAdd.push(wrk);
      } else {
        const srv = serverMap.get(key);
        const srvSet = srv.unitTypeIds;
        const wrkSet = wrk.unitTypeIds;
        const isEqual =
          srvSet.size === wrkSet.size &&
          [...srvSet].every((id) => wrkSet.has(id));
        if (!isEqual) {
          toModify.push({
            serverIds: srv.serverIds,
            create: wrk,
          });
        }
      }
    }

    const totalDiff = toDelete.length + toAdd.length + toModify.length;
    return {
      pendingDiff: { toDelete, toAdd, toModify },
      pendingCount: totalDiff,
      hasPendingChanges: totalDiff > 0,
    };
  }, [serverShifts, workingShifts]);

  // Cấu trúc ma trận theo Ca làm việc (Shift-First Matrix)
  // Gom các thẻ nhân viên trong cùng 1 ô ca làm việc (1 nhân viên = 1 thẻ duy nhất)
  const shiftGrid = useMemo(() => {
    const grid = {
      MORNING: {},
      AFTERNOON: {},
    };

    for (const day of weekDays) {
      grid.MORNING[day.key] = [];
      grid.AFTERNOON[day.key] = [];
    }

    const addToSlot = (shiftWindow, shift) => {
      if (!grid[shiftWindow] || !grid[shiftWindow][shift.date]) return;
      const slotList = grid[shiftWindow][shift.date];
      const existing = slotList.find((item) => item.staffId === shift.staffId);

      if (existing) {
        // Gom các loại kho vào thẻ duy nhất của nhân viên trong ô
        for (const uid of shift.unitTypeIds || []) {
          if (!existing.unitTypeIds.includes(uid)) existing.unitTypeIds.push(uid);
        }
        for (const tn of shift.typeNames || []) {
          if (!existing.typeNames.includes(tn)) existing.typeNames.push(tn);
        }
        existing.typeName = existing.typeNames.join(", ");
        if (shift.isDraftNew) existing.isDraftNew = true;
        if (shift.isDraftModified) existing.isDraftModified = true;
        if (shift.id && !existing.allIds.includes(shift.id)) existing.allIds.push(shift.id);
      } else {
        slotList.push({
          ...shift,
          allIds: shift.id ? [shift.id] : [],
          unitTypeIds: [...(shift.unitTypeIds || [])],
          typeNames: [...(shift.typeNames || [])],
        });
      }
    };

    for (const shift of workingShifts) {
      // Áp dụng bộ lọc tìm kiếm
      if (searchTerm.trim()) {
        const q = searchTerm.trim();
        if (
          !matchSearch(shift.staffName, q) &&
          !matchSearch(shift.staffCode, q)
        ) {
          continue;
        }
      }

      // Áp dụng bộ lọc loại kho
      if (selectedTypeFilter !== "ALL") {
        const hasType = (shift.typeNames || []).some(
          (name) => name.toUpperCase() === selectedTypeFilter.toUpperCase()
        );
        if (!hasType) continue;
      }

      if (shift.shiftWindow === "MORNING" || shift.shiftWindow === "FULL_DAY") {
        addToSlot("MORNING", shift);
      }

      if (shift.shiftWindow === "AFTERNOON" || shift.shiftWindow === "FULL_DAY") {
        addToSlot("AFTERNOON", shift);
      }
    }

    return grid;
  }, [workingShifts, weekDays, searchTerm, selectedTypeFilter]);

  // Kiểm tra va chạm (Phân công): Phát hiện nhân viên trực 2 ca trùng nhau trong cùng 1 ngày
  const totalConflicts = useMemo(() => {
    let conflicts = 0;
    for (const day of weekDays) {
      const morningStaff = (shiftGrid.MORNING[day.key] || []).map((s) => s.staffId);
      const afternoonStaff = (shiftGrid.AFTERNOON[day.key] || []).map((s) => s.staffId);

      for (const staffId of morningStaff) {
        if (afternoonStaff.includes(staffId)) {
          conflicts++;
          const mItem = (shiftGrid.MORNING[day.key] || []).find((s) => s.staffId === staffId);
          const aItem = (shiftGrid.AFTERNOON[day.key] || []).find((s) => s.staffId === staffId);
          if (mItem) mItem.isConflict = true;
          if (aItem) aItem.isConflict = true;
        }
      }
    }
    return conflicts;
  }, [shiftGrid, weekDays]);

  // Thống kê nhân sự cho Staff Workload Bar dựa trên workingShifts
  const staffRoster = useMemo(() => {
    return staffList.map((member) => {
      const memberShifts = workingShifts.filter((s) => s.staffId === member.id);
      return {
        id: member.id,
        fullName: member.fullName,
        code: member.code,
        roleLabel: "Nhân viên vận hành",
        shiftCount: memberShifts.length,
        shifts: memberShifts,
      };
    });
  }, [staffList, workingShifts]);

  // Mở Quick Fill Popover
  const handleOpenFillPopover = (shiftKey, day, existingAssignment = null) => {
    const currentSlotStaffIds = (shiftGrid[shiftKey]?.[day.key] || []).map(
      (s) => s.staffId
    );

    setActiveFillPopover({
      shiftKey,
      shiftInfo:
        STANDARD_SHIFTS.find((s) => s.key === shiftKey) || STANDARD_SHIFTS[0],
      day,
      existingAssignment,
      currentSlotStaffIds,
    });
  };

  const handleCloseFillPopover = () => {
    setActiveFillPopover(null);
  };

  // Lưu phân công vào BẢN NHÁP cục bộ (không gửi ngay request về DB)
  const handleSaveFill = ({ staffId, unitTypeIds, shiftKey, workDate }) => {
    const staff = staffList.find((s) => s.id === Number(staffId));
    const staffName = staff ? staff.fullName : `Nhân viên #${staffId}`;
    const staffCode = staff ? staff.code : `KC-${staffId}`;

    const typeCodes = unitTypeIds.map(
      (id) => UNIT_TYPES.find((u) => u.id === id)?.code || "Kho"
    );

    setWorkingShifts((prev) => {
      // Loại bỏ bản ghi cũ của nhân viên này trong ca đó (nếu đang sửa)
      const remaining = prev.filter(
        (s) =>
          !(
            s.staffId === Number(staffId) &&
            s.date === workDate &&
            s.shiftWindow === shiftKey
          )
      );

      const newShift = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        staffId: Number(staffId),
        staffName,
        staffCode,
        date: workDate,
        shiftWindow: shiftKey,
        unitTypeIds,
        typeNames: typeCodes,
        typeName: typeCodes.join(", "),
        isDraftNew: true,
      };

      return [...remaining, newShift];
    });

    setActiveFillPopover(null);
    setToast({
      type: "info",
      message: `Đã cập nhật phân công cho ${staffName} (${typeCodes.join(", ")}). Bấm "Xác nhận lưu ca" để lưu.`,
    });
    setTimeout(() => setToast(null), 3500);
  };

  // Hủy ca trực trong BẢN NHÁP cục bộ (không gửi ngay request về DB)
  const handleRemoveShift = (target) => {
    setWorkingShifts((prev) => {
      if (typeof target === "object" && target.staffId) {
        return prev.filter(
          (s) =>
            !(
              s.staffId === target.staffId &&
              s.date === target.date &&
              s.shiftWindow === target.shiftWindow
            )
        );
      }
      return prev.filter((s) => s.id !== target);
    });

    if (activeFillPopover) {
      setActiveFillPopover(null);
    }

    setToast({
      type: "info",
      message: "Đã gỡ nhân viên khỏi ca trực trong bản nháp. Bấm \"Xác nhận lưu ca\" để lưu.",
    });
    setTimeout(() => setToast(null), 3500);
  };

  // XÁC NHẬN LƯU CA: Gửi các thay đổi về database theo batch
  const handleConfirmSave = async () => {
    if (!hasPendingChanges || saving) return;

    try {
      setSaving(true);
      const { toDelete, toAdd, toModify } = pendingDiff;

      // 1. Xóa các ca bị xóa hoặc ca cần cập nhật lại loại kho
      const idsToDelete = [
        ...toDelete.flatMap((d) => d.serverIds),
        ...toModify.flatMap((m) => m.serverIds),
      ];

      for (const id of idsToDelete) {
        await deleteShiftAssignment(id);
      }

      // 2. Tạo mới các ca phân công và các ca đã sửa
      const itemsToCreate = [
        ...toAdd,
        ...toModify.map((m) => m.create),
      ];

      for (const item of itemsToCreate) {
        await createShiftAssignment({
          staffId: item.staffId,
          unitTypeIds: Array.from(item.unitTypeIds),
          shifts: [item.shiftWindow],
          workDate: item.date,
        });
      }

      // 3. Tải lại danh sách từ backend
      await fetchRoster();

      setToast({
        type: "success",
        message: `Đã xác nhận và lưu thành công ${pendingCount} thay đổi vào cơ sở dữ liệu!`,
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error("Failed to save pending shift changes:", err);
      setToast({
        type: "error",
        message: err.message || "Không thể lưu thay đổi ca trực.",
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // HOÀN TÁC: Khôi phục lại bản làm việc gốc từ server
  const handleRevertChanges = () => {
    setWorkingShifts(serverShifts);
    setToast({
      type: "info",
      message: "Đã hủy các thay đổi chưa lưu và khôi phục lịch gốc.",
    });
    setTimeout(() => setToast(null), 3500);
  };

  // Sao chép ca từ tuần trước vào BẢN NHÁP cục bộ
  const handleCopyPreviousWeek = async () => {
    try {
      setCopying(true);
      const prevDays = getWeekDays(weekOffset - 1);
      const currentDays = getWeekDays(weekOffset);

      const prevShifts = await getShifts({
        startDate: prevDays[0].key,
        endDate: prevDays[6].key,
      });

      if (!Array.isArray(prevShifts) || prevShifts.length === 0) {
        setToast({
          type: "error",
          message: "Không tìm thấy ca trực nào ở tuần trước để sao chép.",
        });
        setTimeout(() => setToast(null), 4000);
        return;
      }

      let stagedCount = 0;
      const newShiftsToAdd = [];

      for (const prev of prevShifts) {
        const dayIndex = prevDays.findIndex((d) => d.key === prev.workDate);
        if (dayIndex === -1) continue;
        const targetDate = currentDays[dayIndex].key;
        const typeIds = prev.unitTypeIds || (prev.unitTypeId ? [prev.unitTypeId] : [1, 2]);

        const exists = workingShifts.some(
          (s) =>
            s.staffId === prev.staffId &&
            s.date === targetDate &&
            s.shiftWindow === prev.shift
        );

        if (!exists) {
          const staff = staffList.find((st) => st.id === prev.staffId);
          newShiftsToAdd.push({
            id: `draft-copy-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            staffId: prev.staffId,
            staffName: prev.staffName || staff?.fullName || "Nhân viên",
            staffCode: prev.staffCode || staff?.code || `KC-${prev.staffId}`,
            date: targetDate,
            shiftWindow: prev.shift,
            unitTypeIds: typeIds,
            typeNames: typeIds.map(
              (id) => UNIT_TYPES.find((u) => u.id === id)?.code || "Kho"
            ),
            typeName: typeIds
              .map((id) => UNIT_TYPES.find((u) => u.id === id)?.name || "Kho")
              .join(", "),
            isDraftNew: true,
          });
          stagedCount++;
        }
      }

      if (newShiftsToAdd.length > 0) {
        setWorkingShifts((prev) => [...prev, ...newShiftsToAdd]);
        setToast({
          type: "success",
          message: `Đã sao chép ${stagedCount} ca từ tuần trước vào bản nháp. Vui lòng bấm "Xác nhận lưu ca" để áp dụng.`,
        });
      } else {
        setToast({
          type: "info",
          message: "Tất cả các ca của tuần trước đã có trên lịch tuần này.",
        });
      }
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Không thể sao chép lịch từ tuần trước.",
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setCopying(false);
    }
  };

  // Điều hướng tuần kèm xác nhận nếu có thay đổi chưa lưu
  const checkPendingBeforeNavigate = (nextAction) => {
    if (hasPendingChanges) {
      const confirmLeave = window.confirm(
        `Bạn có ${pendingCount} thay đổi chưa lưu trên tuần này. Bạn có chắc muốn chuyển tuần mà không lưu không?`
      );
      if (!confirmLeave) return;
    }
    nextAction();
  };

  const handlePrevWeek = () => checkPendingBeforeNavigate(() => setWeekOffset((prev) => prev - 1));
  const handleNextWeek = () => checkPendingBeforeNavigate(() => setWeekOffset((prev) => prev + 1));
  const handleCurrentWeek = () => checkPendingBeforeNavigate(() => setWeekOffset(0));

  return {
    loading,
    saving,
    error,
    refreshRoster: fetchRoster,
    weekOffset,
    weekDays,
    weekLabel,
    handlePrevWeek,
    handleNextWeek,
    handleCurrentWeek,
    searchTerm,
    setSearchTerm,
    selectedTypeFilter,
    setSelectedTypeFilter,
    highlightedStaffId,
    setHighlightedStaffId,
    toast,
    setToast,
    staffRoster,
    staffList,
    allShifts: workingShifts,
    totalConflicts,
    shiftGrid,
    activeFillPopover,
    handleOpenFillPopover,
    handleCloseFillPopover,
    handleSaveFill,
    handleRemoveShift,
    handleCopyPreviousWeek,
    copying,
    hasPendingChanges,
    pendingCount,
    handleConfirmSave,
    handleRevertChanges,
  };
}
