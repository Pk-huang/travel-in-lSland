"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { CloudSun, MapPin, Route } from "lucide-react";

import { useWorkspaceStore } from "@/src/lib/store/workspace";

export type InfoMode = "weather" | "road" | "poi";

export type InfoModeOption = {
  id: InfoMode;
  label: string;
  Icon: LucideIcon;
};

export type InfoModeState = {
  activeMode: InfoMode | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  options: readonly InfoModeOption[];
  setMode: (mode: InfoMode) => void;
  toggleMode: (mode: InfoMode) => void;
  closeMode: () => void;
};

const INFO_MODE_OPTIONS: readonly InfoModeOption[] = [
  { id: "weather", label: "天氣", Icon: CloudSun },
  { id: "poi", label: "景點", Icon: MapPin },
  { id: "road", label: "路況", Icon: Route },
] as const;

export function useInfoModeState(): InfoModeState {
  const activeMode = useWorkspaceStore((s) => s.activeInfoPanelSection);
  const setActiveMode = useWorkspaceStore((s) => s.setActiveInfoPanelSection);
  const isOpen = useWorkspaceStore((s) => s.isMapInfoOpen);
  const setOpen = useWorkspaceStore((s) => s.setMapInfoOpen);

  return useMemo(
    () => ({
      activeMode,
      isOpen,
      setOpen,
      options: INFO_MODE_OPTIONS,
      setMode: (mode: InfoMode) => setActiveMode(mode),
      toggleMode: (mode: InfoMode) => {
        setActiveMode(activeMode === mode ? null : mode);
      },
      closeMode: () => setActiveMode(null),
    }),
    [activeMode, setActiveMode, isOpen, setOpen],
  );
}