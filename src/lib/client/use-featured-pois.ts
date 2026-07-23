"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { POINTS_OF_INTEREST } from "@/src/lib/config/poi";
import type { ApiErrorResponse, PointOfInterest } from "@/src/types";

type PoiApiItem = {
  poiId: string;
  name: {
    zhHant: string;
    en: string;
  };
  location: {
    lat: number;
    lon: number;
  };
  displayLocation?: {
    lat: number;
    lon: number;
  };
  description: {
    short: string;
    medium: string;
    long: string;
  };
  media: {
    heroImageUrl: string;
    gallery?: Array<{
      imageUrl: string;
      alt: string;
    }>;
    sourcePageUrl: string;
    author: string;
    licenseName: string;
    licenseUrl: string;
    attributionText: string;
  };
  category: string;
  tags?: string[];
  visit?: {
    region: PointOfInterest["visitRegion"];
    bestSeason: string[];
  };
  travel?: PointOfInterest["travel"];
  cautionNotes?: string[];
  sources: {
    wikidataUrl: string;
    wikipediaUrl: string;
    osmReference: string;
  };
  cameraView?: {
    distance: number;
    polarAngle: number;
    azimuthAngle: number;
  };
};

type PoisApiResponse = {
  items: PoiApiItem[];
};

export type FeaturedPoisState = {
  points: PointOfInterest[];
  loading: boolean;
  error: string | null;
  source: "api" | "fallback";
  refetch: () => void;
};

function isErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiErrorResponse).error?.message === "string"
  );
}

function mapApiItemToPoint(item: PoiApiItem): PointOfInterest {
  const displayLat = item.displayLocation?.lat ?? item.location.lat;
  const displayLon = item.displayLocation?.lon ?? item.location.lon;
  const gallery = item.media.gallery ?? [
    {
      imageUrl: item.media.heroImageUrl,
      alt: `${item.name.en} hero`,
    },
  ];

  return {
    id: item.poiId,
    label: item.name.en,
    labelZhHant: item.name.zhHant,
    imageUrl: item.media.heroImageUrl,
    imageGallery: gallery,
    description: item.description.medium,
    descriptionShort: item.description.short,
    descriptionLong: item.description.long,
    lat: displayLat,
    lon: displayLon,
    category: item.category,
    tags: item.tags ?? [],
    visitRegion: item.visit?.region,
    bestSeason: item.visit?.bestSeason ?? [],
    sources: {
      wikidataUrl: item.sources.wikidataUrl,
      wikipediaUrl: item.sources.wikipediaUrl,
      osmReference: item.sources.osmReference,
    },
    mediaAttribution: {
      sourcePageUrl: item.media.sourcePageUrl,
      author: item.media.author,
      licenseName: item.media.licenseName,
      licenseUrl: item.media.licenseUrl,
      attributionText: item.media.attributionText,
    },
    travel: item.travel ?? {
      access: "建議自駕前往，依地區道路與天候預留彈性時間。",
      parking: "以現地停車場或遊客中心指示為準；旺季需提早抵達。",
      publicTransport: "大眾運輸班次有限，通常需搭配當地一日遊或接駁安排。",
      driveTimeFromReykjavik: "請依當日路況與季節天候預估行車時間。",
    },
    cautionNotes: item.cautionNotes ?? [
      "出發前先確認當地天氣與道路狀況。",
      "高風、濕滑與海岸浪況可能快速變化，請遵循現場標示。",
    ],
    cameraView: item.cameraView ?? {
      distance: 4,
      polarAngle: 1.05,
      azimuthAngle: 0.2,
    },
  };
}

export function useFeaturedPois(): FeaturedPoisState {
  const [points, setPoints] = useState<PointOfInterest[]>(POINTS_OF_INTEREST);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"api" | "fallback">("fallback");
  const [reloadKey, setReloadKey] = useState<number>(0);
  const controllerRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/data/pois", { signal: controller.signal });
        const body: unknown = await response.json();

        if (!response.ok) {
          const message = isErrorResponse(body)
            ? body.error.message
            : `請求失敗（HTTP ${response.status}）`;
          throw new Error(message);
        }

        const payload = body as PoisApiResponse;
        const mapped = payload.items.map(mapApiItemToPoint);
        setPoints(mapped.length > 0 ? mapped : POINTS_OF_INTEREST);
        setSource(mapped.length > 0 ? "api" : "fallback");
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPoints(POINTS_OF_INTEREST);
        setSource("fallback");
        setError(err instanceof Error ? err.message : "未知錯誤");
      } finally {
        if (controllerRef.current === controller) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [reloadKey]);

  return { points, loading, error, source, refetch };
}
