import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Facility3DViewer from "../../components/Facility3DViewer/Facility3DViewer.jsx";
import { getFacilities, getFacilityLayout } from "../../services/facilityService.js";
import "./Facility3DPage.css";

export default function Facility3DPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getFacilities()
      .then((data) => {
        if (alive && Array.isArray(data)) setFacilities(data);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    getFacilityLayout(facilityId)
      .then((data) => alive && setLayout(data))
      .catch((err) => alive && setError(err.message || "Không thể tải sơ đồ cơ sở."));
    return () => { alive = false; };
  }, [facilityId]);

  return (
    <AppShell showFooter={false}>
      <main className="facility-3d-page">
        <div className="facility-3d-head">
          <div>
            <p className="facility-3d-kicker">SƠ ĐỒ 3D CƠ SỞ · 2 TẦNG</p>
            <h1>{layout?.facilityName || "Đang tải cơ sở..."}</h1>
            <p className="facility-3d-address">{layout?.address}</p>
          </div>
          <div className="facility-3d-actions">
            <button type="button" className="facility-3d-back" onClick={() => navigate("/browse")}>
              ← Về danh mục kho
            </button>
          </div>
        </div>

        {/* Facility Switcher Bar */}
        {facilities.length > 0 && (
          <div className="facility-3d-switcher-bar">
            <span className="facility-3d-switcher__label">CHỌN CƠ SỞ:</span>
            <div className="facility-3d-switcher__tabs">
              {facilities.map((fac) => {
                const facId = fac.facilityId || fac.id;
                const isActive = String(facId) === String(facilityId);
                return (
                  <button
                    key={facId}
                    type="button"
                    className={`facility-3d-switcher__tab ${isActive ? "is-active" : ""}`}
                    onClick={() => navigate(`/facilities/${facId}/3d`)}
                  >
                    {fac.name?.replace("StorageHub ", "") || `Cơ sở ${facId}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="facility-3d-error">{error}</p>}
        {layout && (
          <Facility3DViewer
            layout={layout}
            height={640}
            onSelectUnit={(id) => navigate(`/units/${id}`)}
          />
        )}
      </main>
    </AppShell>
  );
}
