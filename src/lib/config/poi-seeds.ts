import type { PoiSeedRecord } from "@/src/types";

/**
 * 30 筆景點種子池：
 * - featured=true 的前 10 筆供前台首頁與 demo 使用
 * - 全部 30 筆供後台同步與備援快取使用
 */
export const FEATURED_POI_IDS: string[] = [
  "thingvellir-national-park",
  "gullfoss",
  "geysir-geothermal-area",
  "seljalandsfoss",
  "skogafoss",
  "reynisfjara-black-sand-beach",
  "jokulsarlon-glacier-lagoon",
  "diamond-beach",
  "kirkjufell",
  "blue-lagoon",
];

const DEFAULT_SYNC = {
  sourcePriority: ["wikidata", "commons", "osm"],
  lastSyncedAt: "2026-07-20T00:00:00.000Z",
  staleAfter: "2026-07-27T00:00:00.000Z",
  syncStatus: "fresh" as const,
  syncError: null,
};

const DEFAULT_MEDIA = {
  heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Thingvellir.jpg",
  sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Thingvellir.jpg",
  author: "Andreas Tille",
  licenseName: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  attributionText: "Image: Andreas Tille, CC BY-SA 4.0, via Wikimedia Commons",
};

function createSeed(
  poiId: string,
  zhHant: string,
  en: string,
  lat: number,
  lon: number,
  category: string,
  region: "south" | "west" | "north" | "east",
  wikidataId: string,
): PoiSeedRecord {
  const slug = poiId;
  const featured = FEATURED_POI_IDS.includes(poiId);
  const wikipediaSlug = encodeURIComponent(en.replace(/\s+/g, "_"));

  return {
    poiId,
    slug,
    featured,
    name: {
      zhHant,
      en,
    },
    location: {
      lat,
      lon,
    },
    category,
    description: {
      short: `${zhHant}是冰島知名景點，適合在地圖模式做快速導覽。`,
      medium: `${zhHant}位於冰島${region === "south" ? "南部" : region === "west" ? "西部" : region === "north" ? "北部" : "東部"}，具備高辨識度地貌與旅遊價值，適合作為 demo 亮點。`,
      long: `${zhHant}（${en}）是冰島代表性景點之一，常見於行程規劃與地圖導覽。此資料建議以 Wikidata 為主來源，搭配 Wikimedia Commons 圖像授權欄位與 OSM 地理參考，以便在 API 異常時仍可從本地快取穩定提供內容。`,
    },
    media: DEFAULT_MEDIA,
    sources: {
      wikidataId,
      wikidataUrl: `https://www.wikidata.org/wiki/${wikidataId}`,
      wikipediaUrl: `https://en.wikipedia.org/wiki/${wikipediaSlug}`,
      commonsCategory: en,
      osmReference: `search:${en},Iceland`,
    },
    sync: DEFAULT_SYNC,
    tags: [category, "iceland", "demo"],
    visit: {
      region,
      bestSeason: ["summer", "winter"],
    },
    cameraView: {
      distance: 4,
      polarAngle: 1.05,
      azimuthAngle: 0.2,
    },
  };
}

export const POI_SEED_POOL: PoiSeedRecord[] = [
  createSeed("thingvellir-national-park", "辛格韋德利國家公園", "Thingvellir National Park", 64.2581, -21.125, "national_park", "south", "Q107370"),
  createSeed("gullfoss", "黃金瀑布", "Gullfoss", 64.3271, -20.1218, "waterfall", "south", "Q165167"),
  createSeed("geysir-geothermal-area", "蓋歇爾地熱區", "Geysir Geothermal Area", 64.3104, -20.3024, "geothermal", "south", "Q211983"),
  createSeed("seljalandsfoss", "塞里雅蘭瀑布", "Seljalandsfoss", 63.6156, -19.991, "waterfall", "south", "Q1136324"),
  createSeed("skogafoss", "斯科加瀑布", "Skogafoss", 63.5321, -19.5114, "waterfall", "south", "Q828676"),
  createSeed("reynisfjara-black-sand-beach", "雷尼斯黑沙灘", "Reynisfjara Black Sand Beach", 63.4042, -19.0452, "beach", "south", "Q7318086"),
  createSeed("jokulsarlon-glacier-lagoon", "傑古沙龍冰河湖", "Jokulsarlon Glacier Lagoon", 64.0485, -16.1794, "glacier_lagoon", "east", "Q936783"),
  createSeed("diamond-beach", "鑽石沙灘", "Diamond Beach", 64.0377, -16.1775, "beach", "east", "Q116702514"),
  createSeed("kirkjufell", "教會山", "Kirkjufell", 64.9419, -23.3065, "mountain", "west", "Q803421"),
  createSeed("blue-lagoon", "藍湖", "Blue Lagoon", 63.8792, -22.4458, "geothermal_spa", "south", "Q910679"),
  createSeed("hallgrimskirkja", "哈爾格林姆教堂", "Hallgrimskirkja", 64.1417, -21.9266, "landmark", "south", "Q309340"),
  createSeed("harpa-concert-hall", "哈帕音樂廳", "Harpa Concert Hall", 64.1501, -21.9323, "landmark", "south", "Q567000"),
  createSeed("sun-voyager", "太陽航海者", "Sun Voyager", 64.1475, -21.9226, "sculpture", "south", "Q765647"),
  createSeed("perlan", "珍珠樓", "Perlan", 64.129, -21.9185, "museum", "south", "Q1434299"),
  createSeed("dettifoss", "黛提瀑布", "Dettifoss", 65.8145, -16.3846, "waterfall", "north", "Q1193018"),
  createSeed("godafoss", "眾神瀑布", "Godafoss", 65.6828, -17.5502, "waterfall", "north", "Q849636"),
  createSeed("hraunfossar", "熔岩瀑布", "Hraunfossar", 64.7004, -20.9738, "waterfall", "west", "Q1232478"),
  createSeed("dynjandi", "丁堅地瀑布", "Dynjandi", 65.732, -23.1991, "waterfall", "west", "Q1187459"),
  createSeed("svartifoss", "黑瀑布", "Svartifoss", 64.0266, -16.9752, "waterfall", "east", "Q1549465"),
  createSeed("fjadrargljufur-canyon", "費德拉格尤富爾峽谷", "Fjadrargljufur Canyon", 63.7713, -18.1717, "canyon", "south", "Q5449952"),
  createSeed("snaefellsjokull-national-park", "斯奈山半島國家公園", "Snaefellsjokull National Park", 64.8, -23.78, "national_park", "west", "Q907269"),
  createSeed("vatnajokull-national-park", "瓦特納冰川國家公園", "Vatnajokull National Park", 64.422, -16.79, "national_park", "east", "Q1287611"),
  createSeed("landmannalaugar", "蘭德曼納勞卡", "Landmannalaugar", 63.9847, -19.067, "highland", "south", "Q1798784"),
  createSeed("dyrholaey", "迪霍拉里", "Dyrholaey", 63.3993, -19.1262, "cliff", "south", "Q1262286"),
  createSeed("vestrahorn", "維斯特拉霍恩山", "Vestrahorn", 64.2549, -14.9756, "mountain", "east", "Q3556967"),
  createSeed("hvitserkur", "白袍怪石", "Hvitserkur", 65.6062, -20.6353, "sea_stack", "north", "Q852885"),
  createSeed("myvatn", "米湖", "Myvatn", 65.6056, -16.9969, "lake", "north", "Q211886"),
  createSeed("namafjall-hverir", "納馬山地熱區", "Namafjall Hverir", 65.6412, -16.8095, "geothermal", "north", "Q6962800"),
  createSeed("krafla", "克拉夫拉火山", "Krafla", 65.715, -16.728, "volcano", "north", "Q841596"),
  createSeed("askja", "阿斯恰火山", "Askja", 65.05, -16.75, "volcano", "north", "Q217013"),
];
