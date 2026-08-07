import type {
  IsMarkerActiveInput,
  MarkerInteractionCoreState,
  MarkerInteractionIntent,
  MarkerInteractionProjection,
  MarkerKind,
  MarkerSelectionSnapshot,
} from "@/src/lib/map/marker-interaction/types";

function resolveActiveKind(state: MarkerInteractionCoreState): MarkerKind | null {
  if (state.poiFocusEnabled && state.activePoiId) {
    return "poi";
  }

  if (state.selectedStationId) {
    return "weather";
  }

  if (state.selectedRoadSegmentId) {
    return "road";
  }

  if (state.activeTravelItemId) {
    return "travel";
  }

  return null;
}

export function createMarkerSelectionSnapshot(
  state: MarkerInteractionCoreState,
): MarkerSelectionSnapshot {
  return {
    activeKind: resolveActiveKind(state),
    activePoiId: state.activePoiId,
    activeStationId: state.selectedStationId,
    activeRoadSegmentId: state.selectedRoadSegmentId,
    activeTravelItemId: state.activeTravelItemId,
    isPoiFocusEnabled: state.poiFocusEnabled,
    focusTarget: state.mapFocusTarget,
    activeInfoMode: state.activeInfoMode,
  };
}

export function isMarkerActive(
  state: MarkerInteractionCoreState,
  input: IsMarkerActiveInput,
): boolean {
  if (input.kind === "poi") {
    return state.poiFocusEnabled && state.activePoiId === input.poiId;
  }

  if (input.kind === "weather") {
    return state.selectedStationId === input.stationId;
  }

  if (input.kind === "road") {
    return state.selectedRoadSegmentId === input.roadSegmentId;
  }

  return state.activeTravelItemId === input.travelItemId;
}

export function projectMarkerInteraction(
  state: MarkerInteractionCoreState,
): MarkerInteractionProjection {
  const snapshot = createMarkerSelectionSnapshot(state);

  return {
    selectedIds: {
      poiId: snapshot.activePoiId,
      stationId: snapshot.activeStationId,
      roadSegmentId: snapshot.activeRoadSegmentId,
      travelItemId: snapshot.activeTravelItemId,
    },
    mode: snapshot.activeInfoMode,
    focusTarget: snapshot.focusTarget,
    shouldClearPoiFocus: snapshot.activeKind !== "poi",
  };
}

export function transitionMarkerInteraction(
  state: MarkerInteractionCoreState,
  intent: MarkerInteractionIntent,
): MarkerInteractionCoreState {
  if (intent.type === "clear-interaction") {
    return {
      ...state,
      activePoiId: null,
      activeTravelItemId: null,
      poiFocusEnabled: false,
      selectedStationId: null,
      selectedRoadSegmentId: null,
      mapFocusTarget: null,
      activeInfoMode:
        intent.source === "blank-map" ? state.activeInfoMode : null,
    };
  }

  if (intent.kind === "poi") {
    const shouldToggleOff =
      state.poiFocusEnabled && state.activePoiId === intent.poiId;

    if (shouldToggleOff) {
      return {
        ...state,
        selectedStationId: null,
        selectedRoadSegmentId: null,
        activePoiId: null,
        poiFocusEnabled: false,
        mapFocusTarget: null,
        activeInfoMode: "poi",
      };
    }

    return {
      ...state,
      selectedStationId: null,
      selectedRoadSegmentId: null,
      activeTravelItemId: null,
      activePoiId: intent.poiId,
      poiFocusEnabled: true,
      mapFocusTarget: { lon: intent.lon, lat: intent.lat },
      activeInfoMode: "poi",
    };
  }

  if (intent.kind === "weather") {
    return {
      ...state,
      activePoiId: null,
      activeTravelItemId: null,
      poiFocusEnabled: false,
      selectedStationId: intent.stationId,
      selectedRoadSegmentId: null,
      mapFocusTarget: { lon: intent.lon, lat: intent.lat },
      activeInfoMode: "weather",
    };
  }

  if (intent.kind === "road") {
    return {
      ...state,
      activePoiId: null,
      activeTravelItemId: null,
      poiFocusEnabled: false,
      selectedStationId: null,
      selectedRoadSegmentId: intent.roadSegmentId,
      mapFocusTarget: { lon: intent.lon, lat: intent.lat },
      activeInfoMode: "road",
    };
  }

  return {
    ...state,
    activePoiId: null,
    poiFocusEnabled: false,
    selectedStationId: null,
    selectedRoadSegmentId: null,
    activeTravelItemId: intent.travelItemId,
    mapFocusTarget: { lon: intent.lon, lat: intent.lat },
  };
}