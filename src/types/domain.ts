export type Region = "south" | "west" | "north" | "east" | "all";

export type LightingPresetId = "realistic" | "cinematic" | "seasonal";

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

export type AuroraConditions = {
  source: "noaa";
  observationTime: string;
  forecastTime: string;
  coordinates: Array<[number, number, number]>;
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
  summary: IcelandStatusSummary;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fallback: boolean;
  };
};
