import { describe, expect, it } from "vitest";

import { deriveRoadStatus, deriveRoads } from "./road";
import type { RawVedurObservation } from "@/src/lib/api/vedur";
import type { StationCoordsMap } from "./stations";

describe("Road Adapter", () => {
  describe("deriveRoadStatus", () => {
    it("returns 'closed' when gust exceeds 25 m/s", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        fg: 26,
      };

      expect(deriveRoadStatus(obs)).toBe("closed");
    });

    it("returns 'closed' when snow depth exceeds 30 cm", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        snd: 31,
      };

      expect(deriveRoadStatus(obs)).toBe("closed");
    });

    it("returns 'closed' when temperature drops below -15°C", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        t: -16,
      };

      expect(deriveRoadStatus(obs)).toBe("closed");
    });

    it("returns 'caution' when gust is 15-25 m/s", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        fg: 20,
      };

      expect(deriveRoadStatus(obs)).toBe("caution");
    });

    it("returns 'caution' when snow depth is 10-30 cm", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        snd: 15,
      };

      expect(deriveRoadStatus(obs)).toBe("caution");
    });

    it("returns 'caution' when precipitation exceeds 5 mm", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        r: 6,
      };

      expect(deriveRoadStatus(obs)).toBe("caution");
    });

    it("returns 'caution' when temperature is -5 to -15°C", () => {
      const obs: RawVedurObservation = {
        station: 1,
        name: "Station 1",
        time: "2026-08-24T12:00:00",
        t: -10,
      };

      expect(deriveRoadStatus(obs)).toBe("caution");
    });

    it("returns 'open' for benign conditions", () => {
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

      expect(deriveRoadStatus(obs)).toBe("open");
    });
  });

  describe("deriveRoads - data structure", () => {
    it("outputs array of RoadSegment", () => {
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

      const result = deriveRoads(raw, coords);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it("includes required fields: segmentId, name, status, updatedAt, geometry", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Route 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
          fg: 8,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = deriveRoads(raw, coords);
      const item = result[0];

      expect(item.segmentId).toBeDefined();
      expect(item.name).toBe("Route 1");
      expect(["open", "caution", "closed"]).toContain(item.status);
      expect(item.updatedAt).toBeDefined();
      expect(Array.isArray(item.geometry)).toBe(true);
      expect(item.geometry.length).toBeGreaterThan(0);
    });
  });

  describe("deriveRoads - reason field", () => {
    it("omits reason when status is 'open'", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Route 1",
          time: "2026-08-24T12:00:00",
          t: 10,
          f: 5,
          fg: 8,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = deriveRoads(raw, coords);

      expect(result[0].reason).toBeUndefined();
    });

    it("includes reason when status is 'caution' or 'closed'", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Route 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
          fg: 26,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = deriveRoads(raw, coords);

      expect(result[0].reason).toBeDefined();
      expect(typeof result[0].reason).toBe("string");
      expect(result[0].reason!.length).toBeGreaterThan(0);
    });
  });

  describe("deriveRoads - coordinate handling", () => {
    it("uses station coords for geometry point", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Route 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
        },
      ];
      const coords: StationCoordsMap = {
        1: { lat: 64.1, lon: -21.9 },
      };

      const result = deriveRoads(raw, coords);

      expect(result[0].geometry[0]).toEqual([-21.9, 64.1]); // [lon, lat]
    });

    it("falls back to observation lat/lon when station not in coords", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 1,
          name: "Route 1",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
          lat: 65.0,
          lon: -20.0,
        },
      ];
      const coords: StationCoordsMap = {}; // empty, no station data

      const result = deriveRoads(raw, coords);

      expect(result[0].geometry[0]).toEqual([-20.0, 65.0]);
    });

    it("falls back to [0, 0] when no coords and no observation lat/lon", () => {
      const raw: RawVedurObservation[] = [
        {
          station: 999,
          name: "Unknown Route",
          time: "2026-08-24T12:00:00",
          t: 2,
          f: 6,
        },
      ];
      const coords: StationCoordsMap = {};

      const result = deriveRoads(raw, coords);

      expect(result[0].geometry[0]).toEqual([0, 0]);
    });
  });
});
