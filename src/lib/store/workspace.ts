import { create } from "zustand";

import { DEFAULT_LIGHTING_PRESET_ID, DEFAULT_REGION } from "@/src/lib/config/app";
import type { LightingPresetId, Region } from "@/src/types";

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
  /** 時間軸選擇的時刻（Phase 2-3 啟用，先定型別）。 */
  time: string | null;
  /** 被點選的測站 id（Phase 2-2 啟用，先定型別）。 */
  selectedStationId: string | null;

  setRegion: (region: Region) => void;
  setLightingPresetId: (lightingPresetId: LightingPresetId) => void;
  setTime: (time: string | null) => void;
  selectStation: (id: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  region: DEFAULT_REGION,
  lightingPresetId: DEFAULT_LIGHTING_PRESET_ID,
  time: null,
  selectedStationId: null,

  setRegion: (region) => set({ region }),
  setLightingPresetId: (lightingPresetId) => set({ lightingPresetId }),
  setTime: (time) => set({ time }),
  selectStation: (selectedStationId) => set({ selectedStationId }),
}));
