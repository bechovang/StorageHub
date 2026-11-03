import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./Facility3DViewer.css";

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

/**
 * Sơ đồ 3D dùng chung: trang cơ sở và trang chi tiết kho.
 * selectedUnitId sẽ làm kho đó sáng lên, các kho còn lại mờ đi.
 */
export default function Facility3DViewer({
  layout,
  selectedUnitId = null,
  initialFloor = null,
  onSelectUnit = null,
  height = 460,
  showFloorControls = true,
  hint = "Kéo để xoay · lăn chuột để zoom · click kho để mở chi tiết",
}) {
  const mountRef = useRef(null);
  const hoverRef = useRef(null);
  const [floor, setFloor] = useState(initialFloor);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (initialFloor != null) setFloor(initialFloor);
  }, [initialFloor]);

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
    controls.maxPolarAngle = Math.PI / 2.1;

    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(6, 18, 8);
    scene.add(sun);

    const floorData = layout.floors?.find((f) => f.floor === floor);
    const zones = floorData?.zones || [];

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(17.2, 0.18, 8.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
    );
    slab.position.set(0, -0.12, 0);
    scene.add(slab);

    const boxes = [];
    let selectedBox = null;
    let selectedMaterial = null;
    let selectedRing = null;

    zones.forEach((zone, zoneIndex) => {
      zone.units.forEach((unit) => {
        const row = Number(unit.row) || 1;
        const col = Number(unit.col) || 1;
        const x = (zoneIndex === 0 ? -4.2 : 4.2) + (col - 3) * 1.45;
        const z = (row - 3) * 1.35;
        const color = TYPE_COLORS[unit.typeName] || 0x64748b;
        const isSelected = selectedUnitId != null && String(unit.id) === String(selectedUnitId);
        const accent = isSelected ? 0xf59e0b
          : unit.status === "AVAILABLE" ? 0x16a34a
          : unit.status === "RENTED" ? 0xdc2626
          : unit.status === "PREPARING" ? 0xf59e0b : 0x64748b;

        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.55,
          metalness: 0.08,
          transparent: Boolean(selectedUnitId && !isSelected),
          opacity: selectedUnitId && !isSelected ? 0.28 : 1,
          emissive: isSelected ? 0xf59e0b : 0x000000,
          emissiveIntensity: isSelected ? 0.55 : 0,
        });
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.35, 0.98), material);
        box.position.set(x, 0.7, z);
        if (isSelected) box.scale.set(1.14, 1.14, 1.14);
        box.userData = unit;

        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(box.geometry),
          new THREE.LineBasicMaterial({
            color: accent,
            transparent: !isSelected && Boolean(selectedUnitId),
            opacity: !isSelected && selectedUnitId ? 0.35 : 1,
          })
        );
        box.add(edge);
        scene.add(box);
        boxes.push(box);

        if (isSelected) {
          selectedBox = box;
          selectedMaterial = material;
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.72, 0.9, 32),
            new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(x, 0.04, z);
          scene.add(ring);
          selectedRing = ring;
        }
      });
    });

    // Camera focus vào kho được chọn để người dùng thấy ngay.
    if (selectedBox) {
      controls.target.copy(selectedBox.position);
      camera.position.set(selectedBox.position.x + 5.5, 7.5, selectedBox.position.z + 6.5);
    }

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
      const id = hoverRef.current?.id;
      if (id && onSelectUnit && String(id) !== String(selectedUnitId)) onSelectUnit(id);
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("click", onClick);

    const resize = () => {
      const width = mount.clientWidth;
      const heightPx = mount.clientHeight;
      renderer.setSize(width, heightPx, false);
      camera.aspect = width / Math.max(heightPx, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame;
    const animate = () => {
      controls.update();
      if (selectedMaterial) {
        selectedMaterial.emissiveIntensity = 0.45 + Math.sin(performance.now() / 320) * 0.25;
      }
      if (selectedRing) {
        const pulse = 1 + Math.sin(performance.now() / 320) * 0.08;
        selectedRing.scale.set(pulse, pulse, pulse);
      }
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
  }, [layout, floor, selectedUnitId, onSelectUnit]);

  const floors = layout?.floors || [];
  const selectedFloorData = floors.find((f) => f.floor === floor);

  return (
    <div className="facility-3d-viewer">
      {showFloorControls && (
        <div className="facility-3d-viewer__toolbar">
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
              <span key={name}>
                <i style={{ background: `#${color.toString(16).padStart(6, "0")}` }} />
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="facility-3d-stage" style={{ height }}>
        <div ref={mountRef} className="facility-3d-canvas" />
        <div className="facility-3d-hint">{hint}</div>
        {hover && (
          <div className="facility-3d-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
            <strong>{hover.code}</strong>
            <span>{hover.typeName} · {hover.sizeM2} m²</span>
            <span>{STATUS_LABEL[hover.status] || hover.status}</span>
          </div>
        )}
      </div>

      {selectedFloorData && (
        <div className="facility-3d-zones">
          {selectedFloorData.zones.map((zone) => (
            <div key={zone.code} className="facility-3d-zone-card">
              <span>KHU {zone.code}</span>
              <strong>{zone.typeName}</strong>
              <small>{zone.units.length} kho</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
