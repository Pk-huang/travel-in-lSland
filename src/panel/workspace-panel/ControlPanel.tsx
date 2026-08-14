"use client";

import { useEffect, useMemo } from "react";
import { ExternalLink, MapPinned } from "lucide-react";

import { useWorkspaceTravelPlans } from "@/src/components/providers/WorkspaceProvider";
import { useMarkerInteraction } from "@/src/lib/map/marker-interaction";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import { buildTravelMapMarkers } from "@/src/lib/travel-plans/travel-plan-map-utils";

type TravelPlanDay = {
  dayId: string;
  title: string;
  regionLabel: string;
  driveText: string;
  mapRouteUrl?: string | null;
  timelineSections: Array<{
    sectionId: string;
    label: string;
    items: Array<{
      itemId: string;
      name: string;
      description?: string | null;
      lat?: number | null;
      lon?: number | null;
    }>;
  }>;
};

type TravelDayOption = {
  dayId: string;
  dateDisplay: { month: string; day: number; weekday: string };
};

type TravelItemSelection = {
  lat?: number | null;
  lon?: number | null;
  itemId: string;
  dayId: string;
};

function DaySelector({
  travelDays,
  selectedTravelDayId,
  onSelectDay,
}: {
  travelDays: TravelDayOption[];
  selectedTravelDayId: string | null;
  onSelectDay: (dayId: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-[18px] bg-white/[0.02] p-3 text-slate-200">
      <p className="text-[10px] leading-5 tracking-[0.18em] text-slate-300/70 uppercase">
        日程選擇
      </p>
      <div className="flex flex-wrap gap-2">
        {travelDays.map((day) => {
          const isSelected = day.dayId === selectedTravelDayId;
          return (
            <button
              key={day.dayId}
              type="button"
              onClick={() => onSelectDay(day.dayId)}
              className={
                isSelected
                  ? "rounded-full bg-[#d9745f]/16 px-3 py-1.5 text-xs font-medium text-[#ffd4ca] ring-1 ring-[#d9745f]/40"
                  : "rounded-full bg-slate-900/35 px-3 py-1.5 text-xs font-medium text-slate-200/80 transition hover:bg-slate-800/60 hover:text-white"
              }
            >
              {day.dateDisplay.month}/{day.dateDisplay.day} {day.dateDisplay.weekday}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TravelSummary({
  selectedDay,
  onSelectTravelItem,
}: {
  selectedDay: TravelPlanDay;
  onSelectTravelItem: (item: TravelItemSelection) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-[20px] bg-gradient-to-br from-[#122334] via-[#0e1a2a] to-[#0a1320] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300/70">Day focus</p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">{selectedDay.title}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#d9745f]/12 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#ffd6cf]">
            Active
          </span>
        </div>

        <p className="text-sm text-slate-200/80">{selectedDay.regionLabel}</p>
        <p className="mt-2 text-sm text-slate-300/75">{selectedDay.driveText}</p>

        {selectedDay.mapRouteUrl ? (
          <a
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#bfe3ff] underline-offset-4 hover:underline"
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
          <div key={section.sectionId} className="rounded-[18px] bg-white/[0.02] p-3">
            <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-slate-300/70">{section.label}</p>
            <ul className="space-y-2.5">
              {section.items.map((item, index) => {
                const hasLocation = item.lat != null && item.lon != null;
                return (
                  <li key={item.itemId}>
                    <button
                      type="button"
                      disabled={!hasLocation}
                      onClick={() => onSelectTravelItem({ ...item, dayId: selectedDay.dayId, itemId: item.itemId })}
                      className={
                        hasLocation
                          ? "w-full rounded-[14px] bg-slate-900/35 px-3 py-2.5 text-left transition hover:bg-slate-800/55"
                          : "w-full rounded-[14px] bg-slate-900/20 px-3 py-2.5 text-left opacity-60"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">
                          <span className="mr-2 inline-block w-6 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {item.name}
                        </p>
                        {hasLocation ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#bfe3ff]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#dff5ff]">
                            <MapPinned className="size-3" />
                            map
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-2 text-xs leading-5 text-slate-300/75">{item.description}</p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function TravelMarkersList({ travelMarkers }: { travelMarkers: ReturnType<typeof buildTravelMapMarkers> }) {
  return (
    <div className="rounded-[18px] bg-white/[0.02] p-3">
      <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-300/70">Map points</p>
      <ul className="space-y-2">
        {travelMarkers.map((marker) => (
          <li key={marker.markerId} className="text-xs text-slate-200/75">
            <div className="flex items-center justify-between gap-2">
              <span>
                {String(marker.sequence).padStart(2, "0")} · {marker.name}
              </span>
              <span className="rounded-full bg-slate-900/35 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-slate-300/70">
                {marker.hasLocation ? "map" : "info"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ControlPanel() {
  const { dispatch } = useMarkerInteraction();
  const selectedTravelDayId = useWorkspaceStore((s) => s.selectedTravelDayId);
  const setSelectedTravelDayId = useWorkspaceStore((s) => s.setSelectedTravelDayId);
  const { data: travelPlans } = useWorkspaceTravelPlans();

  const travelDays = useMemo(() => travelPlans.plans[0]?.days ?? [], [travelPlans]);
  const selectedDay = useMemo(
    () => travelDays.find((day) => day.dayId === selectedTravelDayId) ?? null,
    [selectedTravelDayId, travelDays],
  );
  const travelMarkers = useMemo(() => {
    if (!selectedDay) {
      return [];
    }

    return buildTravelMapMarkers(selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    if (travelDays.length === 0) {
      return;
    }

    const isSelectedDayValid = travelDays.some((day) => day.dayId === selectedTravelDayId);
    if (!isSelectedDayValid) {
      setSelectedTravelDayId(travelDays[0]?.dayId ?? null);
    }
  }, [selectedTravelDayId, setSelectedTravelDayId, travelDays]);

  const handleSelectDay = (dayId: string) => {
    setSelectedTravelDayId(dayId);
  };

  const handleSelectTravelItem = (item: TravelItemSelection) => {
    if (item.lat == null || item.lon == null) {
      return;
    }

    dispatch({
      type: "select-marker",
      kind: "travel",
      travelItemId: `travel-item-${item.dayId}-${item.itemId}`,
      lon: item.lon,
      lat: item.lat,
    });
  };

  return (
    <div className="space-y-4">
      <DaySelector
        travelDays={travelDays}
        selectedTravelDayId={selectedTravelDayId}
        onSelectDay={handleSelectDay}
      />

      {selectedDay ? (
        <section className="space-y-3">
          <TravelSummary selectedDay={selectedDay} onSelectTravelItem={handleSelectTravelItem} />
          <TravelMarkersList travelMarkers={travelMarkers} />
        </section>
      ) : (
        <section className="rounded-[18px] bg-white/[0.02] p-4 text-slate-300/75">
          <p className="text-sm">尚無可顯示的單日行程資料。</p>
        </section>
      )}
    </div>
  );
}
