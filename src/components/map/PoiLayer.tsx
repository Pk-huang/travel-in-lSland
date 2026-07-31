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

const POI_MARKER_SURFACE_OFFSET = 0.35;
const POI_MARKER_ELEVATED_OFFSET = POI_MARKER_SURFACE_OFFSET * 1.5;

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
  const visiblePois =
    poiFocusEnabled && activePoiId
      ? pointsOfInterest.filter((poi) => poi.id === activePoiId)
      : pointsOfInterest;

  const handleSelectPoi = (markerId: string) => {
    const shouldToggleOff = activePoiId === markerId && poiFocusEnabled;
    setActivePoi(shouldToggleOff ? null : markerId);
    setPoiFocusEnabled(!shouldToggleOff);
    setActiveInfoPanelSection("poi");
  };

  return (
    <>
      {visiblePois.map((poi) => {
        const { x, z } = lonLatToSceneXZ(poi.lon, poi.lat);
        const surfaceY = heightmap
          ? elevationToSceneY(sampleElevationMeters(heightmap, poi.lon, poi.lat))
          : 0;
        const isActive = poiFocusEnabled && activePoiId === poi.id;
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
              isActive={isActive}
              isHovered={isHovered}
              icon={MapPin}
              tone="poi"
              onHoverChange={setHoveredPoiId}
              onSelect={handleSelectPoi}
              detailContent={{
                title: poi.labelZhHant || poi.label,
                description: poi.descriptionShort,
                longDescription: poi.descriptionLong || poi.description,
                imageUrl: poi.imageGallery[0]?.imageUrl ?? poi.imageUrl,
                imageAlt: `${poi.label} photo`,
                images: poi.imageGallery.length > 0 ? poi.imageGallery : [{ imageUrl: poi.imageUrl, alt: `${poi.label} photo` }],
                tags: poi.tags.slice(0, 4),
                travelInfo: poi.travel?.publicTransport,
                cautionNotes: poi.cautionNotes.slice(0, 3),
              }}
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