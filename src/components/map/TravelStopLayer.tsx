"use client";

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

  return (
    <>
      {day.stops
        .filter((stop) => stop.lat != null && stop.lon != null)
        .map((stop, index) => {
          const { x, z } = lonLatToSceneXZ(stop.lon as number, stop.lat as number);
          const surfaceY = heightmap
            ? elevationToSceneY(
                sampleElevationMeters(heightmap, stop.lon as number, stop.lat as number),
              )
            : 0;
          const y = surfaceY + TRAVEL_STOP_SURFACE_OFFSET;
          const sequence = String(index + 1).padStart(2, "0");
          const markerId = `travel-stop-${day.dayId}-${stop.stopId}`;

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
