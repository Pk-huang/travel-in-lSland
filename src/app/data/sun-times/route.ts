import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchSunTimes } from "@/src/lib/api/sun-times";
import { UpstreamError } from "@/src/lib/http/client";
import { apiErrorResponseSchema, sunTimesResponseSchema } from "@/src/schemas";

const DEFAULT_ICELAND_CENTER = {
  lat: 64.9631,
  lon: -19.0208,
} as const;

const requestQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tzid: z.string().min(1).optional(),
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
    lat: searchParams.get("lat") ?? undefined,
    lon: searchParams.get("lon") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    tzid: searchParams.get("tzid") ?? undefined,
  });

  if (!queryResult.success) {
    return errorResponse("INVALID_QUERY", "lat/lon/date/tzid 參數格式無效", 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { lat, lon, date, tzid } = queryResult.data;

  try {
    const sun = await fetchSunTimes({
      lat: lat ?? DEFAULT_ICELAND_CENTER.lat,
      lon: lon ?? DEFAULT_ICELAND_CENTER.lon,
      date: date ?? today,
      tzid,
    });

    const body = sunTimesResponseSchema.parse({
      generatedAt: new Date().toISOString(),
      sun,
    });
    console.log("Sun times response:", sun);
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof UpstreamError) {
      return errorResponse("UPSTREAM_UNAVAILABLE", error.message, 503);
    }

    return errorResponse("INTERNAL_ERROR", "日照資料處理失敗", 500);
  }
}
