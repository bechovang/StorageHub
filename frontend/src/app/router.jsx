import { Routes, Route } from "react-router-dom";
import DesignSystemPage from "../pages/DesignSystemPage/DesignSystemPage.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/demo" element={<DesignSystemPage />} />
    </Routes>
  );
}