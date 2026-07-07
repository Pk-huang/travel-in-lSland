"use client";

import { useMemo } from "react";

import {
  DEFAULT_LIGHTING_PRESET_ID,
  INTERNAL_LIGHTING_PRESET_OVERRIDE,
  LIGHTING_PRESETS,
} from "@/src/lib/config/app";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { LightingPreset } from "@/src/types";

/**
 * Lighting：3D 場景光照層。
 *
 * 子步驟 2-3b（本版）：讀取時間軸 time，讓場景光照隨時間變化。
 *
 * - time = null 時使用瀏覽器當下時間（「現在」）。
 * - 白天/夜晚只做保守亮度差異，避免整個場景被洗白。
 * - 方向光位置依小時沿水平面旋轉，形成時間推進感。
 * - 不使用 useFrame：只有 time 改變時才重新計算光照，避免每幀重建。
 */
export function computeLighting(date: Date, preset: LightingPreset) {
  const validDate = Number.isFinite(date.getTime()) ? date : new Date();
  const hour = validDate.getHours() + validDate.getMinutes() / 60;
  const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const ambientIntensity =
    preset.ambientBaseIntensity + daylight * preset.ambientDaylightBoost;
  const sunIntensity = preset.sunBaseIntensity + daylight * preset.sunDaylightBoost;
  const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
  const sunHeight = preset.sunBaseHeight + daylight * preset.sunDaylightHeightBoost;

  return {
    hour,
    daylight,
    skyColor: daylight > 0.2 ? preset.skyDayColor : preset.skyNightColor,
    groundColor: daylight > 0.2 ? preset.groundDayColor : preset.groundNightColor,
    ambientIntensity,
    sunIntensity,
    sunColor: daylight > 0.2 ? preset.sunDayColor : preset.sunNightColor,
    sunPosition: [
      Math.cos(sunAngle) * preset.sunOrbitRadius,
      sunHeight,
      Math.sin(sunAngle) * preset.sunOrbitRadius,
    ] as const,
  };
}

export function Lighting() {
  const selectedTime = useWorkspaceStore((s) => s.time);
  const selectedLightingPresetId = useWorkspaceStore((s) => s.lightingPresetId);
  const activePresetId =
    INTERNAL_LIGHTING_PRESET_OVERRIDE ?? selectedLightingPresetId ?? DEFAULT_LIGHTING_PRESET_ID;
  const preset = LIGHTING_PRESETS[activePresetId];

  const lighting = useMemo(() => {
    return computeLighting(selectedTime ? new Date(selectedTime) : new Date(), preset);
  }, [selectedTime, preset]);

  return (
    <>
      <hemisphereLight
        color={lighting.skyColor}
        groundColor={lighting.groundColor}
        intensity={lighting.ambientIntensity}
      />
      <directionalLight
        position={lighting.sunPosition}
        intensity={lighting.sunIntensity}
        color={lighting.sunColor}
      />
    </>
  );
}
