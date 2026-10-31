import { listMyReservations } from "../../../services/rentalService.js";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getTickets,
  createSupportTicket,
  resolveSupportTicket,
  escalateSupportTicket,
} from "../../../services/ticketService.js";

export function useSupportTickets() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const isStaffOrAdmin =
    user?.role === "STAFF" ||
    user?.role === "SYSTEM_ADMIN" ||
    user?.role === "FACILITY_MANAGER";

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState("");

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError("");
    try {
      const list = await getTickets(isCustomer ? { customerId: user?.id } : {});
      setTickets(list);
    } catch (err) {
      setTicketsError(err.message || "Không thể tải danh sách yêu cầu hỗ trợ.");
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, [isCustomer, user?.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Modal tạo ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Kho gặp sự cố: mặc định trống, khách CHỌN từ danh sách kho đang thuê (FR-23)
  // Danh sách kho khách đang thuê (CHECKED_IN / CHECKOUT_REQUESTED) cho select
  const [rentedUnits, setRentedUnits] = useState([]);
  useEffect(() => {
    if (!isCustomer) return;
    let ignore = false;
    listMyReservations({ group: "active", page: 1, pageSize: 50 })
      .then((data) => {
        if (ignore) return;
        const items = (data.items || []).filter((r) =>
          ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(r.status)
        );
        setRentedUnits(items);
        // Không có gì đang thuê thì không chọn sẵn gì cả
      })
      .catch(() => {
        // Lỗi tải danh sách: để select rỗng, BE vẫn chặn khi submit
      });
    return () => {
      ignore = true;
    };
  }, [isCustomer]);

  // Ticket đang xem chi tiết trong modal
  const [detailTicket, setDetailTicket] = useState(null);

  const [unitCode, setUnitCode] = useState("");
  const [incidentType, setIncidentType] = useState("DEVICE_ISSUE");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");

  // Modal xử lý (RESOLVE)
  const [resolveTargetTicket, setResolveTargetTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolveError, setResolveError] = useState("");

  // Modal chuyển tiếp (ESCALATE)
  const [escalateTargetTicket, setEscalateTargetTicket] = useState(null);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateError, setEscalateError] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (statusFilter !== "ALL") {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [statusFilter, tickets]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      const created = await createSupportTicket({
        customerId: user?.id,
        customerEmail: user?.email || null,
        customerName: user?.fullName || "Khách thuê",
        customerPhone: user?.phone || "",
        unitCode,
        incidentType,
        description,
      });
      await loadTickets();
      setShowCreateModal(false);
      setDescription("");
      showToast(`Đã gửi yêu cầu hỗ trợ mã ${created.code || ""}. Nhân viên trực ca sẽ xử lý ngay.`.trim());
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setResolveError("");
    try {
      await resolveSupportTicket({
        ticketId: resolveTargetTicket.ticketId,
        resolutionNote,
        staffName: user?.fullName || "",
        actorRole: user?.role || "STAFF",
      });
      await loadTickets();
      setResolveTargetTicket(null);
      setResolutionNote("");
      showToast(`Đã hoàn tất xử lý sự cố ${resolveTargetTicket.code}.`);
    } catch (err) {
      setResolveError(err.message);
    }
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    setEscalateError("");
    try {
      await escalateSupportTicket({
        ticketId: escalateTargetTicket.ticketId,
        escalationReason: escalateReason,
        staffName: user?.fullName || "",
      });
      await loadTickets();
      setEscalateTargetTicket(null);
      setEscalateReason("");
      showToast(`Đã chuyển tiếp sự cố ${escalateTargetTicket.code} lên Quản lý cơ sở.`);
    } catch (err) {
      setEscalateError(err.message);
    }
  };

  return {
    user,
    isCustomer,
    isStaffOrAdmin,
    statusFilter,
    setStatusFilter,
    tickets,
    ticketsLoading,
    ticketsError,
    reloadTickets: loadTickets,
    filteredTickets,
    showCreateModal,
    setShowCreateModal,
    unitCode,
    setUnitCode,
    rentedUnits,
    detailTicket,
    setDetailTicket,
    incidentType,
    setIncidentType,
    description,
    setDescription,
    createError,
    resolveTargetTicket,
    setResolveTargetTicket,
    resolutionNote,
    setResolutionNote,
    resolveError,
    setResolveError,
    escalateTargetTicket,
    setEscalateTargetTicket,
    escalateReason,
    setEscalateReason,
    escalateError,
    setEscalateError,
    toastMessage,
    showToast,
    handleCreateSubmit,
    handleResolveSubmit,
    handleEscalateSubmit,
  };
}
