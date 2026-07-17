import type {
  LightingPreset,
  LightingPresetId,
  Region,
} from "@/src/types";

/**
 * App 級別、跨來源共用的設定。
 * 各外部 API 的專屬設定請放在該來源檔案內（例如 api/vedur.ts）。
 */
export const DEFAULT_REGION: Region = "south";

export const REGION_LABELS: Record<Region, string> = {
  south: "South Iceland",
  west: "West Iceland",
  north: "North Iceland",
  east: "East Iceland",
  all: "All Iceland",
};

export const DEFAULT_LIGHTING_PRESET_ID: LightingPresetId = "realistic";

/**
 * 內部驗證用切換入口：
 * - 設為 null：使用 DEFAULT_LIGHTING_PRESET_ID。
 * - 設為 "cinematic" / "seasonal"：可先驗證視覺，不需接 UI。
 */
export const INTERNAL_LIGHTING_PRESET_OVERRIDE: LightingPresetId  | null = null;

export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPreset> = {
  realistic: {
    id: "realistic",
    label: "Realistic Daylight",
    skyDayColor: "#bcd3e6",
    skyNightColor: "#4c5f78",
    groundDayColor: "#2e3226",
    groundNightColor: "#171b20",
    sunDayColor: "#fdf6ec",
    sunNightColor: "#7fa8d8",
    ambientBaseIntensity: 0.22,
    ambientDaylightBoost: 0.38,
    sunBaseIntensity: 0.35,
    sunDaylightBoost: 0.85,
    sunOrbitRadius: 8,
    sunBaseHeight: 4,
    sunDaylightHeightBoost: 4,
  },
  cinematic: {
    id: "cinematic",
    label: "Cinematic Contrast",
    skyDayColor: "#8ea7bf",
    skyNightColor: "#2f3f57",
    groundDayColor: "#323127",
    groundNightColor: "#131821",
    sunDayColor: "#ffd3a1",
    sunNightColor: "#7a92c8",
    ambientBaseIntensity: 0.14,
    ambientDaylightBoost: 0.26,
    sunBaseIntensity: 0.45,
    sunDaylightBoost: 1.25,
    sunOrbitRadius: 8,
    sunBaseHeight: 3,
    sunDaylightHeightBoost: 3,
  },
  seasonal: {
    id: "seasonal",
    label: "Iceland Seasonal",
    skyDayColor: "#b5cbe2",
    skyNightColor: "#435973",
    groundDayColor: "#344033",
    groundNightColor: "#182026",
    sunDayColor: "#f6efe2",
    sunNightColor: "#8db2de",
    ambientBaseIntensity: 0.2,
    ambientDaylightBoost: 0.42,
    sunBaseIntensity: 0.3,
    sunDaylightBoost: 1,
    sunOrbitRadius: 8,
    sunBaseHeight: 3.5,
    sunDaylightHeightBoost: 4.5,
  },
};
