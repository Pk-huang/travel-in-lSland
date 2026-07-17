// @ts-check
/**
 * fetch-poi-catalog.mjs — 由景點名稱清單離線抓取座標，輸出成本地 JSON。
 *
 * 目的：先建立穩定的 POI 座標白名單，供景點模式 / Spot LOD / 壓測腳本共用。
 * 目前只抓 label + lat/lon，不處理圖片、描述與其他旅遊細節。
 *
 * 用法：
 *   node scripts/fetch-poi-catalog.mjs
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SEARCH_BASE_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_DELAY_MS = 1200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @typedef {{ id: string; label: string; query: string }} PoiSeed */

async function loadSeeds(rootDir) {
  const inputPath = join(rootDir, "fixtures", "poi-seeds.iceland.json");
  const raw = await readFile(inputPath, "utf8");
  /** @type {PoiSeed[]} */
  const seeds = JSON.parse(raw);
  return seeds;
}

async function geocodePoi(seed) {
  const url = new URL(SEARCH_BASE_URL);
  url.searchParams.set("q", seed.query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "is");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "island-poi-catalog-builder/1.0 (local development)",
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(`查無結果：${seed.query}`);
  }

  const match = results[0];
  return {
    id: seed.id,
    label: seed.label,
    lat: Number(match.lat),
    lon: Number(match.lon),
  };
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const rootDir = join(__dirname, "..");
  const outDir = join(rootDir, "public", "poi");
  const outPath = join(outDir, "iceland-pois.json");

  const seeds = await loadSeeds(rootDir);
  const pois = [];

  console.log(`抓取 POI 座標：共 ${seeds.length} 個景點`);
  for (let index = 0; index < seeds.length; index += 1) {
    const seed = seeds[index];
    console.log(`  [${index + 1}/${seeds.length}] ${seed.label}`);
    const poi = await geocodePoi(seed);
    pois.push(poi);
    if (index < seeds.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await mkdir(outDir, { recursive: true });
  await writeFile(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "nominatim-openstreetmap",
        pois,
      },
      null,
      2,
    ),
  );

  console.log(`已輸出：${outPath}`);
}

main().catch((error) => {
  console.error("失敗：", error);
  process.exit(1);
});