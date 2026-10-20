import { Clock, ArrowRight, ArrowsClockwise } from "@phosphor-icons/react";

export default function TurnoverQueueTable({
  turnoverQueue,
  onNavigateTasks,
}) {
  return (
    <section className="turnover-section">
      <div className="turnover-section__head">
        <div className="turnover-section__title-group">
          <h2 className="turnover-section__title">Lịch bàn giao & vệ sinh kho hôm nay</h2>
          <span className="badge badge--info">{turnoverQueue.length} ca chuyển trạng thái</span>
        </div>
        <div className="turnover-section__refresh">
          <ArrowsClockwise size={15} />
          <span>Tự động cập nhật mỗi ca trực</span>
        </div>
      </div>

      <div className="turnover-table-wrap">
        <table className="turnover-table">
          <thead>
            <tr>
              <th>MÃ KHO</th>
              <th>CHUYỂN ĐỔI TRẠNG THÁI</th>
              <th>NHIỆM VỤ & REF</th>
              <th>NHÂN VIÊN PHỤ TRÁCH</th>
              <th>HẠN CHÓT (ICT)</th>
              <th className="text-right">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {turnoverQueue.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="unit-cell">
                    <span className="unit-code-box">{item.unitCode}</span>
                    <span className="unit-spec-sub">{item.spec}</span>
                  </div>
                </td>
                <td>
                  <div className="transition-cell">
                    <span className="status-chip status-chip--rented">{item.fromStatus}</span>
                    <ArrowRight size={14} className="text-muted" />
                    <span className="status-chip status-chip--preparing">{item.toStatus}</span>
                  </div>
                </td>
                <td>
                  <div className="task-cell">
                    <strong className="task-name">{item.taskName}</strong>
                    <span className="task-ref font-mono">{item.refCode}</span>
                  </div>
                </td>
                <td>
                  <div className="staff-cell">
                    <span className="avatar-mini">M</span>
                    <span>{item.staffName}</span>
                  </div>
                </td>
                <td>
                  <div className="due-cell font-mono">
                    <Clock size={14} className="text-muted" />
                    <span>{item.dueTime}</span>
                  </div>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={onNavigateTasks}
                  >
                    <span>Xem Task Board</span>
                    <ArrowRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
