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

const yyyyMmDdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const travelPlanStatusSchema = z.enum([
  "draft",
  "active",
  "completed",
  "archived",
]);

export const travelStopCategorySchema = z.enum([
  "sight",
  "hot",
  "info",
  "food",
  "hotel",
  "supply",
  "transport",
  "camp",
  "memo",
]);

export const travelPlanStopSchema = z.object({
  stopId: z.string(),
  poiId: z.string().optional(),
  name: z.string(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  category: travelStopCategorySchema,
  tags: z.array(z.string()),
  distanceFromPrevKm: z.number().nonnegative().optional(),
  note: z.string().optional(),
});

export const travelDateDisplaySchema = z.object({
  day: z.number().int().positive(),
  month: z.string(),
  weekday: z.string(),
});

export const travelTimelineBadgeKindSchema = z.enum([
  "free",
  "paid",
  "warn",
  "hot",
  "info",
]);

export const travelTimelineBadgeSchema = z.object({
  kind: travelTimelineBadgeKindSchema,
  text: z.string(),
});

export const travelTimelineLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

export const travelTimelineItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  type: travelStopCategorySchema,
  bulletColor: z.enum(["blue", "purple", "amber", "yellow"]),
  badge: travelTimelineBadgeSchema.optional(),
  description: z.string().optional(),
  timeWindow: z.string().optional(),
  links: z.array(travelTimelineLinkSchema).optional(),
  poiId: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

export const travelTimelineSectionSchema = z.object({
  sectionId: z.string(),
  label: z.string(),
  items: z.array(travelTimelineItemSchema),
});

export const travelCampInfoSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  note: z.string(),
});

export const travelPlanDaySchema = z.object({
  dayId: z.string(),
  dayIndex: z.number().int().positive(),
  date: yyyyMmDdSchema,
  dateDisplay: travelDateDisplaySchema,
  regionLabel: z.string(),
  title: z.string(),
  driveText: z.string(),
  distanceKm: z.number().nonnegative().optional(),
  mapRouteUrl: z.string().url().optional(),
  timelineSections: z.array(travelTimelineSectionSchema),
  camp: travelCampInfoSchema.optional(),
  stops: z.array(travelPlanStopSchema),
  note: z.string().optional(),
});

export const travelMemoLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  note: z.string().optional(),
});

export const travelSupplyItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  note: z.string().optional(),
  region: regionSchema.optional(),
});

export const travelReminderLevelSchema = z.enum(["info", "warning", "critical"]);

export const travelReminderItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  level: travelReminderLevelSchema,
});

export const travelPlanSchema = z.object({
  planId: z.string(),
  title: z.string(),
  titleEn: z.string().optional(),
  startDate: yyyyMmDdSchema,
  endDate: yyyyMmDdSchema,
  status: travelPlanStatusSchema,
  days: z.array(travelPlanDaySchema),
  memoLinks: z.array(travelMemoLinkSchema),
  supplies: z.array(travelSupplyItemSchema),
  reminders: z.array(travelReminderItemSchema),
  updatedAt: z.string().datetime(),
});

export const travelPlanCollectionSchema = z.object({
  generatedAt: z.string().datetime(),
  plans: z.array(travelPlanSchema),
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
