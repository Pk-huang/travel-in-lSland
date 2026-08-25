import { beforeEach, describe, expect, it, vi } from "vitest";

import snapshot from "@/fixtures/iceland-status.normal.json";
import { UpstreamError } from "@/src/lib/http/client";
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
import { logEvent } from "@/src/lib/observability";
import { GET } from "./route";

const mockFetchVedurObservations = vi.mocked(fetchVedurObservations);
const mockFetchSunTimes = vi.mocked(fetchSunTimes);
const mockGetStationCoords = vi.mocked(getStationCoords);
const mockLogEvent = vi.mocked(logEvent);

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

beforeEach(() => {
  vi.clearAllMocks();

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

describe("GET /data/iceland-status fallback skeleton", () => {
  it("主 API 成功時使用主資料", async () => {
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.fallback).toBe(false);
    expect(body.meta.cache).toBe("miss");
    expect(body.weather.length).toBeGreaterThan(0);
    expect(body.summary).not.toEqual(snapshot.summary);
  });

  it("主 API 失敗時切換至 fallback 路徑", async () => {
    mockFetchVedurObservations.mockRejectedValueOnce(
      new UpstreamError("Vedur unavailable", 503),
    );

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.fallback).toBe(true);
    expect(body.meta.region).toBe("all");
    expect(body.summary).toEqual(snapshot.summary);
  });

  it("上游不可用時使用 local snapshot fallback", async () => {
    mockedBreaker.canRequest.mockReturnValueOnce(false);
    mockedBreaker.getState.mockReturnValueOnce("open");

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.fallback).toBe(true);
    expect(body.meta.region).toBe("all");
    expect(() => icelandStatusResponseSchema.parse(body)).not.toThrow();
  });

  it("空資料或邊界資料時不崩潰，並回傳可處理結果", async () => {
    mockFetchVedurObservations.mockResolvedValueOnce([]);
    mockGetStationCoords.mockResolvedValueOnce({});
    mockFetchSunTimes.mockRejectedValueOnce(new Error("sun API down"));
    mockFetchSunTimes.mockRejectedValueOnce(new Error("sun API down"));
    mockFetchSunTimes.mockRejectedValueOnce(new Error("sun API down"));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.fallback).toBe(false);
    expect(body.weather).toEqual([]);
    expect(body.roads).toEqual([]);
    expect(mockLogEvent).toHaveBeenCalledWith(
      "warn",
      "sun-times fetch failed",
      expect.objectContaining({ fallback: "null" }),
    );
  });
});
