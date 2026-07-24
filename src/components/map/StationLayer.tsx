"use client";

import { Html } from "@react-three/drei";
import { Activity } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/src/lib/utils";
import type { WeatherConditions } from "@/src/types";
import {
  lonLatToSceneXZ,
  elevationToSceneY,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * StationLayer：天氣測站 icon 層。
 *
 * - 資料由 MapCanvas 以 prop 傳入。
 * - 地圖預設只顯示中高風險站點（medium/high），降低視覺噪音。
 * - 若使用者從右側面板點選任一測站，該站會被保留顯示（即使是 low）。
 * - 水平座標 lonLatToSceneXZ(lon,lat) → (x,z)；高度 Y 以 sampleElevationMeters + elevationToSceneY
 *   取該點地形表面高度，再加 offset 讓 icon 立於地表上方。
 */

/** 觀測站標籤離地高度（unit）。 */
const STATION_SURFACE_OFFSET = 0.35;
const STATION_ICON_BASE_CLASS =
  "inline-flex size-8 items-center justify-center rounded-full border bg-black/70 text-white shadow-lg backdrop-blur transition";

function getWeatherIconClass(
  alertLevel: WeatherConditions["alertLevel"],
  isSelected: boolean,
) {
  if (alertLevel === "high") {
    return isSelected
      ? "border-rose-200 text-rose-200 shadow-rose-300/40"
      : "border-rose-400/80 text-rose-300 shadow-rose-400/25";
  }

  if (alertLevel === "medium") {
    return isSelected
      ? "border-amber-100 text-amber-100 shadow-amber-300/40"
      : "border-amber-300/80 text-amber-200 shadow-amber-300/25";
  }

  return isSelected
    ? "border-emerald-200 text-emerald-200 shadow-emerald-300/35"
    : "border-emerald-400/75 text-emerald-300 shadow-emerald-300/20";
}

export function StationLayer({
  stations,
  isWeatherMode,
}: {
  stations: WeatherConditions[];
  isWeatherMode: boolean;
}) {
  const heightmap = useHeightmap();
  const [hoveredStationKey, setHoveredStationKey] = useState<string | null>(null);
  const selectedStationId = useWorkspaceStore((s) => s.selectedStationId);
  const selectStation = useWorkspaceStore((s) => s.selectStation);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const setActiveInfoPanelSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);

  const positions = useMemo(
    () =>
      stations.map((station, index) => {
        const { x, z } = lonLatToSceneXZ(station.lon, station.lat);
        const surfaceY = heightmap
          ? elevationToSceneY(
              sampleElevationMeters(heightmap, station.lon, station.lat),
            )
          : 0;
        const y = surfaceY + STATION_SURFACE_OFFSET;
        const markerId = `station-${index}`;
        return { markerId, x, y, z, station };
      }),
    [stations, heightmap],
  );

  const visibleStations = useMemo(() => {
    return positions.filter((marker) => {
      const isSelected = marker.markerId === selectedStationId;
      if (isSelected) {
        return true;
      }
      return marker.station.alertLevel === "high" || marker.station.alertLevel === "medium";
    });
  }, [positions, selectedStationId]);

  return (
    <>
      {visibleStations.map(({ markerId, x, y, z, station }) => {
        const isHovered = hoveredStationKey === markerId;
        const isSelected = selectedStationId === markerId;
        const markerToneClass = getWeatherIconClass(station.alertLevel, isSelected || isHovered);

        return (
          <Html key={markerId} position={[x, y, z]} distanceFactor={38}>
            <div
              className="pointer-events-auto"
              onPointerEnter={() => setHoveredStationKey(markerId)}
              onPointerLeave={() => setHoveredStationKey(null)}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPoiFocusEnabled(false);
                  selectStation(markerId);
                  setMapFocusTarget({ lon: station.lon, lat: station.lat });
                  setActiveInfoPanelSection("weather");
                }}
                className={cn(STATION_ICON_BASE_CLASS, markerToneClass)}
                aria-label={`天氣站 ${markerId}`}
                title={`${station.temperatureC.toFixed(1)}°C / 風 ${station.windSpeedMs.toFixed(1)} m/s`}
              >
                <Activity className="size-4" />
              </button>

              {isWeatherMode && (isSelected || isHovered) ? (
                <div className="mt-1 min-w-40 rounded-lg border border-white/20 bg-black/80 px-2 py-1 text-xs text-white/85 shadow-lg backdrop-blur">
                  <p className="font-semibold">{station.temperatureC.toFixed(1)}°C</p>
                  <p className="text-white/70">風速 {station.windSpeedMs.toFixed(1)} m/s</p>
                  <p className="text-white/60">{station.lat.toFixed(2)}, {station.lon.toFixed(2)}</p>
                </div>
              ) : null}
            </div>
          </Html>
        );
      })}
    </>
  );
}
