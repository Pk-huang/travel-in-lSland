"use client";

import { useTerrainDetailController } from "./useTerrainDetailController";

export function DetailTab() {
  const { terrainDetailLevel, terrainDetailLevels, onSelectLevel } = useTerrainDetailController();

  return (
    <section className="mx-auto w-full space-y-2 rounded-lg border border-white/10 bg-black/15 p-3">
      <div>
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">地形細節</p>
        <p className="text-[11px] text-white/55">DEM 與 landcover 維持相同解析度，避免場景錯位。</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {terrainDetailLevels.map((level) => {
          const isActive = terrainDetailLevel === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onSelectLevel(level)}
              className={
                isActive
                  ? "rounded-md border border-sky-300/70 bg-sky-400/20 px-2 py-2 text-xs font-medium text-white"
                  : "rounded-md border border-white/20 bg-black/20 px-2 py-2 text-xs text-white/85 transition hover:bg-black/30"
              }
            >
              {level}
            </button>
          );
        })}
      </div>
    </section>
  );
}
