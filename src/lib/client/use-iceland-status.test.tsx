import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIcelandStatus } from "./use-iceland-status";

describe("useIcelandStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses fetched status data when the request succeeds", async () => {
    const payload = {
      meta: {
        region: "all",
        generatedAt: "2026-08-12T00:00:00.000Z",
        cache: "hit",
        fallback: false,
      },
      weather: [],
      roads: [],
      aurora: [],
      summary: {
        riskScore: 0,
        highRiskSegments: 0,
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    const { result } = renderHook(() => useIcelandStatus("all"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(payload);
    expect(result.current.error).toBeNull();
  });

  it("records an error when the status API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("status service unavailable")),
    );

    const { result } = renderHook(() => useIcelandStatus("all"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("status service unavailable");
  });
});
