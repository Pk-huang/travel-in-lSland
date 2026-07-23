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

const COMMONS_LICENSE_URL = "https://commons.wikimedia.org/wiki/Commons:Licensing";

function commonsRedirectUrl(fileTitle: string) {
  const encodedTitle = encodeURIComponent(fileTitle.replace(/^File:/, ""));
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodedTitle}`;
}

function commonsPageUrl(fileTitle: string) {
  return `https://commons.wikimedia.org/wiki/${encodeURI(fileTitle.replace(/ /g, "_"))}`;
}

function createCommonsMedia(
  heroFileTitle: string,
  galleryFileTitles: string[],
  poiLabel: string,
) {
  return {
    heroImageUrl: commonsRedirectUrl(heroFileTitle),
    gallery: galleryFileTitles.map((fileTitle, index) => ({
      imageUrl: commonsRedirectUrl(fileTitle),
      alt: `${poiLabel} gallery ${index + 1}`,
    })),
    sourcePageUrl: commonsPageUrl(heroFileTitle),
    author: "See Wikimedia Commons source pages",
    licenseName: "Varies by image (Wikimedia Commons)",
    licenseUrl: COMMONS_LICENSE_URL,
    attributionText:
      "Images via Wikimedia Commons; see each image source page for specific author and license details.",
  };
}

const FEATURED_MEDIA_OVERRIDES: Partial<Record<string, typeof DEFAULT_MEDIA>> = {
  "thingvellir-national-park": createCommonsMedia(
    'File:"Þingvellir in Iceland" - Apr 2015.jpg',
    [
      'File:"Þingvellir in Iceland" - Apr 2015.jpg',
      'File:World Heritage plaque at Þingvellir National Park.jpg',
    ],
    "Thingvellir National Park",
  ),
  gullfoss: createCommonsMedia(
    "File:Iceland - 2017-02-22 - Gullfoss - 3684.jpg",
    [
      "File:Iceland - 2017-02-22 - Gullfoss - 3684.jpg",
      "File:Gullfoss from the Air (cropped).jpg",
    ],
    "Gullfoss",
  ),
  "geysir-geothermal-area": createCommonsMedia(
    "File:Erupting geysir.jpg",
    [
      "File:Erupting geysir.jpg",
      "File:Great Geysir (4).jpg",
      "File:Gran Geysir, Área geotérmica de Geysir, Suðurland, Islandia, 2014-08-16, DD 107.JPG",
    ],
    "Geysir Geothermal Area",
  ),
  seljalandsfoss: createCommonsMedia(
    "File:Seljalandsfoss, Suðurland, Islandia, 2014-08-16, DD 201-203 HDR.JPG",
    [
      "File:Seljalandsfoss, Suðurland, Islandia, 2014-08-16, DD 201-203 HDR.JPG",
      "File:Icland Seljalandsfoss Luftbild Sept 2019 1.jpg",
      "File:Premises of Seljalandsfoss 25.jpg",
    ],
    "Seljalandsfoss",
  ),
  skogafoss: createCommonsMedia(
    "File:Skógafoss - Front view.jpg",
    [
      "File:Skógafoss - Front view.jpg",
      "File:Skógafoss - Top.jpg",
      "File:Skogafoss At Night (167821181).jpeg",
      "File:Skogafoss in winter aerial view.jpg",
    ],
    "Skogafoss",
  ),
  "reynisfjara-black-sand-beach": createCommonsMedia(
    "File:Reynisfjara Beach Looking West Towards Dyrhólaey.jpg",
    [
      "File:Reynisfjara Beach Looking West Towards Dyrhólaey.jpg",
      "File:Hálsanefshellir Cave at Reynisfjara Beach.jpg",
      "File:Eyjafjallajökull Volcano seen from Reynisfjara Beach.jpg",
    ],
    "Reynisfjara Black Sand Beach",
  ),
  "jokulsarlon-glacier-lagoon": createCommonsMedia(
    "File:Jokulsarlon Panorama.jpg",
    [
      "File:Jokulsarlon Panorama.jpg",
      "File:Jökulsárlón 002.jpg",
      "File:An iceberg in Jokulsarlon.jpg",
      "File:Vatnajökull glacier.jpg",
    ],
    "Jokulsarlon Glacier Lagoon",
  ),
  "diamond-beach": createCommonsMedia(
    "File:IceBlockNearJoekullsarlon.jpg",
    [
      "File:IceBlockNearJoekullsarlon.jpg",
      "File:Jökulsárlón .jpg",
    ],
    "Diamond Beach",
  ),
  kirkjufell: createCommonsMedia(
    "File:2008-05-17 06 Kirkjufell at Grundarfjörður.jpg",
    [
      "File:2008-05-17 06 Kirkjufell at Grundarfjörður.jpg",
      "File:1 grundarfjörður 2017 aerial pano.jpg",
      "File:Asa-steinars-0163.jpg",
    ],
    "Kirkjufell",
  ),
  "blue-lagoon": createCommonsMedia(
    "File:BlueLagoon Noface.jpg",
    [
      "File:BlueLagoon Noface.jpg",
      "File:Blue Lagoon Main Building.JPG",
    ],
    "Blue Lagoon",
  ),
};

const DEFAULT_MEDIA = {
  heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Thingvellir.jpg",
  gallery: [
    {
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Thingvellir.jpg",
      alt: "Thingvellir landscape",
    },
  ],
  sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Thingvellir.jpg",
  author: "Andreas Tille",
  licenseName: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  attributionText: "Image: Andreas Tille, CC BY-SA 4.0, via Wikimedia Commons",
};

const FEATURED_TRAVEL_OVERRIDES: Partial<Record<string, PoiSeedRecord["travel"]>> = {
  "thingvellir-national-park": {
    access: "適合從雷克雅維克自駕走 Golden Circle 首段進入，沿 36 號公路可直達主要遊客中心。",
    parking: "遊客中心與觀景區周邊有正式停車場，旺季上午中後段較容易壅塞。",
    publicTransport: "大眾運輸班次有限，通常以 Golden Circle 一日團或自駕最方便。",
    driveTimeFromReykjavik: "約 45 分鐘至 1 小時。",
  },
  gullfoss: {
    access: "通常與 Geysir 串成 Golden Circle 行程，自駕可經 35 號公路前往。",
    parking: "瀑布上方設有停車區與步道入口，冬季地面可能結冰濕滑。",
    publicTransport: "多仰賴一日團或包車，大眾交通直達選項不多。",
    driveTimeFromReykjavik: "約 1 小時 45 分到 2 小時。",
  },
  "geysir-geothermal-area": {
    access: "位於 Golden Circle 中段，適合與 Þingvellir、Gullfoss 同日安排。",
    parking: "地熱區旁有大型停車場與服務區，但熱門時段人潮密集。",
    publicTransport: "以旅遊巴士與自駕為主，固定公車並不便利。",
    driveTimeFromReykjavik: "約 1 小時 30 分到 1 小時 45 分。",
  },
  seljalandsfoss: {
    access: "位於冰島南岸 1 號公路旁，適合南岸一日或兩日行程停靠。",
    parking: "瀑布前設有停車區，旺季常需步行一小段；部分時段可能需停車付費。",
    publicTransport: "大眾運輸不算直覺，通常建議跟團或自駕。",
    driveTimeFromReykjavik: "約 2 小時。",
  },
  skogafoss: {
    access: "沿南岸 1 號公路繼續向東即可抵達，常與 Seljalandsfoss 同日安排。",
    parking: "停車方便，但靠近瀑布的觀景區水氣重、風大，建議預留換裝與收納防水用品空間。",
    publicTransport: "可搭配南岸巴士團；自行搭公車較受班次限制。",
    driveTimeFromReykjavik: "約 2 小時 15 分到 2 小時 30 分。",
  },
  "reynisfjara-black-sand-beach": {
    access: "從 Vik 附近沿支線即可抵達，是南岸自駕熱門停靠點。",
    parking: "海灘入口設有停車區，但尖峰時段車位緊張，需提早抵達。",
    publicTransport: "多以南岸巴士團或自駕前往。",
    driveTimeFromReykjavik: "約 2 小時 30 分到 3 小時。",
  },
  "jokulsarlon-glacier-lagoon": {
    access: "位於東南岸 1 號公路邊，適合安排過夜後前往，不建議雷克雅維克單日來回。",
    parking: "環湖與橋邊都有停車區，旺季遊客多，行李與攝影器材需留意防風。",
    publicTransport: "通常以自駕、長途巴士團或多日行程前往。",
    driveTimeFromReykjavik: "約 5 小時到 6 小時。",
  },
  "diamond-beach": {
    access: "就在 Jökulsárlón 橋口對海側，通常與冰河湖一起步行或短程移動參觀。",
    parking: "可使用冰河湖周邊停車區，再步行到海灘側。",
    publicTransport: "多與 Jökulsárlón 同行程安排，大眾運輸班次有限。",
    driveTimeFromReykjavik: "約 5 小時到 6 小時。",
  },
  kirkjufell: {
    access: "位於斯奈山半島北岸，通常與 Grundarfjörður、Kirkjufellsfoss 一起安排。",
    parking: "拍攝經典機位時常需停在瀑布周邊指定區域，請留意路肩與私人土地標示。",
    publicTransport: "以自駕最實際，跟團則多屬斯奈山半島一日或兩日遊。",
    driveTimeFromReykjavik: "約 2.5 到 3 小時。",
  },
  "blue-lagoon": {
    access: "位於凱夫拉維克機場與雷克雅維克之間，適合安排抵達或離境當天前往。",
    parking: "園區停車動線清楚，但旺季與熱門時段預約量大，建議提早進場。",
    publicTransport: "可搭接駁巴士，自駕也很方便。",
    driveTimeFromReykjavik: "約 45 到 50 分鐘。",
  },
};

const FEATURED_CAUTION_OVERRIDES: Partial<Record<string, string[]>> = {
  "thingvellir-national-park": [
    "裂谷與岩壁邊緣落差明顯，拍照時請勿跨越保護欄。",
    "步道範圍廣，若遇強風或雨勢建議準備防水外套與保暖層。",
  ],
  gullfoss: [
    "瀑布觀景步道近水霧區容易濕滑，冬季特別需要防滑鞋。",
    "風勢大時水霧會直接打向觀景平台，請保護相機與手機。",
  ],
  "geysir-geothermal-area": [
    "嚴禁跨越地熱區圍欄，地表薄弱且高溫蒸氣具有危險性。",
    "噴發時間不固定，觀賞時請與噴口保持安全距離。",
  ],
  seljalandsfoss: [
    "繞到瀑布後方時地面濕滑且岩壁滴水，建議穿防水外套與防滑鞋。",
    "冬季後方步道可能因結冰而封閉，請依現場公告為準。",
  ],
  skogafoss: [
    "靠近瀑布正前方容易被大量水霧打濕，電子設備建議加防水保護。",
    "通往瀑布上方的階梯較多，濕滑或大風時需放慢腳步。",
  ],
  "reynisfjara-black-sand-beach": [
    "務必遠離海浪邊界，這裡的 sneaker waves 速度快且拉力強。",
    "不要背對海面拍照，也不要攀爬玄武岩柱到危險位置。",
  ],
  "jokulsarlon-glacier-lagoon": [
    "冰河湖與橋口一帶風勢強且體感溫度低，請準備保暖防風衣物。",
    "拍攝時請留意車道與遊船動線，不要停留在橋面危險區域。",
  ],
  "diamond-beach": [
    "冰塊外觀美觀但表面濕滑且易碎，請避免攀坐或追浪拍照。",
    "海浪會突然推進到冰塊區域，需與海線保持安全距離。",
  ],
  kirkjufell: [
    "若非有經驗與適當裝備，不建議自行登山；山體濕滑且曾有墜落事故。",
    "經典攝影點常鄰近溪流與濕地，腳下地形鬆軟時請留意站位。",
  ],
  "blue-lagoon": [
    "藍湖營運與開放狀態可能受雷克雅內斯半島地震與火山活動影響，出發前務必確認公告。",
    "園區入場多需預約時段，若臨時到訪可能無法現場入場。",
  ],
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
  displayLocation?: { lat: number; lon: number },
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
    displayLocation,
    category,
    description: {
      short: `${zhHant}是冰島知名景點，適合在地圖模式做快速導覽。`,
      medium: `${zhHant}位於冰島${region === "south" ? "南部" : region === "west" ? "西部" : region === "north" ? "北部" : "東部"}，具備高辨識度地貌與旅遊價值，適合作為 demo 亮點。`,
      long: `${zhHant}（${en}）是冰島代表性景點之一，常見於行程規劃與地圖導覽。此資料建議以 Wikidata 為主來源，搭配 Wikimedia Commons 圖像授權欄位與 OSM 地理參考，以便在 API 異常時仍可從本地快取穩定提供內容。`,
    },
    media: FEATURED_MEDIA_OVERRIDES[poiId] ?? DEFAULT_MEDIA,
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
    travel:
      FEATURED_TRAVEL_OVERRIDES[poiId] ?? {
        access: "建議以自駕或跟團接駁前往，沿環島公路或主要聯外道路接近景點。",
        parking: "多數熱門景點設有停車區，旺季尖峰可能需要排隊或步行一段距離。",
        publicTransport: "公車班次有限，若非首都圈景點，通常需搭配巴士團或自駕。",
        driveTimeFromReykjavik:
          region === "south"
            ? "約 1.5 至 3 小時，依南岸路況而定。"
            : region === "west"
              ? "約 2 至 3.5 小時，視西部道路條件而定。"
              : region === "north"
                ? "約 5 至 7 小時，通常需提早出發或分段住宿。"
                : "約 5 至 6.5 小時，請預留東部長途行車時間。",
      },
    cautionNotes:
      FEATURED_CAUTION_OVERRIDES[poiId] ?? [
        "冰島天氣與風況變化快，出發前請再次確認 Vedur 與道路資訊。",
        "熱門自然景點周邊常有濕滑地面、碎石步道或強風，請穿著防滑鞋並注意安全距離。",
      ],
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
  createSeed(
    "seljalandsfoss",
    "塞里雅蘭瀑布",
    "Seljalandsfoss",
    63.6156,
    -19.991,
    "waterfall",
    "south",
    "Q1136324",
    { lat: 63.6191, lon: -19.9882 },
  ),
  createSeed(
    "skogafoss",
    "斯科加瀑布",
    "Skogafoss",
    63.5321,
    -19.5114,
    "waterfall",
    "south",
    "Q828676",
    { lat: 63.5352, lon: -19.5097 },
  ),
  createSeed(
    "reynisfjara-black-sand-beach",
    "雷尼斯黑沙灘",
    "Reynisfjara Black Sand Beach",
    63.4042,
    -19.0452,
    "beach",
    "south",
    "Q7318086",
    { lat: 63.4089, lon: -19.0476 },
  ),
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
