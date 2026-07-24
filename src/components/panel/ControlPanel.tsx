"use client";

import { useEffect, useMemo } from "react";
import { ExternalLink, MapPinned } from "lucide-react";

import { useWorkspaceTravelPlans } from "@/src/components/providers/WorkspaceProvider";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

export function ControlPanel() {
  const selectedTravelDayId = useWorkspaceStore((s) => s.selectedTravelDayId);
  const setSelectedTravelDayId = useWorkspaceStore((s) => s.setSelectedTravelDayId);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const selectStation = useWorkspaceStore((s) => s.selectStation);
  const selectRoadSegment = useWorkspaceStore((s) => s.selectRoadSegment);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
  const { data: travelPlans } = useWorkspaceTravelPlans();

  const travelDays = useMemo(() => travelPlans.plans[0]?.days ?? [], [travelPlans]);
  const selectedDay = useMemo(
    () => travelDays.find((day) => day.dayId === selectedTravelDayId) ?? null,
    [selectedTravelDayId, travelDays],
  );

  useEffect(() => {
    if (travelDays.length === 0) {
      return;
    }

    const isSelectedDayValid = travelDays.some((day) => day.dayId === selectedTravelDayId);
    if (!isSelectedDayValid) {
      setSelectedTravelDayId(travelDays[0]?.dayId ?? null);
    }
  }, [selectedTravelDayId, setSelectedTravelDayId, travelDays]);

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-3">
        <p className="text-[11px] text-white/55">
          點擊日期後，左側顯示當日全部行程，地圖同步顯示當日全部可定位站點。
        </p>
        <div className="flex flex-wrap gap-2">
          {travelDays.map((day) => {
            const isSelected = day.dayId === selectedTravelDayId;
            return (
              <button
                key={day.dayId}
                type="button"
                onClick={() => setSelectedTravelDayId(day.dayId)}
                className={
                  isSelected
                    ? "rounded-full border border-sky-300/70 bg-sky-400/20 px-3 py-1.5 text-xs font-medium text-sky-100"
                    : "rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-sky-300/50 hover:text-white"
                }
              >
                {day.dateDisplay.month}/{day.dateDisplay.day} {day.dateDisplay.weekday}
              </button>
            );
          })}
        </div>
      </section>

      {selectedDay ? (
        <section className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-base font-semibold text-white">{selectedDay.title}</p>
            <p className="text-xs text-white/65">{selectedDay.regionLabel}</p>
            <p className="mt-1 text-xs text-white/70">{selectedDay.driveText}</p>
            {selectedDay.mapRouteUrl ? (
              <a
                className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 underline-offset-4 hover:underline"
                href={selectedDay.mapRouteUrl}
                target="_blank"
                rel="noreferrer"
              >
                查看整日路線
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>

          <div className="space-y-3">
            {selectedDay.timelineSections.map((section) => (
              <div key={section.sectionId} className="rounded-xl border border-white/10 bg-black/15 p-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-white/70">
                  {section.label}
                </p>
                <ul className="space-y-2">
                  {section.items.map((item, index) => {
                    const hasLocation = item.lat != null && item.lon != null;
                    return (
                      <li key={item.itemId}>
                        <button
                          type="button"
                          disabled={!hasLocation}
                          onClick={() => {
                            if (!hasLocation) {
                              return;
                            }
                            setPoiFocusEnabled(false);
                            selectStation(null);
                            selectRoadSegment(null);
                            setMapFocusTarget({ lon: item.lon as number, lat: item.lat as number });
                          }}
                          className={
                            hasLocation
                              ? "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:border-sky-300/50 hover:bg-black/30"
                              : "w-full rounded-lg border border-white/5 bg-black/10 px-3 py-2 text-left opacity-65"
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white">
                              {String(index + 1).padStart(2, "0")} · {item.name}
                            </p>
                            {hasLocation ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/40 px-2 py-0.5 text-[11px] text-sky-200">
                                <MapPinned className="size-3.5" />
                                地圖
                              </span>
                            ) : null}
                          </div>
                          {item.description ? (
                            <p className="mt-1 text-xs leading-5 text-white/68">{item.description}</p>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/15 p-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-white/70">
              地圖站點（{selectedDay.stops.length}）
            </p>
            <ul className="space-y-1.5">
              {selectedDay.stops.map((stop, index) => (
                <li key={stop.stopId} className="text-xs text-white/75">
                  {String(index + 1).padStart(2, "0")} · {stop.name}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-white/10 bg-black/10 p-3">
          <p className="text-sm text-white/65">尚無可顯示的單日行程資料。</p>
        </section>
      )}
    </div>
  );
}
