// 觀測層：結構化日誌。
// 設計原則：
// - 一律輸出「單行 JSON」，方便 Vercel / 任何 log drain 收集與查詢
// - 不認識業務語意，只負責把欄位安全地序列化出來
// - 與告警解耦：告警規則設定在 Sentry / log 平台，這裡只負責產生事件

export type LogLevel = "debug" | "info" | "warn" | "error";

/** 一筆日誌可附帶的結構化欄位（requestId / region / latencyMs / cacheState ...）。 */
export type LogFields = Record<string, unknown>;

/** 將任意 error 轉成可序列化的欄位（保留 name / message / stack）。 */
export function errorToFields(error: unknown): LogFields {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

/**
 * 輸出一筆結構化日誌。
 * error/warn 走 stderr（console.error/warn），其餘走 stdout，
 * 方便在平台上依嚴重度分流。
 */
export function logEvent(
  level: LogLevel,
  message: string,
  fields: LogFields = {},
): void {
  const entry = {
    level,
    message,
    ts: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
