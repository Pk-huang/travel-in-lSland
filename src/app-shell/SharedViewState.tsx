"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  useWorkspaceStore,
  type InfoPanelSection,
  type UtilityPanel,
  type UtilityPanelTab,
} from "@/src/lib/store/workspace";

export type SharedViewStateValue = {
  activeInfoPanelSection: InfoPanelSection;
  setActiveInfoPanelSection: (section: InfoPanelSection) => void;
  activeUtilityPanel: UtilityPanel;
  setActiveUtilityPanel: (panel: UtilityPanel) => void;
  activeUtilityTab: UtilityPanelTab;
  setActiveUtilityTab: (tab: UtilityPanelTab) => void;
};

const SharedViewStateContext = createContext<SharedViewStateValue | null>(null);

export function SharedViewStateProvider({ children }: { children: ReactNode }) {
  const activeInfoPanelSection = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const setActiveInfoPanelSection = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const activeUtilityPanel = useWorkspaceStore((s) => s.activeUtilityPanel);
  const setActiveUtilityPanel = useWorkspaceStore((s) => s.setActiveUtilityPanel);
  const activeUtilityTab = useWorkspaceStore((s) => s.activeUtilityTab);
  const setActiveUtilityTab = useWorkspaceStore((s) => s.setActiveUtilityTab);

  const value = useMemo<SharedViewStateValue>(
    () => ({
      activeInfoPanelSection,
      setActiveInfoPanelSection,
      activeUtilityPanel,
      setActiveUtilityPanel,
      activeUtilityTab,
      setActiveUtilityTab,
    }),
    [
      activeInfoPanelSection,
      activeUtilityPanel,
      activeUtilityTab,
      setActiveInfoPanelSection,
      setActiveUtilityPanel,
      setActiveUtilityTab,
    ],
  );

  return (
    <SharedViewStateContext.Provider value={value}>{children}</SharedViewStateContext.Provider>
  );
}

export function useSharedViewState(): SharedViewStateValue {
  const value = useContext(SharedViewStateContext);
  if (!value) {
    throw new Error("useSharedViewState 必須在 SharedViewStateProvider 內使用");
  }
  return value;
}
