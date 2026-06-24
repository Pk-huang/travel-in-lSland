import { InMemoryCacheStore, type CacheStore } from "./store";
import type { Region } from "@/src/types";

/** 快取 TTL：900 秒（見 PROJECT_SPEC_AND_PLAN.md §2.5）。 */
export const CACHE_TTL_MS = 900_000;

/**
 * 單例快取。目前為記憶體實作；之後改 Redis 只需替換此處：
 *   export const cache: CacheStore = new UpstashCacheStore(...)
 */
export const cache: CacheStore = new InMemoryCacheStore();

/**
 * 快取鍵：`status:{region}:{timeslot}`。
 * timeslot 以「TTL 桶」切齊，讓同一時段共用同一份快取。
 */
export function buildStatusKey(region: Region, at?: string): string {
  const base = at ? Date.parse(at) : Date.now();
  const timeslot = Math.floor(base / CACHE_TTL_MS);
  return `status:${region}:${timeslot}`;
}

export { isFresh } from "./store";
export type { CacheEntry, CacheStore } from "./store";
