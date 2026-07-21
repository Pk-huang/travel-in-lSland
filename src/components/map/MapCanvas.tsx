"use client";

import { Canvas } from "@react-three/fiber";

import { Terrain } from "@/src/components/map/Terrain";
import { SeaLevel } from "@/src/components/map/SeaLevel";
import { CameraRig } from "@/src/components/map/CameraRig";
import { PoiLayer } from "@/src/components/map/PoiLayer";
import { RoadLayer } from "@/src/components/map/RoadLayer";
import { StationLayer } from "@/src/components/map/StationLayer";
import { Lighting } from "@/src/components/map/Lighting";
import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * MapCanvas：3D 地圖島（client island）— 全螢幕背景層。
 *
 * Phase 2-1a 步驟 2a：以一塊躺平的平面（Terrain）取代驗證方塊。
 * 後續步驟將替換為 low-poly 地形（Terrain）+ 2-1b 真實 DEM；
 * 再來 2-2 以 data.weather 的 lat/lon 用 InstancedMesh 畫測站點位。
 */
export function MapCanvas() {
  const activeInfoPanelSection = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const clearPoiFocus = useWorkspaceStore((s) => s.clearPoiFocus);
  const { data } = useWorkspaceData();
  const shouldShowPoiPins = activeInfoPanelSection === "poi";
  const shouldShowStations = activeInfoPanelSection === "weather";
  const shouldShowRoads = activeInfoPanelSection === "road";

  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.22_0.03_250)_0%,_oklch(0.13_0.02_250)_100%)]">
      <Canvas
        camera={{ position: [12, 36, 12], fov: 50 }}
        dpr={[1, 2]}
        onPointerMissed={() => clearPoiFocus()}
      >
        <Lighting />
        <Terrain />
        <SeaLevel />
        {shouldShowPoiPins ? <PoiLayer /> : null}
        {shouldShowStations && data ? <StationLayer stations={data.weather} /> : null}
        {shouldShowRoads && data ? <RoadLayer roads={data.roads} /> : null}
        <CameraRig />
      </Canvas>
    </div>
  );
}


