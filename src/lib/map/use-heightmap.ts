"use client";

import { useEffect, useState } from "react";

import type { HeightmapGrid } from "@/src/lib/map/coords";

/** 靜態 heightmap 路徑（由 scripts/fetch-dem.mjs 產生）。 */
const HEIGHTMAP_URL = "/dem/iceland-mapzen-768.json";

/**
 * useHeightmap：讀取靜態高程檔（一次），供地形與點位共用。
 *
 * 技術債 #5 收斂：heightmap 讀取原本內嵌在 Terrain，現測站也需共用 → 抽成 hook。
 * 瀏覽器會快取同一靜態檔，多處使用不會重打網路。
 */
export function useHeightmap(): HeightmapGrid | null {
  const [heightmap, setHeightmap] = useState<HeightmapGrid | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(HEIGHTMAP_URL)
      .then((res) => res.json())
      .then((data: HeightmapGrid) => {
        if (alive) setHeightmap(data);
      })
      .catch((err) => console.error("[useHeightmap] 載入失敗：", err));
    return () => {
      alive = false;
    };
  }, []);

  return heightmap;
}
