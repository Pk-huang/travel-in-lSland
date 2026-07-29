import type { TravelPlanDay } from "@/src/types";

export type TravelMapMarker = {
  kind: "stop" | "timeline";
  markerId: string;
  name: string;
  lat: number | null;
  lon: number | null;
  note?: string;
  hasLocation: boolean;
  sequence: number;
};

export function buildTravelMapMarkers(day: TravelPlanDay): TravelMapMarker[];
