"use client";

import { useMemo } from "react";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { IcelandStatusResponse, Region } from "@/src/types";

type TravelDayOption = {
  dayId: string;
  date: string;
  dateDisplay: { month: string; day: number; weekday: string };
};

type CalendarCell = {
  date: string;
  dayNumber: number;
  travelDay: TravelDayOption | null;
};

type WeatherVisualState = "sunny" | "cloudy" | "rain" | "snow" | "unknown";

type WeatherVisual = {
  Icon: LucideIcon;
  iconClass: string;
  temperatureClass: string;
};

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const REGION_LABELS: Record<Region, string> = {
  south: "冰島南部",
  west: "冰島西部",
  north: "冰島北部",
  east: "冰島東部",
  all: "全冰島",
};

const WEATHER_VISUALS: Record<WeatherVisualState, WeatherVisual> = {
  sunny: { Icon: Sun, iconClass: "text-amber-200/25", temperatureClass: "text-amber-100" },
  cloudy: { Icon: Cloud, iconClass: "text-slate-100/20", temperatureClass: "text-white" },
  rain: { Icon: CloudRain, iconClass: "text-sky-200/25", temperatureClass: "text-sky-100" },
  snow: { Icon: CloudSnow, iconClass: "text-cyan-100/30", temperatureClass: "text-cyan-50" },
  unknown: { Icon: Cloud, iconClass: "text-white/12", temperatureClass: "text-white" },
};

function getWeatherVisualState(condition: string | null | undefined): WeatherVisualState {
  switch (condition?.toLowerCase()) {
    case "sunny":
    case "clear":
      return "sunny";
    case "cloudy":
    case "overcast":
      return "cloudy";
    case "rain":
    case "rainy":
      return "rain";
    case "snow":
    case "snowy":
      return "snow";
    default:
      return "unknown";
  }
}

function buildCalendarCells(travelDays: TravelDayOption[]): CalendarCell[] {
  const firstDate = travelDays[0]?.date;
  const lastDate = travelDays.at(-1)?.date;
  if (!firstDate || !lastDate) {
    return [];
  }

  const first = new Date(`${firstDate}T00:00:00.000Z`);
  const last = new Date(`${lastDate}T00:00:00.000Z`);
  const firstWeekday = (first.getUTCDay() + 6) % 7;
  const lastWeekday = (last.getUTCDay() + 6) % 7;
  const gridStart = new Date(first.getTime() - firstWeekday * 86_400_000);
  const gridEnd = new Date(last.getTime() + (6 - lastWeekday) * 86_400_000);
  const travelDaysByDate = new Map(travelDays.map((day) => [day.date, day]));
  const cells: CalendarCell[] = [];

  for (let date = gridStart; date <= gridEnd; date = new Date(date.getTime() + 86_400_000)) {
    const dateKey = date.toISOString().slice(0, 10);
    cells.push({
      date: dateKey,
      dayNumber: date.getUTCDate(),
      travelDay: travelDaysByDate.get(dateKey) ?? null,
    });
  }

  return cells;
}

function formatObservationTime(timestamp: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Atlantic/Reykjavik",
  }).format(new Date(timestamp));
}

export function DateWeatherSection({
  travelDays,
  selectedTravelDayId,
  onSelectDay,
  weather,
}: {
  travelDays: TravelDayOption[];
  selectedTravelDayId: string | null;
  onSelectDay: (dayId: string) => void;
  weather: IcelandStatusResponse | null;
}) {
  const calendarCells = useMemo(() => buildCalendarCells(travelDays), [travelDays]);
  const firstDay = travelDays[0];
  const lastDay = travelDays.at(-1);
  const calendarTitle = firstDay && lastDay
    ? `${firstDay.dateDisplay.month}${firstDay.dateDisplay.month === lastDay.dateDisplay.month ? "" : `–${lastDay.dateDisplay.month}`} ${lastDay.date.slice(0, 4)}`
    : "行程日期";
  const readings = weather?.weather ?? [];
  const averageTemperature = readings.length
    ? readings.reduce((total, reading) => total + reading.temperatureC, 0) / readings.length
    : null;
  const latestTimestamp = readings.reduce(
    (latest, reading) => Math.max(latest, Date.parse(reading.timestamp)),
    0,
  );
  const weatherVisual = WEATHER_VISUALS[getWeatherVisualState(null)];
  const WeatherIcon = weatherVisual.Icon;

  return (
    <section className="overflow-hidden rounded-[18px] text-slate-200">
      <div className="grid grid-cols-[minmax(112px,0.82fr)_minmax(0,1.18fr)] gap-2 py-2.5 max-[360px]:grid-cols-1">
        <div className="relative flex min-h-33 flex-col justify-between overflow-hidden rounded-xl p-3 max-[360px]:min-h-23.5">
          <WeatherIcon
            aria-hidden="true"
            className={`absolute -right-3 top-5 size-20 ${weatherVisual.iconClass}`}
            strokeWidth={1}
          />
          <div className="relative flex items-center gap-1.5 text-[9px] font-medium tracking-[0.12em] text-white/75">
            <span className="size-1.5 rounded-full bg-[#d9745f]" />
            區域觀測 · {weather ? REGION_LABELS[weather.meta.region] : "冰島"}
          </div>

          <div className="relative">
            <p className={`text-[30px] leading-none font-light tabular-nums ${weatherVisual.temperatureClass}`}>
              {averageTemperature == null ? "--" : `${averageTemperature.toFixed(1)}°`}
            </p>
          </div>

          <p className="relative text-[9px] text-white/65">
            {latestTimestamp > 0
              ? `更新 ${formatObservationTime(new Date(latestTimestamp).toISOString())}`
              : "尚無觀測時間"}
          </p>
        </div>

        <div className="flex min-w-0 flex-col justify-center px-1 py-1">
          <div className="mb-2 flex items-center justify-between gap-1">
            <p className="truncate text-[10px] font-medium tracking-[0.08em] text-slate-200">
              {calendarTitle}
            </p>
            {weather?.meta.fallback ? (
              <span className="shrink-0 text-[8px] text-amber-200/80">備援資料</span>
            ) : null}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {WEEKDAY_LABELS.map((weekday) => (
              <span key={weekday} className="text-center text-[8px] text-slate-400">
                {weekday}
              </span>
            ))}
            {calendarCells.map((cell) => {
              const day = cell.travelDay;
              const isSelected = day?.dayId === selectedTravelDayId;
              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={!day}
                  aria-label={day ? `${day.dateDisplay.month} ${day.dateDisplay.day} ${day.dateDisplay.weekday}` : cell.date}
                  aria-pressed={isSelected}
                  onClick={() => day && onSelectDay(day.dayId)}
                  className={`mx-auto flex size-7 items-center justify-center rounded-full text-[10px] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9745f] max-[360px]:size-8 ${
                    isSelected
                      ? "bg-[#d9745f] font-semibold text-white shadow-[0_0_14px_rgba(217,116,95,0.3)]"
                      : day
                        ? "bg-white/[0.07] text-slate-200 hover:bg-white/[0.14]"
                        : "text-slate-600"
                  }`}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}