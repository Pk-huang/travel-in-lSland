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
import { buildTravelMapMarkers } from "@/src/lib/travel-plans/travel-plan-map-utils";

const TRAVEL_STOP_SURFACE_OFFSET = 0.42;

export function TravelStopLayer({ day }: { day: TravelPlanDay }) {
  const heightmap = useHeightmap();
  const stopMarkers = useMemo(() => {
    return buildTravelMapMarkers(day).filter((marker) => marker.hasLocation);
  }, [day]);

  return (
    <>
      {stopMarkers.map((stop, index) => {
          if (stop.lat == null || stop.lon == null) {
            return null;
          }

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
