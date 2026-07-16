"use client";

import { useEffect, useState } from "react";

import type { ZoomLevel } from "@/src/lib/config/app";
import type { HeightmapGrid } from "@/src/lib/map/coords";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/** 兩層 DEM 映射：遠景 z0 用 768，近景 z1/z2/z3 共用 2560。 */
const HEIGHTMAP_URL_BY_ZOOM_LEVEL: Record<ZoomLevel, string> = {
  z0: "/dem/iceland-mapzen-768.json",
  z1: "/dem/iceland-mapzen-2560.json",
  z2: "/dem/iceland-mapzen-2560.json",
  z3: "/dem/iceland-mapzen-2560.json",
};

const heightmapCache = new Map<string, HeightmapGrid>();
const heightmapRequestCache = new Map<string, Promise<HeightmapGrid>>();

function loadHeightmap(url: string): Promise<HeightmapGrid> {
  const cachedHeightmap = heightmapCache.get(url);
  if (cachedHeightmap) {
    return Promise.resolve(cachedHeightmap);
  }

  const cachedRequest = heightmapRequestCache.get(url);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = fetch(url)
    .then((res) => res.json())
    .then((data: HeightmapGrid) => {
      heightmapCache.set(url, data);
      heightmapRequestCache.delete(url);
      return data;
    })
    .catch((error) => {
      heightmapRequestCache.delete(url);
      throw error;
    });

  heightmapRequestCache.set(url, request);
  return request;
}

/**
 * useHeightmap：讀取靜態高程檔（一次），供地形與點位共用。
 *
 * 技術債 #5 收斂：heightmap 讀取原本內嵌在 Terrain，現測站也需共用 → 抽成 hook。
 * 瀏覽器會快取同一靜態檔，多處使用不會重打網路。
 */
export function useHeightmap(): HeightmapGrid | null {
  const zoomLevel = useWorkspaceStore((state) => state.zoomLevel);
  const setAppliedHeightmapGrid = useWorkspaceStore(
    (state) => state.setAppliedHeightmapGrid,
  );
  const heightmapUrl = HEIGHTMAP_URL_BY_ZOOM_LEVEL[zoomLevel];
  const [heightmap, setHeightmap] = useState<HeightmapGrid | null>(
    () => heightmapCache.get(heightmapUrl) ?? null,
  );

  useEffect(() => {
    let alive = true;

    loadHeightmap(heightmapUrl)
      .then((data: HeightmapGrid) => {
        if (!alive) return;
        setHeightmap(data);
        setAppliedHeightmapGrid(data.grid);
      })
      .catch((err) => console.error("[useHeightmap] 載入失敗：", err));

    return () => {
      alive = false;
    };
  }, [heightmapUrl, setAppliedHeightmapGrid]);

  return heightmap;
}
