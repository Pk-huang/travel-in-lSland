import { NextResponse } from "next/server";

import { DEFAULT_REGION } from "@/src/lib/config/app";
import { fetchVedurObservations } from "@/src/lib/api/vedur";
import { deriveRoads } from "@/src/lib/adapters/road";
import { parseWeather } from "@/src/lib/adapters/weather";
import {
  apiErrorResponseSchema,
  icelandStatusResponseSchema,
  regionSchema,
} from "@/src/schemas";
import type {
  ApiErrorResponse,
  IcelandStatusResponse,
  RoadSegment,
} from "@/src/types";

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

/**
 * GET /data/iceland-status
 *
 * 接收需求 → 抓一次 Vedur raw → weather/road 各自解析 → 合併驗證後回傳。
 * 這層只負責 HTTP 進出與協調，不含資料轉換邏輯。
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  // 1. 接收並驗證參數
  const regionResult = regionSchema.safeParse(
    searchParams.get("region") ?? DEFAULT_REGION,
  );
  if (!regionResult.success) {
    return NextResponse.json(
      errorBody("INVALID_REGION", "region 參數無效"),
      { status: 400 },
    );
  }
  const region = regionResult.data;

  const atParam = searchParams.get("at");
  if (atParam !== null && Number.isNaN(Date.parse(atParam))) {
    return NextResponse.json(
      errorBody("INVALID_AT", "at 參數需為 ISO datetime"),
      { status: 400 },
    );
  }

  // 2. 抓取 + 解析 + 組裝
  try {
    const raw = await fetchVedurObservations({ region });
    const weather = parseWeather(raw);
    const roads = deriveRoads(raw);

    const body: IcelandStatusResponse = {
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
    };

    // 3. 出口前驗證，確保契約一致
    const validated = icelandStatusResponseSchema.parse(body);
    return NextResponse.json(validated);
  } catch {
    return NextResponse.json(
      errorBody("UPSTREAM_UNAVAILABLE", "Vedur API unavailable", true),
      { status: 503 },
    );
  }
}
