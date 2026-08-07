import type { InfoPanelSection } from "@/src/lib/store/workspace";

export type MarkerKind = "poi" | "weather" | "road" | "travel";

export type ClearInteractionSource = "blank-map" | "panel-close" | "mode-switch";

export type MarkerInteractionIntent =
  | { type: "select-marker"; kind: "poi"; poiId: string; lon: number; lat: number }
  | {
      type: "select-marker";
      kind: "weather";
      stationId: string;
      lon: number;
      lat: number;
    }
  | {
      type: "select-marker";
      kind: "road";
      roadSegmentId: string;
      lon: number;
      lat: number;
    }
  | {
      type: "select-marker";
      kind: "travel";
      travelItemId: string;
      lon: number;
      lat: number;
    }
  | { type: "clear-interaction"; source: ClearInteractionSource };

export type MarkerSelectionSnapshot = {
  activeKind: MarkerKind | null;
  activePoiId: string | null;
  activeStationId: string | null;
  activeRoadSegmentId: string | null;
  activeTravelItemId: string | null;
  isPoiFocusEnabled: boolean;
  focusTarget: { lon: number; lat: number } | null;
  activeInfoMode: InfoPanelSection;
};

export type IsMarkerActiveInput =
  | { kind: "poi"; poiId: string }
  | { kind: "weather"; stationId: string }
  | { kind: "road"; roadSegmentId: string }
  | { kind: "travel"; travelItemId: string };

export type MarkerInteractionProjection = {
  selectedIds: {
    poiId: string | null;
    stationId: string | null;
    roadSegmentId: string | null;
    travelItemId: string | null;
  };
  mode: InfoPanelSection;
  focusTarget: { lon: number; lat: number } | null;
  shouldClearPoiFocus: boolean;
};
