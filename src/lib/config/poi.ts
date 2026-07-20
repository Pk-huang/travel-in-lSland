import { FEATURED_POI_IDS, POI_SEED_POOL } from "@/src/lib/config/poi-seeds";
import type { PoiSeedRecord, PointOfInterest } from "@/src/types";

/**
 * 固定景點清單：先供景點模式與壓測腳本共用。
 * 後續 UI/相機轉場都只讀這份設定，不把鏡位參數散落在各元件。
 */
function toPointOfInterest(seed: PoiSeedRecord): PointOfInterest {
  return {
    id: seed.poiId,
    label: seed.name.en,
    imageUrl: seed.media.heroImageUrl,
    description: seed.description.medium,
    lat: seed.location.lat,
    lon: seed.location.lon,
    cameraView: seed.cameraView ?? {
      distance: 4,
      polarAngle: 1.05,
      azimuthAngle: 0.2,
    },
  };
}

/**
 * 本地備援景點清單（featured 10 筆），當 /data/pois 不可用時前台可直接回退。
 */
export const POINTS_OF_INTEREST: PointOfInterest[] = POI_SEED_POOL
  .filter((seed) => FEATURED_POI_IDS.includes(seed.poiId))
  .map(toPointOfInterest);

export function findPointOfInterestById(
  points: PointOfInterest[],
  id: string | null,
): PointOfInterest | null {
  if (!id) return null;
  return points.find((poi) => poi.id === id) ?? null;
}

export function getPointOfInterestById(id: string | null): PointOfInterest | null {
  return findPointOfInterestById(POINTS_OF_INTEREST, id);
}