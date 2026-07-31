"use client";

import { Html } from "@react-three/drei";
import { MapPin } from "lucide-react";
import { useState } from "react";

import { MapMarkerTag } from "@/src/components/ui/map-marker-tag";
import { useWorkspacePois } from "@/src/components/providers/WorkspaceProvider";
import {
  elevationToSceneY,
  lonLatToSceneXZ,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { usePoiController } from "./usePoiController";

const POI_MARKER_SURFACE_OFFSET = 0.35;
const POI_MARKER_ELEVATED_OFFSET = POI_MARKER_SURFACE_OFFSET * 1.5;

/**
 * POI 圖釘控制台：統一負責景點選取、聚焦與內容派送，
 * 讓地圖上的各種景點 UI 只負責呈現，不必各自處理互動邏輯。
 */
export function PoiLayer() {
  const heightmap = useHeightmap();
  const { points: pointsOfInterest } = useWorkspacePois();
  const { activePoi, visiblePois, isActive, selectPoi, getDetailContent } = usePoiController(
    pointsOfInterest,
  );
  const [hoveredPoiId, setHoveredPoiId] = useState<string | null>(null);

  return (
    <>
      {visiblePois.map((poi) => {
        const { x, z } = lonLatToSceneXZ(poi.lon, poi.lat);
        const surfaceY = heightmap
          ? elevationToSceneY(sampleElevationMeters(heightmap, poi.lon, poi.lat))
          : 0;
        const currentIsActive = isActive(poi.id);
        const isHovered = hoveredPoiId === poi.id;

        return (
          <group key={poi.id}>
            <MapMarkerTag
              markerId={poi.id}
              label={poi.label}
              description={poi.description}
              x={x}
              y={surfaceY + POI_MARKER_ELEVATED_OFFSET}
              z={z}
              isActive={currentIsActive}
              isHovered={isHovered}
              icon={MapPin}
              tone="poi"
              onHoverChange={setHoveredPoiId}
              onSelect={selectPoi}
              detailContent={getDetailContent(poi)}
            />
          </group>
        );
      })}

      {activePoi ? (
        <Html position={[0, 8.5, 0]} distanceFactor={14}>
          <div className="pointer-events-none rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] text-white/70 backdrop-blur">
            已選擇景點：{activePoi.label}
          </div>
        </Html>
      ) : null}
    </>
  );
}
