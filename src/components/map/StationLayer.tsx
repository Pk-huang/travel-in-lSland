"use client";

import { Activity } from "lucide-react";
import { useMemo, useState } from "react";

import { MapMarkerTag } from "@/src/components/ui/map-marker-tag";
import type { WeatherConditions } from "@/src/types";
import {
  lonLatToSceneXZ,
  elevationToSceneY,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { selectVisibleMarkerIds } from "@/src/lib/map/marker-visibility";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * StationLayer：氣象測站標籤層（與 POI 共用同款圖釘 UI）。
 *
 * - 資料由 MapCanvas 以 prop 傳入。
 * - 外觀與 POI 共用 MapMarkerTag；顏色透過 tone 變體統一在元件內定義。
 * - 水平座標 lonLatToSceneXZ(lon,lat) → (x,z)；高度 Y 以 sampleElevationMeters + elevationToSceneY
 *   取該點地形表面高度，再加 offset 讓標籤立於地表上方。
 */

/** 觀測站標籤離地高度（unit）。 */
const STATION_SURFACE_OFFSET = 0.35;
const STATION_DEFAULT_VISIBLE_MARKER_COUNT = 5;

function getWeatherPriority(alertLevel: WeatherConditions["alertLevel"]) {
  if (alertLevel === "high") return 3;
  if (alertLevel === "medium") return 2;
  return 1;
}

export function StationLayer({ stations }: { stations: WeatherConditions[] }) {
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

  const visibleStationMarkerIds = useMemo(() => {
    return selectVisibleMarkerIds(
      positions.map((marker) => ({
        markerId: marker.markerId,
        priority: getWeatherPriority(marker.station.alertLevel),
        alwaysVisible:
          marker.station.alertLevel !== "low" ||
          selectedStationId === marker.markerId,
        isHovered: hoveredStationKey === marker.markerId,
      })),
      STATION_DEFAULT_VISIBLE_MARKER_COUNT,
    );
  }, [positions, hoveredStationKey, selectedStationId]);

  return (
    <>
      {positions
        .filter(({ markerId }) => visibleStationMarkerIds.has(markerId))
        .map(({ markerId, x, y, z, station }) => {
        const isHovered = hoveredStationKey === markerId;
        const isSelected = selectedStationId === markerId;
        const label = `${station.lat.toFixed(2)}, ${station.lon.toFixed(2)}`;
        const description = `${station.temperatureC.toFixed(1)}°C  風 ${station.windSpeedMs.toFixed(1)} m/s`;

        return (
          <MapMarkerTag
            key={markerId}
            markerId={markerId}
            label={label}
            description={description}
            x={x}
            y={y}
            z={z}
            isActive={isHovered || isSelected}
            isHovered={isHovered}
            icon={Activity}
            tone="weather"
            toneLevel={station.alertLevel}
            onHoverChange={setHoveredStationKey}
            onSelect={() => {
              setPoiFocusEnabled(false);
              selectStation(markerId);
              setMapFocusTarget({ lon: station.lon, lat: station.lat });
              setActiveInfoPanelSection("weather");
            }}
          />
        );
      })}
    </>
  );
}
