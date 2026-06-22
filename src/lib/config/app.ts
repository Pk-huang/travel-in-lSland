import type { Region } from "@/src/types";

/**
 * App 級別、跨來源共用的設定。
 * 各外部 API 的專屬設定請放在該來源檔案內（例如 api/vedur.ts）。
 */
export const DEFAULT_REGION: Region = "south";

export const REGION_LABELS: Record<Region, string> = {
  south: "South Iceland",
  west: "West Iceland",
  north: "North Iceland",
  east: "East Iceland",
  all: "All Iceland",
};
