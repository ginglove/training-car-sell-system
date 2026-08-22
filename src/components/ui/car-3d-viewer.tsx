"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCw, ZoomIn, ZoomOut, Lightbulb, RefreshCcw, Eye, Sparkles } from "lucide-react";

interface Car3DViewerProps {
  selectedColor?: string;
  brandName?: string;
  modelName?: string;
  bodyType?: string;
}

const COLOR_MAP: Record<string, number> = {
  "Trắng Ngọc Trai": 0xf4f5f7,
  "Đen Huyền Bí": 0x111318,
  "Bạc Ánh Trăng": 0xb0b5bc,
  "Đỏ Rực Rỡ": 0xc9182b,
  "Xanh Thiên Thanh": 0x0055a5,
  "Xám Titan": 0x4a4e57,
  "Vàng Cát": 0xc2a649,
};

export function Car3DViewer({
  selectedColor = "Đỏ Rực Rỡ",
  brandName = "Toyota",
  modelName = "Veloz Cross",
  bodyType = "MPV",
}: Car3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const carBodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const headlightsRef = useRef<THREE.PointLight[]>([]);

  const [autoRotate, setAutoRotate] = useState(true);
  const [lightsOn, setLightsOn] = useState(true);
  const [cameraDistance, setCameraDistance] = useState(7.5);
  const [isInteracting, setIsInteracting] = useState(false);

  // Mouse / Touch interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.2, y: 0.6 });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, cameraDistance);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(12, 18, 12);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa5c9ff, 0.9);
    dirLight2.position.set(-12, 12, -12);
    scene.add(dirLight2);

    const groundLight = new THREE.HemisphereLight(0xffffff, 0x333333, 0.7);
    scene.add(groundLight);

    // Studio Showroom Ground Plane
    const groundGeo = new THREE.PlaneGeometry(35, 35);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Showroom Circular Pedestal
    const padGeo = new THREE.CircleGeometry(4.8, 64);
    const padMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.001;
    scene.add(pad);

    // 5. Construct 3D Car Group Mesh based on Body Type
    const carGroup = new THREE.Group();

    // Car Body Material (Glossy Metallic Automotive Paint)
    const initialHex = COLOR_MAP[selectedColor] || 0xc9182b;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: initialHex,
      metalness: 0.75,
      roughness: 0.2,
      envMapIntensity: 1.5,
    });
    carBodyMaterialRef.current = bodyMat;

    // Glass Material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.85,
    });

    // Dark Trim & Chrome Materials
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.5 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, metalness: 0.95, roughness: 0.05 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const lightLensMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.9 });
    const tailLensMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 0.7 });

    // Normalize body type
    const normalizedBody = (bodyType || "").toUpperCase();
    const isMPV = normalizedBody.includes("MPV");
    const isSUV = normalizedBody.includes("SUV");
    const isPickup = normalizedBody.includes("PICKUP");
    const isHatchback = normalizedBody.includes("HATCHBACK");
    const isSedan = normalizedBody.includes("SEDAN");

    // Dynamic Dimensions per Body Type
    const carLength = isPickup ? 4.9 : isSUV ? 4.7 : isMPV ? 4.6 : isSedan ? 4.5 : isHatchback ? 3.7 : 4.4;
    const carWidth = isSUV || isPickup ? 2.45 : isMPV ? 2.35 : 2.3;
    const chassisHeight = isSUV || isPickup ? 0.8 : isMPV ? 0.72 : isSedan ? 0.52 : 0.62;
    const groundY = isSUV || isPickup ? 0.68 : isMPV ? 0.6 : 0.5;
    const tireRadius = isSUV || isPickup ? 0.44 : 0.38;

    // --- CAR LOWER CHASSIS BODY ---
    const chassisGeo = new THREE.BoxGeometry(carWidth, chassisHeight, carLength);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = groundY;
    chassis.castShadow = true;
    carGroup.add(chassis);

    if (isPickup) {
      // Pickup Double Cab Cabin
      const cabinGeo = new THREE.BoxGeometry(carWidth - 0.2, 0.75, 2.3);
      const cabin = new THREE.Mesh(cabinGeo, bodyMat);
      cabin.position.set(0, groundY + 0.6, 0.4);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Open Cargo Bed
      const bedGeo = new THREE.BoxGeometry(carWidth - 0.1, 0.45, 1.9);
      const bed = new THREE.Mesh(bedGeo, trimMat);
      bed.position.set(0, groundY + 0.35, -1.4);
      carGroup.add(bed);

      // Roll Bar Cage
      const barGeo = new THREE.BoxGeometry(carWidth - 0.2, 0.65, 0.1);
      const bar = new THREE.Mesh(barGeo, trimMat);
      bar.position.set(0, groundY + 0.6, -0.6);
      carGroup.add(bar);
    } else {
      // Standard / MPV / SUV / Sedan Upper Cabin Roof
      const cabinLength = isMPV ? 2.7 : isSUV ? 2.5 : isHatchback ? 2.0 : 2.2;
      const cabinHeight = isMPV ? 0.78 : isSUV ? 0.72 : isSedan ? 0.58 : 0.65;
      const cabinZ = isMPV ? -0.1 : isSUV ? -0.15 : -0.2;

      const cabinGeo = new THREE.BoxGeometry(carWidth - 0.3, cabinHeight, cabinLength);
      const cabin = new THREE.Mesh(cabinGeo, bodyMat);
      cabin.position.set(0, groundY + chassisHeight / 2 + cabinHeight / 2, cabinZ);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Roof Rails for MPV / SUV
      if (isMPV || isSUV) {
        const railGeo = new THREE.BoxGeometry(0.08, 0.08, cabinLength - 0.2);
        const railL = new THREE.Mesh(railGeo, chromeMat);
        railL.position.set(-(carWidth / 2 - 0.2), groundY + chassisHeight / 2 + cabinHeight + 0.04, cabinZ);
        const railR = new THREE.Mesh(railGeo, chromeMat);
        railR.position.set(carWidth / 2 - 0.2, groundY + chassisHeight / 2 + cabinHeight + 0.04, cabinZ);
        carGroup.add(railL);
        carGroup.add(railR);
      }
    }

    // Windshield (Front)
    const windshieldGeo = new THREE.BoxGeometry(carWidth - 0.35, 0.55, 0.85);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, groundY + chassisHeight / 2 + 0.35, carLength / 2 - 1.35);
    windshield.rotation.x = Math.PI / 6;
    carGroup.add(windshield);

    // Rear Window
    const rearWinGeo = new THREE.BoxGeometry(carWidth - 0.35, 0.5, 0.8);
    const rearWindow = new THREE.Mesh(rearWinGeo, glassMat);
    rearWindow.position.set(0, groundY + chassisHeight / 2 + 0.35, -carLength / 2 + (isPickup ? 1.9 : 1.05));
    rearWindow.rotation.x = -Math.PI / 6;
    carGroup.add(rearWindow);

    // Front Grille & Logo
    const grilleGeo = new THREE.BoxGeometry(carWidth - 0.5, 0.35, 0.1);
    const grille = new THREE.Mesh(grilleGeo, trimMat);
    grille.position.set(0, groundY - 0.05, carLength / 2 + 0.01);
    carGroup.add(grille);

    const logoGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32);
    const logo = new THREE.Mesh(logoGeo, chromeMat);
    logo.rotation.x = Math.PI / 2;
    logo.position.set(0, groundY + 0.05, carLength / 2 + 0.02);
    carGroup.add(logo);

    // Headlights L & R
    const headGeo = new THREE.BoxGeometry(0.48, 0.18, 0.1);
    const headL = new THREE.Mesh(headGeo, lightLensMat);
    headL.position.set(-(carWidth / 2 - 0.4), groundY + 0.1, carLength / 2 + 0.01);
    carGroup.add(headL);

    const headR = new THREE.Mesh(headGeo, lightLensMat);
    headR.position.set(carWidth / 2 - 0.4, groundY + 0.1, carLength / 2 + 0.01);
    carGroup.add(headR);

    // Headlight Pointlights (Real LED Glow)
    const pLightL = new THREE.PointLight(0x38bdf8, 3.2, 9);
    pLightL.position.set(-(carWidth / 2 - 0.4), groundY + 0.1, carLength / 2 + 0.3);
    carGroup.add(pLightL);

    const pLightR = new THREE.PointLight(0x38bdf8, 3.2, 9);
    pLightR.position.set(carWidth / 2 - 0.4, groundY + 0.1, carLength / 2 + 0.3);
    carGroup.add(pLightR);

    headlightsRef.current = [pLightL, pLightR];

    // Taillights L & R
    const tailGeo = new THREE.BoxGeometry(0.5, 0.16, 0.1);
    const tailL = new THREE.Mesh(tailGeo, tailLensMat);
    tailL.position.set(-(carWidth / 2 - 0.4), groundY + 0.12, -carLength / 2 - 0.01);
    carGroup.add(tailL);

    const tailR = new THREE.Mesh(tailGeo, tailLensMat);
    tailR.position.set(carWidth / 2 - 0.4, groundY + 0.12, -carLength / 2 - 0.01);
    carGroup.add(tailR);

    // 4 Alloy Wheels & Tires
    const wheelZOffset = carLength / 2 - 1.0;
    const wheelPositions = [
      [-(carWidth / 2 + 0.05), tireRadius, wheelZOffset],   // Front Left
      [carWidth / 2 + 0.05, tireRadius, wheelZOffset],    // Front Right
      [-(carWidth / 2 + 0.05), tireRadius, -wheelZOffset],  // Rear Left
      [carWidth / 2 + 0.05, tireRadius, -wheelZOffset],   // Rear Right
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, y, z);

      // Tire Rubber Outer
      const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, 0.32, 32);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Rim Inner Chrome
      const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, 0.34, 16);
      const rim = new THREE.Mesh(rimGeo, chromeMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Rim Spokes
      const spokeGeo = new THREE.BoxGeometry(0.06, tireRadius * 1.1, 0.35);
      const spoke1 = new THREE.Mesh(spokeGeo, trimMat);
      const spoke2 = new THREE.Mesh(spokeGeo, trimMat);
      spoke2.rotation.x = Math.PI / 2;
      wheelGroup.add(spoke1);
      wheelGroup.add(spoke2);

      carGroup.add(wheelGroup);
    });

    scene.add(carGroup);

    // 6. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        rotationRef.current.y += 0.008;
      }

      // Smooth Camera Orbit Positioning
      camera.position.x = cameraDistance * Math.sin(rotationRef.current.y) * Math.cos(rotationRef.current.x);
      camera.position.y = cameraDistance * Math.sin(rotationRef.current.x) + 0.8;
      camera.position.z = cameraDistance * Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x);
      camera.lookAt(0, groundY, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    const currentMount = mountRef.current;

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraDistance, autoRotate, bodyType]);

  // Dynamic Color Sync
  useEffect(() => {
    if (carBodyMaterialRef.current) {
      const hex = COLOR_MAP[selectedColor] || 0xc9182b;
      carBodyMaterialRef.current.color.setHex(hex);
    }
  }, [selectedColor]);

  // Headlights Toggle
  useEffect(() => {
    headlightsRef.current.forEach((light) => {
      light.intensity = lightsOn ? 3.2 : 0;
    });
  }, [lightsOn]);

  // Mouse & Touch Drag Handlers for 360° Orbital Control
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    setIsInteracting(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    previousMousePositionRef.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - previousMousePositionRef.current.x;
    const deltaY = clientY - previousMousePositionRef.current.y;

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x = Math.max(-0.2, Math.min(1.1, rotationRef.current.x + deltaY * 0.008));

    previousMousePositionRef.current = { x: clientX, y: clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsInteracting(false);
  };

  return (
    <div className="relative w-full h-[420px] rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 border shadow-inner select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Floating Header Info */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border shadow font-semibold">
          <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
          WebGL 3D Model: {brandName} {modelName}
        </Badge>
        <Badge variant="outline" className="bg-background/60 backdrop-blur-sm text-xs font-mono">
          Kiểu dáng: {bodyType}
        </Badge>
        <Badge variant="outline" className="bg-background/60 backdrop-blur-sm text-xs font-mono">
          Màu sơn: {selectedColor}
        </Badge>
      </div>

      {/* Floating Drag Hint */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow text-xs text-muted-foreground pointer-events-none flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
        <RotateCw className={`h-3.5 w-3.5 text-primary ${isInteracting ? "animate-spin" : ""}`} />
        <span>Kéo chuột / vuốt tay để xoay mô hình 3D 360° ({bodyType})</span>
      </div>

      {/* Control Buttons Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="sm"
          variant={autoRotate ? "default" : "outline"}
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => setAutoRotate(!autoRotate)}
          title="Tự động xoay 360°"
        >
          <RotateCw className={`h-4 w-4 ${autoRotate ? "animate-spin text-primary" : "text-foreground"}`} />
        </Button>

        <Button
          size="sm"
          variant={lightsOn ? "default" : "outline"}
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => setLightsOn(!lightsOn)}
          title="Bật/Tắt đèn pha LED"
        >
          <Lightbulb className={`h-4 w-4 ${lightsOn ? "text-amber-500 fill-amber-400" : "text-foreground"}`} />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => setCameraDistance((d) => Math.max(4, d - 1))}
          title="Phóng to"
        >
          <ZoomIn className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => setCameraDistance((d) => Math.min(10, d + 1))}
          title="Thu nhỏ"
        >
          <ZoomOut className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => {
            rotationRef.current = { x: 0.2, y: 0.6 };
            setCameraDistance(7.5);
          }}
          title="Đặt lại góc quay"
        >
          <RefreshCcw className="h-4 w-4 text-foreground" />
        </Button>
      </div>
    </div>
  );
}
