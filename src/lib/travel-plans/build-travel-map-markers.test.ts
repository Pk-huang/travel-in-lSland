import { describe, expect, it } from "vitest";

import { buildTravelMapMarkers } from "./travel-plan-map-utils.js";

describe("buildTravelMapMarkers dedupe", () => {
  it("deduplicates same-name duplicate stops and timeline items in the same day", () => {
    const day = {
      dayId: "day-1",
      stops: [
        {
          stopId: "stop-1",
          name: "Same Place",
          lat: 64.1,
          lon: -21.9,
          note: "first stop",
        },
        {
          stopId: "stop-2",
          name: "Same Place",
          lat: 64.1,
          lon: -21.9,
          note: "duplicate stop",
        },
      ],
      timelineSections: [
        {
          sectionId: "section-1",
          label: "Morning",
          items: [
            {
              itemId: "item-1",
              name: "Same Place",
              lat: 64.1,
              lon: -21.9,
              description: "timeline duplicate",
            },
          ],
        },
      ],
    };

    const markers = buildTravelMapMarkers(day as any);

    expect(markers).toHaveLength(2);
    expect(markers.map((marker) => marker.name)).toEqual(["Same Place", "Same Place"]);
    expect(markers.map((marker) => marker.kind)).toEqual(["stop", "timeline"]);
  });
});
