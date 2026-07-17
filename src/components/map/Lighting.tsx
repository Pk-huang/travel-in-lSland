"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type DirectionalLight, type HemisphereLight } from "three";

import {
  DEFAULT_LIGHTING_PRESET_ID,
  INTERNAL_LIGHTING_PRESET_OVERRIDE,
  LIGHTING_PRESETS,
} from "@/src/lib/config/app";
import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { LightingPreset, LightingPresetId, SunLightingModel } from "@/src/types";

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
function smoothstep(min: number, max: number, value: number): number {
  if (max <= min) {
    return value >= max ? 1 : 0;
  }
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const VISUAL_LONG_DAY_THRESHOLD_SECONDS = 18 * 60 * 60;
const VISUAL_LONG_DAY_MIN_DAYLIGHT = 0.8;

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return [255, 255, 255];
  }

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return [255, 255, 255];
  }

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => {
    const safe = Math.round(clamp01(v / 255) * 255);
    return safe.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHexColor(night: string, day: string, t: number): string {
  const ratio = clamp01(t);
  const [nr, ng, nb] = hexToRgb(night);
  const [dr, dg, db] = hexToRgb(day);

  return rgbToHex(
    nr + (dr - nr) * ratio,
    ng + (dg - ng) * ratio,
    nb + (db - nb) * ratio,
  );
}

type LightingComputed = {
  timeMs: number;
  hour: number;
  daylight: number;
  sunAngle: number;
  skyColor: string;
  groundColor: string;
  ambientIntensity: number;
  sunIntensity: number;
  sunColor: string;
  sunPosition: readonly [number, number, number];
  debug: {
    source: SunLightingModel["source"];
    tzid: string;
    boundary: SunLightingModel["boundary"];
    fallbackDaylight: number;
    legacySunAngle: number;
    usedSunPath: boolean;
  };
};

type RuntimeLighting = {
  skyColor: Color;
  groundColor: Color;
  ambientIntensity: number;
  sunIntensity: number;
  sunColor: Color;
  sunPosition: [number, number, number];
};

function toRuntimeLighting(lighting: LightingComputed): RuntimeLighting {
  return {
    skyColor: new Color(lighting.skyColor),
    groundColor: new Color(lighting.groundColor),
    ambientIntensity: lighting.ambientIntensity,
    sunIntensity: lighting.sunIntensity,
    sunColor: new Color(lighting.sunColor),
    sunPosition: [...lighting.sunPosition],
  };
}

function applyLightingToRefs(
  runtime: RuntimeLighting,
  hemisphereLight: HemisphereLight | null,
  directionalLight: DirectionalLight | null,
) {
  if (hemisphereLight) {
    hemisphereLight.color.copy(runtime.skyColor);
    hemisphereLight.groundColor.copy(runtime.groundColor);
    hemisphereLight.intensity = runtime.ambientIntensity;
  }

  if (directionalLight) {
    directionalLight.color.copy(runtime.sunColor);
    directionalLight.intensity = runtime.sunIntensity;
    directionalLight.position.set(...runtime.sunPosition);
  }
}

function isRuntimeLightingClose(current: RuntimeLighting, target: RuntimeLighting): boolean {
  const intensityClose =
    Math.abs(current.ambientIntensity - target.ambientIntensity) < 0.002 &&
    Math.abs(current.sunIntensity - target.sunIntensity) < 0.002;
  const positionClose =
    Math.abs(current.sunPosition[0] - target.sunPosition[0]) < 0.01 &&
    Math.abs(current.sunPosition[1] - target.sunPosition[1]) < 0.01 &&
    Math.abs(current.sunPosition[2] - target.sunPosition[2]) < 0.01;
  const colorClose =
    Math.abs(current.skyColor.r - target.skyColor.r) < 0.004 &&
    Math.abs(current.skyColor.g - target.skyColor.g) < 0.004 &&
    Math.abs(current.skyColor.b - target.skyColor.b) < 0.004 &&
    Math.abs(current.groundColor.r - target.groundColor.r) < 0.004 &&
    Math.abs(current.groundColor.g - target.groundColor.g) < 0.004 &&
    Math.abs(current.groundColor.b - target.groundColor.b) < 0.004 &&
    Math.abs(current.sunColor.r - target.sunColor.r) < 0.004 &&
    Math.abs(current.sunColor.g - target.sunColor.g) < 0.004 &&
    Math.abs(current.sunColor.b - target.sunColor.b) < 0.004;

  return intensityClose && positionClose && colorClose;
}

function composeLighting(
  date: Date,
  preset: LightingPreset,
  daylight: number,
  sunAngle: number,
  debug: LightingComputed["debug"],
): LightingComputed {
  const hour = date.getHours() + date.getMinutes() / 60;
  const safeDaylight = clamp01(daylight);
  const ambientIntensity =
    preset.ambientBaseIntensity + safeDaylight * preset.ambientDaylightBoost;
  const sunIntensity =
    preset.sunBaseIntensity + safeDaylight * preset.sunDaylightBoost;
  const sunHeight =
    preset.sunBaseHeight + safeDaylight * preset.sunDaylightHeightBoost;
  const colorBlend = smoothstep(0.02, 0.35, safeDaylight);

  return {
    timeMs: date.getTime(),
    hour,
    daylight: safeDaylight,
    sunAngle,
    skyColor: mixHexColor(preset.skyNightColor, preset.skyDayColor, colorBlend),
    groundColor: mixHexColor(
      preset.groundNightColor,
      preset.groundDayColor,
      colorBlend,
    ),
    ambientIntensity,
    sunIntensity,
    sunColor: mixHexColor(preset.sunNightColor, preset.sunDayColor, colorBlend),
    sunPosition: [
      Math.cos(sunAngle) * preset.sunOrbitRadius,
      sunHeight,
      Math.sin(sunAngle) * preset.sunOrbitRadius,
    ] as const,
    debug,
  };
}

function computeDaylightFromBoundary(
  date: Date,
  boundary: NonNullable<SunLightingModel["boundary"]>,
): number | null {
  const nowMs = date.getTime();
  const { sunriseTs, sunsetTs, civilBeginTs, civilEndTs, previousSunsetTs } = boundary;
  if (sunsetTs <= sunriseTs) {
    return null;
  }

  const civilBeginMs = civilBeginTs ?? sunriseTs - 45 * 60 * 1000;
  const civilEndMs = civilEndTs ?? sunsetTs + 45 * 60 * 1000;
  const previousCivilEndMs =
    previousSunsetTs === null ? null : previousSunsetTs + 45 * 60 * 1000;

  if (
    previousSunsetTs !== null &&
    previousCivilEndMs !== null &&
    nowMs >= previousSunsetTs &&
    nowMs <= previousCivilEndMs
  ) {
    return 0.2 * (1 - smoothstep(previousSunsetTs, previousCivilEndMs, nowMs));
  }

  if (nowMs < civilBeginMs || nowMs > civilEndMs) {
    return 0;
  }

  if (nowMs < sunriseTs) {
    return 0.2 * smoothstep(civilBeginMs, sunriseTs, nowMs);
  }

  if (nowMs <= sunsetTs) {
    const dayProgress = (nowMs - sunriseTs) / (sunsetTs - sunriseTs);
    return Math.max(0, Math.sin(dayProgress * Math.PI));
  }

  return 0.2 * (1 - smoothstep(sunsetTs, civilEndMs, nowMs));
}

function computeSunAngleFromBoundary(
  date: Date,
  boundary: NonNullable<SunLightingModel["boundary"]>,
): number | null {
  const nowMs = date.getTime();
  const { previousSunsetTs, sunriseTs, sunsetTs, nextSunriseTs } = boundary;
  if (sunsetTs <= sunriseTs) {
    return null;
  }

  if (nowMs >= sunriseTs && nowMs <= sunsetTs) {
    const dayProgress = (nowMs - sunriseTs) / (sunsetTs - sunriseTs);
    return -Math.PI / 2 + dayProgress * Math.PI;
  }

  if (nowMs > sunsetTs) {
    if (nextSunriseTs !== null && nextSunriseTs > sunsetTs) {
      const nightProgress = Math.min(
        1,
        Math.max(0, (nowMs - sunsetTs) / (nextSunriseTs - sunsetTs)),
      );
      return Math.PI / 2 + nightProgress * Math.PI;
    }
    return Math.PI / 2;
  }

  if (previousSunsetTs !== null && sunriseTs > previousSunsetTs) {
    const nightProgress = Math.min(
      1,
      Math.max(0, (nowMs - previousSunsetTs) / (sunriseTs - previousSunsetTs)),
    );
    return Math.PI / 2 + nightProgress * Math.PI;
  }

  return -Math.PI / 2;
}

export function computeLighting(
  date: Date,
  preset: LightingPreset,
  sunModel: SunLightingModel | undefined,
): LightingComputed {
  const validDate = Number.isFinite(date.getTime()) ? date : new Date();
  const utcHour = validDate.getUTCHours() + validDate.getUTCMinutes() / 60;
  const fallbackDaylight = Math.max(0, Math.sin(((utcHour - 6) / 12) * Math.PI));
  const legacySunAngle = ((utcHour - 6) / 24) * Math.PI * 2;
  const effectiveModel = sunModel ?? {
    source: "fallback",
    tzid: "Atlantic/Reykjavik",
    boundary: null,
    dayType: "normal",
  };
  const useSunPath =
    effectiveModel.source === "sun" &&
    effectiveModel.boundary !== null;

  let daylight = fallbackDaylight;
  let sunAngle = legacySunAngle;

  if (effectiveModel.source === "sun" && effectiveModel.boundary !== null) {
    daylight =
      computeDaylightFromBoundary(validDate, effectiveModel.boundary) ??
      fallbackDaylight;
    sunAngle =
      computeSunAngleFromBoundary(validDate, effectiveModel.boundary) ??
      legacySunAngle;
  }

  if (effectiveModel.dayType === "polar_day") {
    daylight = clamp(daylight, 0.6, 1);
  } else if (effectiveModel.dayType === "polar_night") {
    daylight = clamp(daylight, 0.02, 0.18);
  } else if (effectiveModel.boundary !== null) {
    const daytimeSeconds =
      (effectiveModel.boundary.sunsetTs - effectiveModel.boundary.sunriseTs) / 1000;
    if (daytimeSeconds >= VISUAL_LONG_DAY_THRESHOLD_SECONDS) {
      daylight = clamp(daylight, VISUAL_LONG_DAY_MIN_DAYLIGHT, 1);
    }
  }

  return composeLighting(validDate, preset, daylight, sunAngle, {
    source: effectiveModel.source,
    tzid: effectiveModel.tzid,
    boundary: effectiveModel.boundary,
    fallbackDaylight,
    legacySunAngle,
    usedSunPath: useSunPath,
  });
}

export function Lighting() {
  const selectedTime = useWorkspaceStore((s) => s.time);
  const selectedLightingPresetId = useWorkspaceStore((s) => s.lightingPresetId);
  const { data } = useWorkspaceData();
  const activePresetId =
    INTERNAL_LIGHTING_PRESET_OVERRIDE ?? selectedLightingPresetId ?? DEFAULT_LIGHTING_PRESET_ID;
  const preset = LIGHTING_PRESETS[activePresetId];

  const lighting = useMemo(() => {
    return computeLighting(
      selectedTime ? new Date(selectedTime) : new Date(),
      preset,
      data?.sunModel,
    );
  }, [selectedTime, preset, data?.sunModel]);

  const hemisphereLightRef = useRef<HemisphereLight | null>(null);
  const directionalLightRef = useRef<DirectionalLight | null>(null);
  const runtimeCurrentRef = useRef<RuntimeLighting>(toRuntimeLighting(lighting));
  const runtimeTargetRef = useRef<RuntimeLighting>(toRuntimeLighting(lighting));
  const isPresetTransitioningRef = useRef(false);
  const previousPresetIdRef = useRef<LightingPresetId>(activePresetId);

  useEffect(() => {
    const target = toRuntimeLighting(lighting);
    const presetChanged = previousPresetIdRef.current !== activePresetId;
    previousPresetIdRef.current = activePresetId;

    runtimeTargetRef.current = target;
    if (presetChanged) {
      isPresetTransitioningRef.current = true;
      return;
    }

    // 時間軸推進維持即時更新，避免白天/夜晚卡在中間值。
    runtimeCurrentRef.current = toRuntimeLighting(lighting);
    applyLightingToRefs(
      runtimeCurrentRef.current,
      hemisphereLightRef.current,
      directionalLightRef.current,
    );
  }, [lighting, activePresetId]);

  useFrame((_, delta) => {
    if (!isPresetTransitioningRef.current) {
      return;
    }

    const current = runtimeCurrentRef.current;
    const target = runtimeTargetRef.current;
    const factor = 1 - Math.pow(0.05, delta);

    current.ambientIntensity +=
      (target.ambientIntensity - current.ambientIntensity) * factor;
    current.sunIntensity += (target.sunIntensity - current.sunIntensity) * factor;
    current.sunPosition[0] += (target.sunPosition[0] - current.sunPosition[0]) * factor;
    current.sunPosition[1] += (target.sunPosition[1] - current.sunPosition[1]) * factor;
    current.sunPosition[2] += (target.sunPosition[2] - current.sunPosition[2]) * factor;
    current.skyColor.lerp(target.skyColor, factor);
    current.groundColor.lerp(target.groundColor, factor);
    current.sunColor.lerp(target.sunColor, factor);

    applyLightingToRefs(current, hemisphereLightRef.current, directionalLightRef.current);

    if (isRuntimeLightingClose(current, target)) {
      runtimeCurrentRef.current = {
        skyColor: target.skyColor.clone(),
        groundColor: target.groundColor.clone(),
        ambientIntensity: target.ambientIntensity,
        sunIntensity: target.sunIntensity,
        sunColor: target.sunColor.clone(),
        sunPosition: [...target.sunPosition],
      };
      applyLightingToRefs(
        runtimeCurrentRef.current,
        hemisphereLightRef.current,
        directionalLightRef.current,
      );
      isPresetTransitioningRef.current = false;
    }
  });

  const lastLightingRef = useRef<LightingComputed | null>(null);
  useEffect(() => {
    const previous = lastLightingRef.current;
    if (previous) {
      const daylightJump = Math.abs(lighting.daylight - previous.daylight);
      const sunIntensityJump = Math.abs(lighting.sunIntensity - previous.sunIntensity);
      const ambientJump = Math.abs(
        lighting.ambientIntensity - previous.ambientIntensity,
      );

      if (daylightJump >= 0.08 || sunIntensityJump >= 0.08 || ambientJump >= 0.06) {
        console.info("[Lighting Debug Jump]", {
          selectedTime,
          previous: {
            daylight: previous.daylight,
            sunIntensity: previous.sunIntensity,
            ambientIntensity: previous.ambientIntensity,
            debug: previous.debug,
          },
          current: {
            daylight: lighting.daylight,
            sunIntensity: lighting.sunIntensity,
            ambientIntensity: lighting.ambientIntensity,
            debug: lighting.debug,
          },
          delta: {
            daylightJump,
            sunIntensityJump,
            ambientJump,
          },
        });
      }
    }

    lastLightingRef.current = lighting;
  }, [lighting, selectedTime]);

  return (
    <>
      <hemisphereLight
        ref={hemisphereLightRef}
        color={lighting.skyColor}
        groundColor={lighting.groundColor}
        intensity={lighting.ambientIntensity}
      />
      <directionalLight
        ref={directionalLightRef}
        position={lighting.sunPosition}
        intensity={lighting.sunIntensity}
        color={lighting.sunColor}
      />
    </>
  );
}
