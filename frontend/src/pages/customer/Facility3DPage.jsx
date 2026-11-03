import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Facility3DViewer from "../../components/Facility3DViewer/Facility3DViewer.jsx";
import { getFacilityLayout } from "../../services/facilityService.js";
import "./Facility3DPage.css";

export default function Facility3DPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getFacilityLayout(facilityId)
      .then((data) => alive && setLayout(data))
      .catch((err) => alive && setError(err.message || "Không thể tải sơ đồ."));
    return () => { alive = false; };
  }, [facilityId]);

  return (
    <AppShell showFooter={false}>
      <main className="facility-3d-page">
        <div className="facility-3d-head">
          <div>
            <p className="facility-3d-kicker">SƠ ĐỒ 3D CƠ SỞ</p>
            <h1>{layout?.facilityName || "Đang tải cơ sở..."}</h1>
            <p>{layout?.address}</p>
          </div>
          <button type="button" className="facility-3d-back" onClick={() => navigate("/browse")}>
            ← Về danh mục kho
          </button>
        </div>

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
