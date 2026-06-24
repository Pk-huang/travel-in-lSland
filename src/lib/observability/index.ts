// 觀測層對外入口：統一匯出日誌與例外上報。
//
// Sentry 採「延遲載入 + DSN 開關」策略：
// - 未設定 SENTRY_DSN（本機 / 尚未接 Sentry）→ 完全不載入、零成本
// - 設定後才動態 import @sentry/nextjs 並上報
// 真正的 Sentry 初始化（instrumentation、source map）與失敗率告警規則
// 屬於部署設定，待提供 DSN 後再補；本模組確保「程式端」已備妥上報接口。

import { errorToFields, logEvent } from "./logger";
import type { LogFields } from "./logger";

export { logEvent, errorToFields };
export type { LogLevel, LogFields } from "./logger";

/**
 * 上報一個非預期例外（程式 / 資料錯誤）。
 * - 一律寫入結構化錯誤日誌（即使沒有 Sentry 也看得到）
 * - 若有設定 SENTRY_DSN，再額外送往 Sentry
 */
export function captureException(error: unknown, context: LogFields = {}): void {
  logEvent("error", "captured exception", {
    ...context,
    error: errorToFields(error),
  });

  if (!process.env.SENTRY_DSN) return;

  void import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    })
    .catch(() => {
      // Sentry 上報失敗不可影響主流程，已有本地日誌兜底。
    });
}
