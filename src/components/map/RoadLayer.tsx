"use client";

import { Route } from "lucide-react";
import { useMemo, useState } from "react";

import { MapMarkerTag } from "@/src/components/ui/map-marker-tag";
import {
  elevationToSceneY,
  lonLatToSceneXZ,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { selectVisibleMarkerIds } from "@/src/lib/map/marker-visibility";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { RoadSegment } from "@/src/types";

const ROAD_SURFACE_OFFSET = 0.35;
const ROAD_DEFAULT_VISIBLE_MARKER_COUNT = 5;

function getRoadPriority(status: RoadSegment["status"]) {
  if (status === "closed") return 3;
  if (status === "caution") return 2;
  return 1;
}

export function RoadLayer({ roads }: { roads: RoadSegment[] }) {
  const heightmap = useHeightmap();
  const [hoveredRoadId, setHoveredRoadId] = useState<string | null>(null);
  const selectedRoadSegmentId = useWorkspaceStore((s) => s.selectedRoadSegmentId);
  const selectRoadSegment = useWorkspaceStore((s) => s.selectRoadSegment);
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

  const visibleRoadMarkerIds = useMemo(() => {
    return selectVisibleMarkerIds(
      markerItems.map((marker) => ({
        markerId: marker.markerId,
        priority: getRoadPriority(marker.road.status),
        alwaysVisible:
          marker.road.status !== "open" ||
          selectedRoadSegmentId === marker.markerId,
        isHovered: hoveredRoadId === marker.markerId,
      })),
      ROAD_DEFAULT_VISIBLE_MARKER_COUNT,
    );
  }, [markerItems, hoveredRoadId, selectedRoadSegmentId]);

  return (
    <>
      {markerItems
        .filter(({ markerId }) => visibleRoadMarkerIds.has(markerId))
        .map(({ markerId, x, y, z, road }) => {
        const isHovered = hoveredRoadId === markerId;
        const isSelected = selectedRoadSegmentId === markerId;
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
            isActive={isHovered || isSelected}
            isHovered={isHovered}
            icon={Route}
            tone="road"
            toneLevel={road.status}
            onHoverChange={setHoveredRoadId}
            onSelect={() => {
              const [lon = 0, lat = 0] = road.geometry[0] ?? [0, 0];
              setPoiFocusEnabled(false);
              selectRoadSegment(markerId);
              setMapFocusTarget({ lon, lat });
              setActiveInfoPanelSection("road");
            }}
          />
        );
      })}
    </>
  );
}
