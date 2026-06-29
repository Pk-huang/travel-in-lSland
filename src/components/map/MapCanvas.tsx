"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";

import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { REGION_LABELS } from "@/src/lib/config/app";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/** 步驟 1 驗證物件：一顆持續旋轉的方塊，確認 R3F 渲染迴圈正常運作。 */
function SpinningBox() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.5;
    ref.current.rotation.y += delta * 0.8;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4aa3ff" />
    </mesh>
  );
}

/**
 * MapCanvas：3D 地圖島（client island）— 全螢幕背景層。
 *
 * Phase 2-1a 步驟 1：先以 R3F <Canvas> + 旋轉方塊驗證工具鏈。
 * 後續步驟將替換為 low-poly 地形（Terrain）+ 2-1b 真實 DEM；
 * 再來 2-2 以 data.weather 的 lat/lon 用 InstancedMesh 畫測站點位。
 */
export function MapCanvas() {
  const region = useWorkspaceStore((s) => s.region);
  const { data, loading } = useWorkspaceData();
  const stationCount = data?.weather.length ?? 0;

  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.22_0.03_250)_0%,_oklch(0.13_0.02_250)_100%)]">
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <SpinningBox />
        <OrbitControls enableDamping />
      </Canvas>

      {/* 角落資訊：驗證資料連動仍在 */}
      <div className="pointer-events-none absolute right-4 bottom-4 text-right">
        <p className="text-foreground/80 text-sm">
          {REGION_LABELS[region]} ·{" "}
          {loading ? "載入測站中…" : `${stationCount} 個測站待渲染`}
        </p>
        <p className="text-muted-foreground text-xs">3D 場景（步驟 1：方塊驗證）</p>
      </div>
    </div>
  );
}


