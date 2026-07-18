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
  const { data, loading, error, refetch } = useWorkspaceData();
  const isLightingPresetLocked = INTERNAL_LIGHTING_PRESET_OVERRIDE != null;

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
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">天氣概況</p>
          <p className="text-[11px] text-white/55">
            切換區域後查看觀測站、風險分數與路況摘要；左側面板暫時專注資訊顯示，不承擔場景控制。
          </p>
        </div>
        <RegionSelector value={region} onChange={setRegion} disabled={loading} />
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
