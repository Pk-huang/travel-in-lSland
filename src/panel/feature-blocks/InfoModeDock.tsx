"use client";

import { useInfoModeState, type InfoMode } from "@/src/app-shell/hooks/useInfoModeState";
import { useMarkerInteraction } from "@/src/lib/map/marker-interaction";
import { cn } from "@/src/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

const ACTIVE_MODE_CLASSES: Record<InfoMode, string> = {
  weather: "border-emerald-300/80 bg-emerald-400/20 text-emerald-100",
  poi: "border-sky-300/80 bg-sky-400/20 text-sky-100",
  road: "border-amber-300/80 bg-amber-400/20 text-amber-100",
};

export function InfoModeDock() {
  const { activeMode, options, setMode, isOpen: isPanelOpen, setOpen } = useInfoModeState();
  const { dispatch } = useMarkerInteraction();

  return (
    <div
      role="group"
      aria-label="地圖資訊模式"
      className={cn(
        "pointer-events-auto relative z-30 w-full border border-white/15 bg-[#0c1724]/95 p-2 shadow-xl backdrop-blur-md",
        isPanelOpen ? "rounded-b-2xl rounded-t-none border-t-0" : "rounded-2xl",
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (!isPanelOpen && activeMode === null) {
            setMode("weather");
          }
          setOpen(!isPanelOpen);
        }}
        aria-expanded={isPanelOpen}
        aria-label={isPanelOpen ? "Collapse Map Info" : "Expand Map Info"}
        className="mb-2 flex w-full items-center justify-between rounded-md px-2 py-1 text-sm font-medium text-slate-300 transition-colors hover:text-white"
      >
        <span>Map Info</span>
        {isPanelOpen ? (
          <ChevronDown aria-hidden="true" className="size-4" />
        ) : (
          <ChevronUp aria-hidden="true" className="size-4" />
        )}
      </button>

      <div className="grid grid-cols-3 gap-2">
        {options.map(({ id, label, Icon }) => {
          const isActive = activeMode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (activeMode !== id && activeMode !== null) {
                  dispatch({ type: "clear-interaction", source: "mode-switch" });
                }
                setMode(id);
              }}
              aria-label={label}
              aria-pressed={isActive}
              title={label}
              className={
                isActive
                  ? cn("inline-flex h-11 min-w-0 items-center justify-center rounded-xl border", ACTIVE_MODE_CLASSES[id])
                  : "inline-flex h-11 min-w-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"
              }
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
