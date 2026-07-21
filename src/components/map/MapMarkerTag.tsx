"use client";

import { Html } from "@react-three/drei";
import type { ReactNode } from "react";

type MapMarkerTagProps = {
  markerId: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
  isHovered: boolean;
  dotColorClass: string;
  dotHoverColorClass?: string;
  dotActiveColorClass: string;
  dotActiveGlowShadowClass?: string;
  markerIcon?: ReactNode;
  markerIconClassName?: string;
  activeAccentClass: string;
  activeShadowClass?: string;
  hoverBorderClass?: string;
  widthClass: string;
  titleTextClass: string;
  descriptionTextClass: string;
  expandedDescriptionHeightClass: string;
  collapsedLineHeightClass: string;
  expandedLineHeightClass: string;
  expandedLineColorClass?: string;
  expandedLineGlowShadowClass?: string;
  onHoverChange: (markerId: string | null) => void;
  onSelect?: (markerId: string) => void;
};

export function MapMarkerTag({
  markerId,
  label,
  description,
  x,
  y,
  z,
  isActive,
  isHovered,
  dotColorClass,
  dotHoverColorClass = "group-hover:text-sky-300",
  dotActiveColorClass,
  dotActiveGlowShadowClass = "drop-shadow-[0_0_8px_rgba(125,211,252,0.9)]",
  markerIcon,
  markerIconClassName = "block",
  activeAccentClass,
  activeShadowClass = "shadow-sky-400/20",
  hoverBorderClass = "hover:border-sky-300/70",
  widthClass,
  titleTextClass,
  descriptionTextClass,
  expandedDescriptionHeightClass,
  collapsedLineHeightClass,
  expandedLineHeightClass,
  expandedLineColorClass = "bg-sky-300/90",
  expandedLineGlowShadowClass = "shadow-[0_0_12px_rgba(125,211,252,0.45)]",
  onHoverChange,
  onSelect,
}: MapMarkerTagProps) {
  const showPreview = isHovered || isActive;

  return (
    <Html position={[x, y, z]} center distanceFactor={10}>
      <div
        className={`pointer-events-auto flex ${widthClass} flex-col items-center overflow-visible`}
        onPointerEnter={() => onHoverChange(markerId)}
        onPointerLeave={() => onHoverChange(null)}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.(markerId);
          }}
          className={[
            "group flex w-full items-start gap-2 rounded-full border border-white/30 bg-black/80 px-[0.8vw] py-[0.55vw] text-white shadow-lg backdrop-blur transition-all duration-200 ease-out",
            isActive
              ? `${activeShadowClass} ${activeAccentClass}`
              : `${hoverBorderClass} hover:scale-[1.03]`,
            showPreview ? "rounded-3xl" : "rounded-full",
            onSelect ? "cursor-pointer" : "cursor-default",
          ].join(" ")}
          aria-label={`選擇標記 ${label}`}
        >
          <span
            className={[
              "mt-0.5 inline-flex shrink-0 items-center justify-center transition-colors",
              isActive
                ? `${dotActiveColorClass} ${dotActiveGlowShadowClass}`
                : `${dotColorClass} ${dotHoverColorClass}`,
            ].join(" ")}
          >
            {markerIcon ? <span className={markerIconClassName}>{markerIcon}</span> : null}
          </span>

          <span className="min-w-0 flex-1 text-left">
            <span className={`block truncate text-white ${titleTextClass}`}>{label}</span>
            {description ? (
              <span
                className={[
                  `block overflow-hidden text-white/70 transition-all duration-200 ease-out ${descriptionTextClass}`,
                  showPreview
                    ? `mt-1 ${expandedDescriptionHeightClass} opacity-100`
                    : "max-h-0 opacity-0",
                ].join(" ")}
              >
                {description}
              </span>
            ) : null}
          </span>
        </button>

        <div
          className={[
            "pointer-events-none w-[2px] bg-white/60 transition-all duration-200 ease-out",
            showPreview
              ? `${expandedLineHeightClass} ${expandedLineColorClass} ${expandedLineGlowShadowClass}`
              : collapsedLineHeightClass,
          ].join(" ")}
        />
      </div>
    </Html>
  );
}
