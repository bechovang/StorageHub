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

const STATUS_COLORS = {
  AVAILABLE: 0x16a34a,
  RENTED: 0xdc2626,
  PREPARING: 0xf59e0b,
  MAINTENANCE: 0x64748b,
  RESERVED: 0x0ea5e9,
  RETIRED: 0x94a3b8,
};

const STATUS_LABEL = {
  AVAILABLE: "Còn trống",
  RENTED: "Đang thuê",
  PREPARING: "Đang dọn",
  MAINTENANCE: "Bảo trì",
  RESERVED: "Đã giữ chỗ",
  RETIRED: "Ngừng dùng",
};

function makeLabel(text, color = "#0f172a", scale = [3.4, 0.8]) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "700 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.fillRect(0, 18, canvas.width, 114);
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scale[0], scale[1], 1);
  sprite.renderOrder = 20;
  return sprite;
}

function buildStairs(height) {
  const group = new THREE.Group();
  const steps = 18;
  const stepMaterial = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.75,
  });
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.55,
    metalness: 0.35,
  });
  const rise = height / steps;
  const run = 0.28;
  const startZ = -2.6;
  const x = 9.35;

  for (let i = 0; i < steps; i += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.13, run + 0.05), stepMaterial);
    step.position.set(x, i * rise + 0.065, startZ + i * run);
    group.add(step);
  }

  for (const side of [-0.88, 0.88]) {
    for (let i = 0; i <= 4; i += 1) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.05), railMaterial);
      post.position.set(x + side, (i / 4) * height + 0.5, startZ + (i / 4) * steps * run);
      group.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 4.9), railMaterial);
    rail.position.set(x + side, height + 0.55, startZ + 2.2);
    rail.rotation.x = -Math.atan2(height, steps * run);
    group.add(rail);
  }

  const landing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.3), stepMaterial);
  landing.position.set(x, height + 0.02, 2.65);
  group.add(landing);

  const label = makeLabel("CẦU THANG", "#475569", [2.2, 0.5]);
  label.position.set(x, height + 1.25, 2.7);
  group.add(label);
  return group;
}

function buildFloorShell(floorY, floorNumber, opacity = 1) {
  const group = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(17.4, 0.18, 8.4),
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.92,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    })
  );
  slab.position.set(0, floorY - 0.1, 0);
  group.add(slab);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.95,
    transparent: opacity < 1,
    opacity: opacity * 0.9,
  });
  const back = new THREE.Mesh(new THREE.BoxGeometry(17.4, 1.2, 0.16), wallMaterial);
  back.position.set(0, floorY + 0.6, -4.15);
  group.add(back);
  for (const x of [-8.55, 8.55]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 8.2), wallMaterial);
    side.position.set(x, floorY + 0.6, 0);
    group.add(side);
  }

  const floorLabel = makeLabel(`TẦNG ${floorNumber}`, "#334155", [2.4, 0.6]);
  floorLabel.position.set(-9.7, floorY + 0.5, 3.9);
  group.add(floorLabel);
  return group;
}

function addZonePlate(scene, zone, zoneIndex, floorY, opacity) {
  const color = TYPE_COLORS[zone.typeName] || 0x64748b;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.035, 7.2),
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.16 * opacity,
      depthWrite: false,
    })
  );
  plate.position.set(zoneIndex === 0 ? -4.2 : 4.2, floorY + 0.015, 0);
  scene.add(plate);

  const label = makeLabel(`${zone.code} · ${zone.typeName}`, `#${color.toString(16).padStart(6, "0")}`, [3.8, 0.64]);
  label.position.set(zoneIndex === 0 ? -4.2 : 4.2, floorY + 1.6, 4.55);
  scene.add(label);
}

export default function Facility3DViewer({
  layout,
  selectedUnitId = null,
  initialFloor = null,
  onSelectUnit = null,
  height = 560,
  showFloorControls = true,
  hint = "Kéo để xoay · lăn chuột để zoom · click kho để mở chi tiết",
}) {
  const mountRef = useRef(null);
  const hoverRef = useRef(null);
  const selectRef = useRef(onSelectUnit);
  const [activeFloor, setActiveFloor] = useState(initialFloor || 1);
  const [mode, setMode] = useState("exploded");
  const [hover, setHover] = useState(null);

  useEffect(() => {
    selectRef.current = onSelectUnit;
  }, [onSelectUnit]);

  useEffect(() => {
    if (initialFloor != null) setActiveFloor(initialFloor);
  }, [initialFloor]);

  useEffect(() => {
    if (!layout || !mountRef.current) return undefined;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const floorGap = mode === "exploded" ? 5.6 : 3.35;
    const floorDataList = layout.floors || [];
    const selectedFloor = floorDataList.find((floor) =>
      floor.zones?.some((zone) => zone.units?.some(
        (unit) => selectedUnitId != null && String(unit.id) === String(selectedUnitId)
      ))
    )?.floor;

    const active = activeFloor ?? selectedFloor;
    const unitMeshes = [];
    let selectedBox = null;
    let selectedMaterial = null;
    let selectedRing = null;
    let selectedLabel = null;

    const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, 0.1, 200);
    camera.position.set(18, 16, 23);
    camera.lookAt(0, floorGap * 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf8fafc, 1);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, floorGap * 0.5, 0);
    controls.minZoom = 0.55;
    controls.maxZoom = 3.2;
    controls.maxPolarAngle = Math.PI / 2.05;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 2.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(10, 22, 12);
    scene.add(sun);

    floorDataList.forEach((floorData) => {
      const isUpper = Number(floorData.floor) > 1;
      const floorY = isUpper ? floorGap : 0;
      const isActive = Number(floorData.floor) === Number(active);
      const opacity = selectedUnitId && !isActive ? 0.2 : 1;
      scene.add(buildFloorShell(floorY, floorData.floor, opacity));

      floorData.zones.forEach((zone, zoneIndex) => {
        addZonePlate(scene, zone, zoneIndex, floorY, opacity);
        zone.units.forEach((unit) => {
          const row = Number(unit.row) || 1;
          const col = Number(unit.col) || 1;
          const x = (zoneIndex === 0 ? -4.2 : 4.2) + (col - 3) * 1.45;
          const z = (row - 3) * 1.35;
          const isSelected = selectedUnitId != null && String(unit.id) === String(selectedUnitId);
          const typeColor = TYPE_COLORS[unit.typeName] || 0x94a3b8;
          const bodyColor = new THREE.Color(typeColor).lerp(new THREE.Color(0xffffff), 0.68);
          const dim = selectedUnitId ? (isSelected ? 0 : (isActive ? 0.38 : 0.12)) : 1;

          const material = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.58,
            metalness: 0.05,
            transparent: dim < 1,
            opacity: dim,
            depthWrite: dim >= 1,
            emissive: isSelected ? 0xf59e0b : 0x000000,
            emissiveIntensity: isSelected ? 0.6 : 0,
          });
          const box = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.35, 0.98), material);
          box.position.set(x, floorY + 0.7, z);
          if (isSelected) box.scale.set(1.16, 1.16, 1.16);
          box.userData = unit;

          const edge = new THREE.LineSegments(
            new THREE.EdgesGeometry(box.geometry),
            new THREE.LineBasicMaterial({
              color: isSelected ? 0xf59e0b : typeColor,
              transparent: dim < 1,
              opacity: Math.max(dim, 0.12),
            })
          );
          box.add(edge);

          // Dải màu loại kho + đèn trạng thái nhỏ ở mặt trước.
          const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.16, 0.035),
            new THREE.MeshStandardMaterial({ color: typeColor, emissive: typeColor, emissiveIntensity: 0.16 })
          );
          stripe.position.set(0, -0.42, 0.505);
          box.add(stripe);
          const statusLight = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.12, 0.04),
            new THREE.MeshStandardMaterial({
              color: STATUS_COLORS[unit.status] || 0x94a3b8,
              emissive: STATUS_COLORS[unit.status] || 0x94a3b8,
              emissiveIntensity: 0.8,
            })
          );
          statusLight.position.set(0.36, 0.44, 0.505);
          box.add(statusLight);

          scene.add(box);
          unitMeshes.push(box);

          if (isSelected) {
            selectedBox = box;
            selectedMaterial = material;
            selectedLabel = makeLabel(`KHO ${unit.code}`, "#b45309", [2.9, 0.68]);
            selectedLabel.position.set(x, floorY + 2.2, z);
            selectedLabel.userData.baseY = selectedLabel.position.y;
            scene.add(selectedLabel);

            const ring = new THREE.Mesh(
              new THREE.RingGeometry(0.78, 0.98, 40),
              new THREE.MeshBasicMaterial({
                color: 0xf59e0b,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
              })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(x, floorY + 0.03, z);
            scene.add(ring);
            selectedRing = ring;

            const beam = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.05, 3.2, 12),
              new THREE.MeshBasicMaterial({
                color: 0xf59e0b,
                transparent: true,
                opacity: 0.2,
                depthWrite: false,
              })
            );
            beam.position.set(x, floorY + 1.6, z);
            scene.add(beam);
          }
        });
      });
    });

    scene.add(buildStairs(floorGap));

    if (selectedBox) {
      controls.target.set(
        selectedBox.position.x * 0.45,
        Math.min(selectedBox.position.y + 0.4, floorGap + 0.8),
        selectedBox.position.z * 0.45
      );
      camera.position.set(selectedBox.position.x + 17, selectedBox.position.y + 14, selectedBox.position.z + 22);
      camera.lookAt(controls.target);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let pointerDown = false;

    const onPointerDown = (event) => {
      pointerDown = true;
      downX = event.clientX;
      downY = event.clientY;
    };
    const onPointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(unitMeshes, false)[0];
      const next = hit ? { ...hit.object.userData, x: event.clientX, y: event.clientY } : null;
      hoverRef.current = next;
      setHover(next);
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    };
    const onPointerUp = (event) => {
      const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
      if (pointerDown && moved < 5 && hoverRef.current?.id && selectRef.current) {
        const id = hoverRef.current.id;
        if (String(id) !== String(selectedUnitId)) selectRef.current(id);
      }
      pointerDown = false;
    };
    const onPointerLeave = () => {
      hoverRef.current = null;
      setHover(null);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const width = mount.clientWidth;
      const heightPx = mount.clientHeight;
      renderer.setSize(width, heightPx, false);
      const aspect = width / Math.max(heightPx, 1);
      const size = 15.5;
      camera.left = (-size * aspect) / 2;
      camera.right = (size * aspect) / 2;
      camera.top = size / 2;
      camera.bottom = -size / 2;
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
        const pulse = 1 + Math.sin(performance.now() / 320) * 0.09;
        selectedRing.scale.set(pulse, pulse, pulse);
      }
      if (selectedLabel) {
        selectedLabel.position.y = selectedLabel.userData.baseY
          + Math.sin(performance.now() / 500) * 0.045;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [layout, mode, activeFloor, selectedUnitId]);

  const floors = layout?.floors || [];
  const activeFloorData = floors.find((f) => Number(f.floor) === Number(activeFloor));

  return (
    <div className="facility-3d-viewer">
      <div className="facility-3d-viewer__toolbar">
        {showFloorControls && (
          <div className="facility-3d-viewer__group">
            <span className="facility-3d-viewer__label">TẦNG</span>
            <div className="facility-3d-floors">
              {floors.map((f) => (
                <button
                  key={f.floor}
                  type="button"
                  className={Number(f.floor) === Number(activeFloor) ? "is-active" : ""}
                  onClick={() => setActiveFloor(f.floor)}
                >
                  {f.floor}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="facility-3d-viewer__group">
          <span className="facility-3d-viewer__label">CHẾ ĐỘ</span>
          <div className="facility-3d-modes">
            <button
              type="button"
              className={mode === "exploded" ? "is-active" : ""}
              onClick={() => setMode("exploded")}
            >
              Tách tầng
            </button>
            <button
              type="button"
              className={mode === "stacked" ? "is-active" : ""}
              onClick={() => setMode("stacked")}
            >
              Liền khối
            </button>
          </div>
        </div>
        <div className="facility-3d-legend">
          {Object.entries(TYPE_COLORS).map(([name, color]) => (
            <span key={name}>
              <i style={{ background: `#${color.toString(16).padStart(6, "0")}` }} />
              {name.replace("Kho ", "")}
            </span>
          ))}
          <span><i className="is-status is-available" />Trống</span>
          <span><i className="is-status is-rented" />Thuê</span>
        </div>
      </div>

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

      {activeFloorData && (
        <div className="facility-3d-zones">
          {activeFloorData.zones.map((zone) => (
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
