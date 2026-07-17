"use client";

import { useEffect, useState } from "react";

import type { HeightmapGrid } from "@/src/lib/map/coords";

/** 靜態 heightmap 路徑（由 scripts/fetch-dem.mjs 產生）。 */
const DEFAULT_HEIGHTMAP_URL = "/dem/iceland-mapzen-768.json";
const heightmapCache = new Map<string, HeightmapGrid>();

function fetchHeightmap(url: string): Promise<HeightmapGrid> {
  const cached = heightmapCache.get(url);
  if (cached) return Promise.resolve(cached);

  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then((data: HeightmapGrid) => {
      heightmapCache.set(url, data);
      return data;
    });
}

/**
 * useHeightmap：讀取靜態高程檔，供地形與點位共用。
 *
 * 技術債 #5 收斂：heightmap 讀取原本內嵌在 Terrain，現測站也需共用 → 抽成 hook。
 * 當來源 URL 切換時採 ready-swap：新資料載入完成前保留舊資料，避免畫面閃斷。
 */
export function useHeightmap(heightmapUrl: string = DEFAULT_HEIGHTMAP_URL): HeightmapGrid | null {
  const [heightmap, setHeightmap] = useState<HeightmapGrid | null>(null);

  useEffect(() => {
    let alive = true;
    fetchHeightmap(heightmapUrl)
      .then((data: HeightmapGrid) => {
        if (alive) setHeightmap(data);
      })
      .catch((err) => {
        console.error(`[useHeightmap] 載入失敗（${heightmapUrl}）：`, err);
      });
    return () => {
      alive = false;
    };
  }, [heightmapUrl]);

  return heightmap;
}
