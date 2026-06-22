import type { Region } from "@/src/types";
import { fetchJson } from "@/src/lib/http/client";

// --- Vedur upstream config（就近放在來源檔內）---
export const VEDUR_BASE_URL =
  process.env.VEDUR_BASE_URL ?? "https://api.vedur.is/weather";
export const VEDUR_API_VERSION = "2026-02-17";
export const VEDUR_HEADERS: Record<string, string> = {
  Accept: "application/json",
  "X-Vi-Api-Version": VEDUR_API_VERSION,
};

// Region -> Vedur region_id（見 docs/api/vedur-weather-api.md §7）
export const VEDUR_REGION_ID: Record<Region, number> = {
  south: 2,
  west: 3,
  north: 7,
  east: 9,
  all: 12,
};

/**
 * Vedur AWS 最新觀測的原始欄位（見 docs/api/vedur-weather-api.md §5.2）。
 * 這裡只描述 MVP 會用到的欄位，其餘忽略。
 */
export type RawVedurObservation = {
  station: number;
  name: string;
  time: string; // 例：2026-06-22T09:00:00（Vedur 不帶時區，視為 UTC）
  t?: number | null; // 氣溫
  f?: number | null; // 風速
  fg?: number | null; // 陣風
  d_txt?: string | null; // 風向文字
  rh?: number | null; // 相對濕度
  r?: number | null; // 降水
  snd?: number | null; // 積雪深度
  ps?: number | null; // 氣壓
  lat?: number;
  lon?: number;
};

/**
 * Vedur 的 time 不帶時區（例：2026-06-22T09:00:00），冰島全年使用 UTC。
 * 補上 Z 轉成標準 ISO8601，供 schema 驗證與前端使用。
 */
export function normalizeVedurTime(time: string): string {
  const hasZone = /Z|[+-]\d{2}:?\d{2}$/.test(time);
  const iso = hasZone ? time : `${time}Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export type VedurFetchParams = {
  region: Region;
  parameters?: "basic" | "all";
};

/**
 * 唯一對外抓取 Vedur 的進入點：依參數決定抓什麼，回傳「原始 raw 觀測」。
 * 只負責接收與傳輸，不做任何 domain 轉換；解析交給 adapters/weather、adapters/road。
 */
export async function fetchVedurObservations(
  params: VedurFetchParams,
): Promise<RawVedurObservation[]> {
  const { region, parameters = "basic" } = params;
  const regionId = VEDUR_REGION_ID[region];
  const url = `${VEDUR_BASE_URL}/observations/aws/hour/latest?region_id=${regionId}&parameters=${parameters}`;

  return fetchJson<RawVedurObservation[]>(url, { headers: VEDUR_HEADERS });
}
