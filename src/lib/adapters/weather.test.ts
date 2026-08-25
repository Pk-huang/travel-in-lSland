import { describe, expect, it } from "vitest";

import { deriveAlertLevel, parseWeather } from "./weather";
import type { RawVedurObservation } from "@/src/lib/api/vedur";
import type { StationCoordsMap } from "./stations";

describe("Weather Adapter", () => {
  describe("deriveAlertLevel", () => {
    it("returns 'high' when gust exceeds 25 m/s", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        fg: 26,
      };

      expect(deriveAlertLevel(obs)).toBe("high");
    });

    it("returns 'high' when snow depth exceeds 30 cm", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        snd: 31,
      };

      expect(deriveAlertLevel(obs)).toBe("high");
    });

    it("returns 'high' when temperature drops below -15°C", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        t: -16,
      };

      expect(deriveAlertLevel(obs)).toBe("high");
    });

    it("returns 'medium' when gust is 15-25 m/s", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        fg: 20,
        f: 10,
      };

      expect(deriveAlertLevel(obs)).toBe("medium");
    });

    it("returns 'medium' when wind speed is 8+ m/s", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        f: 9,
      };

      expect(deriveAlertLevel(obs)).toBe("medium");
    });

    it("returns 'medium' when snow depth is 10-30 cm", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        snd: 15,
      };

      expect(deriveAlertLevel(obs)).toBe("medium");
    });

    it("returns 'medium' when precipitation exceeds 5 mm", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        r: 6,
      };

      expect(deriveAlertLevel(obs)).toBe("medium");
    });

    it("returns 'medium' when temperature is -5 to -15°C", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        t: -10,
      };

      expect(deriveAlertLevel(obs)).toBe("medium");
    });

    it("returns 'low' for benign conditions", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        t: 10,
        f: 5,
        fg: 8,
        r: 0,
        snd: 0,
      };

      expect(deriveAlertLevel(obs)).toBe("low");
    });
  });

  describe("parseWeather - data structure", () => {
    it("outputs array of WeatherConditions", () => {
      const raw: RawVedurObservation[] = [
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
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = parseWeather(raw, coords);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it("includes required fields: lat, lon, timestamp, temperatureC, windSpeedMs, alertLevel", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Station 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
          fg: 8,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = parseWeather(raw, coords);
      const item = result[0];

      expect(item.lat).toBe(64.1);
      expect(item.lon).toBe(-21.9);
      expect(item.timestamp).toBeDefined();
      expect(typeof item.temperatureC).toBe("number");
      expect(typeof item.windSpeedMs).toBe("number");
      expect(["low", "medium", "high"]).toContain(item.alertLevel);
    });
  });

  describe("parseWeather - default/fallback for missing fields", () => {
    it("fills missing temperature with 0", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Station 1",
          time: "2026-08-24T12:00:00",
          // t: undefined,
          f: 6,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = parseWeather(raw, coords);

      expect(result[0].temperatureC).toBe(0);
    });

    it("fills missing wind speed with 0", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Station 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          // f: undefined,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = parseWeather(raw, coords);

      expect(result[0].windSpeedMs).toBe(0);
    });

    it("leaves precipitation undefined when missing", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Station 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
          // r: undefined,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = parseWeather(raw, coords);

      expect(result[0].precipitationMm).toBeUndefined();
    });

    it("uses station coords when observation has no lat/lon", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Station 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
          // lat/lon not present
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = parseWeather(raw, coords);

      expect(result[0].lat).toBe(64.1);
      expect(result[0].lon).toBe(-21.9);
    });

    it("falls back to 0 for lat/lon when station not in coords and observation has no lat/lon", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 999,
          name: "Unknown Station",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
        },
      ];
      const coords: StationCoordsMap = {};

      const result = parseWeather(raw, coords);

      expect(result[0].lat).toBe(0);
      expect(result[0].lon).toBe(0);
    });
  });
});
