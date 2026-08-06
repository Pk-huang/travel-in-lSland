"use client";

import { useMemo } from "react";

import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { REGION_FOCUS_TARGETS, REGION_LABELS } from "@/src/lib/config/app";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import type { Region } from "@/src/types";

type UseDisplaySettingsControllerResult = {
  region: Region;
  regionLabel: string;
  loading: boolean;
  onRegionChange: (region: Region) => void;
  onRegionSelect: (region: Region) => void;
};

export function useDisplaySettingsController(): UseDisplaySettingsControllerResult {
  const region = useWorkspaceStore((s) => s.region);
  const setRegion = useWorkspaceStore((s) => s.setRegion);
  const setMapFocusTarget = useWorkspaceStore((s) => s.setMapFocusTarget);
  const { loading } = useWorkspaceData();

  const regionLabel = useMemo(() => REGION_LABELS[region] ?? region, [region]);

  const onRegionChange = (nextRegion: Region) => {
    setRegion(nextRegion);
    setMapFocusTarget(REGION_FOCUS_TARGETS[nextRegion]);
  };

  const onRegionSelect = (nextRegion: Region) => {
    setRegion(nextRegion);
    setMapFocusTarget(REGION_FOCUS_TARGETS[nextRegion]);
  };

  return {
    region,
    regionLabel,
    loading,
    onRegionChange,
    onRegionSelect,
  };
}
