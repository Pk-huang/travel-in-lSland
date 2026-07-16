"use client";

import { useEffect, useState } from "react";

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

/**
 * useLandcover：依地形網格讀取對應 WorldCover 分類資料。
 *
 * - 檔案由 scripts/fetch-worldcover.mjs 離線產生。
 * - 若目前 grid 無對應檔案，回傳 null，Terrain 會自動退回規則混色。
 */
export function useLandcover(grid: number | null): LandcoverGrid | null {
  const [landcover, setLandcover] = useState<LandcoverGrid | null>(null);

  useEffect(() => {
    if (!grid) {
      return;
    }

    let alive = true;
    const url = `/landcover/iceland-worldcover-2021-${grid}.json`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: LandcoverGrid) => {
        if (alive) setLandcover(data);
      })
      .catch(() => {
        // 無對應檔案時安靜回退到規則混色，不中斷渲染流程。
        if (alive) setLandcover(null);
      });

    return () => {
      alive = false;
    };
  }, [grid]);

  return landcover;
}
