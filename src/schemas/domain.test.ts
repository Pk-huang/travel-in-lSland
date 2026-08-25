import { describe, expect, it } from "vitest";

import snapshot from "@/fixtures/iceland-status.normal.json";
import {
  icelandStatusResponseSchema,
  weatherConditionsSchema,
  roadSegmentSchema,
} from "./domain";

describe("Domain Schema Validation", () => {
  describe("icelandStatusResponseSchema - required fields", () => {
    it("accepts complete valid data", () => {
      expect(() => icelandStatusResponseSchema.parse(snapshot)).not.toThrow();
    });

    it("rejects data missing meta field", () => {
      const incomplete = { ...snapshot };
      delete (incomplete as Partial<typeof snapshot>).meta;

      expect(() => icelandStatusResponseSchema.parse(incomplete)).toThrow();
    });

    it("rejects data missing weather array", () => {
      const incomplete = { ...snapshot };
      delete (incomplete as Partial<typeof snapshot>).weather;

      expect(() => icelandStatusResponseSchema.parse(incomplete)).toThrow();
    });

    it("rejects data missing roads array", () => {
      const incomplete = { ...snapshot };
      delete (incomplete as Partial<typeof snapshot>).roads;

      expect(() => icelandStatusResponseSchema.parse(incomplete)).toThrow();
    });

    it("rejects data missing summary", () => {
      const incomplete = { ...snapshot };
      delete (incomplete as Partial<typeof snapshot>).summary;

      expect(() => icelandStatusResponseSchema.parse(incomplete)).toThrow();
    });
  });

  describe("icelandStatusResponseSchema - field types", () => {
    it("rejects invalid datetime in weather conditions", () => {
      const invalid = {
        ...snapshot,
        weather: [
          {
            source: "vedur",
            timestamp: "not-a-datetime",
            lat: 64.1,
            lon: -21.9,
            temperatureC: 2,
            windSpeedMs: 6,
            alertLevel: "low" as const,
          },
        ],
      };

      expect(() => icelandStatusResponseSchema.parse(invalid)).toThrow();
    });

    it("rejects string temperature (expects number)", () => {
      const invalid = {
        ...snapshot,
        weather: [
          {
            source: "vedur",
            timestamp: "2026-08-24T12:00:00.000Z",
            lat: 64.1,
            lon: -21.9,
            temperatureC: "2" as unknown as number,
            windSpeedMs: 6,
            alertLevel: "low" as const,
          },
        ],
      };

      expect(() => icelandStatusResponseSchema.parse(invalid)).toThrow();
    });

    it("rejects invalid alertLevel enum", () => {
      const invalid = {
        ...snapshot,
        weather: [
          {
            source: "vedur",
            timestamp: "2026-08-24T12:00:00.000Z",
            lat: 64.1,
            lon: -21.9,
            temperatureC: 2,
            windSpeedMs: 6,
            alertLevel: "critical" as unknown,
          },
        ],
      };

      expect(() => icelandStatusResponseSchema.parse(invalid)).toThrow();
    });

    it("rejects invalid road status enum", () => {
      const invalid = {
        ...snapshot,
        roads: [
          {
            source: "road",
            segmentId: "seg-1",
            name: "Route 1",
            status: "impassable" as unknown,
            updatedAt: "2026-08-24T12:00:00.000Z",
            geometry: [[0, 0]],
          },
        ],
      };

      expect(() => icelandStatusResponseSchema.parse(invalid)).toThrow();
    });

    it("rejects invalid cache state enum", () => {
      const invalid = {
        ...snapshot,
        meta: {
          region: "all" as const,
          generatedAt: "2026-08-24T12:00:00.000Z",
          cache: "stale-expired" as unknown,
          fallback: false,
        },
      };

      expect(() => icelandStatusResponseSchema.parse(invalid)).toThrow();
    });
  });

  describe("weatherConditionsSchema - standalone validation", () => {
    it("accepts valid weather conditions", () => {
      const valid = {
        source: "vedur" as const,
        timestamp: "2026-08-24T12:00:00.000Z",
        lat: 64.1,
        lon: -21.9,
        temperatureC: 2,
        windSpeedMs: 6,
        alertLevel: "low" as const,
      };

      expect(() => weatherConditionsSchema.parse(valid)).not.toThrow();
    });

    it("accepts optional visibility and precipitation", () => {
      const valid = {
        source: "vedur" as const,
        timestamp: "2026-08-24T12:00:00.000Z",
        lat: 64.1,
        lon: -21.9,
        temperatureC: 2,
        windSpeedMs: 6,
        visibilityKm: 10,
        precipitationMm: 0.5,
        alertLevel: "low" as const,
      };

      expect(() => weatherConditionsSchema.parse(valid)).not.toThrow();
    });
  });

  describe("roadSegmentSchema - standalone validation", () => {
    it("accepts valid road segment", () => {
      const valid = {
        source: "road" as const,
        segmentId: "seg-1",
        name: "Route 1",
        status: "open" as const,
        updatedAt: "2026-08-24T12:00:00.000Z",
        geometry: [[0, 0]],
      };

      expect(() => roadSegmentSchema.parse(valid)).not.toThrow();
    });

    it("accepts optional reason when status is not open", () => {
      const valid = {
        source: "road" as const,
        segmentId: "seg-1",
        name: "Route 1",
        status: "closed" as const,
        reason: "heavy snow",
        updatedAt: "2026-08-24T12:00:00.000Z",
        geometry: [[0, 0]],
      };

      expect(() => roadSegmentSchema.parse(valid)).not.toThrow();
    });
  });
});
