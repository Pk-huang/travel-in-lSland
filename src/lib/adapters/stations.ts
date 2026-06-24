import type { RawVedurStation } from "@/src/lib/api/vedur";

/** 單一測站的座標（高程可選）。 */
export type StationCoords = {
  lat: number;
  lon: number;
  ele?: number;
};

/**
 * station id → 座標 的對照表。
 * 使用純物件（而非 Map）以利序列化，未來改 Redis 快取時可直接存取。
 */
export type StationCoordsMap = Record<number, StationCoords>;

/**
 * 由測站主檔建立「station id → 座標」對照表（純函式，不碰網路）。
 * 過濾掉缺座標的測站，避免回填出無效的 0,0。
 */
export function buildStationCoords(raw: RawVedurStation[]): StationCoordsMap {
  const map: StationCoordsMap = {};

  for (const s of raw) {
    if (typeof s.lat !== "number" || typeof s.lon !== "number") continue;
    map[s.station] = {
      lat: s.lat,
      lon: s.lon,
      ...(typeof s.ele === "number" ? { ele: s.ele } : {}),
    };
  }

  return map;
}
