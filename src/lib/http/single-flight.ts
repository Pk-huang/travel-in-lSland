/**
 * Single-flight（請求合併 / 去重）。
 *
 * 目的：同一個 key 同時間只執行「一次」非同步工作，
 * 其餘併發的呼叫共用同一個進行中的 Promise，避免驚群效應（thundering herd）。
 *
 * 典型用途：快取 miss 時，100 個併發請求只放 1 個去打上游，其餘等同一結果。
 */
export class SingleFlight {
  private readonly inflight = new Map<string, Promise<unknown>>();

  /**
   * 以 key 去重執行 fn。
   * 若同 key 已有進行中的工作，直接回傳那個 Promise；否則啟動並登記。
   * 工作完成（無論成功失敗）後自動清除登記。
   */
  run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }
}

/** BFF 狀態查詢共用的 single-flight 實例。 */
export const statusSingleFlight = new SingleFlight();
