import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  USER_ROLES,
} from "../../../services/userService.js";

export function useUserManagement() {
  const { user: currentSessionUser } = useAuth();

  const [activeTab, setActiveTab] = useState("USERS"); // "USERS" | "MATRIX"
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatrixRole, setSelectedMatrixRole] = useState("ALL");

  // Dropdown action menu đang mở
  const [openMenuId, setOpenMenuId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  // Dữ liệu users từ Backend API
  const [users, setUsers] = useState([]);

  const reloadUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getUsers()
      .then((data) => {
        if (!ignore) setUsers(data);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRole !== "ALL" && u.role !== selectedRole) return false;
      if (selectedStatus !== "ALL" && u.status !== Number(selectedStatus)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (u.fullName && u.fullName.toLowerCase().includes(term)) ||
          (u.email && u.email.toLowerCase().includes(term)) ||
          (u.phone && u.phone.includes(term))
        );
      }
      return true;
    });
  }, [selectedRole, selectedStatus, searchTerm, users]);

  // Modals state
  // 1. Tạo tài khoản mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createRole, setCreateRole] = useState("STAFF");
  const [createError, setCreateError] = useState("");
  const [createdSuccessData, setCreatedSuccessData] = useState(null);

  // 2. Đổi vai trò
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [targetRole, setTargetRole] = useState("CUSTOMER");
  const [roleReason, setRoleReason] = useState("");
  const [roleError, setRoleError] = useState("");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // 3. Đổi trạng thái (Khóa / Mở khóa)
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState(1);
  const [statusReason, setStatusReason] = useState("");
  const [statusError, setStatusError] = useState("");

  // 4. Reset Password
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetSuccessPass, setResetSuccessPass] = useState(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openCreateModal = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePhone("");
    setCreateRole("STAFF");
    setCreateError("");
    setCreatedSuccessData(null);
    setShowCreateModal(true);
  };

  const openRoleModal = (u) => {
    setOpenMenuId(null);
    setRoleModalUser(u);
    setTargetRole(u.role);
    setRoleReason("");
    setRoleError("");
  };

  const openStatusModal = (u, status) => {
    setOpenMenuId(null);
    setStatusModalUser(u);
    setTargetStatus(status);
    setStatusReason("");
    setStatusError("");
  };

  const openResetModal = (u) => {
    setOpenMenuId(null);
    setResetModalUser(u);
    setResetSuccessPass(null);
  };

  // Submit tạo tài khoản
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      const res = await createUser({
        fullName: createName,
        email: createEmail,
        phone: createPhone,
        role: createRole,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      await reloadUsers();
      setCreatedSuccessData(res);
      showToast(`Đã cấp tài khoản cho ${res.user.fullName} thành công.`);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  // Submit đổi vai trò (US-28 / FR-37) - Đấu nối Backend API
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleError("");
    setIsSubmittingRole(true);
    try {
      const targetId = roleModalUser?.id || roleModalUser?.userId;
      await updateUserRole({
        userId: targetId,
        newRole: targetRole,
        reason: roleReason,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      setSelectedRole("ALL");
      await reloadUsers();
      const updatedUserName = roleModalUser.fullName;
      setRoleModalUser(null);
      showToast(`Đã chuyển vai trò của ${updatedUserName} sang ${USER_ROLES[targetRole]?.label || targetRole}.`);
    } catch (err) {
      setRoleError(err.message || "Không thể cập nhật vai trò người dùng");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Submit đổi trạng thái
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusError("");
    try {
      const targetId = statusModalUser?.id || statusModalUser?.userId;
      const currentActorId = currentSessionUser?.id || currentSessionUser?.userId;
      await updateUserStatus({
        userId: targetId,
        newStatus: targetStatus,
        currentUserId: currentActorId,
        reason: statusReason,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      await reloadUsers();
      const updatedUserName = statusModalUser.fullName;
      setStatusModalUser(null);
      showToast(`Đã cập nhật trạng thái của ${updatedUserName}.`);
    } catch (err) {
      setStatusError(err.message);
    }
  };

  // Submit Reset Mật khẩu
  const handleConfirmReset = async () => {
    try {
      const targetId = resetModalUser?.id || resetModalUser?.userId;
      const res = await resetUserPassword({
        userId: targetId,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      setResetSuccessPass(res.tempPassword);
      await reloadUsers();
      showToast(`Đã cấp mật khẩu tạm mới cho ${resetModalUser.fullName}.`);
    } catch (err) {
      showToast(err.message || "Lỗi khi cấp lại mật khẩu");
    }
  };

  return {
    currentSessionUser,
    activeTab,
    setActiveTab,
    selectedRole,
    setSelectedRole,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,
    selectedMatrixRole,
    setSelectedMatrixRole,
    openMenuId,
    setOpenMenuId,
    dropdownRef,
    users,
    filteredUsers,
    showCreateModal,
    setShowCreateModal,
    createName,
    setCreateName,
    createEmail,
    setCreateEmail,
    createPhone,
    setCreatePhone,
    createRole,
    setCreateRole,
    createError,
    createdSuccessData,
    roleModalUser,
    setRoleModalUser,
    targetRole,
    setTargetRole,
    roleReason,
    setRoleReason,
    roleError,
    isSubmittingRole,
    statusModalUser,
    setStatusModalUser,
    targetStatus,
    setTargetStatus,
    statusReason,
    setStatusReason,
    statusError,
    resetModalUser,
    setResetModalUser,
    resetSuccessPass,
    toastMessage,
    copied,
    showToast,
    handleCopy,
    openCreateModal,
    openRoleModal,
    openStatusModal,
    openResetModal,
    handleCreateSubmit,
    handleRoleSubmit,
    handleStatusSubmit,
    handleConfirmReset,
  };
}
