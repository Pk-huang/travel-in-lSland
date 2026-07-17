import { z } from "zod";

export const regionSchema = z.enum(["south", "west", "north", "east", "all"]);
export const alertLevelSchema = z.enum(["low", "medium", "high"]);
export const roadStatusSchema = z.enum(["open", "caution", "closed"]);
export const cacheStateSchema = z.enum(["hit", "miss", "stale"]);

export const geoPointSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  elevationM: z.number().optional(),
  kind: z.enum(["poi", "weather-station", "road-segment"]),
});

export const weatherConditionsSchema = z.object({
  source: z.literal("vedur"),
  timestamp: z.string().datetime(),
  lat: z.number(),
  lon: z.number(),
  temperatureC: z.number(),
  windSpeedMs: z.number(),
  visibilityKm: z.number().optional(),
  precipitationMm: z.number().optional(),
  alertLevel: alertLevelSchema,
});

export const roadSegmentSchema = z.object({
  source: z.literal("road"),
  segmentId: z.string(),
  name: z.string(),
  status: roadStatusSchema,
  reason: z.string().optional(),
  updatedAt: z.string().datetime(),
  geometry: z.array(z.tuple([z.number(), z.number()])),
});

export const itineraryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  waypoint: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  riskNote: z.string().optional(),
});

export const auroraConditionsSchema = z.object({
  source: z.literal("noaa"),
  observationTime: z.string().datetime(),
  forecastTime: z.string().datetime(),
  coordinates: z.array(z.tuple([z.number(), z.number(), z.number()])),
});

export const sunTimesSchema = z.object({
  source: z.literal("sunrise-sunset"),
  date: z.string(),
  tzid: z.string(),
  lat: z.number(),
  lon: z.number(),
  sunrise: z.string().datetime({ offset: true }),
  sunset: z.string().datetime({ offset: true }),
  solarNoon: z.string().datetime({ offset: true }),
  dayLengthSeconds: z.number().int().nonnegative(),
  civilTwilightBegin: z.string().datetime({ offset: true }),
  civilTwilightEnd: z.string().datetime({ offset: true }),
  nauticalTwilightBegin: z.string().datetime({ offset: true }),
  nauticalTwilightEnd: z.string().datetime({ offset: true }),
  astronomicalTwilightBegin: z.string().datetime({ offset: true }),
  astronomicalTwilightEnd: z.string().datetime({ offset: true }),
});

export const sunTimesResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  sun: sunTimesSchema,
});

export const sunTimesBoundarySchema = z.object({
  previous: sunTimesSchema.nullable(),
  current: sunTimesSchema.nullable(),
  next: sunTimesSchema.nullable(),
});

export const sunLightingBoundarySchema = z.object({
  previousSunsetTs: z.number().int().nullable(),
  sunriseTs: z.number().int(),
  sunsetTs: z.number().int(),
  nextSunriseTs: z.number().int().nullable(),
  civilBeginTs: z.number().int().nullable(),
  civilEndTs: z.number().int().nullable(),
});

export const sunLightingModelSchema = z.object({
  source: z.enum(["sun", "fallback"]),
  tzid: z.string(),
  boundary: sunLightingBoundarySchema.nullable(),
  dayType: z.enum(["normal", "polar_day", "polar_night"]),
  dayTypeConfidence: z.enum(["low", "medium", "high"]).optional(),
  dayTypeReason: z.string().optional(),
  fallbackReason: z.string().optional(),
});

export const icelandStatusMetaSchema = z.object({
  region: regionSchema,
  generatedAt: z.string().datetime(),
  cache: cacheStateSchema,
  fallback: z.boolean(),
});

export const icelandStatusSummarySchema = z.object({
  riskScore: z.number().min(0).max(100),
  highRiskSegments: z.number().int().min(0),
});

export const icelandStatusResponseSchema = z.object({
  meta: icelandStatusMetaSchema,
  weather: z.array(weatherConditionsSchema),
  roads: z.array(roadSegmentSchema),
  aurora: z.array(auroraConditionsSchema),
  sun: sunTimesSchema.nullable().optional(),
  sunBoundary: sunTimesBoundarySchema.nullable().optional(),
  sunModel: sunLightingModelSchema.optional(),
  summary: icelandStatusSummarySchema,
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fallback: z.boolean(),
  }),
});
