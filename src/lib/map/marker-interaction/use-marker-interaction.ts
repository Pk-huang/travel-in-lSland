"use client";

import { useCallback, useMemo } from "react";

import { useWorkspaceStore } from "@/src/lib/store/workspace";
import {
  createMarkerSelectionSnapshot,
  isMarkerActive as isMarkerActiveWithCore,
  projectMarkerInteraction,
  transitionMarkerInteraction,
} from "@/src/lib/map/marker-interaction/core";
import {
  type MarkerInteractionAdapter,
} from "@/src/lib/map/marker-interaction/adapters";
import type {
  IsMarkerActiveInput,
  MarkerInteractionCoreState,
  MarkerInteractionIntent,
  MarkerInteractionProjection,
  MarkerSelectionSnapshot,
} from "@/src/lib/map/marker-interaction/types";

function toCoreState(adapter: MarkerInteractionAdapter): MarkerInteractionCoreState {
  return {
    activePoiId: adapter.activePoiId,
    activeTravelItemId: adapter.activeTravelItemId,
    poiFocusEnabled: adapter.poiFocusEnabled,
    selectedStationId: adapter.selectedStationId,
    selectedRoadSegmentId: adapter.selectedRoadSegmentId,
    activeInfoMode: adapter.activeInfoMode,
    mapFocusTarget: adapter.mapFocusTarget,
  };
}

function applyCoreState(
  adapter: MarkerInteractionAdapter,
  nextState: MarkerInteractionCoreState,
) {
  adapter.setActivePoi(nextState.activePoiId);
  adapter.setActiveTravelItemId(nextState.activeTravelItemId);
  adapter.setPoiFocusEnabled(nextState.poiFocusEnabled);
  adapter.selectStation(nextState.selectedStationId);
  adapter.selectRoadSegment(nextState.selectedRoadSegmentId);
  adapter.setMapFocusTarget(nextState.mapFocusTarget);
  adapter.setActiveInfoMode(nextState.activeInfoMode);
}

export function useMarkerInteraction() {
  const activePoiId = useWorkspaceStore((state) => state.activePoiId);
  const activeTravelItemId = useWorkspaceStore((state) => state.activeTravelItemId);
  const poiFocusEnabled = useWorkspaceStore((state) => state.poiFocusEnabled);
  const selectedStationId = useWorkspaceStore((state) => state.selectedStationId);
  const selectedRoadSegmentId = useWorkspaceStore((state) => state.selectedRoadSegmentId);
  const mapFocusTarget = useWorkspaceStore((state) => state.mapFocusTarget);
  const activeInfoMode = useWorkspaceStore((state) => state.activeInfoPanelSection);
  const setActivePoi = useWorkspaceStore((state) => state.setActivePoi);
  const setActiveTravelItemId = useWorkspaceStore((state) => state.setActiveTravelItemId);
  const setPoiFocusEnabled = useWorkspaceStore((state) => state.setPoiFocusEnabled);
  const selectStation = useWorkspaceStore((state) => state.selectStation);
  const selectRoadSegment = useWorkspaceStore((state) => state.selectRoadSegment);
  const setMapFocusTarget = useWorkspaceStore((state) => state.setMapFocusTarget);
  const setActiveInfoMode = useWorkspaceStore((state) => state.setActiveInfoPanelSection);

  const adapter = useMemo<MarkerInteractionAdapter>(
    () => ({
      activePoiId,
      activeTravelItemId,
      poiFocusEnabled,
      selectedStationId,
      selectedRoadSegmentId,
      activeInfoMode,
      mapFocusTarget,
      setActivePoi,
      setActiveTravelItemId,
      setPoiFocusEnabled,
      selectStation,
      selectRoadSegment,
      setMapFocusTarget,
      setActiveInfoMode,
    }),
    [
      activePoiId,
      activeTravelItemId,
      poiFocusEnabled,
      selectedStationId,
      selectedRoadSegmentId,
      activeInfoMode,
      mapFocusTarget,
      setActivePoi,
      setActiveTravelItemId,
      setPoiFocusEnabled,
      selectStation,
      selectRoadSegment,
      setMapFocusTarget,
      setActiveInfoMode,
    ],
  );

  const snapshot = useCallback((): MarkerSelectionSnapshot => {
    return createMarkerSelectionSnapshot(toCoreState(adapter));
  }, [adapter]);

  const isMarkerActive = useCallback(
    (input: IsMarkerActiveInput) => {
      return isMarkerActiveWithCore(toCoreState(adapter), input);
    },
    [adapter],
  );

  const project = useCallback((): MarkerInteractionProjection => {
    return projectMarkerInteraction(toCoreState(adapter));
  }, [adapter]);

  const dispatch = useCallback(
    (intent: MarkerInteractionIntent) => {
      const currentState = toCoreState(adapter);
      const nextState = transitionMarkerInteraction(currentState, intent);
      applyCoreState(adapter, nextState);
    },
    [adapter],
  );

  return {
    dispatch,
    snapshot,
    isMarkerActive,
    project,
  };
}
