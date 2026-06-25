"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiErrorResponse, IcelandStatusResponse, Region } from "@/src/types";

/** hook 對外暴露的狀態：資料 + 載入 + 錯誤。 */
export type IcelandStatusState = {
  data: IcelandStatusResponse | null;
  loading: boolean;
  error: string | null;
  /** 手動重新抓取（例如錯誤後的「重試」）。 */
  refetch: () => void;
};

function isErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiErrorResponse).error?.message === "string"
  );
}

/**
 * 取得某 region 的冰島狀態（CSR 資料來源）。
 *
 * 職責單一：只負責「跟我們自己的後端 BFF 拿整理好的資料」與管理 loading/error，
 * 不含任何畫面。之後 Phase 2 的 3D 地圖可重用同一個 hook。
 *
 * 設計重點：
 * - region 改變會自動重抓（effect 依賴 region）。
 * - 用 AbortController 取消過期請求，避免「快速連點」時舊回應覆蓋新資料（race condition）。
 */
export function useIcelandStatus(region: Region): IcelandStatusState {
  const [data, setData] = useState<IcelandStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // 保存目前進行中的 controller，切換 region 時可中止上一個請求。
  const controllerRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/data/iceland-status?region=${region}`, {
          signal: controller.signal,
        });
        const body: unknown = await res.json();

        if (!res.ok) {
          const message = isErrorResponse(body)
            ? body.error.message
            : `請求失敗（HTTP ${res.status}）`;
          throw new Error(message);
        }

        setData(body as IcelandStatusResponse);
      } catch (err: unknown) {
        // 主動中止（切換 region）不算錯誤，忽略。
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "未知錯誤");
      } finally {
        // 僅當這是「最新」的請求時才關閉 loading，避免被中止的舊請求誤關。
        if (controllerRef.current === controller) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [region, reloadKey]);

  return { data, loading, error, refetch };
}
