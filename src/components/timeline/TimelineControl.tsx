"use client";

import { useEffect, useMemo } from "react";
import { Clock, Pause, Play, RotateCcw, Settings, X } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { computeLighting } from "@/src/components/map/Lighting";
import { RegionSelector } from "@/src/components/panel/RegionSelector";
import {
  DEFAULT_LIGHTING_PRESET_ID,
  INTERNAL_LIGHTING_PRESET_OVERRIDE,
  LIGHTING_PRESETS,
  REGION_LABELS,
  REGION_FOCUS_TARGETS,
  TERRAIN_DETAIL_LEVEL_OPTIONS,
} from "@/src/lib/config/app";
import {
  useWorkspaceStore,
  type PlaybackSpeed,
} from "@/src/lib/store/workspace";
import { cn } from "@/src/lib/utils";
import type { LightingPresetId, TerrainDetailLevel } from "@/src/types";

/**
 * TimelineControl：底部時間軸控制器。
 *
 * 子步驟 2-3a（本版）：建立 2D 時間軸 UI，將使用者選擇寫入 Zustand 的 time 意圖狀態。
 *
 * - 本步只建立「時間意圖」：拖曳 range -> setTime(ISO string)。
 * - 3D 場景讀取 time 並改變光影/鏡頭，留待 2-3b。
 * - 本步啟用播放器自動推進（僅前端槽位切換，不碰 API）。
 */
const HOUR_OFFSETS = [-6, -3, 0, 3, 6, 9, 12, 18, 24] as const;
const PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [0.5, 1, 2] as const;
const MINUTE_MS = 60_000;
const TICK_MS = 200;
const BASE_ADVANCE_MINUTES_PER_SECOND = 24;
const SCENE_CONTROL_CONTENT_MAX_WIDTH = "100%";

function formatTimeLabel(value: number | null): string {
  if (!value) return "現在";
  const date = new Date(value);
  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatOffsetLabel(offset: number): string {
  if (offset === 0) return "現在";
  return offset > 0 ? `+${offset}h` : `${offset}h`;
}

export function TimelineControl() {
  const selectedTime = useWorkspaceStore((s) => s.time);
  const playbackState = useWorkspaceStore((s) => s.playbackState);
  const playbackSpeed = useWorkspaceStore((s) => s.playbackSpeed);
  const lightingPresetId = useWorkspaceStore((s) => s.lightingPresetId);
  const terrainDetailLevel = useWorkspaceStore((s) => s.terrainDetailLevel);
  const region = useWorkspaceStore((s) => s.region);
  const activeInfoPanelSection = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const setTime = useWorkspaceStore((s) => s.setTime);
  const play = useWorkspaceStore((s) => s.play);
  const pause = useWorkspaceStore((s) => s.pause);
  const setSpeed = useWorkspaceStore((s) => s.setSpeed);
  const setLightingPresetId = useWorkspaceStore((s) => s.setLightingPresetId);
  const setTerrainDetailLevel = useWorkspaceStore((s) => s.setTerrainDetailLevel);
  const setRegion = useWorkspaceStore((s) => s.setRegion);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
  const activeUtilityPanel = useWorkspaceStore((s) => s.activeUtilityPanel);
  const activeUtilityTab = useWorkspaceStore((s) => s.activeUtilityTab);
  const setActiveUtilityPanel = useWorkspaceStore((s) => s.setActiveUtilityPanel);
  const setActiveUtilityTab = useWorkspaceStore((s) => s.setActiveUtilityTab);
  const { data, loading } = useWorkspaceData();
  const isLightingPresetLocked = INTERNAL_LIGHTING_PRESET_OVERRIDE != null;
  const isAlreadyDefaultPreset = lightingPresetId === DEFAULT_LIGHTING_PRESET_ID;
  const stationCount = data?.weather.length ?? 0;
  const roadCount = data?.roads.length ?? 0;
  const shouldShowPoiPins = activeInfoPanelSection === "poi";
  const shouldShowStations = activeInfoPanelSection === "weather";
  const shouldShowRoads = activeInfoPanelSection === "road";
  const activePresetId =
    INTERNAL_LIGHTING_PRESET_OVERRIDE ?? lightingPresetId ?? DEFAULT_LIGHTING_PRESET_ID;
  const lightingDebug = computeLighting(
    selectedTime ? new Date(selectedTime) : new Date(),
    LIGHTING_PRESETS[activePresetId],
    data?.sunModel,
  );

  const slots = useMemo(() => {
    const base = new Date();
    base.setMinutes(0, 0, 0);
    return HOUR_OFFSETS.map((offset) => {
      const date = new Date(base);
      date.setHours(base.getHours() + offset);
      return { offset, ms: date.getTime() };
    });
  }, []);

  const windowStartMs = slots[0].ms;
  const windowEndMs = slots[slots.length - 1].ms;
  const totalMinutes = Math.max(1, Math.round((windowEndMs - windowStartMs) / MINUTE_MS));
  const nowSlotIndex = HOUR_OFFSETS.indexOf(0);

  const effectiveTimeMs = Math.min(
    Math.max(selectedTime ?? slots[nowSlotIndex].ms, windowStartMs),
    windowEndMs,
  );

  const selectedMinuteOffset = Math.round((effectiveTimeMs - windowStartMs) / MINUTE_MS);

  useEffect(() => {
    if (playbackState !== "playing") return;

    const intervalMs = TICK_MS;
    const advanceMs =
      (BASE_ADVANCE_MINUTES_PER_SECOND * MINUTE_MS * playbackSpeed * intervalMs) /
      1000;

    const timer = window.setInterval(() => {
      const currentMs = Math.min(
        Math.max(selectedTime ?? Date.now(), windowStartMs),
        windowEndMs,
      );
      const nextMs = currentMs + advanceMs;

      if (nextMs >= windowEndMs) {
        setTime(windowEndMs);
        pause();
        return;
      }
      setTime(Math.round(nextMs));
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [
    playbackSpeed,
    playbackState,
    pause,
    selectedTime,
    setTime,
    windowEndMs,
    windowStartMs,
  ]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActiveUtilityTab("display");
          setActiveUtilityPanel(activeUtilityPanel === "settings" ? null : "settings");
        }}
        className="pointer-events-auto absolute top-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-xs font-medium text-white/85 shadow-lg backdrop-blur transition hover:bg-black/75"
        aria-expanded={activeUtilityPanel !== null}
        aria-label={activeUtilityPanel ? "切換到設定抽屜" : "開啟設定抽屜"}
      >
        <Settings className="size-4" />
        Settings
      </button>

      <section
        aria-hidden={activeUtilityPanel !== "settings" && activeUtilityPanel !== "timeline"}
        className={cn(
          "absolute top-16 right-4 z-30 w-[min(420px,calc(100vw-1.5rem))] rounded-xl border border-white/10 bg-black/70 px-4 py-4 shadow-2xl backdrop-blur-md transform-gpu transition-transform duration-300 ease-out",
          activeUtilityPanel === "settings" || activeUtilityPanel === "timeline"
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none translate-x-full",
        )}
      >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">Scene Settings</p>
              <button
                type="button"
                onClick={() => setActiveUtilityPanel(null)}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-1.5 text-white/80 transition hover:bg-white/10"
                aria-label="關閉設定抽屜"
              >
                <X className="size-4" />
              </button>
            </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ControlTabButton
              label="顯示"
              active={activeUtilityTab === "display"}
              onClick={() => setActiveUtilityTab("display")}
            />
            <ControlTabButton
              label="光影風格"
              active={activeUtilityTab === "lighting"}
              onClick={() => setActiveUtilityTab("lighting")}
            />
            <ControlTabButton
              label="細節程度"
              active={activeUtilityTab === "detail"}
              onClick={() => setActiveUtilityTab("detail")}
            />
            <ControlTabButton
              label="時間軸"
              active={activeUtilityTab === "timeline"}
              onClick={() => setActiveUtilityTab("timeline")}
            />
            <ControlTabButton
              label="Debug"
              active={activeUtilityTab === "debug"}
              onClick={() => setActiveUtilityTab("debug")}
            />
          </div>
        </div>

        <div className="space-y-3">
            {activeUtilityTab === "display" ? (
              <section
                className="mx-auto w-full space-y-3 rounded-lg border border-white/10 bg-black/15 p-3"
                style={{ maxWidth: SCENE_CONTROL_CONTENT_MAX_WIDTH }}
              >
                <div>
                  <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">顯示控制</p>
                  <p className="text-[11px] text-white/55">區域切換已從左側移入這裡，左側面板現在只負責資訊顯示。</p>
                </div>

                <RegionSelector
                  value={region}
                  onChange={setRegion}
                  onSelect={(nextRegion) => {
                    setMapFocusTarget(REGION_FOCUS_TARGETS[nextRegion]);
                  }}
                  disabled={loading}
                />

                <p className="text-[11px] text-white/55">
                  目前區域：{REGION_LABELS[region]}，切換後會更新左側摘要與地圖資料。
                </p>
              </section>
            ) : null}

            {activeUtilityTab === "lighting" ? (
              <section
                className="mx-auto w-full space-y-2 rounded-lg border border-white/10 bg-black/15 p-3"
                style={{ maxWidth: SCENE_CONTROL_CONTENT_MAX_WIDTH }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">場景光影</p>
                    <p className="text-[11px] text-white/55">控制地圖整體視覺語氣與基準亮度。</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLightingPresetId(DEFAULT_LIGHTING_PRESET_ID)}
                    disabled={isLightingPresetLocked || isAlreadyDefaultPreset}
                    className="h-8 px-2 text-xs text-white hover:bg-white/10 hover:text-white disabled:text-white/45"
                  >
                    Reset
                  </Button>
                </div>

                <select
                  id="lighting-preset"
                  name="lighting-preset"
                  value={lightingPresetId}
                  onChange={(event) => setLightingPresetId(event.target.value as LightingPresetId)}
                  disabled={isLightingPresetLocked}
                  className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="光影風格"
                >
                  {Object.values(LIGHTING_PRESETS).map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-zinc-900 text-white">
                      {preset.label}
                    </option>
                  ))}
                </select>

                {isLightingPresetLocked ? (
                  <p className="text-[11px] text-amber-200/80">
                    目前使用內部 override，若要啟用下拉切換，請先把 INTERNAL_LIGHTING_PRESET_OVERRIDE 設為 null。
                  </p>
                ) : null}
              </section>
            ) : null}

            {activeUtilityTab === "detail" ? (
              <section
                className="mx-auto w-full space-y-2 rounded-lg border border-white/10 bg-black/15 p-3"
                style={{ maxWidth: SCENE_CONTROL_CONTENT_MAX_WIDTH }}
              >
                <div>
                  <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">地形細節</p>
                  <p className="text-[11px] text-white/55">DEM 與 landcover 維持相同解析度，避免場景錯位。</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {TERRAIN_DETAIL_LEVEL_OPTIONS.map((level) => {
                    const isActive = terrainDetailLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setTerrainDetailLevel(level as TerrainDetailLevel)}
                        className={
                          isActive
                            ? "rounded-md border border-sky-300/70 bg-sky-400/20 px-2 py-2 text-xs font-medium text-white"
                            : "rounded-md border border-white/20 bg-black/20 px-2 py-2 text-xs text-white/85 transition hover:bg-black/30"
                        }
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {activeUtilityTab === "timeline" ? (
              <section
                className="mx-auto w-full space-y-3 rounded-lg border border-white/10 bg-black/15 p-3"
                style={{ maxWidth: SCENE_CONTROL_CONTENT_MAX_WIDTH }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Clock className="size-4" />
                    <span>時間軸</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/75">
                      {formatTimeLabel(selectedTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => (playbackState === "playing" ? pause() : play())}
                      aria-label={playbackState === "playing" ? "暫停播放" : "開始播放"}
                      className="size-8 text-white hover:bg-white/10 hover:text-white"
                    >
                      {playbackState === "playing" ? (
                        <Pause className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>

                    <label htmlFor="timeline-speed" className="sr-only">
                      播放速度
                    </label>
                    <select
                      id="timeline-speed"
                      name="timeline-speed"
                      value={String(playbackSpeed)}
                      onChange={(event) =>
                        setSpeed(Number(event.currentTarget.value) as PlaybackSpeed)
                      }
                      className="h-8 rounded-md border border-white/20 bg-black/30 px-2 text-xs text-white outline-none transition focus:border-white/40"
                      aria-label="播放速度"
                    >
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <option key={speed} value={speed} className="bg-zinc-900 text-white">
                          {speed}x
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTime(null)}
                      aria-label="重設為現在"
                      className="size-8 text-white hover:bg-white/10 hover:text-white"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={totalMinutes}
                  step={1}
                  value={selectedMinuteOffset}
                  onChange={(event) =>
                    setTime(windowStartMs + Number(event.currentTarget.value) * MINUTE_MS)
                  }
                  aria-label="選擇時間"
                  className={cn(
                    "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-sky-300",
                    "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-200",
                  )}
                />

                <div className="grid grid-cols-9 text-center text-[11px] text-white/60">
                  {HOUR_OFFSETS.map((offset) => (
                    <span key={offset}>{formatOffsetLabel(offset)}</span>
                  ))}
                </div>
              </section>
            ) : null}

            {activeUtilityTab === "debug" ? (
              <section
                className="mx-auto w-full space-y-3 rounded-lg border border-white/10 bg-black/15 p-3"
                style={{ maxWidth: SCENE_CONTROL_CONTENT_MAX_WIDTH }}
              >
                <div>
                  <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">Debug 資訊</p>
                  <p className="text-[11px] text-white/55">集中顯示場景與資料連動檢查訊息。</p>
                </div>

                <div className="rounded-md border border-white/10 bg-black/30 p-2 text-xs text-white/75">
                  光照 debug · {lightingDebug.hour.toFixed(1)}h · day {lightingDebug.daylight.toFixed(2)} · sun {lightingDebug.sunIntensity.toFixed(2)}
                </div>

                <div className="rounded-md border border-white/10 bg-black/30 p-2 text-xs text-white/75">
                  {REGION_LABELS[region]} ·{" "}
                  {loading
                    ? "載入資料中…"
                    : shouldShowStations
                      ? `${stationCount} 個測站待渲染`
                      : shouldShowRoads
                        ? `${roadCount} 段路況待渲染`
                        : shouldShowPoiPins
                          ? "景點圖釘待渲染"
                          : "已收合資訊面板"}
                </div>

                <p className="text-[11px] text-white/50">3D 場景（Phase 2-1b：真實 DEM 地形）</p>
              </section>
            ) : null}
        </div>
          </div>
        </section>
    </>
  );
}

function ControlTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-sky-300/70 bg-sky-400/20 px-4 py-2 text-sm font-medium text-white"
          : "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
      }
    >
      {label}
    </button>
  );
}
