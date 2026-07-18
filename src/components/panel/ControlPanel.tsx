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
} from "@/src/lib/config/app";
import { POINTS_OF_INTEREST } from "@/src/lib/config/poi";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { LightingPresetId } from "@/src/types";

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
  const activePoiId = useWorkspaceStore((s) => s.activePoiId);
  const poiFocusEnabled = useWorkspaceStore((s) => s.poiFocusEnabled);
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const clearPoiFocus = useWorkspaceStore((s) => s.clearPoiFocus);
  const activeSection = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const setActiveSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const { data, loading, error, refetch } = useWorkspaceData();
  const isLightingPresetLocked = INTERNAL_LIGHTING_PRESET_OVERRIDE != null;
  const isWeatherOpen = activeSection === "weather";
  const isPoiOpen = activeSection === "poi";

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
      <section className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveSection((current) => (current === "weather" ? null : "weather"))}
            aria-expanded={isWeatherOpen}
            className={
              isWeatherOpen
                ? "w-full rounded-lg border border-sky-300/70 bg-sky-400/15 px-4 py-3 text-left text-base font-semibold text-white transition"
                : "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-base font-semibold text-white/90 transition hover:bg-white/10"
            }
          >
            天氣
          </button>

          <button
            type="button"
            onClick={() => setActiveSection((current) => (current === "poi" ? null : "poi"))}
            aria-expanded={isPoiOpen}
            className={
              isPoiOpen
                ? "w-full rounded-lg border border-sky-300/70 bg-sky-400/15 px-4 py-3 text-left text-base font-semibold text-white transition"
                : "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-base font-semibold text-white/90 transition hover:bg-white/10"
            }
          >
            景點
          </button>
        </div>

        {isWeatherOpen ? (
          <div className="space-y-3">
            <p className="text-[11px] text-white/55">
              切換區域後查看觀測站、風險分數與路況摘要；左側面板暫時專注資訊顯示，不承擔場景控制。
            </p>
            <RegionSelector value={region} onChange={setRegion} disabled={loading} />
          </div>
        ) : null}

        {isPoiOpen ? (
          <div className="space-y-3">
            <p className="text-[11px] text-white/55">
              點擊固定景點後，相機會飛到預設鏡位；這一層先作為景點導覽入口，不承擔地形重建職責。
            </p>

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
              disabled={!poiFocusEnabled || activePoiId === null}
              className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-xs font-medium tracking-wide text-white/85 transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              回到全島視角
            </button>
          </div>
        ) : null}
      </section>

      {isWeatherOpen ? (
        <StatusPanel
          data={data}
          loading={loading}
          error={error}
          onRetry={refetch}
        />
      ) : null}
    </div>
  );
}
