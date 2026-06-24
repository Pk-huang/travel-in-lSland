/**
 * 斷路器（Circuit Breaker）。
 *
 * 規格（見 PROJECT_SPEC_AND_PLAN.md §2.5）：
 * - 連續 5 次上游失敗即「開啟」
 * - 開啟後 60 秒進入「半開」，放行一次試探
 * - 試探成功 → 關閉並歸零；失敗 → 重新開啟
 */

export type CircuitState = "closed" | "open" | "half-open";

export type CircuitBreakerOptions = {
  failureThreshold?: number;
  openMs?: number;
};

export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly openMs: number;

  private failures = 0;
  private openedAt = 0;
  private state: CircuitState = "closed";

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.openMs = options.openMs ?? 60_000;
  }

  /** 是否允許這次對上游發出請求。 */
  canRequest(): boolean {
    if (this.state === "open") {
      if (Date.now() - this.openedAt >= this.openMs) {
        this.state = "half-open";
        return true; // 放行一次試探
      }
      return false;
    }
    return true; // closed 或 half-open
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.state === "half-open" || this.failures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

/** Vedur 上游專用的單例斷路器。 */
export const vedurBreaker = new CircuitBreaker();
