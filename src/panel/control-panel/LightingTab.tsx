"use client";

import { Button } from "@/src/components/ui/button";
import type { LightingPresetId } from "@/src/types";
import { useLightingSettingsController } from "./useLightingSettingsController";

export function LightingTab() {
  const {
    lightingPresetId,
    isLightingPresetLocked,
    isAlreadyDefaultPreset,
    lightingPresets,
    onPresetChange,
    onResetPreset,
  } = useLightingSettingsController();

  return (
    <section className="mx-auto w-full space-y-2 rounded-lg border border-white/10 bg-black/15 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">場景光影</p>
          <p className="text-[11px] text-white/55">控制地圖整體視覺語氣與基準亮度。</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResetPreset}
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
        onChange={(event) => onPresetChange(event.target.value as LightingPresetId)}
        disabled={isLightingPresetLocked}
        className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="光影風格"
      >
        {lightingPresets.map((preset) => (
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
  );
}
