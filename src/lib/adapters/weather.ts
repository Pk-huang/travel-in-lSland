import type { AlertLevel, WeatherConditions } from "@/src/types";
import { type RawVedurObservation, normalizeVedurTime } from "@/src/lib/api/vedur";
import type { StationCoordsMap } from "@/src/lib/adapters/stations";

/**
 * 由觀測欄位推算天氣警示等級。
 * 純函式，不碰網路；輸入同一份 raw 即可重現結果，便於測試。
 */
export function deriveAlertLevel(obs: RawVedurObservation): AlertLevel {
  const gust = obs.fg ?? obs.f ?? 0;
  const snow = obs.snd ?? 0;
  const temp = obs.t ?? 0;
  const rain = obs.r ?? 0;

  if (gust > 25 || snow > 30 || temp < -15) return "high";
  if (gust > 15 || snow > 10 || rain > 5 || temp < -5) return "medium";
  return "low";
}

/**
 * 把 Vedur 原始觀測轉成統一的 WeatherConditions[]。
 *
 * AWS 觀測本身不帶 lat/lon，須以 station id 對照測站主檔（coords）回填座標：
 * 優先序為「主檔座標 → 觀測自帶座標 → 0」。
 * 缺座標的測站（回填後仍為 0）對 3D 渲染無意義，但 MVP 暫予容忍。
 */
export function parseWeather(
  raw: RawVedurObservation[],
  coords: StationCoordsMap = {},
): WeatherConditions[] {
  return raw.map((obs) => {
    const station = coords[obs.station];
    return {
      source: "vedur",
      timestamp: normalizeVedurTime(obs.time),
      lat: station?.lat ?? obs.lat ?? 0,
      lon: station?.lon ?? obs.lon ?? 0,
      temperatureC: obs.t ?? 0,
      windSpeedMs: obs.f ?? 0,
      precipitationMm: obs.r ?? undefined,
      alertLevel: deriveAlertLevel(obs),
    };
  });
}
