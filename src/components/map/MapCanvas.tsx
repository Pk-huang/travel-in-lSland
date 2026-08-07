"use client";

import { Canvas } from "@react-three/fiber";

import { Terrain } from "@/src/components/map/Terrain";
import { SeaLevel } from "@/src/components/map/SeaLevel";
import { CameraRig } from "@/src/components/map/CameraRig";
import { PoiLayer } from "@/src/components/map/poi";
import { RoadLayer } from "@/src/components/map/RoadLayer";
import { StationLayer } from "@/src/components/map/StationLayer";
import { TravelStopLayer } from "@/src/components/map/TravelStopLayer";
import { Lighting } from "@/src/components/map/Lighting";
import {
  useWorkspaceData,
  useWorkspaceTravelPlans,
} from "@/src/components/providers/WorkspaceProvider";
import { useInfoModeState } from "@/src/app-shell/hooks/useInfoModeState";
import { useMarkerInteraction } from "@/src/lib/map/marker-interaction";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * MapCanvas：3D 地圖島（client island）— 全螢幕背景層。
 *
 * Phase 2-1a 步驟 2a：以一塊躺平的平面（Terrain）取代驗證方塊。
 * 後續步驟將替換為 low-poly 地形（Terrain）+ 2-1b 真實 DEM；
 * 再來 2-2 以 data.weather 的 lat/lon 用 InstancedMesh 畫測站點位。
 */
export function MapCanvas() {
  const { dispatch } = useMarkerInteraction();
  const selectedTravelDayId = useWorkspaceStore((s) => s.selectedTravelDayId);
  const { activeMode } = useInfoModeState();
  const { data } = useWorkspaceData();
  const { data: travelPlans } = useWorkspaceTravelPlans();
  const shouldShowPoiPins = activeMode === "poi";
  const isWeatherMode = activeMode === "weather";
  const shouldShowRoads = activeMode === "road";
  const selectedDay =
    travelPlans.plans[0]?.days.find((day) => day.dayId === selectedTravelDayId) ?? null;

  const handlePointerMissed = () => {
    dispatch({ type: "clear-interaction", source: "blank-map" });
  };

  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.22_0.03_250)_0%,_oklch(0.13_0.02_250)_100%)]">
      <Canvas
        camera={{ position: [12, 36, 12], fov: 50 }}
        dpr={[1, 2]}
        onPointerMissed={handlePointerMissed}
      >
        <Lighting />
        <Terrain />
        <SeaLevel />
        {selectedDay ? <TravelStopLayer day={selectedDay} /> : null}
        {shouldShowPoiPins ? <PoiLayer /> : null}
        {data ? <StationLayer stations={data.weather} isWeatherMode={isWeatherMode} /> : null}
        {shouldShowRoads && data ? <RoadLayer roads={data.roads} /> : null}
        <CameraRig />
      </Canvas>
    </div>
  );
}


