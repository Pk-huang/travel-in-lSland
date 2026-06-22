import type { RoadSegment, RoadStatus } from "@/src/types";
import { type RawVedurObservation, normalizeVedurTime } from "@/src/lib/api/vedur";

/**
 * Road Risk 推算公式（見 docs/api/iceland-traffic-api.md §9）。
 * 由 Vedur 天氣欄位推算路段風險，無獨立路況 API。
 */
export function deriveRoadStatus(obs: RawVedurObservation): RoadStatus {
  const gust = obs.fg ?? 0;
  const snow = obs.snd ?? 0;
  const temp = obs.t ?? 0;
  const rain = obs.r ?? 0;

  // closed：陣風過強、積雪過深、極端低溫
  if (gust > 25 || snow > 30 || temp < -15) return "closed";

  // caution：風速偏高、積雪、降水、低溫
  if (gust > 15 || snow > 10 || rain > 5 || temp < -5) return "caution";

  return "open";
}

function buildReason(obs: RawVedurObservation): string {
  const reasons: string[] = [];
  if ((obs.fg ?? 0) > 15) reasons.push(`gust ${obs.fg} m/s`);
  if ((obs.snd ?? 0) > 10) reasons.push(`snow depth ${obs.snd} cm`);
  if ((obs.r ?? 0) > 5) reasons.push(`precipitation ${obs.r} mm`);
  if ((obs.t ?? 0) < -5) reasons.push(`temperature ${obs.t}°C`);
  return reasons.join(", ");
}

/**
 * 把同一份 Vedur 原始觀測推算成 RoadSegment[]。
 * 純函式：只吃 raw、不 import vedur 解析、不碰網路。
 */
export function deriveRoads(raw: RawVedurObservation[]): RoadSegment[] {
  return raw.map((obs) => {
    const status = deriveRoadStatus(obs);
    return {
      source: "road",
      segmentId: `station-${obs.station}`,
      name: obs.name,
      status,
      reason: status === "open" ? undefined : buildReason(obs),
      updatedAt: normalizeVedurTime(obs.time),
      geometry: [[obs.lon ?? 0, obs.lat ?? 0]],
    };
  });
}
