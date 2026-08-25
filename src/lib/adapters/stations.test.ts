import { describe, expect, it } from "vitest";

import { buildStationCoords } from "./stations";
import type { RawVedurStation } from "@/src/lib/api/vedur";

describe("Stations Adapter", () => {
  describe("buildStationCoords - structure and filtering", () => {
    it("outputs Record<number, StationCoords>", () => {
      const raw: RawVedurStation[] = [
        { station: 1, name: "Station 1", lat: 64.1, lon: -21.9 },
      ];

      const result = buildStationCoords(raw);

      expect(typeof result).toBe("object");
      expect(result[1]).toBeDefined();
      expect(result[1].lat).toBe(64.1);
      expect(result[1].lon).toBe(-21.9);
    });

    it("includes optional elevation when present", () => {
      const raw: RawVedurStation[] = [
        { station: 1, name: "Station 1", lat: 64.1, lon: -21.9, ele: 150 },
      ];

      const result = buildStationCoords(raw);

      expect(result[1].ele).toBe(150);
    });

    it("omits elevation when not present or null", () => {
      const raw: RawVedurStation[] = [
        { station: 1, name: "Station 1", lat: 64.1, lon: -21.9 },
        { station: 2, name: "Station 2", lat: 65.0, lon: -20.0, ele: null },
      ];

      const result = buildStationCoords(raw);

      expect(result[1].ele).toBeUndefined();
      expect(result[2].ele).toBeUndefined();
    });

    it("filters out stations missing lat or lon", () => {
      const raw: RawVedurStation[] = [
        { station: 1, name: "Station 1", lat: 64.1, lon: -21.9 },
        { station: 2, name: "Station 2 (no lat)", lon: -20.0 },
        { station: 3, name: "Station 3 (no lon)", lat: 65.0 },
        { station: 4, name: "Station 4", lat: 64.5, lon: -19.5 },
      ] as RawVedurStation[];

      const result = buildStationCoords(raw);

      expect(result[1]).toBeDefined();
      expect(result[2]).toBeUndefined();
      expect(result[3]).toBeUndefined();
      expect(result[4]).toBeDefined();
    });

    it("handles multiple stations with different presence of elevation", () => {
      const raw: RawVedurStation[] = [
        { station: 1, name: "Station 1", lat: 64.1, lon: -21.9, ele: 100 },
        { station: 2, name: "Station 2", lat: 65.0, lon: -20.0 },
        { station: 3, name: "Station 3", lat: 64.5, lon: -19.5, ele: 250 },
      ];

      const result = buildStationCoords(raw);

      expect(Object.keys(result).length).toBe(3);
      expect(result[1].ele).toBe(100);
      expect(result[2].ele).toBeUndefined();
      expect(result[3].ele).toBe(250);
    });
  });

  describe("buildStationCoords - as lookup table", () => {
    it("uses station id as key for quick lookup", () => {
      const raw: RawVedurStation[] = [
        { station: 100, name: "Far North", lat: 66.0, lon: -14.0 },
        { station: 200, name: "South Coast", lat: 63.5, lon: -18.0 },
      ];

      const result = buildStationCoords(raw);

      // Can access directly by station id
      expect(result[100].lat).toBe(66.0);
      expect(result[200].lat).toBe(63.5);
      expect(result[999]).toBeUndefined();
    });

    it("returns empty object when no valid stations", () => {
      const raw: RawVedurStation[] = [
        { station: 1, name: "Station 1", lon: -21.9 }, // no lat
        { station: 2, name: "Station 2", lat: 64.1 }, // no lon
      ] as RawVedurStation[];

      const result = buildStationCoords(raw);

      expect(Object.keys(result).length).toBe(0);
    });
  });
});
