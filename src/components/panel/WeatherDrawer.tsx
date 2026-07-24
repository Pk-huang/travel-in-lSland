"use client";

import { ChevronRight, CloudSun, MapPin, Route } from "lucide-react";

import {
  useWorkspaceData,
  useWorkspacePois,
} from "@/src/components/providers/WorkspaceProvider";
import { StatusPanel } from "@/src/components/panel/StatusPanel";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

const DRAWER_SECTIONS = ["weather", "road", "poi"] as const;
type DrawerSection = (typeof DRAWER_SECTIONS)[number];

function isDrawerSection(value: string | null): value is DrawerSection {
  return value != null && DRAWER_SECTIONS.includes(value as DrawerSection);
}

export function WeatherDrawer() {
  const activeInfoPanelSection = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const setActiveInfoPanelSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const selectRoadSegment = useWorkspaceStore((s) => s.selectRoadSegment);
  const selectStation = useWorkspaceStore((s) => s.selectStation);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
  const { data, loading, error, refetch } = useWorkspaceData();
  const { points: pointsOfInterest } = useWorkspacePois();
  const isOpen = isDrawerSection(activeInfoPanelSection);
  const activeSection: DrawerSection = isDrawerSection(activeInfoPanelSection)
    ? activeInfoPanelSection
    : "weather";

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
            onClick={() => setActiveInfoPanelSection(null)}
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
            <Button
              type="button"
              variant={activeSection === "weather" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveInfoPanelSection("weather")}
              className="justify-center gap-1"
            >
              <CloudSun className="size-4" />
              天氣
            </Button>
            <Button
              type="button"
              variant={activeSection === "road" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveInfoPanelSection("road")}
              className="justify-center gap-1"
            >
              <Route className="size-4" />
              路況
            </Button>
            <Button
              type="button"
              variant={activeSection === "poi" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveInfoPanelSection("poi")}
              className="justify-center gap-1"
            >
              <MapPin className="size-4" />
              景點
            </Button>
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
                setActiveInfoPanelSection("weather");
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
                setActiveInfoPanelSection("road");
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
                          setActiveInfoPanelSection("poi");
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
        onClick={() => setActiveInfoPanelSection("weather")}
        aria-label="展開天氣面板"
        className={cn(
          "pointer-events-auto absolute top-16 right-4 z-20 shadow-lg backdrop-blur-md transition-opacity duration-200",
          isOpen ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <CloudSun className="size-5" />
      </Button>
    </>
  );
}
