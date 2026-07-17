import { create } from "zustand";

import {
  DEFAULT_LIGHTING_PRESET_ID,
  DEFAULT_REGION,
} from "@/src/lib/config/app";
import type { LightingPresetId, Region } from "@/src/types";

export type PlaybackState = "playing" | "paused";
export type PlaybackSpeed = 0.5 | 1 | 2;

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
  /** 時間軸選擇的時刻（epoch ms；null 代表「現在」）。 */
  time: number | null;
  /** 時間軸播放狀態（Phase 2-3 播放器）。 */
  playbackState: PlaybackState;
  /** 時間軸播放倍速（Phase 2-3 播放器）。 */
  playbackSpeed: PlaybackSpeed;
  /** 被點選的測站 id（Phase 2-2 啟用，先定型別）。 */
  selectedStationId: string | null;
  /** 目前焦點景點 id；null 代表未進入景點模式。 */
  activePoiId: string | null;
  /** 景點模式啟用旗標；先與焦點 id 分離，後續方便加 loading/transition 條件。 */
  poiFocusEnabled: boolean;

  setRegion: (region: Region) => void;
  setLightingPresetId: (lightingPresetId: LightingPresetId) => void;
  setTime: (time: number | null) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (playbackSpeed: PlaybackSpeed) => void;
  selectStation: (id: string | null) => void;
  setActivePoi: (id: string | null) => void;
  setPoiFocusEnabled: (enabled: boolean) => void;
  clearPoiFocus: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  region: DEFAULT_REGION,
  lightingPresetId: DEFAULT_LIGHTING_PRESET_ID,
  time: null,
  playbackState: "paused",
  playbackSpeed: 1,
  selectedStationId: null,
  activePoiId: null,
  poiFocusEnabled: false,

  setRegion: (region) => set({ region }),
  setLightingPresetId: (lightingPresetId) => set({ lightingPresetId }),
  setTime: (time) => set({ time }),
  play: () => set({ playbackState: "playing" }),
  pause: () => set({ playbackState: "paused" }),
  setSpeed: (playbackSpeed) => set({ playbackSpeed }),
  selectStation: (selectedStationId) => set({ selectedStationId }),
  setActivePoi: (activePoiId) => set({ activePoiId }),
  setPoiFocusEnabled: (poiFocusEnabled) => set({ poiFocusEnabled }),
  clearPoiFocus: () => set({ activePoiId: null, poiFocusEnabled: false }),
}));
