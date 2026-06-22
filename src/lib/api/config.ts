import type { Region } from "@/src/types";

export const DEFAULT_REGION: Region = "south";
export const DEFAULT_TIMEOUT_MS = 3_000;
export const DEFAULT_RETRY_COUNT = 2;

export const REGION_LABELS: Record<Region, string> = {
  south: "South Iceland",
  west: "West Iceland",
  north: "North Iceland",
  east: "East Iceland",
  all: "All Iceland",
};
