import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WarningCircle,
  Clock,
  SignOut,
  Gavel,
  ArrowClockwise,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import {
  listCheckoutCases,
  listActiveRentals,
  decideCheckoutCase,
  forceCheckoutReservation,
  liquidateReservation,
} from "../../services/checkoutCaseService.js";
import { formatVND, formatDate } from "../../utils/formatters.js";
import "./CheckoutManagementPage.css";

const TABS = [
  { key: "LATE", label: "Trễ 1–3 ngày" },
  { key: "PENDING_MANAGER", label: "Quá 3 ngày" },
  { key: "EXTENDED", label: "Đang gia hạn" },
  { key: "ACTIVE", label: "Đơn đang thuê" },
  { key: "HISTORY", label: "Lịch sử" },
];

const STATUS_LABEL = {
  LATE: "Đang trễ",
  PENDING_MANAGER: "Chờ quyết định",
  EXTENDED: "Đã gia hạn",
  RESOLVED: "Đã tất toán",
  LIQUIDATED: "Đã thanh lý",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CheckoutManagementPage() {
  const [tab, setTab] = useState("PENDING_MANAGER");
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState([]);
  const [kpiCases, setKpiCases] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "ACTIVE") {
        setActiveRentals(await listActiveRentals({ query }));
        setKpiCases(await listCheckoutCases({ status: "ALL", query }));
      } else {
        const all = await listCheckoutCases({ status: "ALL", query });
        setKpiCases(all);
        if (tab === "HISTORY") {
          setCases(all.filter((c) => c.status === "RESOLVED" || c.status === "LIQUIDATED"));
        } else {
          setCases(all.filter((c) => c.status === tab));
        }
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const kpi = useMemo(() => {
    const source = kpiCases.length ? kpiCases : cases;
    const pending = source.filter((c) => c.status === "PENDING_MANAGER").length;
    const late = source.filter((c) => c.status === "LATE").length;
    const extended = source.filter((c) => c.status === "EXTENDED").length;
    return { pending, late, extended };
  }, [cases, kpiCases]);

  const openModal = (type, row) => {
    setError("");
    setForm({
      reason: "",
      extensionDays: 0,
      deadline: todayIso(),
      reasonType: type === "liquidate" || type === "liquidateReservation" ? "OVERDUE" : "VIOLATION",
    });
    setModal({ type, row });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
  };

  const submit = async () => {
    if (!modal) return;
    if (!form.reason || !form.reason.trim()) {
      setError("Vui lòng nhập lý do.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { type, row } = modal;
      if (type === "allow") {
        await decideCheckoutCase(row.caseId, { decision: "EXTEND", extensionDays: 0, reason: form.reason });
        setToast("Đã cho phép khách trả kho hôm nay.");
      } else if (type === "extend") {
        await decideCheckoutCase(row.caseId, {
          decision: "EXTEND",
          extensionDays: Number(form.extensionDays) || 0,
          reason: form.reason,
        });
        setToast(`Đã gia hạn thêm ${form.extensionDays} ngày.`);
      } else if (type === "liquidate") {
        await decideCheckoutCase(row.caseId, {
          decision: "LIQUIDATE",
          reason: form.reason,
        });
        setToast("Đã thanh lý hợp đồng.");
      } else if (type === "forceCheckout") {
        await forceCheckoutReservation(row.reservationId, {
          checkoutType: "VIOLATION",
          deadline: form.deadline,
          reason: form.reason,
        });
        setToast("Đã buộc khách trả kho.");
      } else if (type === "liquidateReservation") {
        await liquidateReservation(row.reservationId, {
          reasonType: form.reasonType,
          reason: form.reason,
        });
        setToast("Đã thanh lý hợp đồng.");
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message || "Không thể xử lý.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCaseActions = (row) => (
    <div className="cm-actions">
      {row.status !== "LIQUIDATED" && row.status !== "RESOLVED" && (
        <>
          <button type="button" className="cm-btn cm-btn--primary" onClick={() => openModal("allow", row)}>
            Cho phép trả kho
          </button>
          <button type="button" className="cm-btn" onClick={() => openModal("extend", row)}>
            Gia hạn
          </button>
          <button type="button" className="cm-btn cm-btn--danger" onClick={() => openModal("liquidate", row)}>
            Thanh lý
          </button>
        </>
      )}
    </div>
  );

  const modalConfig = useMemo(() => {
    if (!modal) return null;
    if (modal.type === "allow") {
      return { title: "Cho phép trả kho hôm nay", confirm: "Xác nhận" };
    }
    if (modal.type === "extend") {
      return { title: "Gia hạn thời gian trả kho", confirm: "Gia hạn" };
    }
    if (modal.type === "liquidate" || modal.type === "liquidateReservation") {
      return { title: "Thanh lý hợp đồng", confirm: "Thanh lý ngay" };
    }
    return { title: "Buộc trả kho", confirm: "Xác nhận" };
  }, [modal]);

  return (
    <AppShell>
      <div className="cm-page">
        <header className="cm-header">
          <div>
            <div className="cm-breadcrumb">Vận hành cơ sở / Trả kho &amp; Thanh lý</div>
            <h1 className="cm-title">Trả kho &amp; Thanh lý</h1>
            <p className="cm-subtitle">
              Theo dõi đơn trễ, duyệt gia hạn/thanh lý và xử lý vi phạm hợp đồng.
            </p>
          </div>
          <button type="button" className="cm-btn" onClick={load} disabled={loading}>
            <ArrowClockwise size={16} weight="bold" />
            <span>Làm mới</span>
          </button>
        </header>

        {toast && <div className="cm-toast">{toast}</div>}
        {error && (
          <div className="cm-error">
            <WarningCircle size={18} weight="fill" />
            <span>{error}</span>
          </div>
        )}

        <section className="cm-kpis">
          <div className="cm-kpi">
            <Clock size={20} weight="bold" />
            <div>
              <span>Trễ 1–3 ngày</span>
              <strong>{kpi.late}</strong>
            </div>
          </div>
          <div className="cm-kpi">
            <WarningCircle size={20} weight="fill" />
            <div>
              <span>Chờ quyết định</span>
              <strong>{kpi.pending}</strong>
            </div>
          </div>
          <div className="cm-kpi">
            <SignOut size={20} weight="bold" />
            <div>
              <span>Đang gia hạn</span>
              <strong>{kpi.extended}</strong>
            </div>
          </div>
        </section>

        <div className="cm-toolbar">
          <div className="cm-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`cm-tab ${tab === t.key ? "is-active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="cm-search">
            <MagnifyingGlass size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã đơn, khách, kho…"
            />
          </label>
        </div>

        {loading ? (
          <div className="cm-empty">Đang tải dữ liệu…</div>
        ) : tab === "ACTIVE" ? (
          <ActiveTable rows={activeRentals} onForce={(r) => openModal("forceCheckout", r)} onLiquidate={(r) => openModal("liquidateReservation", r)} />
        ) : (
          <CaseTable rows={cases} renderActions={renderCaseActions} />
        )}
      </div>

      <Modal
        isOpen={Boolean(modal)}
        title={modalConfig?.title || ""}
        onClose={closeModal}
        onConfirm={submit}
        confirmLabel={modalConfig?.confirm || "Xác nhận"}
        showFooter
      >
        {modal?.type === "extend" && (
          <div className="cm-field">
            <label>Số ngày gia hạn (0 = cho phép trả kho hôm nay)</label>
            <input
              type="number"
              min="0"
              max="30"
              value={form.extensionDays}
              onChange={(e) => setForm((f) => ({ ...f, extensionDays: e.target.value }))}
            />
            <small>Phạt trễ vẫn tiếp tục tính trong thời gian gia hạn.</small>
          </div>
        )}

        {modal?.type === "forceCheckout" && (
          <div className="cm-field">
            <label>Deadline trả kho (tối đa +3 ngày)</label>
            <input
              type="date"
              min={todayIso()}
              max={plusDaysIso(3)}
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>
        )}

        {(modal?.type === "liquidate" || modal?.type === "liquidateReservation") && (
          <>
            <div className="cm-field">
              <label>Loại lý do</label>
              <select
                value={form.reasonType}
                onChange={(e) => setForm((f) => ({ ...f, reasonType: e.target.value }))}
              >
                <option value="OVERDUE">Quá hạn</option>
                <option value="VIOLATION">Vi phạm hợp đồng</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div className="cm-warning">
              Hợp đồng sẽ đóng ngay, cọc không hoàn, kho bị khóa đến khi task CLEANING hoàn tất.
            </div>
          </>
        )}

        <div className="cm-field">
          <label>Lý do *</label>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Nhập lý do xử lý…"
          />
        </div>
        {submitting && <div className="cm-empty">Đang xử lý…</div>}
      </Modal>
    </AppShell>
  );
}

function CaseTable({ rows, renderActions }) {
  if (!rows.length) {
    return <div className="cm-empty">Không có đơn nào trong nhóm này.</div>;
  }
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Đơn</th>
            <th>Khách</th>
            <th>Kho</th>
            <th>Hạn trả</th>
            <th>Trễ</th>
            <th>Phí tạm tính</th>
            <th>Trạng thái</th>
            <th>Hạn gia hạn</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.caseId}>
              <td className="font-mono">{row.reservationCode}</td>
              <td>
                <div>{row.customerName}</div>
                <small>{row.customerPhone}</small>
              </td>
              <td>{row.unitCode}</td>
              <td>{row.endDate ? formatDate(row.endDate) : "—"}</td>
              <td>{row.daysLate} ngày</td>
              <td className="font-mono">{formatVND(row.lateFee || 0)}</td>
              <td>
                <span className={`cm-badge cm-badge--${(row.status || "").toLowerCase()}`}>
                  {STATUS_LABEL[row.status] || row.status}
                </span>
              </td>
              <td>{row.extendedUntil ? formatDate(row.extendedUntil) : "—"}</td>
              <td>{renderActions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActiveTable({ rows, onForce, onLiquidate }) {
  if (!rows.length) {
    return <div className="cm-empty">Không có đơn đang thuê.</div>;
  }
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Đơn</th>
            <th>Khách</th>
            <th>Kho</th>
            <th>Hạn trả</th>
            <th>Trễ</th>
            <th>Phí tạm tính</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.reservationId}>
              <td className="font-mono">{row.reservationCode}</td>
              <td>
                <div>{row.customerName}</div>
                <small>{row.customerPhone}</small>
              </td>
              <td>{row.unitCode}</td>
              <td>{row.endDate ? formatDate(row.endDate) : "—"}</td>
              <td>{row.daysLate} ngày</td>
              <td className="font-mono">{formatVND(row.lateFee || 0)}</td>
              <td>
                <span className={`cm-badge cm-badge--${(row.caseStatus || row.reservationStatus || "").toLowerCase()}`}>
                  {STATUS_LABEL[row.caseStatus] || row.reservationStatus}
                </span>
              </td>
              <td>
                <div className="cm-actions">
                  <button type="button" className="cm-btn" onClick={() => onForce(row)}>
                    Buộc checkout
                  </button>
                  <button type="button" className="cm-btn cm-btn--danger" onClick={() => onLiquidate(row)}>
                    Thanh lý
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
