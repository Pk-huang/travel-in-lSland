"use client";

import { useMemo } from "react";

import {
  DEFAULT_LIGHTING_PRESET_ID,
  INTERNAL_LIGHTING_PRESET_OVERRIDE,
  LIGHTING_PRESETS,
} from "@/src/lib/config/app";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { LightingPresetId } from "@/src/types";

type UseLightingSettingsControllerResult = {
  lightingPresetId: LightingPresetId;
  isLightingPresetLocked: boolean;
  isAlreadyDefaultPreset: boolean;
  lightingPresets: ReadonlyArray<{ id: LightingPresetId; label: string }>;
  onPresetChange: (presetId: LightingPresetId) => void;
  onResetPreset: () => void;
};

export function useLightingSettingsController(): UseLightingSettingsControllerResult {
  const lightingPresetId = useWorkspaceStore((s) => s.lightingPresetId);
  const setLightingPresetId = useWorkspaceStore((s) => s.setLightingPresetId);

  const isLightingPresetLocked = INTERNAL_LIGHTING_PRESET_OVERRIDE != null;
  const isAlreadyDefaultPreset = lightingPresetId === DEFAULT_LIGHTING_PRESET_ID;

  const lightingPresets = useMemo(
    () =>
      Object.values(LIGHTING_PRESETS).map((preset) => ({
        id: preset.id,
        label: preset.label,
      })),
    [],
  );

  const onPresetChange = (presetId: LightingPresetId) => {
    setLightingPresetId(presetId);
  };

  const onResetPreset = () => {
    setLightingPresetId(DEFAULT_LIGHTING_PRESET_ID);
  };

  return {
    lightingPresetId,
    isLightingPresetLocked,
    isAlreadyDefaultPreset,
    lightingPresets,
    onPresetChange,
    onResetPreset,
  };
}
