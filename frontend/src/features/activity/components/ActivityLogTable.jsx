import {
  MagnifyingGlass,
  Funnel,
  ArrowRight,
  Database,
} from "@phosphor-icons/react";
import {
  ENTITY_TYPES,
  ROLE_LABELS,
  ACTION_BADGES,
  STATUS_LABELS,
} from "../../../services/activityService.js";
import { formatAuditTimestamp } from "../../../utils/formatters.js";

export function ActivityLogTable({
  logs = [],
  selectedEntity,
  onSelectEntity,
  searchTerm,
  onSearchChange,
}) {
  return (
    <>
      {/* Toolbar: Search input & Entity filter tabs */}
      <div className="activity-toolbar">
        <div className="activity-toolbar__row">
          <div className="activity-search-box">
            <MagnifyingGlass size={16} className="activity-search-box__icon" />
            <input
              type="text"
              className="activity-search-box__input"
              placeholder="Lọc theo nhân sự, mã kho/hợp đồng, hành động hoặc lý do..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Tìm kiếm nhật ký"
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.78rem",
              color: "var(--color-secondary)",
            }}
          >
            <Funnel size={14} />
            <span>Lọc thực thể:</span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="activity-tabs">
          {Object.values(ENTITY_TYPES).map((entity) => {
            const isActive = selectedEntity === entity.key;
            return (
              <button
                key={entity.key}
                type="button"
                className={`activity-tab-btn ${
                  isActive ? "activity-tab-btn--active" : ""
                }`}
                onClick={() => onSelectEntity(entity.key)}
              >
                {entity.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="activity-table-wrapper">
        {logs.length === 0 ? (
          <div className="activity-empty">
            <Database size={40} className="activity-empty__icon" />
            <div className="activity-empty__title">Không có bản ghi nhật ký</div>
            <div className="activity-empty__desc">
              Không tìm thấy hoạt động nào phù hợp với bộ lọc hiện tại.
            </div>
          </div>
        ) : (
          <table className="activity-table">
            <thead>
              <tr>
                <th style={{ width: "135px" }}>Thời gian</th>
                <th style={{ width: "150px" }}>Người thực hiện</th>
                <th style={{ width: "175px" }}>Hạng mục kiểm toán</th>
                <th style={{ width: "115px" }}>Hành động</th>
                <th style={{ width: "185px" }}>Thay đổi trạng thái</th>
                <th>Lý do / Diễn giải</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actionInfo = ACTION_BADGES[log.action] || {
                  label: log.action,
                  class: "badge-action--status",
                };
                const entityInfo = ENTITY_TYPES[log.entityType];
                const roleLabel = ROLE_LABELS[log.actorRole] || log.actorRole;
                const fromLabel = STATUS_LABELS[log.fromValue] || log.fromValue;
                const toLabel = STATUS_LABELS[log.toValue] || log.toValue;

                return (
                  <tr key={log.id}>
                    {/* 1. Thời gian */}
                    <td className="td-time font-mono">
                      {formatAuditTimestamp(log.timestamp)}
                    </td>

                    {/* 2. Người thực hiện & Vai trò */}
                    <td className="td-actor">
                      <div className="actor-name">{log.actor}</div>
                      {roleLabel && (
                        <span
                          className={`actor-role-badge role-badge--${(
                            log.actorRole || ""
                          )
                            .toLowerCase()
                            .replace(/_/g, "-")}`}
                        >
                          {roleLabel}
                        </span>
                      )}
                    </td>

                    {/* 3. Hạng mục kiểm toán */}
                    <td className="td-item">
                      <div className="audit-item">
                        <span
                          className={`audit-item__tag ${
                            entityInfo?.badgeClass || ""
                          }`}
                        >
                          {entityInfo?.label || log.entityType}
                        </span>
                        <span className="audit-item__code font-mono">
                          {log.entityCode || log.entityId}
                        </span>
                      </div>
                    </td>

                    {/* 4. Hành động */}
                    <td className="td-action">
                      <span className={`action-badge ${actionInfo.class}`}>
                        {actionInfo.label}
                      </span>
                    </td>

                    {/* 5. Thay đổi trạng thái */}
                    <td className="td-transition">
                      {log.fromValue || log.toValue ? (
                        <div className="transition-flow">
                          <span className="transition-val">
                            {fromLabel || "Khởi tạo"}
                          </span>
                          <ArrowRight size={12} className="transition-arrow" />
                          <span className="transition-val transition-val--to">
                            {toLabel || "—"}
                          </span>
                        </div>
                      ) : (
                        <span className="td-empty-dash">—</span>
                      )}
                    </td>

                    {/* 6. Lý do / Diễn giải */}
                    <td className="td-reason">
                      {log.reason ? (
                        <span className="reason-text">{log.reason}</span>
                      ) : (
                        <span className="reason-empty">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
