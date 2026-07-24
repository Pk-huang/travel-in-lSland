"use client";

import { useMemo } from "react";
import { Route } from "lucide-react";

import { MapMarkerTag } from "@/src/components/ui/map-marker-tag";
import type { TravelPlanDay } from "@/src/types";
import {
  elevationToSceneY,
  lonLatToSceneXZ,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";

const TRAVEL_STOP_SURFACE_OFFSET = 0.42;

export function TravelStopLayer({ day }: { day: TravelPlanDay }) {
  const heightmap = useHeightmap();
  const stopMarkers = useMemo(() => {
    const seen = new Set<string>();
    const markers: Array<{ markerId: string; name: string; lat: number; lon: number; note?: string }> = [];

    day.stops.forEach((stop) => {
      if (stop.lat == null || stop.lon == null) {
        return;
      }

      const dedupeKey = `${stop.name}-${stop.lat}-${stop.lon}`;
      seen.add(dedupeKey);
      markers.push({
        markerId: `travel-stop-${day.dayId}-${stop.stopId}`,
        name: stop.name,
        lat: stop.lat,
        lon: stop.lon,
        note: stop.note,
      });
    });

    day.timelineSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.lat == null || item.lon == null) {
          return;
        }

        const dedupeKey = `${item.name}-${item.lat}-${item.lon}`;
        if (seen.has(dedupeKey)) {
          return;
        }

        seen.add(dedupeKey);
        markers.push({
          markerId: `travel-item-${day.dayId}-${item.itemId}`,
          name: item.name,
          lat: item.lat,
          lon: item.lon,
          note: item.description,
        });
      });
    });

    return markers;
  }, [day]);

  return (
    <>
      {stopMarkers.map((stop, index) => {
          const { x, z } = lonLatToSceneXZ(stop.lon, stop.lat);
          const surfaceY = heightmap
            ? elevationToSceneY(
                sampleElevationMeters(heightmap, stop.lon, stop.lat),
              )
            : 0;
          const y = surfaceY + TRAVEL_STOP_SURFACE_OFFSET;
          const sequence = String(index + 1).padStart(2, "0");
          const markerId = stop.markerId;

          return (
            <MapMarkerTag
              key={markerId}
              markerId={markerId}
              label={`${sequence} · ${stop.name}`}
              description={stop.note}
              x={x}
              y={y}
              z={z}
              isActive={false}
              isHovered={false}
              icon={Route}
              tone="neutral"
              onHoverChange={() => {}}
            />
          );
        })}
    </>
  );
}
