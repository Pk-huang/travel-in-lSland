"use client";

import { useWorkspaceStore } from "@/src/lib/store/workspace";
import { TERRAIN_DETAIL_LEVEL_OPTIONS } from "@/src/lib/config/app";
import type { TerrainDetailLevel } from "@/src/types";

type UseTerrainDetailControllerResult = {
  terrainDetailLevel: TerrainDetailLevel;
  terrainDetailLevels: readonly TerrainDetailLevel[];
  onSelectLevel: (level: TerrainDetailLevel) => void;
};

export function useTerrainDetailController(): UseTerrainDetailControllerResult {
  const terrainDetailLevel = useWorkspaceStore((s) => s.terrainDetailLevel);
  const setTerrainDetailLevel = useWorkspaceStore((s) => s.setTerrainDetailLevel);

  const onSelectLevel = (level: TerrainDetailLevel) => {
    setTerrainDetailLevel(level);
  };

  return {
    terrainDetailLevel,
    terrainDetailLevels: TERRAIN_DETAIL_LEVEL_OPTIONS,
    onSelectLevel,
  };
}
