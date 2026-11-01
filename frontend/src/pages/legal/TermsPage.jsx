import { useState, useEffect } from "react";
import LegalReaderLayout from "./LegalReaderLayout.jsx";
import { getTermsContent } from "../../services/legalContentService.js";

/**
 * TermsPage — Trang Điều khoản Dịch vụ Thuê kho Tự quản StorageHub (/terms & /term)
 * Giao diện đọc công khai (Read-only) cho khách hàng
 */
export default function TermsPage() {
  const [docData, setDocData] = useState(() => getTermsContent());

  useEffect(() => {
    document.title = "Điều khoản Dịch vụ · StorageHub";
    window.scrollTo(0, 0);
    setDocData(getTermsContent());
  }, []);

  return <LegalReaderLayout activeType="TERMS" docData={docData} />;
}
