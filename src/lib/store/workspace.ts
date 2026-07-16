import { create } from "zustand";

import {
  DEFAULT_LIGHTING_PRESET_ID,
  DEFAULT_REGION,
  DEFAULT_TERRAIN_EXPERIMENT_MODE,
} from "@/src/lib/config/app";
import type { LightingPresetId, Region, TerrainExperimentMode } from "@/src/types";

export type PlaybackState = "playing" | "paused";
export type PlaybackSpeed = 0.5 | 1 | 2;
export type TerrainDetailLevel = "far" | "near";

/**
 * Workspace 意圖狀態（client state）。
 *
 * 只放「使用者想看什麼」這類可直接賦值、同步、無 loading/error 的狀態。
 * 後端資料（IcelandStatusResponse）為「region 的衍生」，不放這裡——
 * 由 WorkspaceProvider 內的 useIcelandStatus 即時抓取並透過 Context 供應。
 *
 * 為什麼用 Zustand 而非 useState：region 等狀態需被多個平行兄弟（ControlPanel /
 * MapCanvas）共讀寫，放模組單例 store 可讓各島直接訂閱，父層不必為持有狀態而下放成 client。
 */
export type WorkspaceState = {
  /** 目前選擇的地區（驅動資料抓取）。 */
  region: Region;
  /** 目前選擇的光影樣式。 */
  lightingPresetId: LightingPresetId;
  /** 地形渲染實驗模式（方案六開關）。 */
  terrainExperimentMode: TerrainExperimentMode;
  /** 時間軸選擇的時刻（epoch ms；null 代表「現在」）。 */
  time: number | null;
  /** 時間軸播放狀態（Phase 2-3 播放器）。 */
  playbackState: PlaybackState;
  /** 時間軸播放倍速（Phase 2-3 播放器）。 */
  playbackSpeed: PlaybackSpeed;
  /** 被點選的測站 id（Phase 2-2 啟用，先定型別）。 */
  selectedStationId: string | null;
  /** 相機到 OrbitControls target 的距離（監測用）。 */
  cameraDistance: number;
  /** 兩層 DEM 細節層級：far=768，near=2560。 */
  terrainDetailLevel: TerrainDetailLevel;

  setRegion: (region: Region) => void;
  setLightingPresetId: (lightingPresetId: LightingPresetId) => void;
  setTerrainExperimentMode: (terrainExperimentMode: TerrainExperimentMode) => void;
  setTime: (time: number | null) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (playbackSpeed: PlaybackSpeed) => void;
  selectStation: (id: string | null) => void;
  setCameraDistance: (cameraDistance: number) => void;
  setTerrainDetailLevel: (terrainDetailLevel: TerrainDetailLevel) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  region: DEFAULT_REGION,
  lightingPresetId: DEFAULT_LIGHTING_PRESET_ID,
  terrainExperimentMode: DEFAULT_TERRAIN_EXPERIMENT_MODE,
  time: null,
  playbackState: "paused",
  playbackSpeed: 1,
  selectedStationId: null,
  cameraDistance: Math.sqrt(12 * 12 + 12 * 12 + 12 * 12),
  terrainDetailLevel: "near",

  setRegion: (region) => set({ region }),
  setLightingPresetId: (lightingPresetId) => set({ lightingPresetId }),
  setTerrainExperimentMode: (terrainExperimentMode) => set({ terrainExperimentMode }),
  setTime: (time) => set({ time }),
  play: () => set({ playbackState: "playing" }),
  pause: () => set({ playbackState: "paused" }),
  setSpeed: (playbackSpeed) => set({ playbackSpeed }),
  selectStation: (selectedStationId) => set({ selectedStationId }),
  setCameraDistance: (cameraDistance) => set({ cameraDistance }),
  setTerrainDetailLevel: (terrainDetailLevel) => set({ terrainDetailLevel }),
}));
