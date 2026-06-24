/**
 * 快取抽象層。
 *
 * 目的：讓 route 只依賴介面，不依賴具體實作（記憶體 / Redis）。
 * 之後要換成 Upstash Redis，只需新增一個實作此介面的檔案並替換 singleton。
 */

export type CacheEntry<T> = {
  value: T;
  storedAt: number; // epoch ms
  expiresAt: number; // epoch ms
};

export interface CacheStore {
  /**
   * 取出 entry（即使已過期也會回傳，讓上層可用 stale 做 fallback）。
   * 不存在時回傳 null。
   */
  get<T>(key: string): Promise<CacheEntry<T> | null>;

  /** 寫入並設定 TTL（毫秒）。 */
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
}

/** entry 是否仍新鮮（未過期）。 */
export function isFresh<T>(entry: CacheEntry<T>): boolean {
  return Date.now() < entry.expiresAt;
}

/**
 * 記憶體實作：以 Map 保存，適合單機 / 開發。
 * 注意：serverless 多實例不共享，正式環境需換成 Redis。
 */
export class InMemoryCacheStore implements CacheStore {
  private readonly map = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.map.get(key);
    return entry ? (entry as CacheEntry<T>) : null;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const now = Date.now();
    this.map.set(key, { value, storedAt: now, expiresAt: now + ttlMs });
  }
}
