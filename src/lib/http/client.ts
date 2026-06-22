// http 行為層的預設值（與業務無關）
export const DEFAULT_TIMEOUT_MS = 3_000;
export const DEFAULT_RETRY_COUNT = 2;

export type FetchJsonOptions = {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
};

/**
 * 上游請求錯誤（可被 route handler 接住並轉成統一 error 格式）。
 */
export class UpstreamError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

/**
 * 通用對外請求工具：負責「穩定地把 JSON 拿回來」。
 * - timeout：透過 AbortController 控制（預設 3s）
 * - retry：失敗自動重試（預設 2 次）
 *
 * 此函式不認識任何業務語意（Vedur / Road），只處理連線穩定性。
 */
export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRY_COUNT,
    headers,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new UpstreamError(
          `Upstream responded ${response.status}`,
          response.status,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new UpstreamError("Unknown upstream error");
}
