export type SpotLodZoneConfig = {
  radiusKm: number;
  falloffKm: number;
};

const DEFAULT_SPOT_LOD_ZONE_CONFIG: SpotLodZoneConfig = {
  radiusKm: 16,
  falloffKm: 7,
};

const SPOT_LOD_ZONE_CONFIG_BY_POI_ID: Record<string, SpotLodZoneConfig> = {
  "thingvellir-rift": {
    radiusKm: 14,
    falloffKm: 6,
  },
  "jokulsarlon-glacier": {
    radiusKm: 18,
    falloffKm: 8,
  },
};

export function getSpotLodZoneConfigByPoiId(poiId: string | null): SpotLodZoneConfig {
  if (!poiId) return DEFAULT_SPOT_LOD_ZONE_CONFIG;
  return SPOT_LOD_ZONE_CONFIG_BY_POI_ID[poiId] ?? DEFAULT_SPOT_LOD_ZONE_CONFIG;
}
