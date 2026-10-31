import Modal from "../../../components/Modal/Modal.jsx";

export function RetireConfirmModal({ unit, onConfirm, onClose }) {
  if (!unit) return null;

  return (
    <Modal
      open={Boolean(unit)}
      title={`XÁC NHẬN NGỪNG KHAI THÁC KHO ${unit.code || ""}`}
      confirmLabel="Xác nhận ngừng khai thác"
      cancelLabel="Hủy bỏ"
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <div className="retire-confirm-body">
        <p>
          Bạn đang thực hiện đưa kho <strong>{unit.code}</strong> ({unit.typeName}) ra khỏi danh mục cho thuê.
        </p>
        <div className="retire-consequences">
          <strong>Hệ quả nghiệp vụ:</strong>
          <ul>
            <li>Kho sẽ được chuyển sang trạng thái <strong>Ngừng khai thác</strong>.</li>
            <li>Kho sẽ không còn hiển thị trên trang tìm kiếm (Browse Units) của khách hàng.</li>
            <li>Thao tác này được đóng dấu vào Nhật ký kiểm toán hệ thống (Activity Log).</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
