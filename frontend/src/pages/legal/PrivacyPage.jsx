import { useState, useEffect } from "react";
import LegalReaderLayout from "./LegalReaderLayout.jsx";
import {
  getPrivacyContent,
  savePrivacyContent,
  resetPrivacyContent,
} from "../../services/legalContentService.js";

/**
 * PrivacyPage — Trang Chính sách Bảo mật & Quyền Riêng tư StorageHub (/privacy)
 */
export default function PrivacyPage() {
  const [docData, setDocData] = useState(() => getPrivacyContent());

  useEffect(() => {
    document.title = "Chính sách Bảo mật & Quyền Riêng tư · StorageHub";
    window.scrollTo(0, 0);
  }, []);

  const handleSave = (updated, author) => {
    const saved = savePrivacyContent(updated, author);
    setDocData(saved);
  };

  const handleReset = () => {
    const def = resetPrivacyContent();
    setDocData(def);
  };

  return (
    <LegalReaderLayout
      activeType="PRIVACY"
      docData={docData}
      onSaveContent={handleSave}
      onResetContent={handleReset}
    />
  );
}
