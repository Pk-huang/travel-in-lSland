"use client";

import { Html } from "@react-three/drei";
import Image from "next/image";
import { useMemo, useState } from "react";

import { getPointOfInterestById, POINTS_OF_INTEREST } from "@/src/lib/config/poi";
import {
  elevationToSceneY,
  lonLatToSceneXZ,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import {
  POI_CARD_WIDTH_CLASS,
  POI_DESCRIPTION_TEXT_CLASS,
  POI_IMAGE_HEIGHT_CLASS,
  POI_PIN_HEIGHT_CLASS,
  POI_TITLE_TEXT_CLASS,
} from "@/src/lib/config/poi-display";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

type PoiPinProps = {
  poiId: string;
  label: string;
  imageUrl: string;
  description: string;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
  isHovered: boolean;
  onHoverChange: (poiId: string | null) => void;
  onSelect: (poiId: string) => void;
};

function PoiPin({
  poiId,
  label,
  imageUrl,
  description,
  x,
  y,
  z,
  isActive,
  isHovered,
  onHoverChange,
  onSelect,
}: PoiPinProps) {
  const showPreview = isHovered || isActive;

  return (
    <Html position={[x, y, z]} center distanceFactor={10}>
      <div
        className={`pointer-events-auto flex ${POI_CARD_WIDTH_CLASS} flex-col items-center overflow-visible`}
        onPointerEnter={() => onHoverChange(poiId)}
        onPointerLeave={() => onHoverChange(null)}
      >
        <div
          className={[
            "pointer-events-none mb-4 w-full overflow-hidden rounded-2xl border border-white/15 bg-black/80 shadow-2xl shadow-black/40 transition-all duration-200 ease-out",
            showPreview
              ? "translate-y-0 opacity-100 max-h-[28rem]"
              : "-translate-y-2 opacity-0 max-h-0",
          ].join(" ")}
        >
          <Image
            src={imageUrl}
            alt={label}
            width={960}
            height={540}
            className={`w-full object-cover ${POI_IMAGE_HEIGHT_CLASS}`}
          />
          <div className="space-y-1.5 p-[0.85vw] text-left">
            <p className={`text-white ${POI_TITLE_TEXT_CLASS}`}>{label}</p>
            <p className={`text-white/70 ${POI_DESCRIPTION_TEXT_CLASS}`}>{description}</p>
          </div>
        </div>

        <div
          className={[
            "pointer-events-none mb-[-6px] h-3 w-3 rotate-45 border-l border-t border-white/15 bg-black/80 transition-all duration-200 ease-out",
            showPreview
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-0",
          ].join(" ")}
        />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(poiId);
          }}
          className={[
            `group flex w-full items-center gap-2 rounded-full border px-[0.8vw] py-[0.45vw] text-[0.75vw] font-semibold shadow-lg backdrop-blur transition-transform duration-200 ease-out ${POI_PIN_HEIGHT_CLASS}`,
            isActive
              ? "border-sky-300/80 bg-sky-400/20 text-white shadow-sky-400/20"
              : "border-white/20 bg-black/50 text-white/90 hover:border-sky-300/70 hover:bg-sky-400/15 hover:scale-[1.05]",
          ].join(" ")}
          aria-label={`選擇景點 ${label}`}
        >
          <span
            className={[
              "size-[0.55vw] min-h-2 min-w-2 rounded-full transition",
              isActive ? "bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]" : "bg-amber-300 group-hover:bg-sky-300",
            ].join(" ")}
          />
          <span className="whitespace-nowrap leading-none">{label}</span>
        </button>
      </div>
    </Html>
  );
}

/**
 * POI 圖釘層：在地圖上顯示可點擊景點，hover 時顯示圖片預覽。
 */
export function PoiLayer() {
  const heightmap = useHeightmap();
  const activePoiId = useWorkspaceStore((s) => s.activePoiId);
  const poiFocusEnabled = useWorkspaceStore((s) => s.poiFocusEnabled);
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const setActiveInfoPanelSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const activePoi = useMemo(() => getPointOfInterestById(activePoiId), [activePoiId]);
  const [hoveredPoiId, setHoveredPoiId] = useState<string | null>(null);

  return (
    <>
      {POINTS_OF_INTEREST.map((poi) => {
        const { x, z } = lonLatToSceneXZ(poi.lon, poi.lat);
        const surfaceY = heightmap
          ? elevationToSceneY(sampleElevationMeters(heightmap, poi.lon, poi.lat))
          : 0;
        const isActive = poiFocusEnabled && activePoiId === poi.id;
        const isHovered = hoveredPoiId === poi.id;

        return (
          <PoiPin
            key={poi.id}
            poiId={poi.id}
            label={poi.label}
            imageUrl={poi.imageUrl}
            description={poi.description}
            x={x}
            y={surfaceY + 0.35}
            z={z}
            isActive={isActive}
            isHovered={isHovered}
            onHoverChange={setHoveredPoiId}
            onSelect={(poiId) => {
              setActivePoi(poiId);
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