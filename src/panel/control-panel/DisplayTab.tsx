"use client";

import { RegionSelector } from "@/src/panel/RegionSelector";
import { REGION_LABELS } from "@/src/lib/config/app";
import { useDisplaySettingsController } from "./useDisplaySettingsController";

export function DisplayTab() {
  const { region, regionLabel, loading, onRegionChange, onRegionSelect } = useDisplaySettingsController();

  return (
    <section className="mx-auto w-full space-y-3 rounded-lg border border-white/10 bg-black/15 p-3">
      <div>
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">顯示控制</p>
        <p className="text-[11px] text-white/55">
          區域切換已從左側移入這裡，左側面板現在只負責資訊顯示。
        </p>
      </div>

      <RegionSelector
        value={region}
        onChange={onRegionChange}
        onSelect={onRegionSelect}
        disabled={loading}
      />

      <p className="text-[11px] text-white/55">
        目前區域：{regionLabel}（{REGION_LABELS[region]}），切換後會更新左側摘要與地圖資料。
      </p>
    </section>
  );
}
