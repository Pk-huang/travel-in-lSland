"use client";

import { ChevronRight } from "lucide-react";

import {
  useWorkspaceData,
  useWorkspacePois,
} from "@/src/components/providers/WorkspaceProvider";
import { useInfoModeState } from "@/src/app-shell/hooks/useInfoModeState";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useMarkerInteraction } from "@/src/lib/map/marker-interaction";
import { cn } from "@/src/lib/utils";
import type {
  AlertLevel,
  IcelandStatusResponse,
  RoadStatus,
} from "@/src/types";

type StatusPanelProps = {
  data: IcelandStatusResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  showWeatherList?: boolean;
  showRoadList?: boolean;
  onSelectWeather?: (payload: { index: number; lat: number; lon: number }) => void;
  onSelectRoad?: (payload: { segmentId: string; lon: number; lat: number }) => void;
};

type WeatherItemProps = {
  item: NonNullable<IcelandStatusResponse["weather"]>[number];
  index: number;
  onSelectWeather?: (payload: { index: number; lat: number; lon: number }) => void;
};

type RoadItemProps = {
  item: NonNullable<IcelandStatusResponse["roads"]>[number];
  onSelectRoad?: (payload: { segmentId: string; lon: number; lat: number }) => void;
};

const ALERT_DOT: Record<AlertLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

const ROAD_DOT: Record<RoadStatus, string> = {
  open: "bg-emerald-500",
  caution: "bg-amber-500",
  closed: "bg-red-500",
};

function WeatherList({ items, onSelectWeather }: { items: NonNullable<IcelandStatusResponse["weather"]>; onSelectWeather?: StatusPanelProps["onSelectWeather"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">天氣（{items.length}）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[22rem] overflow-y-auto pr-1">
          <ul className="divide-border divide-y">
            {items.map((item, index) => (
              <WeatherItem key={`${item.lat}-${item.lon}-${index}`} item={item} index={index} onSelectWeather={onSelectWeather} />
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function RoadList({ items, onSelectRoad }: { items: NonNullable<IcelandStatusResponse["roads"]>; onSelectRoad?: StatusPanelProps["onSelectRoad"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">路況（{items.length}）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[22rem] overflow-y-auto pr-1">
          <ul className="divide-border divide-y">
            {items.map((item) => (
              <RoadItem key={item.segmentId} item={item} onSelectRoad={onSelectRoad} />
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherItem({ item, index, onSelectWeather }: WeatherItemProps) {
  return (
    <li className="py-1">
      <button
        type="button"
        onClick={() => onSelectWeather?.({ index, lat: item.lat, lon: item.lon })}
        className="hover:bg-accent/40 flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm transition"
      >
        <span className={`size-2 shrink-0 rounded-full ${ALERT_DOT[item.alertLevel]}`} />
        <span className="text-muted-foreground min-w-[110px] tabular-nums">
          {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
        </span>
        <span className="font-semibold">{item.temperatureC.toFixed(1)}°C</span>
        <span className="text-muted-foreground">風 {item.windSpeedMs.toFixed(1)} m/s</span>
      </button>
    </li>
  );
}

function RoadItem({ item, onSelectRoad }: RoadItemProps) {
  return (
    <li className="py-1">
      <button
        type="button"
        onClick={() => {
          const [lon = 0, lat = 0] = item.geometry[0] ?? [0, 0];
          onSelectRoad?.({ segmentId: item.segmentId, lon, lat });
        }}
        className="hover:bg-accent/40 flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm transition"
      >
        <span className={`size-2 shrink-0 rounded-full ${ROAD_DOT[item.status]}`} />
        <span className="flex-1 truncate">{item.name}</span>
        <span className="font-semibold">{item.status}</span>
        {item.reason ? <span className="text-muted-foreground">{item.reason}</span> : null}
      </button>
    </li>
  );
}

function StatusPanel({
  data,
  loading,
  error,
  onRetry,
  showWeatherList = true,
  showRoadList = true,
  onSelectWeather,
  onSelectRoad,
}: StatusPanelProps) {
  if (loading && !data) {
    return <p className="text-muted-foreground text-sm">載入中…</p>;
  }

  if (error) {
    return (
      <Card className="border-destructive/60">
        <CardContent className="space-y-3 pt-6">
          <p className="text-destructive text-sm">資料載入失敗：{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            重試
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">尚無資料。</p>;
  }

  const { meta, summary, weather, roads } = data;

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 pt-6">
          <Metric label="風險分數" value={summary.riskScore} />
          <Metric label="高風險路段" value={summary.highRiskSegments} />
          <Metric label="天氣測站" value={weather.length} />
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary">cache: {meta.cache}</Badge>
            {meta.fallback && <Badge variant="destructive">備援資料</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {showWeatherList ? <WeatherList items={weather} onSelectWeather={onSelectWeather} /> : null}
        {showRoadList ? <RoadList items={roads} onSelectRoad={onSelectRoad} /> : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

function selectMarkerForPoi(poi: { id: string; lon: number; lat: number }, dispatch: ReturnType<typeof useMarkerInteraction>["dispatch"]) {
  dispatch({
    type: "select-marker",
    kind: "poi",
    poiId: poi.id,
    lon: poi.lon,
    lat: poi.lat,
  });
}

export function WeatherDrawer() {
  const { activeMode, isOpen, options, setMode } = useInfoModeState();
  const { dispatch } = useMarkerInteraction();
  const { data, loading, error, refetch } = useWorkspaceData();
  const { points: pointsOfInterest } = useWorkspacePois();
  const activeSection = activeMode ?? "weather";
  const weatherModeOption = options.find((option) => option.id === "weather");
  const WeatherModeIcon = weatherModeOption?.Icon;

  return (
    <>
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "bg-card/85 border-border pointer-events-auto absolute top-16 right-4 z-20 flex max-h-[calc(100dvh-5rem)] w-[min(340px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-[calc(100%+1.5rem)]",
        )}
      >
        <header className="border-border flex items-center justify-between border-b px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch({ type: "clear-interaction", source: "panel-close" })}
            aria-label="收合右側面板"
          >
            <ChevronRight className="size-5" />
          </Button>
          <div>
            <h2 className="text-base leading-tight font-bold">天氣 / 路況 / 景點</h2>
            <p className="text-muted-foreground text-xs">同區切換清單，點擊項目後同步地圖</p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 grid grid-cols-3 gap-2">
            {options.map(({ id, label, Icon }) => (
              <Button
                key={id}
                type="button"
                variant={activeSection === id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (activeSection !== id) {
                    dispatch({ type: "clear-interaction", source: "mode-switch" });
                  }
                  setMode(id);
                }}
                className="justify-center gap-1"
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>

          {activeSection === "weather" ? (
            <StatusPanel
              data={data}
              loading={loading}
              error={error}
              onRetry={refetch}
              showWeatherList
              showRoadList={false}
              onSelectWeather={({ index, lat, lon }) => {
                dispatch({
                  type: "select-marker",
                  kind: "weather",
                  stationId: `station-${index}`,
                  lon,
                  lat,
                });
              }}
            />
          ) : null}

          {activeSection === "road" ? (
            <StatusPanel
              data={data}
              loading={loading}
              error={error}
              onRetry={refetch}
              showWeatherList={false}
              showRoadList
              onSelectRoad={({ segmentId, lon, lat }) => {
                dispatch({
                  type: "select-marker",
                  kind: "road",
                  roadSegmentId: segmentId,
                  lon,
                  lat,
                });
              }}
            />
          ) : null}

          {activeSection === "poi" ? (
            <section className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                <p className="text-sm font-semibold text-white">景點（{pointsOfInterest.length}）</p>
                <p className="text-xs text-white/60">點擊景點後，地圖會切到景點模式並聚焦</p>
              </div>

              <div className="max-h-[30rem] overflow-y-auto pr-1">
                <ul className="space-y-2">
                  {pointsOfInterest.map((poi) => (
                    <li key={poi.id}>
                      <button
                        type="button"
                        onClick={() => selectMarkerForPoi(poi, dispatch)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:border-sky-300/40 hover:bg-black/30"
                      >
                        <p className="truncate text-sm font-semibold text-white">{poi.label}</p>
                        <p className="truncate text-xs text-white/60">{poi.descriptionShort}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      </aside>

      <Button
        variant="secondary"
        size="icon"
        onClick={() => setMode("weather")}
        aria-label="展開天氣面板"
        className={cn(
          "pointer-events-auto absolute top-16 right-4 z-20 shadow-lg backdrop-blur-md transition-opacity duration-200",
          isOpen ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        {WeatherModeIcon ? <WeatherModeIcon className="size-5" /> : null}
      </Button>
    </>
  );
}
