import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import snapshot from "@/fixtures/iceland-status.normal.json";
import { UpstreamError } from "@/src/lib/http/client";
import { useIcelandStatus } from "@/src/lib/client/use-iceland-status";
import { icelandStatusResponseSchema } from "@/src/schemas";

vi.mock("@/src/lib/api/vedur", () => ({
  fetchVedurObservations: vi.fn(),
  normalizeVedurTime: (time: string) => {
    const parsed = new Date(`${time}Z`);
    return Number.isNaN(parsed.getTime())
      ? new Date("2026-01-01T00:00:00.000Z").toISOString()
      : parsed.toISOString();
  },
}));

vi.mock("@/src/lib/api/sun-times", () => ({
  fetchSunTimes: vi.fn(),
}));

vi.mock("@/src/lib/stations/catalog", () => ({
  getStationCoords: vi.fn(),
}));

vi.mock("@/src/lib/observability", () => ({
  logEvent: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/src/lib/http/circuit-breaker", () => ({
  vedurBreaker: {
    canRequest: vi.fn(),
    recordSuccess: vi.fn(),
    recordFailure: vi.fn(),
    getState: vi.fn(),
  },
}));

import { cache } from "@/src/lib/cache";
import { fetchSunTimes } from "@/src/lib/api/sun-times";
import { fetchVedurObservations } from "@/src/lib/api/vedur";
import { vedurBreaker } from "@/src/lib/http/circuit-breaker";
import { getStationCoords } from "@/src/lib/stations/catalog";
import { GET } from "./route";

const mockFetchVedurObservations = vi.mocked(fetchVedurObservations);
const mockFetchSunTimes = vi.mocked(fetchSunTimes);
const mockGetStationCoords = vi.mocked(getStationCoords);

const mockedBreaker = vedurBreaker as {
  canRequest: ReturnType<typeof vi.fn>;
  recordSuccess: ReturnType<typeof vi.fn>;
  recordFailure: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
};

function createRequest(query = "region=all"): Request {
  return new Request(`http://localhost:3000/data/iceland-status?${query}`);
}

function createSunTimes(date: string) {
  return {
    source: "sunrise-sunset" as const,
    date,
    tzid: "Atlantic/Reykjavik",
    lat: 64.9631,
    lon: -19.0208,
    sunrise: `${date}T05:00:00+00:00`,
    sunset: `${date}T19:00:00+00:00`,
    solarNoon: `${date}T12:00:00+00:00`,
    dayLengthSeconds: 50_400,
    civilTwilightBegin: `${date}T04:00:00+00:00`,
    civilTwilightEnd: `${date}T20:00:00+00:00`,
    nauticalTwilightBegin: `${date}T03:00:00+00:00`,
    nauticalTwilightEnd: `${date}T21:00:00+00:00`,
    astronomicalTwilightBegin: `${date}T02:00:00+00:00`,
    astronomicalTwilightEnd: `${date}T22:00:00+00:00`,
  };
}

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();

  vi.spyOn(cache, "get").mockResolvedValue(null);
  vi.spyOn(cache, "set").mockResolvedValue();

  mockedBreaker.canRequest.mockReturnValue(true);
  mockedBreaker.recordSuccess.mockReturnValue(undefined);
  mockedBreaker.recordFailure.mockReturnValue(undefined);
  mockedBreaker.getState.mockReturnValue("closed");

  mockFetchVedurObservations.mockResolvedValue([
    {
      station: 1,
      name: "Station 1",
      time: "2026-08-24T12:00:00",
      t: 2,
      f: 6,
      fg: 8,
      r: 0,
      snd: 0,
    },
  ]);

  mockGetStationCoords.mockResolvedValue({
    1: { lat: 64.1, lon: -21.9 },
  });

  mockFetchSunTimes.mockImplementation(async ({ date }) => createSunTimes(date));
});

describe("JSON priority and pre-render loading integration", () => {
  it("主次來源同時可用時採用主 JSON", async () => {
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.fallback).toBe(false);
    expect(body.meta.cache).toBe("miss");
    expect(body.summary).not.toEqual(snapshot.summary);
  });

  it("主來源失敗時切換到 fallback JSON", async () => {
    mockFetchVedurObservations.mockRejectedValueOnce(
      new UpstreamError("Vedur unavailable", 503),
    );

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.fallback).toBe(true);
    expect(body.summary).toEqual(snapshot.summary);
    expect(() => icelandStatusResponseSchema.parse(body)).not.toThrow();
  });

  it("render-ready 前不輸出可渲染資料", async () => {
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

    const deferred = createDeferred<{ ok: boolean; json: () => Promise<typeof payload> }>();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => deferred.promise));

    const { result } = renderHook(() => useIcelandStatus("all"));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    deferred.resolve({
      ok: true,
      json: async () => payload,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(payload);
    expect(result.current.error).toBeNull();
  });

  it("連續 20 次執行來源優先與 ready 時序皆一致", async () => {
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

    for (let index = 0; index < 20; index += 1) {
      const routeResponse = await GET(createRequest());
      const routeBody = await routeResponse.json();

      expect(routeResponse.status).toBe(200);
      expect(routeBody.meta.fallback).toBe(false);

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => payload,
        }),
      );

      const { result, unmount } = renderHook(() => useIcelandStatus("all"));

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(payload);
      expect(result.current.error).toBeNull();
      unmount();
      vi.unstubAllGlobals();
    }
  });
});