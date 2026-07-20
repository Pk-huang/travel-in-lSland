import { NextResponse } from "next/server";
import { z } from "zod";

import { FEATURED_POI_IDS, POI_SEED_POOL } from "@/src/lib/config/poi-seeds";
import { apiErrorResponseSchema } from "@/src/schemas";

const requestQuerySchema = z.object({
  featured: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});

function errorResponse(code: string, message: string, status: number): NextResponse {
  return NextResponse.json(
    apiErrorResponseSchema.parse({
      error: { code, message, fallback: false },
    }),
    { status },
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const queryResult = requestQuerySchema.safeParse({
    featured: searchParams.get("featured") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!queryResult.success) {
    return errorResponse("INVALID_QUERY", "featured/limit 參數格式無效", 400);
  }

  const { featured, limit } = queryResult.data;

  // 預設回傳 featured 10 筆，讓前台可以直接接入 demo 資料來源。
  const isFeaturedOnly = featured !== "false";
  const effectiveLimit = limit ?? 10;

  const pool = isFeaturedOnly
    ? POI_SEED_POOL.filter((poi) => FEATURED_POI_IDS.includes(poi.poiId))
    : POI_SEED_POOL;

  const items = pool.slice(0, effectiveLimit);

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      total: items.length,
      featuredOnly: isFeaturedOnly,
      items,
    },
    { status: 200 },
  );
}
