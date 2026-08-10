import { NextResponse } from "next/server";
import { z } from "zod";

import { FEATURED_POI_IDS, POI_SEED_POOL } from "@/src/lib/config/poi-seeds";
import { apiErrorResponseSchema } from "@/src/schemas";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

const requestQuerySchema = z.object({
  featured: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
});

function createErrorResponse(code: string, message: string, status: number): NextResponse {
  return NextResponse.json(
    apiErrorResponseSchema.parse({
      error: { code, message, fallback: false },
    }),
    { status },
  );
}

function selectPoiItems(featuredOnly: boolean, limit: number) {
  const featuredPoiIds = new Set(FEATURED_POI_IDS);
  const pool = featuredOnly
    ? POI_SEED_POOL.filter((poi) => featuredPoiIds.has(poi.poiId))
    : POI_SEED_POOL;

  return pool.slice(0, limit);
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const queryResult = requestQuerySchema.safeParse({
    featured: searchParams.get("featured") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!queryResult.success) {
    return createErrorResponse("INVALID_QUERY", "featured/limit 參數格式無效", 400);
  }

  const { featured, limit } = queryResult.data;
  const isFeaturedOnly = featured !== "false";
  const effectiveLimit = limit ?? DEFAULT_LIMIT;
  const items = selectPoiItems(isFeaturedOnly, effectiveLimit);

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
