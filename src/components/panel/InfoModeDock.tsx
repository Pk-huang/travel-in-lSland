"use client";

import { Clock3, CloudSun, MapPin, Route } from "lucide-react";

import { useWorkspaceStore } from "@/src/lib/store/workspace";

type ModeOption = {
  id: "weather" | "poi" | "road";
  label: string;
  Icon: typeof CloudSun;
};

const MODE_OPTIONS: readonly ModeOption[] = [
  { id: "weather", label: "天氣", Icon: CloudSun },
  { id: "poi", label: "景點", Icon: MapPin },
  { id: "road", label: "路況", Icon: Route },
] as const;

export function InfoModeDock() {
  const activeSection = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const setActiveSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const activeUtilityPanel = useWorkspaceStore((s) => s.activeUtilityPanel);
  const setActiveUtilityPanel = useWorkspaceStore((s) => s.setActiveUtilityPanel);
  const setActiveUtilityTab = useWorkspaceStore((s) => s.setActiveUtilityTab);

  return (
    <div className="pointer-events-auto absolute right-4 bottom-4 z-30">
      <div className="rounded-2xl border border-white/15 bg-black/45 p-2 shadow-xl backdrop-blur-md">
        <div className="mb-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() =>
              {
                setActiveUtilityTab("timeline");
                setActiveUtilityPanel(activeUtilityPanel === "timeline" ? null : "timeline");
              }
            }
            aria-label="時間軸"
            aria-pressed={activeUtilityPanel === "timeline"}
            title="時間軸"
            className={
              activeUtilityPanel === "timeline"
                ? "inline-flex size-11 items-center justify-center rounded-xl border border-sky-300/80 bg-sky-400/20 text-sky-100"
                : "inline-flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"
            }
          >
            <Clock3 className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {MODE_OPTIONS.map(({ id, label, Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(isActive ? null : id)}
                aria-label={label}
                aria-pressed={isActive}
                title={label}
                className={
                  isActive
                    ? "inline-flex size-11 items-center justify-center rounded-xl border border-sky-300/80 bg-sky-400/20 text-sky-100"
                    : "inline-flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"
                }
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
