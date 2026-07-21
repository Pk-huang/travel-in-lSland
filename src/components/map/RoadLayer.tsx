"use client";

import { Route } from "lucide-react";
import { useMemo, useState } from "react";

import { MapMarkerTag } from "@/src/components/map/MapMarkerTag";
import {
  POI_CARD_WIDTH_CLASS,
  POI_DESCRIPTION_TEXT_CLASS,
  POI_TITLE_TEXT_CLASS,
} from "@/src/lib/config/poi-display";
import {
  elevationToSceneY,
  lonLatToSceneXZ,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { RoadStatus, RoadSegment } from "@/src/types";

const ROAD_STYLE: Record<
  RoadStatus,
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
  open: {
    dotColorClass: "text-emerald-400",
    dotHoverColorClass: "group-hover:text-emerald-300",
    dotActiveColorClass: "text-emerald-300",
    dotActiveGlowShadowClass: "drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]",
    activeAccentClass: "border-emerald-300/80",
    activeShadowClass: "shadow-emerald-400/20",
    hoverBorderClass: "hover:border-emerald-300/70",
    expandedLineColorClass: "bg-emerald-300/90",
    expandedLineGlowShadowClass: "shadow-[0_0_12px_rgba(52,211,153,0.45)]",
  },
  caution: {
    dotColorClass: "text-amber-300",
    dotHoverColorClass: "group-hover:text-amber-200",
    dotActiveColorClass: "text-amber-200",
    dotActiveGlowShadowClass: "drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    activeAccentClass: "border-amber-300/80",
    activeShadowClass: "shadow-amber-400/20",
    hoverBorderClass: "hover:border-amber-300/70",
    expandedLineColorClass: "bg-amber-200/90",
    expandedLineGlowShadowClass: "shadow-[0_0_12px_rgba(251,191,36,0.45)]",
  },
  closed: {
    dotColorClass: "text-rose-400",
    dotHoverColorClass: "group-hover:text-rose-300",
    dotActiveColorClass: "text-rose-300",
    dotActiveGlowShadowClass: "drop-shadow-[0_0_8px_rgba(251,113,133,0.9)]",
    activeAccentClass: "border-rose-300/80",
    activeShadowClass: "shadow-rose-400/20",
    hoverBorderClass: "hover:border-rose-300/70",
    expandedLineColorClass: "bg-rose-300/90",
    expandedLineGlowShadowClass: "shadow-[0_0_12px_rgba(251,113,133,0.45)]",
  },
};

const ROAD_SURFACE_OFFSET = 0.35;

export function RoadLayer({ roads }: { roads: RoadSegment[] }) {
  const heightmap = useHeightmap();
  const [hoveredRoadId, setHoveredRoadId] = useState<string | null>(null);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const setActiveInfoPanelSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);

  const markerItems = useMemo(
    () =>
      roads.map((road) => {
        const [lon = 0, lat = 0] = road.geometry[0] ?? [0, 0];
        const { x, z } = lonLatToSceneXZ(lon, lat);
        const surfaceY = heightmap
          ? elevationToSceneY(sampleElevationMeters(heightmap, lon, lat))
          : 0;
        return {
          markerId: road.segmentId,
          x,
          y: surfaceY + ROAD_SURFACE_OFFSET,
          z,
          road,
        };
      }),
    [roads, heightmap],
  );

  return (
    <>
      {markerItems.map(({ markerId, x, y, z, road }) => {
        const style = ROAD_STYLE[road.status];
        const isHovered = hoveredRoadId === markerId;
        const description = road.reason ?? `status: ${road.status}`;

        return (
          <MapMarkerTag
            key={markerId}
            markerId={markerId}
            label={road.name}
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
            markerIcon={<Route className="size-[1.04vw] min-h-4 min-w-4" strokeWidth={2.5} />}
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
            onHoverChange={setHoveredRoadId}
            onSelect={() => {
              const [lon = 0, lat = 0] = road.geometry[0] ?? [0, 0];
              setPoiFocusEnabled(false);
              setMapFocusTarget({ lon, lat });
              setActiveInfoPanelSection("road");
            }}
          />
        );
      })}
    </>
  );
}
