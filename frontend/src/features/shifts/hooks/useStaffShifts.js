import { useState, useEffect, useMemo, useCallback } from "react";
import { matchSearch } from "../../../utils/formatters.js";
import {
  DAYS_OF_WEEK,
  ZONES,
  getStaffRoster,
  createShiftAssignment,
  deleteShiftAssignment,
  detectShiftConflict,
} from "../../../services/shiftService.js";

export function useStaffShifts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawRoster, setRawRoster] = useState([]);

  // Form phân công mới
  const [selectedStaffId, setSelectedStaffId] = useState([0].id);
  const [selectedZone, setSelectedZone] = useState(ZONES[0].code);
  const [selectedWindow, setSelectedWindow] = useState("MORNING");
  const [selectedDate, setSelectedDate] = useState(DAYS_OF_WEEK[0].key);

  // Bộ lọc danh sách Roster
  const [searchTerm, setSearchTerm] = useState("");

  // Toast thông báo
  const [toast, setToast] = useState(null);

  // Load staff roster from backend
  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStaffRoster({
        startDate: "2026-10-26",
        endDate: "2026-11-01",
      });
      setRawRoster(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load staff roster:", err);
      setError(err.message || "Không thể tải danh sách nhân sự trực ca.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getStaffRoster({
      startDate: "2026-10-26",
      endDate: "2026-11-01",
    })
      .then((data) => {
        if (!ignore) {
          setRawRoster(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load staff roster:", err);
          setError(err.message || "Không thể tải danh sách nhân sự trực ca.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Map raw backend roster to UI roster format
  const { staffRoster, allShifts, totalConflicts, staffList } = useMemo(() => {
    if (!rawRoster || rawRoster.length === 0) {
      return {
        staffRoster: [],
        allShifts: [],
        totalConflicts: 0,
        staffList: [],
      };
    }

    const collectedShifts = [];
    const roster = rawRoster.map((member) => {
      const shifts = (member.shifts || []).map((s) => {
        const item = {
          id: s.assignmentId,
          staffId: s.staffId || member.staffId,
          date: s.workDate,
          shiftWindow: s.shift,
          zone: s.zoneName || (s.zoneCode ? `Zone ${s.zoneCode}` : "Zone A"),
          zoneId: s.zoneId,
          isConflict: false,
        };
        collectedShifts.push(item);
        return item;
      });

      // Đánh dấu các ca trùng nhau
      const markedShifts = shifts.map((s) => {
        const hasOverlap = shifts.some(
          (other) =>
            other.id !== s.id &&
            other.date === s.date &&
            other.shiftWindow === s.shiftWindow
        );
        return { ...s, isConflict: hasOverlap };
      });

      const conflicts = markedShifts.filter((s) => s.isConflict);

      return {
        id: member.staffId,
        fullName: member.fullName,
        email: member.email,
        code: member.code || `KC-${member.staffId}`,
        roleLabel: member.roleLabel || "Nhân viên vận hành",
        rfid: `RFID #${member.code || member.staffId}`,
        station: "Station Desk Tân Bình",
        status: member.status || (markedShifts.length > 0 ? "ON_DUTY" : "OFF"),
        statusText:
          member.status === "ON_DUTY"
            ? "On duty"
            : member.status === "SCHEDULED"
            ? "Scheduled"
            : "Off duty",
        hasConflict: conflicts.length > 0 || member.conflictCount > 0,
        conflictCount: Math.max(conflicts.length, member.conflictCount || 0),
        shiftCount: markedShifts.length,
        shifts: markedShifts,
      };
    });

    const sList = roster.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      code: r.code,
    }));

    const conflictsTotal = roster.reduce((sum, r) => sum + r.conflictCount, 0);

    return {
      staffRoster: roster,
      allShifts: collectedShifts,
      totalConflicts: conflictsTotal,
      staffList: sList,
    };
  }, [rawRoster]);

  // Đảm bảo selectedStaffId luôn tồn tại trong staffList
  useEffect(() => {
    if (staffList && staffList.length > 0 && !staffList.some((s) => Number(s.id) === Number(selectedStaffId))) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [staffList, selectedStaffId]);

  // Kiểm tra xung đột thời gian thực trên form hiện tại
  const liveConflict = useMemo(() => {
    return detectShiftConflict({
      staffId: selectedStaffId,
      date: selectedDate,
      shiftWindow: selectedWindow,
      shifts: allShifts,
      staffList,
    });
  }, [selectedStaffId, selectedDate, selectedWindow, allShifts, staffList]);

  // Xử lý lưu phân công mới
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    try {
      const zoneObj = ZONES.find((z) => z.code === selectedZone) || ZONES[0];
      await createShiftAssignment({
        staffId: selectedStaffId,
        zoneId: zoneObj.id,
        shift: selectedWindow,
        workDate: selectedDate,
      });

      await fetchRoster();
      setToast({
        type: "success",
        message: "Đã lưu phân công ca trực thành công vào máy chủ!",
      });

      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Không thể lưu ca trực do xung đột!",
      });
      setTimeout(() => setToast(null), 6000);
    }
  };

  // Xử lý xóa/gỡ ca trực
  const handleRemoveShift = async (shiftId) => {
    try {
      await deleteShiftAssignment(shiftId);
      await fetchRoster();
      setToast({
        type: "info",
        message: "Đã hủy ca trực và cập nhật lại tiến độ rà soát xung đột.",
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Không thể hủy ca trực.",
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Lọc roster theo tìm kiếm
  const filteredRoster = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return staffRoster;
    return staffRoster.filter(
      (s) =>
        matchSearch(s.fullName, q) ||
        matchSearch(s.code, q) ||
        matchSearch(s.roleLabel, q) ||
        matchSearch(s.rfid, q)
    );
  }, [staffRoster, searchTerm]);

  return {
    loading,
    error,
    refreshRoster: fetchRoster,
    selectedStaffId,
    setSelectedStaffId,
    selectedZone,
    setSelectedZone,
    selectedWindow,
    setSelectedWindow,
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    toast,
    setToast,
    staffRoster,
    staffList,
    totalConflicts,
    liveConflict,
    filteredRoster,
    allShifts,
    handleSaveAssignment,
    handleRemoveShift,
  };
}
