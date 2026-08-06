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
import { cn } from "@/src/lib/utils";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
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
        {showWeatherList ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">天氣（{weather.length}）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[22rem] overflow-y-auto pr-1">
                <ul className="divide-border divide-y">
                  {weather.map((w, i) => (
                    <li key={`${w.lat}-${w.lon}-${i}`} className="py-1">
                      <button
                        type="button"
                        onClick={() => onSelectWeather?.({ index: i, lat: w.lat, lon: w.lon })}
                        className="hover:bg-accent/40 flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm transition"
                      >
                        <span className={`size-2 shrink-0 rounded-full ${ALERT_DOT[w.alertLevel]}`} />
                        <span className="text-muted-foreground min-w-[110px] tabular-nums">
                          {w.lat.toFixed(2)}, {w.lon.toFixed(2)}
                        </span>
                        <span className="font-semibold">{w.temperatureC.toFixed(1)}°C</span>
                        <span className="text-muted-foreground">
                          風 {w.windSpeedMs.toFixed(1)} m/s
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showRoadList ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">路況（{roads.length}）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[22rem] overflow-y-auto pr-1">
                <ul className="divide-border divide-y">
                  {roads.map((r) => (
                    <li key={r.segmentId} className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          const [lon = 0, lat = 0] = r.geometry[0] ?? [0, 0];
                          onSelectRoad?.({ segmentId: r.segmentId, lon, lat });
                        }}
                        className="hover:bg-accent/40 flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm transition"
                      >
                        <span className={`size-2 shrink-0 rounded-full ${ROAD_DOT[r.status]}`} />
                        <span className="flex-1 truncate">{r.name}</span>
                        <span className="font-semibold">{r.status}</span>
                        {r.reason && <span className="text-muted-foreground">{r.reason}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : null}
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

export function WeatherDrawer() {
  const { activeMode, isOpen, options, setMode, closeMode } = useInfoModeState();
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const selectRoadSegment = useWorkspaceStore((s) => s.selectRoadSegment);
  const selectStation = useWorkspaceStore((s) => s.selectStation);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
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
            onClick={closeMode}
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
                onClick={() => setMode(id)}
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
                setPoiFocusEnabled(false);
                selectRoadSegment(null);
                selectStation(`station-${index}`);
                setMapFocusTarget({ lon, lat });
                setMode("weather");
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
                setPoiFocusEnabled(false);
                selectStation(null);
                selectRoadSegment(segmentId);
                setMapFocusTarget({ lon, lat });
                setMode("road");
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
                        onClick={() => {
                          setPoiFocusEnabled(true);
                          setActivePoi(poi.id);
                          selectStation(null);
                          selectRoadSegment(null);
                          setMapFocusTarget({ lon: poi.lon, lat: poi.lat });
                          setMode("poi");
                        }}
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
