"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { StatusPanel } from "@/src/components/panel/StatusPanel";
import { Badge } from "@/src/components/ui/badge";
import {
  useWorkspaceData,
  useWorkspacePois,
} from "@/src/components/providers/WorkspaceProvider";
import {
  DEFAULT_LIGHTING_PRESET_ID,
  INTERNAL_LIGHTING_PRESET_OVERRIDE,
  LIGHTING_PRESETS,
} from "@/src/lib/config/app";
import { findPointOfInterestById } from "@/src/lib/config/poi";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { LightingPresetId, PointOfInterest } from "@/src/types";

const activePoiFromStore = (
  points: PointOfInterest[],
  activePoiId: string | null,
) => findPointOfInterestById(points, activePoiId);

function isLightingPresetId(value: string | null): value is LightingPresetId {
  if (value === null) {
    return false;
  }
  return value in LIGHTING_PRESETS;
}

export function ControlPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lightingPresetId = useWorkspaceStore((s) => s.lightingPresetId);
  const setLightingPresetId = useWorkspaceStore((s) => s.setLightingPresetId);
  const activePoiId = useWorkspaceStore((s) => s.activePoiId);
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const poiFocusEnabled = useWorkspaceStore((s) => s.poiFocusEnabled);
  const clearPoiFocus = useWorkspaceStore((s) => s.clearPoiFocus);
  const selectStation = useWorkspaceStore((s) => s.selectStation);
  const selectRoadSegment = useWorkspaceStore((s) => s.selectRoadSegment);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const activeSection = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const setActiveInfoPanelSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const { data, loading, error, refetch } = useWorkspaceData();
  const { points: pointsOfInterest } = useWorkspacePois();
  const [activePoiImageIndex, setActivePoiImageIndex] = useState(0);

  const isLightingPresetLocked = INTERNAL_LIGHTING_PRESET_OVERRIDE != null;
  const isWeatherOpen = activeSection === "weather";
  const isPoiOpen = activeSection === "poi";
  const isRoadOpen = activeSection === "road";
  const activePoi = activePoiFromStore(pointsOfInterest, activePoiId);
  const activePoiGallery = activePoi?.imageGallery ?? [];
  const effectivePoiImageIndex =
    activePoiGallery.length === 0
      ? 0
      : Math.min(activePoiImageIndex, activePoiGallery.length - 1);

  useEffect(() => {
    if (isLightingPresetLocked) {
      return;
    }

    const presetFromUrl = searchParams.get("preset");
    const resolvedPreset = isLightingPresetId(presetFromUrl)
      ? presetFromUrl
      : DEFAULT_LIGHTING_PRESET_ID;

    const currentPreset = useWorkspaceStore.getState().lightingPresetId;
    if (resolvedPreset !== currentPreset) {
      setLightingPresetId(resolvedPreset);
    }
  }, [isLightingPresetLocked, searchParams, setLightingPresetId]);

  useEffect(() => {
    if (isLightingPresetLocked) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const currentPresetInUrl = currentUrl.searchParams.get("preset");
    if (currentPresetInUrl === lightingPresetId && currentUrl.pathname === pathname) {
      return;
    }

    currentUrl.pathname = pathname;
    currentUrl.searchParams.set("preset", lightingPresetId);
    window.history.replaceState(window.history.state, "", currentUrl.toString());
  }, [isLightingPresetLocked, lightingPresetId, pathname]);

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-3">
        {isWeatherOpen ? (
          <div className="space-y-3">
            <p className="text-[11px] text-white/55">
              區域切換已移到右上 Settings；左側現在只顯示觀測站、風險分數與路況摘要。
            </p>
          </div>
        ) : null}

        {isPoiOpen ? (
          <div className="flex min-h-[34rem] flex-col gap-3">
            <p className="text-[11px] text-white/55">
              點擊地圖圖釘後，相機會飛到預設鏡位，右側會同步顯示景點詳情。
            </p>

            {activePoi ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="relative">
                  <Image
                    src={activePoiGallery[effectivePoiImageIndex]?.imageUrl ?? activePoi.imageUrl}
                    alt={activePoiGallery[effectivePoiImageIndex]?.alt ?? activePoi.label}
                    width={960}
                    height={540}
                    className="h-40 w-full object-cover"
                  />
                  {activePoiGallery.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePoiImageIndex((current) =>
                            current === 0 ? activePoiGallery.length - 1 : current - 1,
                          )
                        }
                        className="absolute top-1/2 left-3 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/85 backdrop-blur transition hover:bg-black/75"
                        aria-label="上一張圖片"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePoiImageIndex((current) =>
                            current === activePoiGallery.length - 1 ? 0 : current + 1,
                          )
                        }
                        className="absolute top-1/2 right-3 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/85 backdrop-blur transition hover:bg-black/75"
                        aria-label="下一張圖片"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                      <div className="absolute right-0 bottom-0 left-0 flex justify-center gap-2 p-3">
                        {activePoiGallery.map((image, index) => (
                          <button
                            key={`${image.imageUrl}-${index}`}
                            type="button"
                            onClick={() => setActivePoiImageIndex(index)}
                            className={
                              index === effectivePoiImageIndex
                                ? "size-2 rounded-full bg-white"
                                : "size-2 rounded-full bg-white/40 transition hover:bg-white/70"
                            }
                            aria-label={`切換到第 ${index + 1} 張圖片`}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{activePoi.label}</p>
                      <p className="text-xs text-white/65">{activePoi.labelZhHant}</p>
                      <p className="text-xs text-white/55">
                        {activePoi.lat.toFixed(4)}, {activePoi.lon.toFixed(4)}
                      </p>
                    </div>
                    <Badge variant="secondary">已選擇</Badge>
                  </div>

                  <p className="text-sm leading-6 text-white/75">{activePoi.description}</p>

                  <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
                    <span className="rounded-full border border-white/10 px-2 py-1">
                      類別：{activePoi.category}
                    </span>
                    {activePoi.visitRegion ? (
                      <span className="rounded-full border border-white/10 px-2 py-1">
                        區域：{activePoi.visitRegion}
                      </span>
                    ) : null}
                    {activePoi.bestSeason.map((season) => (
                      <span key={season} className="rounded-full border border-white/10 px-2 py-1">
                        {season}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold tracking-wide text-white/70">完整介紹</p>
                    <p className="text-sm leading-6 text-white/72">{activePoi.descriptionLong}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold tracking-wide text-white/70">交通方式</p>
                    <p className="text-sm leading-6 text-white/72">{activePoi.travel.access}</p>
                    <p className="text-sm leading-6 text-white/60">停車：{activePoi.travel.parking}</p>
                    <p className="text-sm leading-6 text-white/60">大眾運輸：{activePoi.travel.publicTransport}</p>
                    <p className="text-sm leading-6 text-white/60">雷克雅維克出發：{activePoi.travel.driveTimeFromReykjavik}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold tracking-wide text-white/70">注意事項</p>
                    <ul className="space-y-2 text-sm leading-6 text-white/72">
                      {activePoi.cautionNotes.map((note) => (
                        <li key={note} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-300" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold tracking-wide text-white/70">來源與授權</p>
                    <div className="space-y-1 text-sm text-white/68">
                      <p>
                        來源頁：
                        <a
                          className="ml-1 text-sky-300 underline-offset-4 hover:underline"
                          href={activePoi.mediaAttribution.sourcePageUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          圖片來源
                        </a>
                      </p>
                      <p>
                        維基百科：
                        <a
                          className="ml-1 text-sky-300 underline-offset-4 hover:underline"
                          href={activePoi.sources.wikipediaUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {activePoi.label}
                        </a>
                      </p>
                      <p>
                        Wikidata：
                        <a
                          className="ml-1 text-sky-300 underline-offset-4 hover:underline"
                          href={activePoi.sources.wikidataUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          開啟資料頁
                        </a>
                      </p>
                      <p>授權：{activePoi.mediaAttribution.licenseName}</p>
                      <p>作者：{activePoi.mediaAttribution.author}</p>
                      <p className="text-xs text-white/52">{activePoi.mediaAttribution.attributionText}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {pointsOfInterest.map((poi) => (
                    <button
                      key={poi.id}
                      type="button"
                      onClick={() => {
                        setActivePoi(poi.id);
                        setPoiFocusEnabled(true);
                        setActiveInfoPanelSection("poi");
                        setActivePoiImageIndex(0);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-sky-300/40 hover:bg-black/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{poi.label}</p>
                          <p className="truncate text-xs text-white/55">{poi.labelZhHant}</p>
                        </div>
                        <Badge variant="secondary">景點</Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/65">
                        {poi.descriptionShort}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => clearPoiFocus()}
              disabled={!poiFocusEnabled || activePoiId === null}
              className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-xs font-medium tracking-wide text-white/85 transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              回到全島視角
            </button>
          </div>
        ) : null}

        {isRoadOpen ? (
          <div className="space-y-3">
            <p className="text-[11px] text-white/55">
              路況已改為地圖圖標模式，左側清單已關閉；請直接在地圖上 hover 圖標查看路段狀態。
            </p>
          </div>
        ) : null}
      </section>

      {isWeatherOpen || isRoadOpen ? (
        <StatusPanel
          data={data}
          loading={loading}
          error={error}
          onRetry={refetch}
          showWeatherList={isWeatherOpen}
          showRoadList={isRoadOpen}
          onSelectWeather={({ index, lat, lon }) => {
            setPoiFocusEnabled(false);
            selectRoadSegment(null);
            selectStation(`station-${index}`);
            setMapFocusTarget({ lon, lat });
            setActiveInfoPanelSection("weather");
          }}
          onSelectRoad={({ segmentId, lon, lat }) => {
            setPoiFocusEnabled(false);
            selectStation(null);
            selectRoadSegment(segmentId);
            setMapFocusTarget({ lon, lat });
            setActiveInfoPanelSection("road");
          }}
        />
      ) : null}
    </div>
  );
}
