"use client";

import { useEffect, useMemo } from "react";
import {
  BedDouble,
  Car,
  ExternalLink,
  Info,
  Landmark,
  MapPinned,
  Moon,
  NotebookText,
  ShoppingBasket,
  StickyNote,
  Sun,
  Tent,
  Utensils,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  useWorkspaceData,
  useWorkspaceTravelPlans,
} from "@/src/components/providers/WorkspaceProvider";
import { useMarkerInteraction } from "@/src/lib/map/marker-interaction";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type {
  TravelStopCategory,
  TravelTimelineBadgeKind,
  TravelTimelineItem,
} from "@/src/types";
import { DateWeatherSection } from "./trip-planning/DateWeatherSection";

type TravelPlanDay = {
  dayId: string;
  title: string;
  regionLabel: string;
  driveText: string;
  mapRouteUrl?: string | null;
  timelineSections: Array<{
    sectionId: string;
    label: string;
    items: TravelTimelineItem[];
  }>;
};

type TimelineDisplayGroup = {
  id: string;
  kind: "daytime" | "evening" | "custom";
  label: string;
  items: TravelTimelineItem[];
};

type TravelItemSelection = {
  lat?: number | null;
  lon?: number | null;
  itemId: string;
  dayId: string;
};

const ITEM_TYPE_PRESENTATION: Record<TravelStopCategory, { label: string; Icon: LucideIcon; color: string }> = {
  sight: { label: "景點", Icon: Landmark, color: "text-sky-200" },
  hot: { label: "溫泉", Icon: Waves, color: "text-orange-200" },
  info: { label: "資訊", Icon: Info, color: "text-slate-300" },
  food: { label: "餐飲", Icon: Utensils, color: "text-rose-200" },
  hotel: { label: "住宿", Icon: BedDouble, color: "text-blue-200" },
  supply: { label: "補給", Icon: ShoppingBasket, color: "text-amber-200" },
  transport: { label: "交通", Icon: Car, color: "text-violet-200" },
  camp: { label: "露營", Icon: Tent, color: "text-emerald-200" },
  memo: { label: "備註", Icon: StickyNote, color: "text-yellow-200" },
};

const BADGE_TEXT_CLASSES: Record<TravelTimelineBadgeKind, string> = {
  free: "text-emerald-200",
  paid: "text-amber-200",
  warn: "text-amber-200",
  hot: "text-orange-200",
  info: "text-slate-300",
};

function groupTimelineSections(
  sections: TravelPlanDay["timelineSections"],
): TimelineDisplayGroup[] {
  const groups: TimelineDisplayGroup[] = [];

  for (const section of sections) {
    const normalizedLabel = section.label.toLowerCase();
    const kind =
      normalizedLabel === "morning" || normalizedLabel === "midday"
        ? "daytime"
        : normalizedLabel === "evening"
          ? "evening"
          : "custom";
    const label = kind === "daytime" ? "Daytime" : kind === "evening" ? "Evening" : section.label;

    if (kind === "custom") {
      groups.push({ id: section.sectionId, kind, label, items: [...section.items] });
      continue;
    }

    const existingGroup = groups.find((group) => group.kind === kind);
    if (existingGroup) {
      existingGroup.items.push(...section.items);
    } else {
      groups.push({ id: kind, kind, label, items: [...section.items] });
    }
  }

  return groups;
}

function TravelSummary({
  selectedDay,
  onSelectTravelItem,
}: {
  selectedDay: TravelPlanDay;
  onSelectTravelItem: (item: TravelItemSelection) => void;
}) {
  const timelineGroups = groupTimelineSections(selectedDay.timelineSections);

  return (
    <section className="space-y-4 rounded-[20px] from-[#122334]  py-5 via-[#0e1a2a] to-[#0a1320] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div>
        <div className="">
          <div className="bg-amber-400 px-2 py-2 w-full">
            <p className="flex items-center gap-1.5 text-lg uppercase  text-slate-950 font-semibold">
              <NotebookText aria-hidden="true" className="size-5" />
              Day focus
            </p>
          </div>
          <div className="mt-5">
            <p className=" mt-2 text-lg font-semibold tracking-[-0.04em] text-white">{selectedDay.title}</p>
          </div>

        </div>


        <p className="mt-4 text-sm text-slate-300/80">{selectedDay.driveText}</p>

        {selectedDay.mapRouteUrl ? (
          <a
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#bfe3ff] underline-offset-4 hover:underline"
            href={selectedDay.mapRouteUrl}
            target="_blank"
            rel="noreferrer"
          >
            查看整日路線
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>

      {timelineGroups.map((section) => (
        <div key={section.id} className="border-t border-white/10 pt-4">
          <p className="mb-2 flex items-center gap-2 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300/80">
            {section.kind === "daytime" ? (
              <Sun aria-hidden="true" className="size-4 text-amber-300" />
            ) : section.kind === "evening" ? (
              <Moon aria-hidden="true" className="size-4 text-sky-200" />
            ) : null}
            {section.label}
          </p>
          <ul className="space-y-1.5">
            {section.items.map((item) => {
              const hasLocation = item.lat != null && item.lon != null;
              const typePresentation = ITEM_TYPE_PRESENTATION[item.type];
              const TypeIcon = typePresentation.Icon;
              const badge = item.badge;
              const badgeRepeatsType = badge?.text === typePresentation.label;
              const showBadge = badge !== undefined && (
                !badgeRepeatsType || badge.kind === "warn" || badge.kind === "hot"
              );
              const itemContent = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span title={typePresentation.label} className="shrink-0">
                        <TypeIcon aria-hidden="true" className={`size-4 ${typePresentation.color}`} />
                      </span>
                      <p className="min-w-0 text-sm font-medium text-white">{item.name}</p>
                    </div>
                    {hasLocation ? (
                      <MapPinned aria-hidden="true" className="size-4 shrink-0 text-sky-200" />
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="mt-1.5 text-xs leading-5 text-slate-300/75">
                      <span className="mr-1 text-slate-400">行程內容：</span>
                      {item.description}
                    </p>
                  ) : null}
                  {showBadge || item.timeWindow ? (
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                      {showBadge && badge ? (
                        <span className={BADGE_TEXT_CLASSES[badge.kind]}>{badge.text}</span>
                      ) : null}
                      {item.timeWindow ? (
                        <span className="text-slate-400">時間資訊 {item.timeWindow}</span>
                      ) : null}
                    </p>
                  ) : null}
                </>
              );

              return (
                <li key={item.itemId} className="border-b border-white/10 last:border-b-0">
                  {hasLocation ? (
                    <button
                      type="button"
                      title="在地圖上定位"
                      onClick={() => onSelectTravelItem({ ...item, dayId: selectedDay.dayId, itemId: item.itemId })}
                      className="w-full px-3 py-3 text-left transition hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-200"
                    >
                      {itemContent}
                    </button>
                  ) : (
                    <div className="w-full px-3 py-3">{itemContent}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function ControlPanel() {
  const { dispatch } = useMarkerInteraction();
  const selectedTravelDayId = useWorkspaceStore((state) => state.selectedTravelDayId);
  const setSelectedTravelDayId = useWorkspaceStore((state) => state.setSelectedTravelDayId);
  const { data: weather } = useWorkspaceData();
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
      <DateWeatherSection
        travelDays={travelDays}
        selectedTravelDayId={selectedTravelDayId}
        onSelectDay={setSelectedTravelDayId}
        weather={weather}
      />

      {selectedDay ? (
        <section className="space-y-3">
          <TravelSummary selectedDay={selectedDay} onSelectTravelItem={handleSelectTravelItem} />
        </section>
      ) : (
        <section className="rounded-[18px] bg-white/[0.02] p-4 text-slate-300/75">
          <p className="text-sm">尚無可顯示的單日行程資料。</p>
        </section>
      )}
    </div>
  );
}