import { useState, useEffect } from "react";
import LegalReaderLayout from "./LegalReaderLayout.jsx";
import { getPrivacyContent } from "../../services/legalContentService.js";

/**
 * PrivacyPage — Trang Chính sách Bảo mật & Quyền Riêng tư StorageHub (/privacy)
 * Giao diện đọc công khai (Read-only) cho khách hàng
 */
export default function PrivacyPage() {
  const [docData, setDocData] = useState(() => getPrivacyContent());

  useEffect(() => {
    document.title = "Chính sách Bảo mật & Quyền Riêng tư · StorageHub";
    window.scrollTo(0, 0);
    setDocData(getPrivacyContent());
  }, []);

  return <LegalReaderLayout activeType="PRIVACY" docData={docData} />;
}
