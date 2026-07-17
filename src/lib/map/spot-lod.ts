import { getPointOfInterestById } from "@/src/lib/config/poi";
import { getSpotLodZoneConfigByPoiId } from "@/src/lib/config/spot-lod";
import { lonLatToSceneXZ } from "@/src/lib/map/coords";

export type SpotLodFocusZone = {
  poiId: string;
  centerX: number;
  centerZ: number;
  radiusKm: number;
  falloffKm: number;
};

type BuildSpotLodFocusZoneInput = {
  activePoiId: string | null;
  poiFocusEnabled: boolean;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function buildSpotLodFocusZone({
  activePoiId,
  poiFocusEnabled,
}: BuildSpotLodFocusZoneInput): SpotLodFocusZone | null {
  if (!poiFocusEnabled || !activePoiId) return null;

  const poi = getPointOfInterestById(activePoiId);
  if (!poi) return null;

  const { x, z } = lonLatToSceneXZ(poi.lon, poi.lat);
  const zoneConfig = getSpotLodZoneConfigByPoiId(poi.id);

  return {
    poiId: poi.id,
    centerX: x,
    centerZ: z,
    radiusKm: zoneConfig.radiusKm,
    falloffKm: zoneConfig.falloffKm,
  };
}

export function computeSpotLodInfluence(distanceKm: number, focusZone: SpotLodFocusZone): number {
  if (distanceKm <= focusZone.radiusKm) return 1;

  const edge0 = focusZone.radiusKm;
  const edge1 = focusZone.radiusKm + focusZone.falloffKm;
  if (distanceKm >= edge1) return 0;

  return 1 - smoothstep(edge0, edge1, distanceKm);
}
