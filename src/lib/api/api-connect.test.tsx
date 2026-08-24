import { describe, expect, it } from "vitest";

import snapshot from "@/fixtures/iceland-status.normal.json";
import { fetchSunTimes } from "./sun-times";
import {
  fetchVedurObservations,
  fetchVedurStations,
} from "./vedur";

async function fetchJsonSource(url: string): Promise<unknown> {
  const response = await fetch(url);

  expect(response.status).toBe(200);

  return response.json();
}

describe("API source connections", () => {
  it("connects to NOAA SWPC Aurora JSON and parses JSON", async () => {
    const data = await fetchJsonSource(
      "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json",
    );

    expect(data).toBeDefined();
  }, 30_000);

  it("connects to Vedur observations and parses JSON", async () => {
    const data = await fetchVedurObservations({ region: "all" });

    expect(Array.isArray(data)).toBe(true);
  }, 30_000);

  it("connects to Vedur stations and parses JSON", async () => {
    const data = await fetchVedurStations("all");

    expect(Array.isArray(data)).toBe(true);
  }, 30_000);

  it("connects to APIs.is and parses JSON", async () => {
    const data = await fetchJsonSource("https://api.apis.is/weather/");

    expect(data).toBeDefined();
  }, 30_000);

  it("connects to Sunrise-Sunset API and parses JSON", async () => {
    const data = await fetchSunTimes({
      lat: 64.9631,
      lon: -19.0208,
      date: "2026-08-24",
    });

    expect(data).toBeDefined();
  }, 30_000);

  it("reads the existing local snapshot fixture as JSON", () => {
    expect(snapshot).toBeDefined();
  });
});