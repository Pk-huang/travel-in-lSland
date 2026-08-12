import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POINTS_OF_INTEREST } from "@/src/lib/config/poi";
import { useFeaturedPois } from "./use-featured-pois";

describe("useFeaturedPois", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses API data when the request succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              poiId: "api-poi-1",
              name: {
                zhHant: "API 景點",
                en: "API poi",
              },
              location: { lat: 64.1, lon: -21.1 },
              description: {
                short: "短描述",
                medium: "中描述",
                long: "長描述",
              },
              media: {
                heroImageUrl: "https://example.com/hero.jpg",
                sourcePageUrl: "https://example.com/source",
                author: "test",
                licenseName: "CC",
                licenseUrl: "https://example.com/license",
                attributionText: "test attribution",
              },
              category: "landmark",
              tags: ["test"],
              sources: {
                wikidataUrl: "https://example.com/wiki",
                wikipediaUrl: "https://example.com/wikipedia",
                osmReference: "https://example.com/osm",
              },
            },
          ],
        }),
      }),
    );

    const { result } = renderHook(() => useFeaturedPois());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.source).toBe("api");
    expect(result.current.points[0]?.id).toBe("api-poi-1");
    expect(result.current.error).toBeNull();
  });

  it("falls back to default POIs when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const { result } = renderHook(() => useFeaturedPois());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.source).toBe("fallback");
    expect(result.current.points).toEqual(POINTS_OF_INTEREST);
    expect(result.current.error).toBe("network down");
  });

  it("falls back to default POIs when the API returns an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      }),
    );

    const { result } = renderHook(() => useFeaturedPois());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.source).toBe("fallback");
    expect(result.current.points).toEqual(POINTS_OF_INTEREST);
    expect(result.current.error).toBeNull();
  });
});
