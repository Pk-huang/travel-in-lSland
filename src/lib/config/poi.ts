import { FEATURED_POI_IDS, POI_SEED_POOL } from "@/src/lib/config/poi-seeds";
import type { PoiSeedRecord, PointOfInterest } from "@/src/types";

/**
 * 固定景點清單：先供景點模式與壓測腳本共用。
 * 後續 UI/相機轉場都只讀這份設定，不把鏡位參數散落在各元件。
 */
function toPointOfInterest(seed: PoiSeedRecord): PointOfInterest {
  const displayLat = seed.displayLocation?.lat ?? seed.location.lat;
  const displayLon = seed.displayLocation?.lon ?? seed.location.lon;
  const gallery = seed.media.gallery ?? [
    {
      imageUrl: seed.media.heroImageUrl,
      alt: `${seed.name.en} hero`,
    },
  ];

  return {
    id: seed.poiId,
    label: seed.name.en,
    labelZhHant: seed.name.zhHant,
    imageUrl: seed.media.heroImageUrl,
    imageGallery: gallery,
    description: seed.description.medium,
    descriptionShort: seed.description.short,
    descriptionLong: seed.description.long,
    lat: displayLat,
    lon: displayLon,
    category: seed.category,
    tags: seed.tags ?? [],
    visitRegion: seed.visit?.region,
    bestSeason: seed.visit?.bestSeason ?? [],
    sources: {
      wikidataUrl: seed.sources.wikidataUrl,
      wikipediaUrl: seed.sources.wikipediaUrl,
      osmReference: seed.sources.osmReference,
    },
    mediaAttribution: {
      sourcePageUrl: seed.media.sourcePageUrl,
      author: seed.media.author,
      licenseName: seed.media.licenseName,
      licenseUrl: seed.media.licenseUrl,
      attributionText: seed.media.attributionText,
    },
    travel: seed.travel ?? {
      access: "建議自駕前往，依地區道路與天候預留彈性時間。",
      parking: "以現地停車場或遊客中心指示為準；旺季需提早抵達。",
      publicTransport: "大眾運輸班次有限，通常需搭配當地一日遊或接駁安排。",
      driveTimeFromReykjavik: "請依當日路況與季節天候預估行車時間。",
    },
    cautionNotes: seed.cautionNotes ?? [
      "出發前先確認當地天氣與道路狀況。",
      "高風、濕滑與海岸浪況可能快速變化，請遵循現場標示。",
    ],
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