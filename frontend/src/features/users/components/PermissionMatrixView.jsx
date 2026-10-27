import { useState, useEffect } from "react";
import { Check } from "@phosphor-icons/react";
import {
  ROLE_DEFINITIONS,
  PERMISSION_GROUPS,
  getPermissionMatrix,
} from "../../../services/userService.js";
import { getRoleLabel } from "../../../utils/statusLabels.js";

export function PermissionMatrixView({
  selectedMatrixRole,
  setSelectedMatrixRole,
}) {
  const [matrixGroups, setMatrixGroups] = useState(PERMISSION_GROUPS);

  useEffect(() => {
    let isMounted = true;
    getPermissionMatrix().then((res) => {
      if (isMounted && res && res.groups && res.groups.length > 0) {
        setMatrixGroups(res.groups);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <div className="matrix-view-container">
      {/* Header giải thích */}
      <div className="matrix-hero-card">
        <div className="matrix-hero-card__header">
          <div>
            <span className="matrix-hero-super">QUY CHUẨN THẨM QUYỀN VẬN HÀNH</span>
            <h2 className="matrix-hero-title">MA TRẬN PHÂN QUYỀN 5 VAI TRÒ</h2>
            <p className="matrix-hero-desc">
              Bảng đối chiếu thẩm quyền và giới hạn truy cập chức năng của từng nhóm người dùng tại StorageHub. Mọi phân quyền được kiểm soát chặt chẽ ở máy chủ (Server-side Enforced) nhằm bảo mật dữ liệu cơ sở.
            </p>
          </div>
          <div className="matrix-badge-readonly">CHẾ ĐỘ CHỈ ĐỌC (READ-ONLY)</div>
        </div>

        {/* 5 Thẻ vai trò giải thích Persona */}
        <div className="matrix-role-cards">
          {ROLE_DEFINITIONS.map((r) => {
            const isSelected = selectedMatrixRole === r.key;
            return (
              <div
                key={r.key}
                className={`matrix-role-card ${isSelected ? "matrix-role-card--selected" : ""}`}
                onClick={() => setSelectedMatrixRole(isSelected ? "ALL" : r.key)}
              >
                <div className="matrix-role-card__top">
                  <span className={`role-chip ${r.badgeClass}`}>{getRoleLabel(r.key)}</span>
                  <span className="matrix-role-persona">Mẫu: {r.persona}</span>
                </div>
                <h4 className="matrix-role-title">{r.title}</h4>
                <p className="matrix-role-desc">{r.description}</p>
                <div className="matrix-role-action">
                  {isSelected ? "Đang lọc xem riêng ✓" : "Nhấn để xem riêng →"}
                </div>
              </div>
            );
          })}
        </div>

        {selectedMatrixRole !== "ALL" && (
          <div className="matrix-filter-banner">
            <span>
              Đang làm nổi bật quyền hạn của:{" "}
              <strong>{ROLE_DEFINITIONS.find((r) => r.key === selectedMatrixRole)?.title}</strong>
            </span>
            <button
              type="button"
              className="btn-clear-matrix-filter"
              onClick={() => setSelectedMatrixRole("ALL")}
            >
              ✕ Xem lại tất cả vai trò
            </button>
          </div>
        )}
      </div>

      {/* Bảng phân quyền theo 4 nhóm nghiệp vụ */}
      <div className="matrix-groups-wrapper">
        {matrixGroups.map((group, gIdx) => (
          <div key={gIdx} className="matrix-group-section">
            <div className="matrix-group-header">
              <h3 className="matrix-group-title">{group.category}</h3>
              <p className="matrix-group-desc">{group.description}</p>
            </div>

            <div className="matrix-table-responsive">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: "36%" }}>Chức năng & Mô tả thẩm quyền</th>
                    <th className={selectedMatrixRole === "CUSTOMER" ? "th--highlight" : ""}>
                      Khách thuê<br /><span className="th-sub">(Customer)</span>
                    </th>
                    <th className={selectedMatrixRole === "STAFF" ? "th--highlight" : ""}>
                      Nhân viên kho<br /><span className="th-sub">(Staff)</span>
                    </th>
                    <th className={selectedMatrixRole === "FACILITY_MANAGER" ? "th--highlight" : ""}>
                      Quản lý cơ sở<br /><span className="th-sub">(Facility Mgr)</span>
                    </th>
                    <th className={selectedMatrixRole === "BUSINESS_OPS" ? "th--highlight" : ""}>
                      Kinh doanh<br /><span className="th-sub">(Business Ops)</span>
                    </th>
                    <th className={selectedMatrixRole === "SYSTEM_ADMIN" ? "th--highlight" : ""}>
                      Quản trị HT<br /><span className="th-sub">(Sys Admin)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.permissions.map((p) => (
                    <tr key={p.id}>
                      <td className="matrix-perm-info">
                        <div className="matrix-perm-name">{p.name}</div>
                        <div className="matrix-perm-desc">{p.desc}</div>
                      </td>

                      {/* Customer */}
                      <td className={`matrix-cell ${selectedMatrixRole === "CUSTOMER" ? "cell--highlight" : ""}`}>
                        {p.CUSTOMER ? (
                          <span className="perm-badge perm-badge--allow">
                            <Check size={14} weight="bold" /> Cho phép
                          </span>
                        ) : (
                          <span className="perm-badge perm-badge--deny">—</span>
                        )}
                      </td>

                      {/* Staff */}
                      <td className={`matrix-cell ${selectedMatrixRole === "STAFF" ? "cell--highlight" : ""}`}>
                        {p.STAFF ? (
                          <span className="perm-badge perm-badge--allow">
                            <Check size={14} weight="bold" /> Cho phép
                          </span>
                        ) : (
                          <span className="perm-badge perm-badge--deny">—</span>
                        )}
                      </td>

                      {/* Facility Manager */}
                      <td className={`matrix-cell ${selectedMatrixRole === "FACILITY_MANAGER" ? "cell--highlight" : ""}`}>
                        {p.FACILITY_MANAGER ? (
                          <span className="perm-badge perm-badge--allow">
                            <Check size={14} weight="bold" /> Cho phép
                          </span>
                        ) : (
                          <span className="perm-badge perm-badge--deny">—</span>
                        )}
                      </td>

                      {/* Business Ops */}
                      <td className={`matrix-cell ${selectedMatrixRole === "BUSINESS_OPS" ? "cell--highlight" : ""}`}>
                        {p.BUSINESS_OPS ? (
                          <span className="perm-badge perm-badge--allow">
                            <Check size={14} weight="bold" /> Cho phép
                          </span>
                        ) : (
                          <span className="perm-badge perm-badge--deny">—</span>
                        )}
                      </td>

                      {/* System Admin */}
                      <td className={`matrix-cell ${selectedMatrixRole === "SYSTEM_ADMIN" ? "cell--highlight" : ""}`}>
                        {p.SYSTEM_ADMIN ? (
                          <span className="perm-badge perm-badge--admin">
                            <Check size={14} weight="bold" /> Toàn quyền
                          </span>
                        ) : (
                          <span className="perm-badge perm-badge--deny">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
