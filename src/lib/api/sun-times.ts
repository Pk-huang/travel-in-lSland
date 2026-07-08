import { z } from "zod";

import { fetchJson } from "@/src/lib/http/client";
import { sunTimesSchema } from "@/src/schemas";
import type { SunTimes } from "@/src/types";

const SUN_TIMES_BASE_URL = "https://api.sunrise-sunset.org/json";

const rawSunTimesResponseSchema = z.object({
  results: z.object({
    sunrise: z.string().datetime({ offset: true }),
    sunset: z.string().datetime({ offset: true }),
    solar_noon: z.string().datetime({ offset: true }),
    day_length: z.number().int().nonnegative(),
    civil_twilight_begin: z.string().datetime({ offset: true }),
    civil_twilight_end: z.string().datetime({ offset: true }),
    nautical_twilight_begin: z.string().datetime({ offset: true }),
    nautical_twilight_end: z.string().datetime({ offset: true }),
    astronomical_twilight_begin: z.string().datetime({ offset: true }),
    astronomical_twilight_end: z.string().datetime({ offset: true }),
  }),
  status: z.literal("OK"),
  tzid: z.string(),
});

export type FetchSunTimesOptions = {
  lat: number;
  lon: number;
  date: string;
  tzid?: string;
};

export async function fetchSunTimes({
  lat,
  lon,
  date,
  tzid = "Atlantic/Reykjavik",
}: FetchSunTimesOptions): Promise<SunTimes> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lon),
    date,
    formatted: "0",
    tzid,
  });

  const raw = await fetchJson<unknown>(`${SUN_TIMES_BASE_URL}?${params.toString()}`);
  const parsed = rawSunTimesResponseSchema.parse(raw);

  return sunTimesSchema.parse({
    source: "sunrise-sunset",
    date,
    tzid: parsed.tzid,
    lat,
    lon,
    sunrise: parsed.results.sunrise,
    sunset: parsed.results.sunset,
    solarNoon: parsed.results.solar_noon,
    dayLengthSeconds: parsed.results.day_length,
    civilTwilightBegin: parsed.results.civil_twilight_begin,
    civilTwilightEnd: parsed.results.civil_twilight_end,
    nauticalTwilightBegin: parsed.results.nautical_twilight_begin,
    nauticalTwilightEnd: parsed.results.nautical_twilight_end,
    astronomicalTwilightBegin: parsed.results.astronomical_twilight_begin,
    astronomicalTwilightEnd: parsed.results.astronomical_twilight_end,
  });
}
