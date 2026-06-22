import type { AlertLevel, WeatherConditions } from "@/src/types";
import { type RawVedurObservation, normalizeVedurTime } from "@/src/lib/api/vedur";

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
 * 注意：AWS 觀測未必帶 lat/lon，缺值時以 0 代入（MVP 容忍）。
 */
export function parseWeather(
  raw: RawVedurObservation[],
): WeatherConditions[] {
  return raw.map((obs) => ({
    source: "vedur",
    timestamp: normalizeVedurTime(obs.time),
    lat: obs.lat ?? 0,
    lon: obs.lon ?? 0,
    temperatureC: obs.t ?? 0,
    windSpeedMs: obs.f ?? 0,
    precipitationMm: obs.r ?? undefined,
    alertLevel: deriveAlertLevel(obs),
  }));
}
