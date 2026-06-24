import { NextResponse } from "next/server";

import { DEFAULT_REGION } from "@/src/lib/config/app";
import { fetchVedurObservations } from "@/src/lib/api/vedur";
import { deriveRoads } from "@/src/lib/adapters/road";
import { parseWeather } from "@/src/lib/adapters/weather";
import { CACHE_TTL_MS, buildStatusKey, cache, isFresh } from "@/src/lib/cache";
import { vedurBreaker } from "@/src/lib/http/circuit-breaker";
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
 * GET /data/iceland-status
 *
 * 流程：快取命中 → 直接回；否則經斷路器抓上游 →
 * 失敗時依序 fallback：stale cache → 靜態 snapshot → error。
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  // 1. 接收並驗證參數
  const regionResult = regionSchema.safeParse(
    searchParams.get("region") ?? DEFAULT_REGION,
  );
  if (!regionResult.success) {
    return NextResponse.json(errorBody("INVALID_REGION", "region 參數無效"), {
      status: 400,
    });
  }
  const region = regionResult.data;

  const atParam = searchParams.get("at");
  if (atParam !== null && Number.isNaN(Date.parse(atParam))) {
    return NextResponse.json(
      errorBody("INVALID_AT", "at 參數需為 ISO datetime"),
      { status: 400 },
    );
  }

  const key = buildStatusKey(region, atParam ?? undefined);

  // 2. 快取命中（新鮮）→ 直接回
  const cached = await cache.get<IcelandStatusResponse>(key);
  if (cached && isFresh(cached)) {
    return NextResponse.json({
      ...cached.value,
      meta: { ...cached.value.meta, cache: "hit" },
    });
  }

  // 3. 經斷路器嘗試抓上游
  if (vedurBreaker.canRequest()) {
    try {
      const fresh = await fetchFresh(region);
      vedurBreaker.recordSuccess();
      await cache.set(key, fresh, CACHE_TTL_MS);
      return NextResponse.json(fresh);
    } catch {
      vedurBreaker.recordFailure();
    }
  }

  // 4. Fallback：stale cache → snapshot
  if (cached) {
    return NextResponse.json({
      ...cached.value,
      meta: { ...cached.value.meta, cache: "stale", fallback: true },
    });
  }

  return NextResponse.json(buildSnapshot(region));
}
