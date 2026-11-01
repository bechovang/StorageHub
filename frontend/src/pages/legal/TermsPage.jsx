import { useState, useEffect } from "react";
import LegalReaderLayout from "./LegalReaderLayout.jsx";
import {
  getTermsContent,
  saveTermsContent,
  resetTermsContent,
} from "../../services/legalContentService.js";

/**
 * TermsPage — Trang Điều khoản Dịch vụ Thuê kho Tự quản StorageHub (/terms & /term)
 */
export default function TermsPage() {
  const [docData, setDocData] = useState(() => getTermsContent());

  useEffect(() => {
    document.title = "Điều khoản Dịch vụ · StorageHub";
    window.scrollTo(0, 0);
  }, []);

  const handleSave = (updated, author) => {
    const saved = saveTermsContent(updated, author);
    setDocData(saved);
  };

  const handleReset = () => {
    const def = resetTermsContent();
    setDocData(def);
  };

  return (
    <LegalReaderLayout
      activeType="TERMS"
      docData={docData}
      onSaveContent={handleSave}
      onResetContent={handleReset}
    />
  );
}
