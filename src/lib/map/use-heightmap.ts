"use client";

import { useEffect, useState } from "react";

import type { HeightmapGrid } from "@/src/lib/map/coords";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

const HEIGHTMAP_URL_BY_DETAIL_LEVEL = {
  far: "/dem/iceland-mapzen-768.json",
  near: "/dem/iceland-mapzen-2560.json",
} as const;

const heightmapCache = new Map<string, HeightmapGrid>();
const heightmapRequestCache = new Map<string, Promise<HeightmapGrid>>();
let heightmapLoadSequence = 0;

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
  const terrainDetailLevel = useWorkspaceStore((s) => s.terrainDetailLevel);
  const heightmapUrl = HEIGHTMAP_URL_BY_DETAIL_LEVEL[terrainDetailLevel];
  const nearHeightmapUrl = HEIGHTMAP_URL_BY_DETAIL_LEVEL.near;
  const [heightmap, setHeightmap] = useState<HeightmapGrid | null>(
    () => heightmapCache.get(heightmapUrl) ?? null,
  );

  useEffect(() => {
    let alive = true;
    const loadId = ++heightmapLoadSequence;

    if (process.env.NODE_ENV !== "production") {
      const isCached = heightmapCache.has(heightmapUrl);
      console.info(
        `[useHeightmap] load#${loadId} start | level=${terrainDetailLevel} | url=${heightmapUrl} | cached=${isCached}`,
      );
    }

    loadHeightmap(heightmapUrl)
      .then((data: HeightmapGrid) => {
        if (!alive) return;
        setHeightmap(data);
        if (process.env.NODE_ENV !== "production") {
          console.info(
            `[useHeightmap] load#${loadId} done  | level=${terrainDetailLevel} | grid=${data.grid}`,
          );
        }
      })
      .catch((err) => console.error("[useHeightmap] 載入失敗：", err));

    return () => {
      alive = false;
    };
  }, [heightmapUrl, terrainDetailLevel]);

  useEffect(() => {
    if (terrainDetailLevel === "near") return;
    if (heightmapCache.has(nearHeightmapUrl)) return;
    if (heightmapRequestCache.has(nearHeightmapUrl)) return;

    if (process.env.NODE_ENV !== "production") {
      console.info(`[useHeightmap] preload start | level=near | url=${nearHeightmapUrl}`);
    }

    loadHeightmap(nearHeightmapUrl)
      .then((data) => {
        if (process.env.NODE_ENV !== "production") {
          console.info(`[useHeightmap] preload done  | level=near | grid=${data.grid}`);
        }
      })
      .catch((err) => console.error("[useHeightmap] 預熱載入失敗：", err));
  }, [nearHeightmapUrl, terrainDetailLevel]);

  return heightmap;
}
