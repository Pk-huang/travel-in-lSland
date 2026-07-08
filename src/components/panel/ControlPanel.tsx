"use client";

import { RegionSelector } from "@/src/components/panel/RegionSelector";
import { StatusPanel } from "@/src/components/panel/StatusPanel";
import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { INTERNAL_LIGHTING_PRESET_OVERRIDE, LIGHTING_PRESETS } from "@/src/lib/config/app";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * ControlPanel：操作面板島（client island）。
 *
 * 職責單一＝「操作 + 呈現摘要」。意圖狀態（region）讀寫自 Zustand store；
 * 後端資料讀自 WorkspaceProvider（Context）。不持有資料、不負責抓取——
 * 與 MapCanvas 為對等兄弟，兩者透過 store / context 連動，而非父子關係。
 */
export function ControlPanel() {
  const region = useWorkspaceStore((s) => s.region);
  const setRegion = useWorkspaceStore((s) => s.setRegion);
  const lightingPresetId = useWorkspaceStore((s) => s.lightingPresetId);
  const setLightingPresetId = useWorkspaceStore((s) => s.setLightingPresetId);
  const { data, loading, error, refetch } = useWorkspaceData();
  const isLightingPresetLocked = INTERNAL_LIGHTING_PRESET_OVERRIDE != null;
 
  return (
    <div className="space-y-4">
      <RegionSelector value={region} onChange={setRegion} disabled={loading} />
      <section className="space-y-2 rounded-lg border border-white/10 bg-black/10 p-3" >
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">光影風格</p>
        <select
          id="lighting-preset"
          name="lighting-preset"
          value={lightingPresetId}
          onChange={(event) => setLightingPresetId(event.target.value as keyof typeof LIGHTING_PRESETS)}
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
      <StatusPanel
        data={data}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
