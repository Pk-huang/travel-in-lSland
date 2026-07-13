// @ts-check
/**
 * fetch-worldcover.mjs — 離線拉取 WorldCover 分類圖，轉成本地 class grid JSON。
 *
 * 目的：給 L0 地表著色使用真實 land cover 類別（非僅等高線規則）。
 *
 * 用法：
 *   node scripts/fetch-worldcover.mjs --grid=768
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { PNG } from "pngjs";

function parseArgs(argv) {
  const args = { grid: 768, year: 2021 };
  for (const token of argv.slice(2)) {
    if (token.startsWith("--grid=")) args.grid = Number(token.split("=")[1]);
    if (token.startsWith("--year=")) args.year = Number(token.split("=")[1]);
  }
  return args;
}

/** WorldCover 類別調色盤（RGB）。 */
const WORLDCOVER_PALETTE = [
  { id: 10, rgb: [0, 100, 0] },
  { id: 20, rgb: [255, 187, 34] },
  { id: 30, rgb: [255, 255, 76] },
  { id: 40, rgb: [240, 150, 255] },
  { id: 50, rgb: [250, 0, 0] },
  { id: 60, rgb: [180, 180, 180] },
  { id: 70, rgb: [240, 240, 240] },
  { id: 80, rgb: [0, 100, 200] },
  { id: 90, rgb: [0, 150, 160] },
  { id: 95, rgb: [0, 207, 117] },
  { id: 100, rgb: [250, 230, 160] },
];

function nearestClassId(r, g, b) {
  let best = WORLDCOVER_PALETTE[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of WORLDCOVER_PALETTE) {
    const dr = r - entry.rgb[0];
    const dg = g - entry.rgb[1];
    const db = b - entry.rgb[2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return best.id;
}

async function main() {
  const { grid, year } = parseArgs(process.argv);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const root = join(__dirname, "..");
  const demPath = join(root, "public", "dem", `iceland-mapzen-${grid}.json`);
  const demRaw = await readFile(demPath, "utf8");
  const dem = JSON.parse(demRaw);

  const { lonMin, latMin, lonMax, latMax } = dem.bbox;
  const bbox = `${latMin},${lonMin},${latMax},${lonMax}`;
  const layer = `esa-worldcover-map-10m-${year}-v2_map`;

  const wmsUrl =
    "https://titiler.terrascope.be/wms" +
    `?service=WMS&request=GetMap&version=1.3.0&crs=EPSG:4326` +
    `&layers=${layer}&styles=&format=image/png&transparent=false` +
    `&time=${year}-01-01` +
    `&bbox=${bbox}&width=${grid}&height=${grid}`;

  console.log(`下載 WorldCover WMS：${layer}, grid=${grid}`);
  const curlResult = spawnSync("curl", ["-sS", "-m", "120", wmsUrl], {
    encoding: "buffer",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (curlResult.status !== 0) {
    throw new Error(`WMS 下載失敗（curl exit ${curlResult.status}）`);
  }

  const pngBuffer = Buffer.from(curlResult.stdout);
  const png = PNG.sync.read(pngBuffer);
  if (png.width !== grid || png.height !== grid) {
    throw new Error(`WMS 尺寸不符：${png.width}x${png.height}, 預期 ${grid}x${grid}`);
  }

  const classes = new Uint8Array(grid * grid);
  const histogram = new Map();

  // WMS 圖像是北到南，轉成與本專案 DEM 一致的南到北 row-major。
  for (let y = 0; y < grid; y++) {
    const srcY = grid - 1 - y;
    for (let x = 0; x < grid; x++) {
      const srcIndex = (srcY * grid + x) * 4;
      const r = png.data[srcIndex];
      const g = png.data[srcIndex + 1];
      const b = png.data[srcIndex + 2];
      const classId = nearestClassId(r, g, b);
      classes[y * grid + x] = classId;
      histogram.set(classId, (histogram.get(classId) ?? 0) + 1);
    }
  }

  const outDir = join(root, "public", "landcover");
  await mkdir(outDir, { recursive: true });

  const pngOut = join(outDir, `iceland-worldcover-${year}-${grid}.png`);
  const jsonOut = join(outDir, `iceland-worldcover-${year}-${grid}.json`);

  await writeFile(pngOut, pngBuffer);
  await writeFile(
    jsonOut,
    JSON.stringify(
      {
        source: "esa-worldcover-wms",
        year,
        grid,
        bbox: dem.bbox,
        classes: Array.from(classes),
        histogram: Object.fromEntries([...histogram.entries()].sort((a, b) => a[0] - b[0])),
      },
      null,
      2,
    ),
  );

  console.log(`已輸出：${pngOut}`);
  console.log(`已輸出：${jsonOut}`);
}

main().catch((error) => {
  console.error("失敗：", error);
  process.exit(1);
});
