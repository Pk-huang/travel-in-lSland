"use client";

import { useCallback, useMemo } from "react";

import { useWorkspaceStore } from "@/src/lib/store/workspace";
import {
  clearInteractionBySource,
  clearMarkerSelections,
  type MarkerInteractionAdapter,
} from "@/src/lib/map/marker-interaction/adapters";
import type {
  IsMarkerActiveInput,
  MarkerInteractionIntent,
  MarkerInteractionProjection,
  MarkerSelectionSnapshot,
} from "@/src/lib/map/marker-interaction/types";

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
    let activeKind: MarkerSelectionSnapshot["activeKind"] = null;

    if (adapter.poiFocusEnabled && adapter.activePoiId) {
      activeKind = "poi";
    } else if (adapter.selectedStationId) {
      activeKind = "weather";
    } else if (adapter.selectedRoadSegmentId) {
      activeKind = "road";
    } else if (adapter.activeTravelItemId) {
      activeKind = "travel";
    }

    return {
      activeKind,
      activePoiId: adapter.activePoiId,
      activeStationId: adapter.selectedStationId,
      activeRoadSegmentId: adapter.selectedRoadSegmentId,
      activeTravelItemId: adapter.activeTravelItemId,
      isPoiFocusEnabled: adapter.poiFocusEnabled,
      focusTarget: adapter.mapFocusTarget,
      activeInfoMode: adapter.activeInfoMode,
    };
  }, [adapter]);

  const isMarkerActive = useCallback(
    (input: IsMarkerActiveInput) => {
      const current = snapshot();

      if (input.kind === "poi") {
        return current.isPoiFocusEnabled && current.activePoiId === input.poiId;
      }

      if (input.kind === "weather") {
        return current.activeStationId === input.stationId;
      }

      if (input.kind === "road") {
        return current.activeRoadSegmentId === input.roadSegmentId;
      }

      return current.activeTravelItemId === input.travelItemId;
    },
    [snapshot],
  );

  const project = useCallback((): MarkerInteractionProjection => {
    const current = snapshot();

    return {
      selectedIds: {
        poiId: current.activePoiId,
        stationId: current.activeStationId,
        roadSegmentId: current.activeRoadSegmentId,
        travelItemId: current.activeTravelItemId,
      },
      mode: current.activeInfoMode,
      focusTarget: current.focusTarget,
      shouldClearPoiFocus: current.activeKind !== "poi",
    };
  }, [snapshot]);

  const dispatch = useCallback(
    (intent: MarkerInteractionIntent) => {
      if (intent.type === "clear-interaction") {
        clearInteractionBySource(adapter, intent.source);
        return;
      }

      if (intent.kind === "poi") {
        const shouldToggleOff =
          adapter.poiFocusEnabled && adapter.activePoiId === intent.poiId;
        adapter.selectStation(null);
        adapter.selectRoadSegment(null);

        if (shouldToggleOff) {
          adapter.setActivePoi(null);
          adapter.setPoiFocusEnabled(false);
          adapter.setMapFocusTarget(null);
        } else {
          adapter.setActiveTravelItemId(null);
          adapter.setActivePoi(intent.poiId);
          adapter.setPoiFocusEnabled(true);
          adapter.setMapFocusTarget({ lon: intent.lon, lat: intent.lat });
        }

        adapter.setActiveInfoMode("poi");
        return;
      }

      if (intent.kind === "weather") {
        clearMarkerSelections(adapter);
        adapter.selectStation(intent.stationId);
        adapter.setMapFocusTarget({ lon: intent.lon, lat: intent.lat });
        adapter.setActiveInfoMode("weather");
        return;
      }

      if (intent.kind === "road") {
        clearMarkerSelections(adapter);
        adapter.selectRoadSegment(intent.roadSegmentId);
        adapter.setMapFocusTarget({ lon: intent.lon, lat: intent.lat });
        adapter.setActiveInfoMode("road");
        return;
      }

      clearMarkerSelections(adapter);
      adapter.setActiveTravelItemId(intent.travelItemId);
      adapter.setMapFocusTarget({ lon: intent.lon, lat: intent.lat });
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
