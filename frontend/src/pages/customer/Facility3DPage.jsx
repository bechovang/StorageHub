import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { getFacilityLayout } from "../../services/facilityService.js";
import "./Facility3DPage.css";

const TYPE_COLORS = {
  "Kho cấp đông": 0x2563eb,
  "Kho lạnh": 0x06b6d4,
  "Kho hút ẩm": 0xf59e0b,
  "Kho tiệt trùng": 0x8b5cf6,
};

const STATUS_LABEL = {
  AVAILABLE: "Còn trống",
  RENTED: "Đang thuê",
  PREPARING: "Đang dọn",
  MAINTENANCE: "Bảo trì",
  RESERVED: "Đã giữ chỗ",
  RETIRED: "Ngừng dùng",
};

export default function Facility3DPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [floor, setFloor] = useState(null);
  const [error, setError] = useState("");
  const [hover, setHover] = useState(null);
  const hoverRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getFacilityLayout(facilityId)
      .then((data) => {
        if (!alive) return;
        setLayout(data);
        setFloor(data?.floors?.[0]?.floor ?? null);
      })
      .catch((err) => alive && setError(err.message || "Không thể tải sơ đồ."));
    return () => { alive = false; };
  }, [facilityId]);

  useEffect(() => {
    if (!layout || floor == null || !mountRef.current) return undefined;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7fb);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 12, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2.1;

    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(6, 18, 8);
    scene.add(sun);

    const floorData = layout.floors?.find((f) => f.floor === floor);
    const zones = floorData?.zones || [];

    // Nền sàn
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(17.2, 0.18, 8.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
    );
    slab.position.set(0, -0.12, 0);
    scene.add(slab);

    const boxes = [];
    zones.forEach((zone, zoneIndex) => {
      zone.units.forEach((unit) => {
        const row = Number(unit.row) || 1;
        const col = Number(unit.col) || 1;
        const x = (zoneIndex === 0 ? -4.2 : 4.2) + (col - 3) * 1.45;
        const z = (row - 3) * 1.35;
        const color = TYPE_COLORS[unit.typeName] || 0x64748b;
        const accent = unit.status === "AVAILABLE" ? 0x16a34a
          : unit.status === "RENTED" ? 0xdc2626
          : unit.status === "PREPARING" ? 0xf59e0b : 0x64748b;
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1.08, 1.35, 0.98),
          new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08 })
        );
        box.position.set(x, 0.7, z);
        box.userData = unit;
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(box.geometry),
          new THREE.LineBasicMaterial({ color: accent })
        );
        box.add(edge);
        scene.add(box);
        boxes.push(box);
      });
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(boxes, false)[0];
      const next = hit ? { ...hit.object.userData, x: event.clientX, y: event.clientY } : null;
      hoverRef.current = next;
      setHover(next);
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    };
    const onClick = () => {
      if (hoverRef.current?.id) navigate(`/units/${hoverRef.current.id}`);
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("click", onClick);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [layout, floor, navigate]);

  const floors = layout?.floors || [];
  const zones = floors.find((f) => f.floor === floor)?.zones || [];

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

        <div className="facility-3d-toolbar">
          <div className="facility-3d-floors">
            {floors.map((f) => (
              <button
                key={f.floor}
                type="button"
                className={f.floor === floor ? "is-active" : ""}
                onClick={() => setFloor(f.floor)}
              >
                Tầng {f.floor}
              </button>
            ))}
          </div>
          <div className="facility-3d-legend">
            {Object.entries(TYPE_COLORS).map(([name, color]) => (
              <span key={name}><i style={{ background: `#${color.toString(16).padStart(6, "0")}` }} />{name}</span>
            ))}
          </div>
        </div>

        <div className="facility-3d-stage">
          <div ref={mountRef} className="facility-3d-canvas" />
          <div className="facility-3d-hint">Kéo để xoay · lăn chuột để zoom · click kho để mở chi tiết</div>
          {hover && (
            <div className="facility-3d-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
              <strong>{hover.code}</strong>
              <span>{hover.typeName} · {hover.sizeM2} m²</span>
              <span>{STATUS_LABEL[hover.status] || hover.status}</span>
            </div>
          )}
        </div>

        <div className="facility-3d-zones">
          {zones.map((zone) => (
            <div key={zone.code} className="facility-3d-zone-card">
              <span>KHU {zone.code}</span>
              <strong>{zone.typeName}</strong>
              <small>{zone.units.length} kho</small>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
