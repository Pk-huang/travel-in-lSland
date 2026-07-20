"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { POINTS_OF_INTEREST } from "@/src/lib/config/poi";
import type { ApiErrorResponse, PointOfInterest } from "@/src/types";

type PoiApiItem = {
  poiId: string;
  name: {
    en: string;
  };
  location: {
    lat: number;
    lon: number;
  };
  description: {
    medium: string;
  };
  media: {
    heroImageUrl: string;
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
  return {
    id: item.poiId,
    label: item.name.en,
    imageUrl: item.media.heroImageUrl,
    description: item.description.medium,
    lat: item.location.lat,
    lon: item.location.lon,
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
