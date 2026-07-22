"use client";

import { Html } from "@react-three/drei";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";

const iconToneVariants = cva("mt-0.5 inline-flex shrink-0 items-center justify-center transition-colors", {
  variants: {
    tone: {
      poi: "",
      weather: "",
      road: "",
      neutral: "",
    },
    toneLevel: {
      default: "",
      low: "",
      medium: "",
      high: "",
      open: "",
      caution: "",
      closed: "",
    },
    active: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      tone: "poi",
      toneLevel: "default",
      active: true,
      className: "text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.9)]",
    },
    {
      tone: "poi",
      toneLevel: "default",
      active: false,
      className: "text-white/85 group-hover:text-sky-300",
    },
    {
      tone: "weather",
      toneLevel: "default",
      active: true,
      className: "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]",
    },
    {
      tone: "weather",
      toneLevel: "default",
      active: false,
      className: "text-white/85 group-hover:text-emerald-300",
    },
    {
      tone: "weather",
      toneLevel: "low",
      active: true,
      className: "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]",
    },
    {
      tone: "weather",
      toneLevel: "low",
      active: false,
      className: "text-emerald-400 group-hover:text-emerald-300",
    },
    {
      tone: "weather",
      toneLevel: "medium",
      active: true,
      className: "text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    },
    {
      tone: "weather",
      toneLevel: "medium",
      active: false,
      className: "text-amber-300 group-hover:text-amber-200",
    },
    {
      tone: "weather",
      toneLevel: "high",
      active: true,
      className: "text-rose-300 drop-shadow-[0_0_8px_rgba(251,113,133,0.9)]",
    },
    {
      tone: "weather",
      toneLevel: "high",
      active: false,
      className: "text-rose-400 group-hover:text-rose-300",
    },
    {
      tone: "road",
      toneLevel: "default",
      active: true,
      className: "text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    },
    {
      tone: "road",
      toneLevel: "default",
      active: false,
      className: "text-white/85 group-hover:text-amber-300",
    },
    {
      tone: "road",
      toneLevel: "open",
      active: true,
      className: "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]",
    },
    {
      tone: "road",
      toneLevel: "open",
      active: false,
      className: "text-emerald-400 group-hover:text-emerald-300",
    },
    {
      tone: "road",
      toneLevel: "caution",
      active: true,
      className: "text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    },
    {
      tone: "road",
      toneLevel: "caution",
      active: false,
      className: "text-amber-300 group-hover:text-amber-200",
    },
    {
      tone: "road",
      toneLevel: "closed",
      active: true,
      className: "text-rose-300 drop-shadow-[0_0_8px_rgba(251,113,133,0.9)]",
    },
    {
      tone: "road",
      toneLevel: "closed",
      active: false,
      className: "text-rose-400 group-hover:text-rose-300",
    },
    {
      tone: "neutral",
      toneLevel: "default",
      active: true,
      className: "text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.9)]",
    },
    {
      tone: "neutral",
      toneLevel: "default",
      active: false,
      className: "text-white/85 group-hover:text-sky-300",
    },
  ],
  defaultVariants: {
    tone: "neutral",
    toneLevel: "default",
    active: false,
  },
});

const buttonToneVariants = cva("", {
  variants: {
    tone: {
      poi: "",
      weather: "",
      road: "",
      neutral: "",
    },
    active: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { tone: "poi", active: true, className: "border-sky-300/80 shadow-sky-400/20" },
    { tone: "poi", active: false, className: "hover:border-sky-300/70 hover:scale-[1.03]" },
    {
      tone: "weather",
      active: true,
      className: "border-emerald-300/80 shadow-emerald-400/20",
    },
    {
      tone: "weather",
      active: false,
      className: "hover:border-emerald-300/70 hover:scale-[1.03]",
    },
    { tone: "road", active: true, className: "border-amber-300/80 shadow-amber-400/20" },
    { tone: "road", active: false, className: "hover:border-amber-300/70 hover:scale-[1.03]" },
    { tone: "neutral", active: true, className: "border-sky-300/80 shadow-sky-400/20" },
    { tone: "neutral", active: false, className: "hover:border-sky-300/70 hover:scale-[1.03]" },
  ],
  defaultVariants: {
    tone: "neutral",
    active: false,
  },
});

const stemToneVariants = cva("pointer-events-none w-[2px] transition-all duration-200 ease-out", {
  variants: {
    tone: {
      poi: "",
      weather: "",
      road: "",
      neutral: "",
    },
    preview: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      tone: "poi",
      preview: true,
      className: "h-48 bg-sky-300/90 shadow-[0_0_12px_rgba(125,211,252,0.45)]",
    },
    { tone: "poi", preview: false, className: "h-24 bg-white/60" },
    {
      tone: "weather",
      preview: true,
      className: "h-48 bg-emerald-300/90 shadow-[0_0_12px_rgba(110,231,183,0.45)]",
    },
    { tone: "weather", preview: false, className: "h-24 bg-white/60" },
    {
      tone: "road",
      preview: true,
      className: "h-48 bg-amber-200/90 shadow-[0_0_12px_rgba(251,191,36,0.45)]",
    },
    { tone: "road", preview: false, className: "h-24 bg-white/60" },
    {
      tone: "neutral",
      preview: true,
      className: "h-48 bg-sky-300/90 shadow-[0_0_12px_rgba(125,211,252,0.45)]",
    },
    { tone: "neutral", preview: false, className: "h-24 bg-white/60" },
  ],
  defaultVariants: {
    tone: "neutral",
    preview: false,
  },
});

type MapMarkerTone = NonNullable<VariantProps<typeof iconToneVariants>["tone"]>;
type MapMarkerToneLevel = NonNullable<VariantProps<typeof iconToneVariants>["toneLevel"]>;

type MapMarkerTagProps = {
  markerId: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
  isHovered: boolean;
  icon: LucideIcon;
  onHoverChange: (markerId: string | null) => void;
  onSelect?: (markerId: string) => void;
  tone?: MapMarkerTone;
  toneLevel?: MapMarkerToneLevel;
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
  icon: Icon,
  tone = "neutral",
  toneLevel = "default",
  onHoverChange,
  onSelect,
}: MapMarkerTagProps) {
  const showPreview = isHovered || isActive;
  const toneKey = tone ?? "neutral";

  return (
    <Html position={[x, y, z]} distanceFactor={30}>
      <div
        className="pointer-events-auto flex w-[24vw] min-w-60 flex-col items-center overflow-visible"
        style={{ transform: "translate3d(-50%, -100%, 0)" }}
        onPointerEnter={() => onHoverChange(markerId)}
        onPointerLeave={() => onHoverChange(null)}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.(markerId);
          }}
          className={cn(
            "group flex w-full items-start gap-6 rounded-full border border-white/30 bg-black/80 px-[2.4vw] py-[1em] text-white shadow-lg backdrop-blur transition-all duration-200 ease-out",
            buttonToneVariants({ tone: toneKey, active: isActive }),
            showPreview ? "rounded-3xl" : "rounded-full",
            onSelect ? "cursor-pointer" : "cursor-default",
          )}
          aria-label={`選擇標記 ${label}`}
        >
          <span className={cn(iconToneVariants({ tone: toneKey, toneLevel, active: isActive }))}>
            <Icon className="size-[1em]" strokeWidth={1.75} />
          </span>

          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[1.23vw] leading-tight font-semibold text-white min-[1400px]:text-xl">
              {label}
            </span>
            {description ? (
              <span
                className={cn(
                  "block overflow-hidden text-[1.02vw] leading-[1.45] text-white/70 transition-all duration-200 ease-out min-[1400px]:text-lg",
                  showPreview ? "mt-1 max-h-[7.5rem] opacity-100" : "max-h-0 opacity-0",
                )}
              >
                {description}
              </span>
            ) : null}
          </span>
        </button>

        <div className={cn(stemToneVariants({ tone: toneKey, preview: showPreview }))} />
      </div>
    </Html>
  );
}
