import { fetchVedurStations } from "@/src/lib/api/vedur";
import {
  buildStationCoords,
  type StationCoordsMap,
} from "@/src/lib/adapters/stations";
import { cache, isFresh } from "@/src/lib/cache";
import { logEvent } from "@/src/lib/observability";
import type { Region } from "@/src/types";

/**
 * 測站主檔快取 TTL：24 小時。
 * 測站座標屬「主檔」，極少變動，無需與觀測（900s）同頻刷新。
 */
export const STATIONS_TTL_MS = 24 * 60 * 60 * 1000;

function stationsKey(region: Region): string {
  return `stations:${region}`;
}

/**
 * 取得某 region 的「station id → 座標」對照表（含 24h 快取）。
 *
 * 流程：
 * 1. 快取新鮮 → 直接回
 * 2. 否則抓主檔 → 建表 → 寫快取
 * 3. 抓取失敗 → 退回 stale 快取；若連 stale 都沒有，回空表（座標以 0 容忍，不阻斷天氣資料）
 *
 * 設計取捨：座標回填是「加值」而非「關鍵路徑」，因此主檔失敗時優雅降級，
 * 不讓它拖垮整個 iceland-status 回應。
 */
export async function getStationCoords(
  region: Region,
): Promise<StationCoordsMap> {
  const key = stationsKey(region);
  const cached = await cache.get<StationCoordsMap>(key);

  if (cached && isFresh(cached)) {
    return cached.value;
  }

  try {
    const raw = await fetchVedurStations(region);
    const coords = buildStationCoords(raw);
    await cache.set(key, coords, STATIONS_TTL_MS);
    return coords;
  } catch (error) {
    logEvent("warn", "station catalog fetch failed", {
      region,
      source: "vedur",
      error: error instanceof Error ? error.message : String(error),
      fallback: cached ? "stale" : "empty",
    });
    return cached?.value ?? {};
  }
}
