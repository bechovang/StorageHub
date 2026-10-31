import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getTickets,
  createSupportTicket,
  resolveSupportTicket,
  escalateSupportTicket,
} from "../../../services/ticketService.js";
import { listMyReservations } from "../../../services/rentalService.js";

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

  // Modal tạo ticket & Danh sách kho đang thuê
  const [rentedUnits, setRentedUnits] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unitCode, setUnitCode] = useState("");
  const [incidentType, setIncidentType] = useState("DEVICE_ISSUE");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    let isMounted = true;
    listMyReservations({ group: "active" })
      .then((res) => {
        if (!isMounted) return;
        const activeList = res?.items || [];
        const unitsMap = new Map();
        activeList.forEach((r) => {
          const code = r.unit?.code || r.unitCode;
          if (code && !unitsMap.has(code)) {
            unitsMap.set(code, {
              code,
              typeName: r.unit?.typeName || r.unit?.type || "Kho tiêu chuẩn",
              sizeM2: r.unit?.sizeM2 || 5,
              facilityName: r.unit?.facilityName || "Cơ sở Tân Bình",
            });
          }
        });
        const list = Array.from(unitsMap.values());
        setRentedUnits(list);
        if (list.length > 0) {
          setUnitCode(list[0].code);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setRentedUnits([]);
        setUnitCode("");
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    rentedUnits,
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
