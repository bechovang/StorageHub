import { useState, useMemo } from "react";
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
  const [tickets, setTickets] = useState(() =>
    getTickets(isCustomer ? { customerId: user?.id } : {})
  );

  // Modal tạo ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unitCode, setUnitCode] = useState("S-3");
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

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      const created = createSupportTicket({
        customerId: user?.id || 1,
        customerName: user?.fullName || "Khách thuê",
        customerPhone: user?.phone || "0901234567",
        unitCode,
        incidentType,
        description,
      });
      setTickets(getTickets(isCustomer ? { customerId: user?.id } : {}));
      setShowCreateModal(false);
      setDescription("");
      showToast(`Đã gửi yêu cầu hỗ trợ mã ${created.code}. Nhân viên trực ca sẽ xử lý ngay.`);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    setResolveError("");
    try {
      resolveSupportTicket({
        ticketId: resolveTargetTicket.ticketId,
        resolutionNote,
        staffName: user?.fullName || "Trần Minh (Staff)",
      });
      setTickets(getTickets(isCustomer ? { customerId: user?.id } : {}));
      setResolveTargetTicket(null);
      setResolutionNote("");
      showToast(`Đã hoàn tất xử lý sự cố ${resolveTargetTicket.code}.`);
    } catch (err) {
      setResolveError(err.message);
    }
  };

  const handleEscalateSubmit = (e) => {
    e.preventDefault();
    setEscalateError("");
    try {
      escalateSupportTicket({
        ticketId: escalateTargetTicket.ticketId,
        escalationReason: escalateReason,
        staffName: user?.fullName || "Trần Minh (Staff)",
      });
      setTickets(getTickets(isCustomer ? { customerId: user?.id } : {}));
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
    filteredTickets,
    showCreateModal,
    setShowCreateModal,
    unitCode,
    setUnitCode,
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
