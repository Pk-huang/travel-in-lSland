import { NextResponse } from "next/server";

import { DEFAULT_REGION } from "@/src/lib/config/app";
import { fetchVedurObservations } from "@/src/lib/api/vedur";
import { deriveRoads } from "@/src/lib/adapters/road";
import { parseWeather } from "@/src/lib/adapters/weather";
import { CACHE_TTL_MS, buildStatusKey, cache, isFresh } from "@/src/lib/cache";
import { vedurBreaker } from "@/src/lib/http/circuit-breaker";
import { statusSingleFlight } from "@/src/lib/http/single-flight";
import { UpstreamError } from "@/src/lib/http/client";
import { captureException, logEvent } from "@/src/lib/observability";
import {
  apiErrorResponseSchema,
  icelandStatusResponseSchema,
  regionSchema,
} from "@/src/schemas";
import type {
  ApiErrorResponse,
  IcelandStatusResponse,
  Region,
  RoadSegment,
} from "@/src/types";
import snapshot from "@/fixtures/iceland-status.normal.json";

function errorBody(
  code: string,
  message: string,
  fallback = false,
): ApiErrorResponse {
  return apiErrorResponseSchema.parse({ error: { code, message, fallback } });
}

function buildSummary(roads: RoadSegment[]): IcelandStatusResponse["summary"] {
  const weights: Record<RoadSegment["status"], number> = {
    open: 0,
    caution: 50,
    closed: 100,
  };
  const highRiskSegments = roads.filter((r) => r.status === "closed").length;
  const riskScore =
    roads.length === 0
      ? 0
      : Math.round(
          roads.reduce((sum, r) => sum + weights[r.status], 0) / roads.length,
        );

  return { riskScore, highRiskSegments };
}

/** 從上游抓取並組裝統一回應（cache: miss、fallback: false）。 */
async function fetchFresh(region: Region): Promise<IcelandStatusResponse> {
  const raw = await fetchVedurObservations({ region });
  const weather = parseWeather(raw);
  const roads = deriveRoads(raw);

  return icelandStatusResponseSchema.parse({
    meta: {
      region,
      generatedAt: new Date().toISOString(),
      cache: "miss",
      fallback: false,
    },
    weather,
    roads,
    aurora: [],
    summary: buildSummary(roads),
  });
}

/** 靜態 snapshot（fixture）作為最後一層 fallback。 */
function buildSnapshot(region: Region): IcelandStatusResponse {
  return icelandStatusResponseSchema.parse({
    ...snapshot,
    meta: {
      region,
      generatedAt: new Date().toISOString(),
      cache: "miss",
      fallback: true,
    },
  });
}

/**
 * revalidate 的三種結果（讓呼叫端能區分「上游問題」與「程式錯誤」）：
 * - ok：成功取得新資料
 * - upstream-down：斷路器開啟或上游失敗（預期內、可囼 fallback）
 * - error：非預期的程式 / 資料錯誤（應告警，不該被 fallback 麵損）
 */
type RevalidateResult =
  | { status: "ok"; data: IcelandStatusResponse }
  | { status: "upstream-down" }
  | { status: "error"; error: unknown };

/**
 * 經斷路器 + single-flight 抓上游並寫入快取。
 * - 斷路器未放行 → upstream-down（讓上層走 fallback）
 * - 同一 key 併發只會真正打一次上游，其餘共用結果（防驚群）
 * - UpstreamError → 計入斷路器失敗、回 upstream-down
 * - 其他錯誤（程式 bug）→ 不拖累斷路器，上報 Sentry、回 error
 */
async function revalidate(
  region: Region,
  key: string,
  requestId: string,
): Promise<RevalidateResult> {
  if (!vedurBreaker.canRequest()) {
    logEvent("warn", "circuit breaker open, skip upstream", {
      requestId,
      region,
      source: "vedur",
      breaker: vedurBreaker.getState(),
    });
    return { status: "upstream-down" };
  }

  const startedAt = Date.now();
  try {
    const fresh = await statusSingleFlight.run(key, () => fetchFresh(region));
    vedurBreaker.recordSuccess();
    await cache.set(key, fresh, CACHE_TTL_MS);
    logEvent("info", "upstream fetch ok", {
      requestId,
      region,
      source: "vedur",
      latencyMs: Date.now() - startedAt,
    });
    return { status: "ok", data: fresh };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    // 上游問題（逐時 / 非 2xx / 網路）：預期內，計入斷路器並走 fallback。
    if (error instanceof UpstreamError) {
      vedurBreaker.recordFailure();
      logEvent("warn", "upstream fetch failed", {
        requestId,
        region,
        source: "vedur",
        latencyMs,
        breaker: vedurBreaker.getState(),
        error: error.message,
      });
      return { status: "upstream-down" };
    }

    // 非上游錯誤（程式 / 資料 bug）：不拖累斷路器，大聲上報。
    captureException(error, { requestId, region, source: "vedur", latencyMs });
    return { status: "error", error };
  }
}

/** 統一回應：附上 x-request-id，並記錄一筆「請求完成」日誌。 */
function respond(
  body: IcelandStatusResponse | ApiErrorResponse,
  ctx: {
    requestId: string;
    startedAt: number;
    region?: Region;
    cacheState: string;
    fallback: boolean;
    status?: number;
  },
): NextResponse {
  const { requestId, startedAt, region, cacheState, fallback, status = 200 } =
    ctx;

  logEvent(status >= 500 ? "error" : "info", "request completed", {
    requestId,
    region,
    cacheState,
    fallback,
    status,
    latencyMs: Date.now() - startedAt,
  });

  const res = NextResponse.json(body, { status });
  res.headers.set("x-request-id", requestId);
  return res;
}

/**
 * GET /data/iceland-status
 *
 * 流程：
 * 1. 新鮮快取 → 直接回（hit）
 * 2. 過期快取 → 立刻回 stale，並在背景 single-flight 更新（SWR）
 * 3. 無快取 → single-flight 抓上游；
 *    - 上游失敗 → snapshot fallback（200）
 *    - 程式錯誤 → 500 並上報（不被 fallback 掩蓋）
 */
export async function GET(request: Request): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);

  // 1. 接收並驗證參數
  const regionResult = regionSchema.safeParse(
    searchParams.get("region") ?? DEFAULT_REGION,
  );
  if (!regionResult.success) {
    return respond(errorBody("INVALID_REGION", "region 參數無效"), {
      requestId,
      startedAt,
      cacheState: "bypass",
      fallback: false,
      status: 400,
    });
  }
  const region = regionResult.data;

  const atParam = searchParams.get("at");
  if (atParam !== null && Number.isNaN(Date.parse(atParam))) {
    return respond(errorBody("INVALID_AT", "at 參數需為 ISO datetime"), {
      requestId,
      startedAt,
      region,
      cacheState: "bypass",
      fallback: false,
      status: 400,
    });
  }

  const key = buildStatusKey(region, atParam ?? undefined);

  // 2. 查快取
  const cached = await cache.get<IcelandStatusResponse>(key);

  // 2a. 新鮮 → 直接回 hit
  if (cached && isFresh(cached)) {
    return respond(
      { ...cached.value, meta: { ...cached.value.meta, cache: "hit" } },
      { requestId, startedAt, region, cacheState: "hit", fallback: false },
    );
  }

  // 2b. 過期 → 立刻回 stale，背景 single-flight 更新（不 await）
  if (cached) {
    void revalidate(region, key, requestId);
    return respond(
      {
        ...cached.value,
        meta: { ...cached.value.meta, cache: "stale", fallback: true },
      },
      { requestId, startedAt, region, cacheState: "stale", fallback: true },
    );
  }

  // 3. 無快取 → 同步取上游（single-flight）
  const result = await revalidate(region, key, requestId);

  if (result.status === "ok") {
    return respond(result.data, {
      requestId,
      startedAt,
      region,
      cacheState: "miss",
      fallback: false,
    });
  }

  // 3a. 程式 / 資料錯誤 → 500（已於 revalidate 上報），不以 snapshot 掩蓋
  if (result.status === "error") {
    return respond(
      errorBody("INTERNAL_ERROR", "資料處理發生未預期錯誤", false),
      {
        requestId,
        startedAt,
        region,
        cacheState: "miss",
        fallback: false,
        status: 500,
      },
    );
  }

  // 3b. 上游失敗且無快取 → 靜態 snapshot（避免白屏）
  return respond(buildSnapshot(region), {
    requestId,
    startedAt,
    region,
    cacheState: "miss",
    fallback: true,
  });
}
