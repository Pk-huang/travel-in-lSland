"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  useWorkspaceStore,
  type UtilityPanel,
  type UtilityPanelTab,
} from "@/src/lib/store/workspace";

export type ShellUiStateValue = {
  activeUtilityPanel: UtilityPanel;
  setActiveUtilityPanel: (panel: UtilityPanel) => void;
  activeUtilityTab: UtilityPanelTab;
  setActiveUtilityTab: (tab: UtilityPanelTab) => void;
};

const ShellUiStateContext = createContext<ShellUiStateValue | null>(null);

/**
 * ShellUiStateProvider：只提供 shell 版面共用的 UI 狀態。
 * info mode 已拆到獨立 hook，這裡只保留工具抽屜與分頁。
 */
export function ShellUiStateProvider({ children }: { children: ReactNode }) {
  const activeUtilityPanel = useWorkspaceStore((s) => s.activeUtilityPanel);
  const setActiveUtilityPanel = useWorkspaceStore((s) => s.setActiveUtilityPanel);
  const activeUtilityTab = useWorkspaceStore((s) => s.activeUtilityTab);
  const setActiveUtilityTab = useWorkspaceStore((s) => s.setActiveUtilityTab);

  const value = useMemo<ShellUiStateValue>(
    () => ({
      activeUtilityPanel,
      setActiveUtilityPanel,
      activeUtilityTab,
      setActiveUtilityTab,
    }),
    [activeUtilityPanel, activeUtilityTab, setActiveUtilityPanel, setActiveUtilityTab],
  );

  return (
    <ShellUiStateContext.Provider value={value}>{children}</ShellUiStateContext.Provider>
  );
}

export function useShellUiState(): ShellUiStateValue {
  const value = useContext(ShellUiStateContext);
  if (!value) {
    throw new Error("useShellUiState 必須在 ShellUiStateProvider 內使用");
  }
  return value;
}