"use client";

import { Html } from "@react-three/drei";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

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

type MarkerDetailContent = {
  title?: string;
  description?: string;
  longDescription?: string;
  imageUrl?: string;
  imageAlt?: string;
  images?: Array<{ imageUrl: string; alt?: string }>;
  tags?: string[];
  travelInfo?: string;
  cautionNotes?: string[];
};

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
  detailContent?: MarkerDetailContent;
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
  detailContent,
}: MapMarkerTagProps) {
  const isDetailExpanded = isActive;
  const isHighlighted = isActive || isHovered;
  const toneKey = tone ?? "neutral";
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const detailImages = detailContent?.images?.length ? detailContent.images : [];
  const activeImage = detailImages[Math.min(activeImageIndex, Math.max(detailImages.length - 1, 0))];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [detailContent?.title, detailContent?.images?.map((image) => image.imageUrl).join("|")]);

  const showPreviousImage = () => {
    if (detailImages.length <= 1) return;
    setActiveImageIndex((current) => (current === 0 ? detailImages.length - 1 : current - 1));
  };

  const showNextImage = () => {
    if (detailImages.length <= 1) return;
    setActiveImageIndex((current) => (current + 1) % detailImages.length);
  };

  return (
    <Html position={[x, y, z]} distanceFactor={30}>
      <div
        className="pointer-events-auto flex w-[24vw] min-w-60 flex-col items-center overflow-visible"
        style={{ transform: "translate3d(-50%, -100%, 0)" }}
        onPointerEnter={() => onHoverChange(markerId)}
        onPointerLeave={() => onHoverChange(null)}
      >
        {isDetailExpanded && detailContent ? (
          <div className="pointer-events-none mb-2 w-full max-w-[22rem] overflow-hidden rounded-[1.35rem] border border-sky-300/20 bg-slate-950/90 text-left shadow-[0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="border-b border-white/10 bg-gradient-to-r from-sky-500/15 to-transparent px-3 py-2.5">
              <p className="text-[0.63rem] uppercase tracking-[0.28em] text-sky-200/70">景點詳情</p>
              {detailContent.title ? (
                <p className="mt-1 text-[0.95vw] font-semibold text-white min-[1400px]:text-base">
                  {detailContent.title}
                </p>
              ) : null}
            </div>

            {detailImages.length > 0 ? (
              <div className="border-b border-white/10 bg-slate-900/70 p-2.5">
                <div className="pointer-events-auto relative overflow-hidden rounded-2xl">
                  {activeImage ? (
                    <img
                      src={activeImage.imageUrl}
                      alt={activeImage.alt ?? detailContent.imageAlt ?? detailContent.title ?? "景點圖片"}
                      className="h-32 w-full object-cover"
                    />
                  ) : null}

                  {detailImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          showPreviousImage();
                        }}
                        className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 backdrop-blur"
                        aria-label="上一張圖片"
                      >
                        <ChevronLeft className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          showNextImage();
                        }}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 backdrop-blur"
                        aria-label="下一張圖片"
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </>
                  ) : null}
                </div>

                {detailImages.length > 1 ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      {detailImages.map((image, index) => (
                        <button
                          key={`${image.imageUrl}-${index}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveImageIndex(index);
                          }}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            index === activeImageIndex ? "w-6 bg-sky-300" : "w-1.5 bg-white/35",
                          )}
                          aria-label={`查看第 ${index + 1} 張圖片`}
                        />
                      ))}
                    </div>
                    <p className="text-[0.68rem] text-white/60">{activeImageIndex + 1}/{detailImages.length}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3 px-3 py-3">
              {detailContent.description ? (
                <p className="text-[0.9vw] leading-[1.5] text-sky-100/90 min-[1400px]:text-sm">
                  {detailContent.description}
                </p>
              ) : null}

              {detailContent.longDescription ? (
                <p className="text-[0.82vw] leading-[1.5] text-white/70 min-[1400px]:text-xs">
                  {detailContent.longDescription}
                </p>
              ) : null}

              {detailContent.tags && detailContent.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detailContent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[0.68rem] text-white/75"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {detailContent.travelInfo ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sky-200/70">
                    交通資訊
                  </p>
                  <p className="mt-1 text-[0.82vw] leading-[1.45] text-white/75 min-[1400px]:text-xs">
                    {detailContent.travelInfo}
                  </p>
                </div>
              ) : null}

              {detailContent.cautionNotes && detailContent.cautionNotes.length > 0 ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-2.5 py-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                    注意事項
                  </p>
                  <ul className="mt-1 space-y-1 text-[0.82vw] leading-[1.45] text-white/75 min-[1400px]:text-xs">
                    {detailContent.cautionNotes.map((note) => (
                      <li key={note} className="flex gap-1.5">
                        <span className="mt-[0.3rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {description && isDetailExpanded && !detailContent ? (
          <div className="pointer-events-none mb-2 w-full max-w-[20rem] rounded-2xl border border-white/20 bg-black/80 px-3 py-2 text-left shadow-xl backdrop-blur">
            <p className="text-[0.95vw] leading-[1.45] text-white/85 min-[1400px]:text-base">
              {description}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.(markerId);
          }}
          className={cn(
            "group flex w-full items-start gap-6 rounded-full border border-white/30 bg-black/80 px-[2.4vw] py-[1em] text-white shadow-lg backdrop-blur transition-all duration-200 ease-out",
            buttonToneVariants({ tone: toneKey, active: isActive }),
            isHighlighted ? "rounded-3xl" : "rounded-full",
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
          </span>
        </button>

        <div className={cn(stemToneVariants({ tone: toneKey, preview: isHighlighted }))} />
      </div>
    </Html>
  );
}
