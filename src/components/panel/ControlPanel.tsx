"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { RegionSelector } from "@/src/components/panel/RegionSelector";
import { StatusPanel } from "@/src/components/panel/StatusPanel";
import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import {
  DEFAULT_LIGHTING_PRESET_ID,
  INTERNAL_LIGHTING_PRESET_OVERRIDE,
  LIGHTING_PRESETS,
  TERRAIN_DETAIL_LEVEL_OPTIONS,
} from "@/src/lib/config/app";
import { POINTS_OF_INTEREST } from "@/src/lib/config/poi";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { LightingPresetId, TerrainDetailLevel } from "@/src/types";

function isLightingPresetId(value: string | null): value is LightingPresetId {
  if (value === null) {
    return false;
  }
  return value in LIGHTING_PRESETS;
}

/**
 * ControlPanel：操作面板島（client island）。
 *
 * 職責單一＝「操作 + 呈現摘要」。意圖狀態（region）讀寫自 Zustand store；
 * 後端資料讀自 WorkspaceProvider（Context）。不持有資料、不負責抓取——
 * 與 MapCanvas 為對等兄弟，兩者透過 store / context 連動，而非父子關係。
 */
export function ControlPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const region = useWorkspaceStore((s) => s.region);
  const setRegion = useWorkspaceStore((s) => s.setRegion);
  const lightingPresetId = useWorkspaceStore((s) => s.lightingPresetId);
  const setLightingPresetId = useWorkspaceStore((s) => s.setLightingPresetId);
  const terrainDetailLevel = useWorkspaceStore((s) => s.terrainDetailLevel);
  const setTerrainDetailLevel = useWorkspaceStore((s) => s.setTerrainDetailLevel);
  const activePoiId = useWorkspaceStore((s) => s.activePoiId);
  const poiFocusEnabled = useWorkspaceStore((s) => s.poiFocusEnabled);
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const clearPoiFocus = useWorkspaceStore((s) => s.clearPoiFocus);
  const { data, loading, error, refetch } = useWorkspaceData();
  const isLightingPresetLocked = INTERNAL_LIGHTING_PRESET_OVERRIDE != null;
  const isAlreadyDefaultPreset = lightingPresetId === DEFAULT_LIGHTING_PRESET_ID;
  const isPoiModeActive = poiFocusEnabled && activePoiId !== null;

  useEffect(() => {
    if (isLightingPresetLocked) {
      return;
    }

    const presetFromUrl = searchParams.get("preset");
    const resolvedPreset = isLightingPresetId(presetFromUrl)
      ? presetFromUrl
      : DEFAULT_LIGHTING_PRESET_ID;

    // URL 僅在外部導覽（貼連結 / 手改 query / 上下頁）時回寫 store。
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

    // 用 replaceState 鏡像 URL，避免 router navigation 造成額外同步迴圈。
    window.history.replaceState(window.history.state, "", currentUrl.toString());
  }, [isLightingPresetLocked, lightingPresetId, pathname]);
 
  return (
    <div className="space-y-4">
      <RegionSelector value={region} onChange={setRegion} disabled={loading} />
      <section className="space-y-2 rounded-lg border border-white/10 bg-black/10 p-3">
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">細節程度</p>
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
        <p className="text-[11px] text-white/55">DEM 與 landcover 會綁定相同解析度。</p>
      </section>

      <section className="space-y-2 rounded-lg border border-white/10 bg-black/10 p-3">
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">景點檢視</p>
        <div className="grid gap-2">
          {POINTS_OF_INTEREST.map((poi) => {
            const isActive = poiFocusEnabled && activePoiId === poi.id;
            return (
              <button
                key={poi.id}
                type="button"
                onClick={() => {
                  setActivePoi(poi.id);
                  setPoiFocusEnabled(true);
                }}
                className={
                  isActive
                    ? "w-full rounded-md border border-sky-300/70 bg-sky-400/20 px-3 py-2 text-left text-sm text-white transition"
                    : "w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-left text-sm text-white/85 transition hover:bg-black/30"
                }
              >
                {poi.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => clearPoiFocus()}
          disabled={!isPoiModeActive}
          className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-xs font-medium tracking-wide text-white/85 transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          回到全島視角
        </button>
        <p className="text-[11px] text-white/55">
          目前先接 2 個固定景點，點擊後相機會飛到預設鏡位。
        </p>
      </section>
      <section className="space-y-2 rounded-lg border border-white/10 bg-black/10 p-3">
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">光影風格</p>
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
        <button
          type="button"
          onClick={() => setLightingPresetId(DEFAULT_LIGHTING_PRESET_ID)}
          disabled={isLightingPresetLocked || isAlreadyDefaultPreset}
          className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-xs font-medium tracking-wide text-white/85 transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset to realistic
        </button>
        {isLightingPresetLocked ? (
          <p className="text-[11px] text-amber-200/80">
            目前使用內部 override，若要啟用下拉切換，請先把 INTERNAL_LIGHTING_PRESET_OVERRIDE 設為 null。
          </p>
        ) : null}
      </section>
      <StatusPanel
        data={data}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
