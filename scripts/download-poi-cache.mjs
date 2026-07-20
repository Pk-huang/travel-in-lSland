import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_PATH = path.join(process.cwd(), "fixtures", "poi-cache.downloaded.json");
const API_URL = "http://localhost:3000/data/pois?featured=false&limit=30";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(input) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "island-demo/1.0 (local-seed-sync)",
      "Api-User-Agent": "island-demo/1.0 (local-seed-sync)",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }
  return response.json();
}

async function fetchJsonWithRetry(url, retries = 4) {
  let attempt = 0;
  while (attempt <= retries) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "island-demo/1.0 (local-seed-sync)",
        "Api-User-Agent": "island-demo/1.0 (local-seed-sync)",
      },
    });

    if (response.ok) {
      return response.json();
    }

    if (response.status !== 429 || attempt === retries) {
      throw new Error(`Request failed: ${response.status} ${url}`);
    }

    const delayMs = Math.min(10000, 1500 * (2 ** attempt));
    await sleep(delayMs);
    attempt += 1;
  }

  throw new Error(`Request failed after retries: ${url}`);
}

async function fetchWikidataEntity(wikidataId) {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", wikidataId);
  url.searchParams.set("props", "labels|descriptions|claims");
  url.searchParams.set("languages", "zh-hant|en");
  url.searchParams.set("format", "json");

  const data = await fetchJsonWithRetry(url.toString());
  const entity = data?.entities?.[wikidataId];
  if (!entity) {
    return null;
  }

  const claim = entity.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  const latitude = claim?.latitude ?? null;
  const longitude = claim?.longitude ?? null;

  return {
    labelZhHant: entity.labels?.["zh-hant"]?.value ?? null,
    labelEn: entity.labels?.en?.value ?? null,
    descriptionZhHant: entity.descriptions?.["zh-hant"]?.value ?? null,
    descriptionEn: entity.descriptions?.en?.value ?? null,
    lat: latitude,
    lon: longitude,
  };
}

async function fetchCommonsMetadata(sourcePageUrl) {
  const title = sourcePageUrl.split("/").pop();
  if (!title || !title.startsWith("File:")) {
    return null;
  }

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", decodeURIComponent(title));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata");
  url.searchParams.set("format", "json");

  const data = await fetchJsonWithRetry(url.toString());
  const page = Object.values(data?.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) {
    return null;
  }

  const meta = info.extmetadata ?? {};
  return {
    imageUrl: info.url ?? null,
    descriptionUrl: info.descriptionurl ?? null,
    author: decodeHtml(meta.Artist?.value ?? ""),
    licenseName: meta.LicenseShortName?.value ?? null,
    licenseUrl: meta.LicenseUrl?.value ?? null,
    usageTerms: meta.UsageTerms?.value ?? null,
  };
}

async function main() {
  const seedPayload = await fetchJson(API_URL);
  const seeds = seedPayload.items ?? [];
  const commonsCache = new Map();

  const downloaded = [];

  for (const seed of seeds) {
    const wikidataId = seed.sources?.wikidataId;
    const sourcePageUrl = seed.media?.sourcePageUrl;

    let wikidata = null;
    let commons = null;
    let syncError = null;

    try {
      wikidata = wikidataId ? await fetchWikidataEntity(wikidataId) : null;
    } catch (error) {
      syncError = error instanceof Error ? error.message : String(error);
    }

    try {
      if (sourcePageUrl) {
        if (commonsCache.has(sourcePageUrl)) {
          commons = commonsCache.get(sourcePageUrl);
        } else {
          commons = await fetchCommonsMetadata(sourcePageUrl);
          commonsCache.set(sourcePageUrl, commons);
        }
      }
    } catch (error) {
      const commonsError = error instanceof Error ? error.message : String(error);
      syncError = syncError ? `${syncError}; ${commonsError}` : commonsError;
    }

    downloaded.push({
      poiId: seed.poiId,
      name: seed.name,
      location: seed.location,
      category: seed.category,
      sources: seed.sources,
      sync: {
        fetchedAt: new Date().toISOString(),
        sourcePriority: ["wikidata", "commons", "osm"],
        syncError,
      },
      wikidata,
      commons,
    });

    // 避免對上游造成突發流量
    await sleep(1000);
  }

  const result = {
    generatedAt: new Date().toISOString(),
    total: downloaded.length,
    items: downloaded,
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`Downloaded ${downloaded.length} POIs to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
