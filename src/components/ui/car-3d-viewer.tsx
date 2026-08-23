"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCw, ZoomIn, ZoomOut, Lightbulb, RefreshCcw, Eye, Sparkles, Sun } from "lucide-react";

interface Car3DViewerProps {
  selectedColor?: string;
  brandName?: string;
  modelName?: string;
  bodyType?: string;
}

const COLOR_MAP: Record<string, number> = {
  "Trắng Ngọc Trai": 0xf8fafc,
  "Đen Huyền Bí": 0x0f172a,
  "Bạc Ánh Trăng": 0x94a3b8,
  "Đỏ Rực Rỡ": 0xd97706, // High contrast automotive red
  "Xanh Thiên Thanh": 0x0284c7,
  "Xám Titan": 0x475569,
  "Vàng Cát": 0xb45309,
};

export function Car3DViewer({
  selectedColor = "Trắng Ngọc Trai",
  brandName = "Toyota",
  modelName = "Veloz Cross",
  bodyType = "MPV",
}: Car3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const carBodyMaterialRef = useRef<THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial | null>(null);
  const loadedModelMaterialsRef = useRef<THREE.Material[]>([]);
  const headlightsRef = useRef<THREE.PointLight[]>([]);

  const [autoRotate, setAutoRotate] = useState(true);
  const [lightsOn, setLightsOn] = useState(true);
  const [darkStudio, setDarkStudio] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(7.0);
  const [isInteracting, setIsInteracting] = useState(false);

  // Mouse / Touch interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.25, y: 0.75 });

  const normalizedBody = (bodyType || "").toUpperCase();
  const isSedanModel = normalizedBody.includes("SEDAN") || (modelName || "").toLowerCase().includes("camry");

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkStudio ? 0x090d16 : 0xf1f5f9);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, cameraDistance);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Studio Lighting System
    const ambientLight = new THREE.AmbientLight(darkStudio ? 0x384152 : 0xffffff, darkStudio ? 0.8 : 1.6);
    scene.add(ambientLight);

    // Main Studio Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, darkStudio ? 2.2 : 3.0);
    keyLight.position.set(10, 16, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Cool Side Fill Light
    const fillLight = new THREE.DirectionalLight(0x93c5fd, darkStudio ? 1.0 : 1.4);
    fillLight.position.set(-12, 10, -10);
    scene.add(fillLight);

    // Warm Rim / Back Highlight
    const rimLight = new THREE.DirectionalLight(0xfef08a, darkStudio ? 1.8 : 1.4);
    rimLight.position.set(0, 12, -15);
    scene.add(rimLight);

    // 5. Studio Showroom Floor & Soft Contact Shadow Pedestal
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: darkStudio ? 0x0f172a : 0xe2e8f0,
      roughness: darkStudio ? 0.4 : 0.7,
      metalness: 0.3,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Circular Pedestal Ring
    const padGeo = new THREE.RingGeometry(0.1, 5.2, 64);
    const padMat = new THREE.MeshStandardMaterial({
      color: darkStudio ? 0x1e293b : 0xcbd5e1,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.001;
    scene.add(pad);

    // Soft Shadow Blob under Car
    const shadowGeo = new THREE.PlaneGeometry(5.2, 2.8);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
      gradient.addColorStop(0, "rgba(0,0,0,0.6)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
    shadowBlob.rotation.x = -Math.PI / 2;
    shadowBlob.position.y = 0.002;
    scene.add(shadowBlob);

    const carGroup = new THREE.Group();
    const initialHex = COLOR_MAP[selectedColor] || 0xd97706;

    if (isSedanModel) {
      // LOAD REAL GLB MODEL FOR SEDAN (Meshy AI Mercedes-Benz C-Class Model)
      const loader = new GLTFLoader();
      loader.load(
        "/models/sedan.glb",
        (gltf) => {
          const model = gltf.scene;

          // Compute Bounding Box to Center and Auto-Scale Model properly
          const bbox = new THREE.Box3().setFromObject(model);
          const size = bbox.getSize(new THREE.Vector3());
          const center = bbox.getCenter(new THREE.Vector3());

          // Target length ~ 4.5 units in Three.js world
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = 4.6 / maxDim;
          model.scale.set(targetScale, targetScale, targetScale);

          // Center horizontally and align to ground Y=0
          model.position.x = -center.x * targetScale;
          model.position.y = -bbox.min.y * targetScale;
          model.position.z = -center.z * targetScale;

          // Rotate to face front-three-quarter view nicely
          model.rotation.y = Math.PI / 2;

          loadedModelMaterialsRef.current = [];

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat) => {
                  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                    carBodyMaterialRef.current = mat;
                    mat.color.setHex(initialHex);
                    mat.needsUpdate = true;
                  }
                  loadedModelMaterialsRef.current.push(mat);
                });
              }
            }
          });

          carGroup.add(model);
        },
        undefined,
        (err) => {
          console.error("Error loading sedan.glb GLTF model:", err);
        }
      );
    } else {
      // Procedural 3D Model for Non-Sedan Body Types (SUV, MPV, Pickup, Hatchback)
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: initialHex,
        metalness: 0.6,
        roughness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.9,
      });
      carBodyMaterialRef.current = bodyMat;

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x090d16,
        metalness: 0.9,
        roughness: 0.05,
        transmission: 0.7,
        transparent: true,
        opacity: 0.85,
      });

      const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.05 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
      const brakeCaliperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.5, roughness: 0.3 });
      const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x60a5fa, emissiveIntensity: 1.5 });
      const taillightMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 1.8 });

      const isMPV = normalizedBody.includes("MPV");
      const isSUV = normalizedBody.includes("SUV");
      const isPickup = normalizedBody.includes("PICKUP");
      const isHatchback = normalizedBody.includes("HATCHBACK");

      const carLength = isPickup ? 4.8 : isSUV ? 4.6 : isMPV ? 4.5 : isHatchback ? 3.6 : 4.3;
      const carWidth = isSUV || isPickup ? 2.2 : isMPV ? 2.1 : 2.0;
      const chassisHeight = isSUV || isPickup ? 0.7 : isMPV ? 0.65 : 0.58;
      const groundY = isSUV || isPickup ? 0.65 : isMPV ? 0.58 : 0.48;
      const tireRadius = isSUV || isPickup ? 0.42 : 0.36;

      const chassisGeo = new THREE.BoxGeometry(carWidth, chassisHeight, carLength);
      const chassis = new THREE.Mesh(chassisGeo, bodyMat);
      chassis.position.y = groundY;
      chassis.castShadow = true;
      carGroup.add(chassis);

      const hoodGeo = new THREE.BoxGeometry(carWidth - 0.05, chassisHeight * 0.5, 1.2);
      const hood = new THREE.Mesh(hoodGeo, bodyMat);
      hood.position.set(0, groundY + chassisHeight * 0.25, carLength / 2 - 0.5);
      hood.rotation.x = -Math.PI / 36;
      hood.castShadow = true;
      carGroup.add(hood);

      if (isPickup) {
        const cabinGeo = new THREE.BoxGeometry(carWidth - 0.2, 0.75, 2.2);
        const cabin = new THREE.Mesh(cabinGeo, bodyMat);
        cabin.position.set(0, groundY + 0.6, 0.3);
        cabin.castShadow = true;
        carGroup.add(cabin);

        const bedGeo = new THREE.BoxGeometry(carWidth - 0.1, 0.45, 1.8);
        const bed = new THREE.Mesh(bedGeo, trimMat);
        bed.position.set(0, groundY + 0.35, -1.3);
        carGroup.add(bed);
      } else {
        const cabinLength = isMPV ? 2.6 : isSUV ? 2.4 : isHatchback ? 1.9 : 2.1;
        const cabinHeight = isMPV ? 0.76 : isSUV ? 0.7 : 0.62;
        const cabinZ = isMPV ? -0.1 : isSUV ? -0.15 : -0.2;

        const cabinGeo = new THREE.BoxGeometry(carWidth - 0.25, cabinHeight, cabinLength);
        const cabin = new THREE.Mesh(cabinGeo, bodyMat);
        cabin.position.set(0, groundY + chassisHeight / 2 + cabinHeight / 2 - 0.05, cabinZ);
        cabin.castShadow = true;
        carGroup.add(cabin);

        if (isMPV || isSUV) {
          const railGeo = new THREE.BoxGeometry(0.06, 0.06, cabinLength - 0.2);
          const railL = new THREE.Mesh(railGeo, chromeMat);
          railL.position.set(-(carWidth / 2 - 0.15), groundY + chassisHeight / 2 + cabinHeight + 0.02, cabinZ);
          const railR = new THREE.Mesh(railGeo, chromeMat);
          railR.position.set(carWidth / 2 - 0.15, groundY + chassisHeight / 2 + cabinHeight + 0.02, cabinZ);
          carGroup.add(railL);
          carGroup.add(railR);
        }
      }

      const windshieldGeo = new THREE.BoxGeometry(carWidth - 0.3, 0.55, 0.75);
      const windshield = new THREE.Mesh(windshieldGeo, glassMat);
      windshield.position.set(0, groundY + chassisHeight / 2 + 0.3, carLength / 2 - 1.25);
      windshield.rotation.x = Math.PI / 5.5;
      carGroup.add(windshield);

      const rearWinGeo = new THREE.BoxGeometry(carWidth - 0.3, 0.5, 0.7);
      const rearWindow = new THREE.Mesh(rearWinGeo, glassMat);
      rearWindow.position.set(0, groundY + chassisHeight / 2 + 0.3, -carLength / 2 + (isPickup ? 1.8 : 1.0));
      rearWindow.rotation.x = -Math.PI / 5.5;
      carGroup.add(rearWindow);

      const headGeo = new THREE.BoxGeometry(0.45, 0.16, 0.1);
      const headL = new THREE.Mesh(headGeo, headlightMat);
      headL.position.set(-(carWidth / 2 - 0.35), groundY + 0.1, carLength / 2 + 0.02);
      carGroup.add(headL);

      const headR = new THREE.Mesh(headGeo, headlightMat);
      headR.position.set(carWidth / 2 - 0.35, groundY + 0.1, carLength / 2 + 0.02);
      carGroup.add(headR);

      const pLightL = new THREE.PointLight(0x60a5fa, 3.5, 8);
      pLightL.position.set(-(carWidth / 2 - 0.35), groundY + 0.1, carLength / 2 + 0.4);
      carGroup.add(pLightL);

      const pLightR = new THREE.PointLight(0x60a5fa, 3.5, 8);
      pLightR.position.set(carWidth / 2 - 0.35, groundY + 0.1, carLength / 2 + 0.4);
      carGroup.add(pLightR);

      headlightsRef.current = [pLightL, pLightR];

      const tailBarGeo = new THREE.BoxGeometry(carWidth - 0.2, 0.12, 0.08);
      const tailBar = new THREE.Mesh(tailBarGeo, taillightMat);
      tailBar.position.set(0, groundY + 0.12, -carLength / 2 - 0.02);
      carGroup.add(tailBar);

      const wheelZOffset = carLength / 2 - 0.95;
      const wheelPositions = [
        [-(carWidth / 2 + 0.04), tireRadius, wheelZOffset],
        [carWidth / 2 + 0.04, tireRadius, wheelZOffset],
        [-(carWidth / 2 + 0.04), tireRadius, -wheelZOffset],
        [carWidth / 2 + 0.04, tireRadius, -wheelZOffset],
      ];

      wheelPositions.forEach(([x, y, z]) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(x, y, z);

        const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, 0.28, 32);
        const tire = new THREE.Mesh(tireGeo, tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, 0.3, 24);
        const rim = new THREE.Mesh(rimGeo, chromeMat);
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(rim);

        for (let s = 0; s < 5; s++) {
          const angle = (s * Math.PI * 2) / 5;
          const spokeGeo = new THREE.BoxGeometry(0.04, tireRadius * 1.1, 0.31);
          const spoke = new THREE.Mesh(spokeGeo, trimMat);
          spoke.rotation.x = angle;
          wheelGroup.add(spoke);
        }

        const caliperGeo = new THREE.BoxGeometry(0.12, tireRadius * 0.5, 0.15);
        const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMat);
        caliper.position.set(x > 0 ? -0.06 : 0.06, tireRadius * 0.2, 0);
        wheelGroup.add(caliper);

        carGroup.add(wheelGroup);
      });
    }

    scene.add(carGroup);

    // 7. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        rotationRef.current.y += 0.006;
      }

      // Smooth Orbital Camera Position
      camera.position.x = cameraDistance * Math.sin(rotationRef.current.y) * Math.cos(rotationRef.current.x);
      camera.position.y = cameraDistance * Math.sin(rotationRef.current.x) + 0.7;
      camera.position.z = cameraDistance * Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x);
      camera.lookAt(0, 0.5, 0);

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
  }, [cameraDistance, autoRotate, darkStudio, bodyType, isSedanModel]);

  // Dynamic Color Sync for both Procedural and GLTF Loaded GLB Models
  useEffect(() => {
    const hex = COLOR_MAP[selectedColor] || 0xd97706;
    if (carBodyMaterialRef.current) {
      if ("color" in carBodyMaterialRef.current) {
        carBodyMaterialRef.current.color.setHex(hex);
      }
    }

    if (loadedModelMaterialsRef.current.length > 0) {
      loadedModelMaterialsRef.current.forEach((mat) => {
        if ("color" in mat) {
          (mat as THREE.MeshStandardMaterial).color.setHex(hex);
        }
      });
    }
  }, [selectedColor]);

  // Headlights Toggle
  useEffect(() => {
    headlightsRef.current.forEach((light) => {
      light.intensity = lightsOn ? 3.5 : 0;
    });
  }, [lightsOn]);

  // Mouse & Touch Drag Handlers
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
    rotationRef.current.x = Math.max(-0.1, Math.min(1.1, rotationRef.current.x + deltaY * 0.008));

    previousMousePositionRef.current = { x: clientX, y: clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsInteracting(false);
  };

  return (
    <div className={`relative w-full h-[450px] rounded-2xl overflow-hidden transition-colors duration-500 border shadow-inner select-none ${
      darkStudio ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white" : "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 text-slate-900"
    }`}>
      {/* 3D WebGL Canvas Container */}
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

      {/* Floating Header Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border shadow font-semibold">
          <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
          {isSedanModel ? "Meshy GLTF 3D Model: Mercedes-Benz C-Class" : `WebGL 3D Studio: ${brandName} ${modelName}`}
        </Badge>
        <Badge variant="outline" className="bg-background/60 backdrop-blur-sm text-xs font-mono">
          Kiểu dáng: {bodyType}
        </Badge>
        <Badge variant="outline" className="bg-background/60 backdrop-blur-sm text-xs font-mono">
          Màu sơn: {selectedColor}
        </Badge>
      </div>

      {/* Floating Interaction Hint */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow text-xs text-muted-foreground pointer-events-none flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
        <RotateCw className={`h-3.5 w-3.5 text-primary ${isInteracting ? "animate-spin" : ""}`} />
        <span>Kéo chuột / chạm xoay mô hình 3D 360° ({bodyType})</span>
      </div>

      {/* Control Buttons Bar */}
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
          variant={darkStudio ? "default" : "outline"}
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => setDarkStudio(!darkStudio)}
          title="Chế độ Studio Ban Đêm / Ban Ngày"
        >
          <Sun className={`h-4 w-4 ${darkStudio ? "text-amber-400" : "text-slate-600"}`} />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => setCameraDistance((d) => Math.max(4, d - 0.8))}
          title="Phóng to"
        >
          <ZoomIn className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => setCameraDistance((d) => Math.min(9.5, d + 0.8))}
          title="Thu nhỏ"
        >
          <ZoomOut className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full shadow bg-background/80 backdrop-blur border hover:bg-background"
          onClick={() => {
            rotationRef.current = { x: 0.25, y: 0.75 };
            setCameraDistance(7.0);
          }}
          title="Đặt lại góc quay"
        >
          <RefreshCcw className="h-4 w-4 text-foreground" />
        </Button>
      </div>
    </div>
  );
}
