"use client";

import { useMemo, useState } from "react";

import { MapMarkerTag } from "@/src/components/map/MapMarkerTag";
import type { WeatherConditions, AlertLevel } from "@/src/types";
import {
  lonLatToSceneXZ,
  elevationToSceneY,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import {
  POI_CARD_WIDTH_CLASS,
  POI_DESCRIPTION_TEXT_CLASS,
  POI_TITLE_TEXT_CLASS,
} from "@/src/lib/config/poi-display";
import { useHeightmap } from "@/src/lib/map/use-heightmap";

/**
 * StationLayer：氣象測站標籤層（與 POI 共用同款圖釘 UI）。
 *
 * - 資料由 MapCanvas 以 prop 傳入。
 * - 外觀與 POI 共用 MapMarkerTag；差異透過色彩設定（low/medium/high）。
 * - 水平座標 lonLatToSceneXZ(lon,lat) → (x,z)；高度 Y 以 sampleElevationMeters + elevationToSceneY
 *   取該點地形表面高度，再加 offset 讓標籤立於地表上方。
 */

/** 風險等級樣式：共用 UI，不同內容僅換配色。 */
const ALERT_STYLE: Record<
  AlertLevel,
  {
    dotColorClass: string;
    dotHoverColorClass: string;
    dotActiveColorClass: string;
    dotActiveGlowShadowClass: string;
    activeAccentClass: string;
    activeShadowClass: string;
    hoverBorderClass: string;
    expandedLineColorClass: string;
    expandedLineGlowShadowClass: string;
  }
> = {
  low: {
    dotColorClass: "bg-emerald-400",
    dotHoverColorClass: "group-hover:bg-emerald-300",
    dotActiveColorClass: "bg-emerald-300",
    dotActiveGlowShadowClass: "shadow-[0_0_12px_rgba(52,211,153,0.9)]",
    activeAccentClass: "border-emerald-300/80",
    activeShadowClass: "shadow-emerald-400/20",
    hoverBorderClass: "hover:border-emerald-300/70",
    expandedLineColorClass: "bg-emerald-300/90",
    expandedLineGlowShadowClass: "shadow-[0_0_12px_rgba(52,211,153,0.45)]",
  },
  medium: {
    dotColorClass: "bg-amber-300",
    dotHoverColorClass: "group-hover:bg-amber-200",
    dotActiveColorClass: "bg-amber-200",
    dotActiveGlowShadowClass: "shadow-[0_0_12px_rgba(251,191,36,0.9)]",
    activeAccentClass: "border-amber-300/80",
    activeShadowClass: "shadow-amber-400/20",
    hoverBorderClass: "hover:border-amber-300/70",
    expandedLineColorClass: "bg-amber-200/90",
    expandedLineGlowShadowClass: "shadow-[0_0_12px_rgba(251,191,36,0.45)]",
  },
  high: {
    dotColorClass: "bg-rose-400",
    dotHoverColorClass: "group-hover:bg-rose-300",
    dotActiveColorClass: "bg-rose-300",
    dotActiveGlowShadowClass: "shadow-[0_0_12px_rgba(251,113,133,0.9)]",
    activeAccentClass: "border-rose-300/80",
    activeShadowClass: "shadow-rose-400/20",
    hoverBorderClass: "hover:border-rose-300/70",
    expandedLineColorClass: "bg-rose-300/90",
    expandedLineGlowShadowClass: "shadow-[0_0_12px_rgba(251,113,133,0.45)]",
  },
};

/** 觀測站標籤離地高度（unit）。 */
const STATION_SURFACE_OFFSET = 0.35;

export function StationLayer({ stations }: { stations: WeatherConditions[] }) {
  const heightmap = useHeightmap();
  const [hoveredStationKey, setHoveredStationKey] = useState<string | null>(null);

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

  return (
    <>
      {positions.map(({ markerId, x, y, z, station }) => {
        const style = ALERT_STYLE[station.alertLevel];
        const isHovered = hoveredStationKey === markerId;
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
            isActive={isHovered}
            isHovered={isHovered}
            dotColorClass={style.dotColorClass}
            dotHoverColorClass={style.dotHoverColorClass}
            dotActiveColorClass={style.dotActiveColorClass}
            dotActiveGlowShadowClass={style.dotActiveGlowShadowClass}
            activeAccentClass={style.activeAccentClass}
            activeShadowClass={style.activeShadowClass}
            hoverBorderClass={style.hoverBorderClass}
            widthClass={POI_CARD_WIDTH_CLASS}
            titleTextClass={POI_TITLE_TEXT_CLASS}
            descriptionTextClass={POI_DESCRIPTION_TEXT_CLASS}
            expandedDescriptionHeightClass="max-h-[7.5rem]"
            collapsedLineHeightClass="h-24"
            expandedLineHeightClass="h-48"
            expandedLineColorClass={style.expandedLineColorClass}
            expandedLineGlowShadowClass={style.expandedLineGlowShadowClass}
            onHoverChange={setHoveredStationKey}
          />
        );
      })}
    </>
  );
}
