export type SpotLodZoneConfig = {
  radiusKm: number;
  falloffKm: number;
};

const DEFAULT_SPOT_LOD_ZONE_CONFIG: SpotLodZoneConfig = {
  radiusKm: 2.4,
  falloffKm: 1.2,
};

const SPOT_LOD_ZONE_CONFIG_BY_POI_ID: Record<string, SpotLodZoneConfig> = {
  "thingvellir-rift": {
    radiusKm: 2.2,
    falloffKm: 1.1,
  },
  "jokulsarlon-glacier": {
    radiusKm: 2.8,
    falloffKm: 1.4,
  },
};

export function getSpotLodZoneConfigByPoiId(poiId: string | null): SpotLodZoneConfig {
  if (!poiId) return DEFAULT_SPOT_LOD_ZONE_CONFIG;
  return SPOT_LOD_ZONE_CONFIG_BY_POI_ID[poiId] ?? DEFAULT_SPOT_LOD_ZONE_CONFIG;
}
