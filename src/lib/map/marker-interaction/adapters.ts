import type { InfoPanelSection, MapFocusTarget } from "@/src/lib/store/workspace";
import type { ClearInteractionSource } from "@/src/lib/map/marker-interaction/types";

export type MarkerInteractionAdapter = {
  activePoiId: string | null;
  activeTravelItemId: string | null;
  poiFocusEnabled: boolean;
  selectedStationId: string | null;
  selectedRoadSegmentId: string | null;
  activeInfoMode: InfoPanelSection;
  mapFocusTarget: MapFocusTarget;
  setActivePoi: (id: string | null) => void;
  setActiveTravelItemId: (id: string | null) => void;
  setPoiFocusEnabled: (enabled: boolean) => void;
  selectStation: (id: string | null) => void;
  selectRoadSegment: (id: string | null) => void;
  setMapFocusTarget: (target: MapFocusTarget) => void;
  setActiveInfoMode: (mode: InfoPanelSection) => void;
};

export function clearMarkerSelections(adapter: MarkerInteractionAdapter) {
  adapter.setActivePoi(null);
  adapter.setActiveTravelItemId(null);
  adapter.setPoiFocusEnabled(false);
  adapter.selectStation(null);
  adapter.selectRoadSegment(null);
}

export function clearInteractionBySource(
  adapter: MarkerInteractionAdapter,
  source: ClearInteractionSource,
) {
  clearMarkerSelections(adapter);
  adapter.setMapFocusTarget(null);

  if (source !== "blank-map") {
    adapter.setActiveInfoMode(null);
  }
}
