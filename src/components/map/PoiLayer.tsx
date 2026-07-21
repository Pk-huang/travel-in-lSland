"use client";

import { Html } from "@react-three/drei";
import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { MapMarkerTag } from "@/src/components/ui/map-marker-tag";
import { findPointOfInterestById } from "@/src/lib/config/poi";
import { useWorkspacePois } from "@/src/components/providers/WorkspaceProvider";
import {
  elevationToSceneY,
  lonLatToSceneXZ,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * POI 圖釘層：在地圖上顯示可點擊景點，hover 時顯示圖片預覽。
 */
export function PoiLayer() {
  const heightmap = useHeightmap();
  const { points: pointsOfInterest } = useWorkspacePois();
  const activePoiId = useWorkspaceStore((s) => s.activePoiId);
  const poiFocusEnabled = useWorkspaceStore((s) => s.poiFocusEnabled);
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const setActiveInfoPanelSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const activePoi = useMemo(
    () => findPointOfInterestById(pointsOfInterest, activePoiId),
    [activePoiId, pointsOfInterest],
  );
  const [hoveredPoiId, setHoveredPoiId] = useState<string | null>(null);

  return (
    <>
      {pointsOfInterest.map((poi) => {
        const { x, z } = lonLatToSceneXZ(poi.lon, poi.lat);
        const surfaceY = heightmap
          ? elevationToSceneY(sampleElevationMeters(heightmap, poi.lon, poi.lat))
          : 0;
        const isActive = poiFocusEnabled && activePoiId === poi.id;
        const isHovered = hoveredPoiId === poi.id;

        return (
          <MapMarkerTag
            key={poi.id}
            markerId={poi.id}
            label={poi.label}
            description={poi.description}
            x={x}
            y={surfaceY + 0.35}
            z={z}
            isActive={isActive}
            isHovered={isHovered}
            icon={MapPin}
            tone="poi"
            onHoverChange={setHoveredPoiId}
            onSelect={(markerId) => {
              setActivePoi(markerId);
              setPoiFocusEnabled(true);
              setActiveInfoPanelSection("poi");
            }}
          />
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