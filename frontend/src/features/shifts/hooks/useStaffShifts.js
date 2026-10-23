import { useState, useMemo } from "react";
import {
  DAYS_OF_WEEK,
  ZONES,
  INITIAL_STAFF,
  detectShiftConflict,
  addShiftAssignment,
  removeShiftAssignment,
  getRosterWithShifts,
} from "../../../services/shiftService.js";

export function useStaffShifts() {
  // Trạng thái dữ liệu lịch trực
  const [dataVersion, setDataVersion] = useState(0);

  // Form phân công mới
  const [selectedStaffId, setSelectedStaffId] = useState(INITIAL_STAFF[0].id);
  const [selectedZone, setSelectedZone] = useState(ZONES[0].code);
  const [selectedWindow, setSelectedWindow] = useState("MORNING");
  const [selectedDate, setSelectedDate] = useState(DAYS_OF_WEEK[0].key);

  // Bộ lọc danh sách Roster
  const [searchTerm, setSearchTerm] = useState("");

  // Toast thông báo
  const [toast, setToast] = useState(null);

  // Lấy dữ liệu phân công đã đồng bộ
  const { staffRoster, totalConflicts } = useMemo(() => {
    void dataVersion;
    return getRosterWithShifts();
  }, [dataVersion]);

  // Kiểm tra xung đột thời gian thực trên form hiện tại
  const liveConflict = useMemo(() => {
    return detectShiftConflict({
      staffId: selectedStaffId,
      date: selectedDate,
      shiftWindow: selectedWindow,
    });
  }, [selectedStaffId, selectedDate, selectedWindow]);

  // Xử lý lưu phân công mới
  const handleSaveAssignment = (e) => {
    e.preventDefault();
    try {
      addShiftAssignment({
        staffId: selectedStaffId,
        date: selectedDate,
        shiftWindow: selectedWindow,
        zone: selectedZone,
      });

      setDataVersion((v) => v + 1);
      setToast({
        type: "success",
        message: "Đã lưu phân công ca trực thành công vào hệ thống!",
      });

      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Không thể lưu ca trực do xung đột!",
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Xử lý xóa/gỡ ca trực
  const handleRemoveShift = (shiftId) => {
    removeShiftAssignment(shiftId);
    setDataVersion((v) => v + 1);
    setToast({
      type: "info",
      message: "Đã hủy ca trực và cập nhật lại tiến độ rà soát xung đột.",
    });
    setTimeout(() => setToast(null), 4000);
  };

  // Lọc roster theo tìm kiếm
  const filteredRoster = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staffRoster;
    return staffRoster.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.roleLabel.toLowerCase().includes(q)
    );
  }, [staffRoster, searchTerm]);

  return {
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
    totalConflicts,
    liveConflict,
    filteredRoster,
    handleSaveAssignment,
    handleRemoveShift,
  };
}
