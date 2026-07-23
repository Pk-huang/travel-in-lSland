export type Region = "south" | "west" | "north" | "east" | "all";

export type LightingPresetId = "realistic" | "cinematic" | "seasonal";

export type TerrainDetailLevel = 256 | 512 | 1080;

export type LightingPreset = {
  id: LightingPresetId;
  label: string;
  skyDayColor: string;
  skyNightColor: string;
  groundDayColor: string;
  groundNightColor: string;
  sunDayColor: string;
  sunNightColor: string;
  ambientBaseIntensity: number;
  ambientDaylightBoost: number;
  sunBaseIntensity: number;
  sunDaylightBoost: number;
  sunOrbitRadius: number;
  sunBaseHeight: number;
  sunDaylightHeightBoost: number;
};

export type AlertLevel = "low" | "medium" | "high";
export type RoadStatus = "open" | "caution" | "closed";
export type CacheState = "hit" | "miss" | "stale";

export type GeoPoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevationM?: number;
  kind: "poi" | "weather-station" | "road-segment";
};

export type PoiCameraView = {
  distance: number;
  polarAngle: number;
  azimuthAngle: number;
};

export type PointOfInterest = {
  id: string;
  label: string;
  labelZhHant: string;
  imageUrl: string;
  imageGallery: Array<{
    imageUrl: string;
    alt: string;
  }>;
  description: string;
  descriptionShort: string;
  descriptionLong: string;
  lat: number;
  lon: number;
  category: string;
  tags: string[];
  visitRegion?: Region;
  bestSeason: string[];
  sources: {
    wikidataUrl: string;
    wikipediaUrl: string;
    osmReference: string;
  };
  mediaAttribution: {
    sourcePageUrl: string;
    author: string;
    licenseName: string;
    licenseUrl: string;
    attributionText: string;
  };
  travel: {
    access: string;
    parking: string;
    publicTransport: string;
    driveTimeFromReykjavik: string;
  };
  cautionNotes: string[];
  cameraView: PoiCameraView;
};

export type PoiSeedSyncStatus = "fresh" | "stale" | "failed";

export type PoiSeedRecord = {
  poiId: string;
  slug: string;
  featured: boolean;
  name: {
    zhHant: string;
    en: string;
  };
  location: {
    lat: number;
    lon: number;
  };
  displayLocation?: {
    lat: number;
    lon: number;
  };
  category: string;
  description: {
    short: string;
    medium: string;
    long: string;
  };
  media: {
    heroImageUrl: string;
    gallery?: Array<{
      imageUrl: string;
      alt: string;
    }>;
    sourcePageUrl: string;
    author: string;
    licenseName: string;
    licenseUrl: string;
    attributionText: string;
  };
  sources: {
    wikidataId: string;
    wikidataUrl: string;
    wikipediaUrl: string;
    commonsCategory: string;
    osmReference: string;
  };
  sync: {
    sourcePriority: string[];
    lastSyncedAt: string;
    staleAfter: string;
    syncStatus: PoiSeedSyncStatus;
    syncError: string | null;
  };
  tags?: string[];
  visit?: {
    region: Region;
    bestSeason: string[];
  };
  travel?: {
    access: string;
    parking: string;
    publicTransport: string;
    driveTimeFromReykjavik: string;
  };
  cautionNotes?: string[];
  cameraView?: PoiCameraView;
};

export type WeatherConditions = {
  source: "vedur";
  timestamp: string;
  lat: number;
  lon: number;
  temperatureC: number;
  windSpeedMs: number;
  visibilityKm?: number;
  precipitationMm?: number;
  alertLevel: AlertLevel;
};

export type RoadSegment = {
  source: "road";
  segmentId: string;
  name: string;
  status: RoadStatus;
  reason?: string;
  updatedAt: string;
  geometry: Array<[number, number]>;
};

export type ItineraryItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  waypoint: {
    lat: number;
    lon: number;
  };
  riskNote?: string;
};

export type TravelPlanStatus = "draft" | "active" | "completed" | "archived";

export type TravelStopCategory =
  | "sight"
  | "hot"
  | "info"
  | "food"
  | "hotel"
  | "supply"
  | "transport"
  | "camp"
  | "memo";

export type TravelPlanStop = {
  stopId: string;
  poiId?: string;
  name: string;
  lat?: number;
  lon?: number;
  category: TravelStopCategory;
  tags: string[];
  distanceFromPrevKm?: number;
  note?: string;
};

export type TravelDateDisplay = {
  day: number;
  month: string;
  weekday: string;
};

export type TravelTimelineBadgeKind =
  | "free"
  | "paid"
  | "warn"
  | "hot"
  | "info";

export type TravelTimelineBadge = {
  kind: TravelTimelineBadgeKind;
  text: string;
};

export type TravelTimelineLink = {
  label: string;
  url: string;
};

export type TravelTimelineItem = {
  itemId: string;
  name: string;
  type: TravelStopCategory;
  bulletColor: "blue" | "purple" | "amber" | "yellow";
  badge?: TravelTimelineBadge;
  description?: string;
  timeWindow?: string;
  links?: TravelTimelineLink[];
  poiId?: string;
  lat?: number;
  lon?: number;
};

export type TravelTimelineSection = {
  sectionId: string;
  label: string;
  items: TravelTimelineItem[];
};

export type TravelCampInfo = {
  name: string;
  url: string;
  note: string;
};

export type TravelPlanDay = {
  dayId: string;
  dayIndex: number;
  date: string;
  dateDisplay: TravelDateDisplay;
  regionLabel: string;
  title: string;
  driveText: string;
  distanceKm?: number;
  mapRouteUrl?: string;
  timelineSections: TravelTimelineSection[];
  camp?: TravelCampInfo;
  stops: TravelPlanStop[];
  note?: string;
};

export type TravelMemoLink = {
  id: string;
  title: string;
  url: string;
  note?: string;
};

export type TravelSupplyItem = {
  id: string;
  title: string;
  note?: string;
  region?: Region;
};

export type TravelReminderLevel = "info" | "warning" | "critical";

export type TravelReminderItem = {
  id: string;
  title: string;
  detail?: string;
  level: TravelReminderLevel;
};

export type TravelPlan = {
  planId: string;
  title: string;
  titleEn?: string;
  startDate: string;
  endDate: string;
  status: TravelPlanStatus;
  days: TravelPlanDay[];
  memoLinks: TravelMemoLink[];
  supplies: TravelSupplyItem[];
  reminders: TravelReminderItem[];
  updatedAt: string;
};

export type TravelPlanCollection = {
  generatedAt: string;
  plans: TravelPlan[];
};

export type AuroraConditions = {
  source: "noaa";
  observationTime: string;
  forecastTime: string;
  coordinates: Array<[number, number, number]>;
};

export type SunTimes = {
  source: "sunrise-sunset";
  date: string;
  tzid: string;
  lat: number;
  lon: number;
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLengthSeconds: number;
  civilTwilightBegin: string;
  civilTwilightEnd: string;
  nauticalTwilightBegin: string;
  nauticalTwilightEnd: string;
  astronomicalTwilightBegin: string;
  astronomicalTwilightEnd: string;
};

export type SunTimesResponse = {
  generatedAt: string;
  sun: SunTimes;
};

export type SunTimesBoundary = {
  previous: SunTimes | null;
  current: SunTimes | null;
  next: SunTimes | null;
};

export type SunLightingBoundary = {
  previousSunsetTs: number | null;
  sunriseTs: number;
  sunsetTs: number;
  nextSunriseTs: number | null;
  civilBeginTs: number | null;
  civilEndTs: number | null;
};

export type SunDayType = "normal" | "polar_day" | "polar_night";
export type SunDayTypeConfidence = "low" | "medium" | "high";

export type SunLightingModel = {
  source: "sun" | "fallback";
  tzid: string;
  boundary: SunLightingBoundary | null;
  dayType: SunDayType;
  dayTypeConfidence?: SunDayTypeConfidence;
  dayTypeReason?: string;
  fallbackReason?: string;
};

export type IcelandStatusMeta = {
  region: Region;
  generatedAt: string;
  cache: CacheState;
  fallback: boolean;
};

export type IcelandStatusSummary = {
  riskScore: number;
  highRiskSegments: number;
};

export type IcelandStatusResponse = {
  meta: IcelandStatusMeta;
  weather: WeatherConditions[];
  roads: RoadSegment[];
  aurora: AuroraConditions[];
  sun?: SunTimes | null;
  sunBoundary?: SunTimesBoundary | null;
  sunModel?: SunLightingModel;
  summary: IcelandStatusSummary;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fallback: boolean;
  };
};
