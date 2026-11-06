"use client";

import {
  useWorkspaceData,
  useWorkspacePois,
} from "@/src/components/providers/WorkspaceProvider";
import { useInfoModeState } from "@/src/app-shell/hooks/useInfoModeState";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
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
    <section className="border-t border-white/10 pt-4">
      <h3 className="mb-3 text-base font-semibold">天氣（{items.length}）</h3>
        <div className="max-h-[22rem] overflow-y-auto pr-1">
          <ul className="divide-y divide-white/10">
            {items.map((item, index) => (
              <WeatherItem key={`${item.lat}-${item.lon}-${index}`} item={item} index={index} onSelectWeather={onSelectWeather} />
            ))}
          </ul>
        </div>
    </section>
  );
}

function RoadList({ items, onSelectRoad }: { items: NonNullable<IcelandStatusResponse["roads"]>; onSelectRoad?: StatusPanelProps["onSelectRoad"] }) {
  return (
    <section className="border-t border-white/10 pt-4">
      <h3 className="mb-3 text-base font-semibold">路況（{items.length}）</h3>
        <div className="max-h-[22rem] overflow-y-auto pr-1">
          <ul className="divide-y divide-white/10">
            {items.map((item) => (
              <RoadItem key={item.segmentId} item={item} onSelectRoad={onSelectRoad} />
            ))}
          </ul>
        </div>
    </section>
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
      <section className="space-y-3 border-b border-destructive/60 pb-4">
          <p className="text-destructive text-sm">資料載入失敗：{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            重試
          </Button>
      </section>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">尚無資料。</p>;
  }

  const { meta, summary, weather, roads } = data;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 py-2">
          <Metric label="風險分數" value={summary.riskScore} />
          <Metric label="高風險路段" value={summary.highRiskSegments} />
          <Metric label="天氣測站" value={weather.length} />
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary">cache: {meta.cache}</Badge>
            {meta.fallback && <Badge variant="destructive">備援資料</Badge>}
          </div>
      </div>

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
  const { activeMode, isOpen, options } = useInfoModeState();
  const { dispatch } = useMarkerInteraction();
  const { data, loading, error, refetch } = useWorkspaceData();
  const { points: pointsOfInterest } = useWorkspacePois();
  const activeSection = activeMode ?? "weather";
  const activeModeOption = options.find((option) => option.id === activeSection);

  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "bg-[#0c1724]/95 border-white/15 pointer-events-auto absolute right-0 bottom-full z-20 mb-0 flex max-h-[calc(100dvh-8rem)] w-full flex-col overflow-hidden rounded-t-2xl rounded-b-none border border-b-0 shadow-2xl backdrop-blur-md transition-[opacity,transform] duration-300 ease-out",
        isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-base leading-tight font-bold">地圖資訊</h2>
            <p className="text-muted-foreground text-xs">
              {activeModeOption?.label} · 點擊項目後同步地圖
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
              <div className="border-b border-white/10 pb-3">
                <p className="text-sm font-semibold text-white">景點（{pointsOfInterest.length}）</p>
                <p className="text-xs text-white/60">點擊景點後，地圖會切到景點模式並聚焦</p>
              </div>

              <div className="max-h-[30rem] overflow-y-auto pr-1">
                <ul className="divide-y divide-white/10">
                  {pointsOfInterest.map((poi) => (
                    <li key={poi.id}>
                      <button
                        type="button"
                        onClick={() => selectMarkerForPoi(poi, dispatch)}
                        className="w-full px-2 py-3 text-left transition hover:bg-white/5"
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
  );
}
