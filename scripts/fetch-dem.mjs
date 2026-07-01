// @ts-check
/**
 * fetch-dem.mjs — 離線抓取冰島數值高程模型（DEM），生成靜態 heightmap。
 *
 * 用途（Phase 2-1b）：對冰島經緯度範圍打 N×N 格點，向 opentopodata 公開 API
 * 查每點高程（公尺），輸出成 JSON 供 Terrain 讀取，取代 sin 假高度。
 *
 * 設計：
 * - 純 Node ESM，用內建 fetch（Node 18+），不加任何相依套件。
 * - 禮貌限速：每批 100 點、每秒 1 請求（sleep 1100ms），遵守公開 API 規範。
 * - 失敗自動重試（單批最多 3 次），記錄 null 點數。
 * - **主源 / 備源**：預設主源 mapzen；若主源「整批流程」失敗，自動改用備源 aster30m 重抓。
 *   一次只實際使用一個來源，不浪費資源。
 * - 結果**落地成靜態 JSON**（public/dem/），前端執行期讀檔、不再打 API（非存記憶體）。
 * - 兩種模式：--stats 只印統計不存檔（驗證用）；預設存檔。
 *
 * 用法：
 *   node scripts/fetch-dem.mjs --grid=8 --stats           # 小網格驗證（主源 mapzen）
 *   node scripts/fetch-dem.mjs --grid=128                 # 完整存檔（mapzen，失敗 fallback aster30m）
 *   node scripts/fetch-dem.mjs --dataset=aster30m --grid=128   # 指定主源為 aster30m
 *
 * 資料源：
 *   - mapzen   ：含海底負值，適合做島嶼邊界
 *   - aster30m ：陸地為主，海面約 0
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// 冰島經緯度框（略寬，確保涵蓋全島與近海）
const BBOX = {
  latMin: 63.3,
  latMax: 66.6,
  lonMin: -24.6,
  lonMax: -13.4,
};

const API_BASE = "https://api.opentopodata.org/v1";
const POINTS_PER_REQUEST = 100; // API 上限
const SLEEP_MS = 1100; // 限速 1 req/s，多留 100ms 餘裕
const MAX_RETRY = 3;

/** 解析 CLI 參數（--key=value 或 --flag） */
function parseArgs(argv) {
  const args = { dataset: "mapzen", grid: 128, stats: false };
  for (const token of argv.slice(2)) {
    if (token === "--stats") args.stats = true;
    else if (token.startsWith("--dataset=")) args.dataset = token.split("=")[1];
    else if (token.startsWith("--grid=")) args.grid = Number(token.split("=")[1]);
  }
  return args;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 產生 grid×grid 格點（row-major：先南到北 lat，再西到東 lon）。
 * 回傳 [{ lat, lon }, ...]，長度 = grid²。
 */
function buildGridPoints(grid) {
  const points = [];
  for (let row = 0; row < grid; row++) {
    // row 0 = 最南（latMin），row grid-1 = 最北（latMax）
    const lat =
      BBOX.latMin + ((BBOX.latMax - BBOX.latMin) * row) / (grid - 1);
    for (let col = 0; col < grid; col++) {
      const lon =
        BBOX.lonMin + ((BBOX.lonMax - BBOX.lonMin) * col) / (grid - 1);
      points.push({ lat, lon });
    }
  }
  return points;
}

/** 向 API 查一批點（最多 100），回傳高程陣列（null = 無資料）。 */
async function fetchBatch(dataset, batch) {
  const locations = batch.map((p) => `${p.lat},${p.lon}`).join("|");
  const url = `${API_BASE}/${dataset}?locations=${locations}`;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== "OK") throw new Error(`API status ${json.status}`);
      return json.results.map((r) => r.elevation); // number | null
    } catch (err) {
      console.warn(`  批次重試 ${attempt}/${MAX_RETRY}：${err.message}`);
      if (attempt === MAX_RETRY) throw err;
      await sleep(SLEEP_MS * 2);
    }
  }
  return [];
}

/** 抓取指定來源的完整網格高程，回傳 { elevations, min, max, nullCount }。 */
async function fetchDataset(dataset, points, totalBatches) {
  /** @type {(number|null)[]} */
  const elevations = [];
  for (let i = 0; i < points.length; i += POINTS_PER_REQUEST) {
    const batch = points.slice(i, i + POINTS_PER_REQUEST);
    const batchIndex = i / POINTS_PER_REQUEST + 1;
    const result = await fetchBatch(dataset, batch);
    elevations.push(...result);
    process.stdout.write(`\r  進度：${batchIndex}/${totalBatches} 批`);
    if (i + POINTS_PER_REQUEST < points.length) await sleep(SLEEP_MS);
  }
  process.stdout.write("\n");

  const valid = elevations.filter((e) => e !== null);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const nullCount = elevations.length - valid.length;
  return { elevations, min, max, nullCount };
}

async function main() {
  const { dataset, grid, stats } = parseArgs(process.argv);
  const points = buildGridPoints(grid);
  const totalBatches = Math.ceil(points.length / POINTS_PER_REQUEST);

  // 主源 = CLI 指定（預設 mapzen）；備源 = aster30m（主源整批失敗才啟用）
  const primary = dataset;
  const fallback = primary === "mapzen" ? "aster30m" : "mapzen";

  let used = primary;
  let data;
  console.log(
    `抓取 DEM（主源 ${primary}）：grid=${grid}×${grid}（${points.length} 點，${totalBatches} 批）`,
  );
  try {
    data = await fetchDataset(primary, points, totalBatches);
  } catch (err) {
    console.warn(`\n主源 ${primary} 失敗：${err.message}\n改用備源 ${fallback} 重抓…`);
    used = fallback;
    data = await fetchDataset(fallback, points, totalBatches);
  }

  const { elevations, min, max, nullCount } = data;
  console.log(
    `完成（來源 ${used}）：有效 ${elevations.length - nullCount}、null ${nullCount}、高度範圍 ${min}m ~ ${max}m`,
  );

  if (stats) {
    console.log("（--stats 模式，不存檔）");
    return;
  }

  // 存檔（落地成靜態 JSON，前端執行期讀檔、不再打 API）
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outDir = join(__dirname, "..", "public", "dem");
  const outPath = join(outDir, `iceland-${used}-${grid}.json`);
  await mkdir(outDir, { recursive: true });
  await writeFile(
    outPath,
    JSON.stringify({
      dataset: used,
      grid,
      bbox: BBOX,
      min,
      max,
      nullCount,
      // null 以 min 回填，避免前端讀到 null（海底交給 SeaLevel 蓋）
      elevations: elevations.map((e) => (e === null ? min : e)),
    }),
  );
  console.log(`已存檔：${outPath}`);
}

main().catch((err) => {
  console.error("失敗：", err);
  process.exit(1);
});
