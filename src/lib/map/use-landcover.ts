"use client";

import { useEffect, useState } from "react";
import {
  useWorkspaceStore,
  type TerrainDetailLevel,
} from "@/src/lib/store/workspace";

export type LandcoverGrid = {
  source: string;
  year: number;
  grid: number;
  bbox: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  };
  classes: number[];
  histogram?: Record<string, number>;
};

const LANDCOVER_URL_BY_DETAIL_LEVEL = {
  far: "/landcover/iceland-worldcover-2021-768.json",
  near: "/landcover/iceland-worldcover-2021-2560.json",
} as const;

export function getLandcoverUrlByDetailLevel(level: TerrainDetailLevel): string {
  return LANDCOVER_URL_BY_DETAIL_LEVEL[level];
}

export function isLandcoverReadyForDetailLevel(level: TerrainDetailLevel): boolean {
  return landcoverCache.has(getLandcoverUrlByDetailLevel(level));
}

export function preloadLandcoverForDetailLevel(
  level: TerrainDetailLevel,
): Promise<LandcoverGrid | null> {
  return loadLandcover(getLandcoverUrlByDetailLevel(level));
}

const landcoverCache = new Map<string, LandcoverGrid | null>();
const landcoverRequestCache = new Map<string, Promise<LandcoverGrid | null>>();

function loadLandcover(url: string): Promise<LandcoverGrid | null> {
  if (landcoverCache.has(url)) {
    return Promise.resolve(landcoverCache.get(url) ?? null);
  }

  const cachedRequest = landcoverRequestCache.get(url);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then((data: LandcoverGrid) => {
      landcoverCache.set(url, data);
      landcoverRequestCache.delete(url);
      return data;
    })
    .catch(() => {
      // 無對應檔案時安靜回退到規則混色，不中斷渲染流程。
      landcoverCache.set(url, null);
      landcoverRequestCache.delete(url);
      return null;
    });

  landcoverRequestCache.set(url, request);
  return request;
}

/**
 * useLandcover：依地形網格讀取對應 WorldCover 分類資料。
 *
 * - 檔案由 scripts/fetch-worldcover.mjs 離線產生。
 * - 若目前 grid 無對應檔案，回傳 null，Terrain 會自動退回規則混色。
 */
export function useLandcover(grid: number | null): LandcoverGrid | null {
  const terrainDetailLevel = useWorkspaceStore((s) => s.terrainDetailLevel);
  const nearLandcoverUrl = getLandcoverUrlByDetailLevel("near");
  const initialUrl = grid ? `/landcover/iceland-worldcover-2021-${grid}.json` : null;
  const [landcover, setLandcover] = useState<LandcoverGrid | null>(() => {
    if (!initialUrl) return null;
    return landcoverCache.get(initialUrl) ?? null;
  });

  useEffect(() => {
    if (!grid) {
      return;
    }

    let alive = true;
    const url = `/landcover/iceland-worldcover-2021-${grid}.json`;

    loadLandcover(url).then((data) => {
      if (!alive) return;
      setLandcover(data);
    });

    return () => {
      alive = false;
    };
  }, [grid]);

  useEffect(() => {
    if (terrainDetailLevel === "near") return;
    if (landcoverCache.has(nearLandcoverUrl)) return;
    if (landcoverRequestCache.has(nearLandcoverUrl)) return;

    if (process.env.NODE_ENV !== "production") {
      console.info(`[useLandcover] preload start | level=near | url=${nearLandcoverUrl}`);
    }

    loadLandcover(nearLandcoverUrl).then((data) => {
      if (process.env.NODE_ENV !== "production") {
        const gridLabel = data ? data.grid : "fallback-null";
        console.info(`[useLandcover] preload done  | level=near | grid=${gridLabel}`);
      }
    });
  }, [nearLandcoverUrl, terrainDetailLevel]);

  return landcover;
}
