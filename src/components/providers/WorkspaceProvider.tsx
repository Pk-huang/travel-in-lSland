"use client";

import { createContext, useContext } from "react";

import {
  useIcelandStatus,
  type IcelandStatusState,
} from "@/src/lib/client/use-iceland-status";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * WorkspaceProvider：後端資料（server state）的共享供應層。
 *
 * 為什麼用 Context 而非把 data 塞進 Zustand：
 * - data 是「region 的函數」（衍生資料），不是可直接賦值的意圖狀態。
 * - 它牽涉 fetch / loading / error / race 取消，這些由 useIcelandStatus（hook）負責，
 *   不該手動同步進 store（會重造輪子、且 region 與 data 可能短暫不一致）。
 * - 左面板與中地圖都需要同一份 data → 在頂層抓「一次」，經 Context 發給兩島共用。
 *
 * 資料單向流：store.region → 這裡 useIcelandStatus(region) → data → 各島讀取。
 */
const WorkspaceDataContext = createContext<IcelandStatusState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const region = useWorkspaceStore((s) => s.region);
  const status = useIcelandStatus(region);

  return (
    <WorkspaceDataContext.Provider value={status}>
      {children}
    </WorkspaceDataContext.Provider>
  );
}

/** 取得目前 region 對應的後端資料（含 loading/error/refetch）。需在 WorkspaceProvider 內使用。 */
export function useWorkspaceData(): IcelandStatusState {
  const ctx = useContext(WorkspaceDataContext);
  if (!ctx) {
    throw new Error("useWorkspaceData 必須在 <WorkspaceProvider> 內使用");
  }
  return ctx;
}
