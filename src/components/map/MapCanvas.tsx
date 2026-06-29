"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { Terrain } from "@/src/components/map/Terrain";
import { DebugAxes } from "@/src/components/map/DebugAxes";
import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { REGION_LABELS } from "@/src/lib/config/app";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * MapCanvas：3D 地圖島（client island）— 全螢幕背景層。
 *
 * Phase 2-1a 步驟 2a：以一塊躺平的平面（Terrain）取代驗證方塊。
 * 後續步驟將替換為 low-poly 地形（Terrain）+ 2-1b 真實 DEM；
 * 再來 2-2 以 data.weather 的 lat/lon 用 InstancedMesh 畫測站點位。
 */
export function MapCanvas() {
  const region = useWorkspaceStore((s) => s.region);
  const { data, loading } = useWorkspaceData();
  const stationCount = data?.weather.length ?? 0;

  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.22_0.03_250)_0%,_oklch(0.13_0.02_250)_100%)]">
      <Canvas camera={{ position: [12, 12, 12], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <Terrain />
        {/* 暫時：誇張版三軸（紅=X 東西、綠=Y 高度、藍=Z 南北），長度超出地形邊緣便於對位。確認方位後移除。 */}
        <DebugAxes len={26} />
        <OrbitControls enableDamping />
      </Canvas>

      {/* 角落資訊：驗證資料連動仍在 */}
      <div className="pointer-events-none absolute right-4 bottom-4 text-right">
        <p className="text-foreground/80 text-sm">
          {REGION_LABELS[region]} ·{" "}
          {loading ? "載入測站中…" : `${stationCount} 個測站待渲染`}
        </p>
        <p className="text-muted-foreground text-xs">3D 場景（步驟 2a：平坦地面）</p>
      </div>
    </div>
  );
}


