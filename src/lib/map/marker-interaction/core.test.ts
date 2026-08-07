import assert from "node:assert/strict";
import test from "node:test";

import {
  transitionMarkerInteraction,
  type MarkerInteractionCoreState,
  type MarkerInteractionIntent,
} from "./core.ts";

function createBaseState(
  overrides: Partial<MarkerInteractionCoreState> = {},
): MarkerInteractionCoreState {
  return {
    activePoiId: null,
    activeTravelItemId: null,
    poiFocusEnabled: false,
    selectedStationId: null,
    selectedRoadSegmentId: null,
    activeInfoMode: null,
    mapFocusTarget: null,
    ...overrides,
  };
}

type TransitionCase = {
  name: string;
  state: MarkerInteractionCoreState;
  intent: MarkerInteractionIntent;
  expected: MarkerInteractionCoreState;
};

const cases: TransitionCase[] = [
  {
    name: "select poi should activate poi and focus map",
    state: createBaseState(),
    intent: {
      type: "select-marker",
      kind: "poi",
      poiId: "poi-1",
      lon: -21.94,
      lat: 64.15,
    },
    expected: createBaseState({
      activePoiId: "poi-1",
      poiFocusEnabled: true,
      activeInfoMode: "poi",
      mapFocusTarget: { lon: -21.94, lat: 64.15 },
    }),
  },
  {
    name: "select same poi should toggle off and clear focus",
    state: createBaseState({
      activePoiId: "poi-1",
      poiFocusEnabled: true,
      activeInfoMode: "poi",
      mapFocusTarget: { lon: -21.94, lat: 64.15 },
    }),
    intent: {
      type: "select-marker",
      kind: "poi",
      poiId: "poi-1",
      lon: -21.94,
      lat: 64.15,
    },
    expected: createBaseState({
      activeInfoMode: "poi",
    }),
  },
  {
    name: "select weather should clear poi and set weather selection",
    state: createBaseState({
      activePoiId: "poi-1",
      poiFocusEnabled: true,
      activeTravelItemId: "travel-1",
      activeInfoMode: "poi",
    }),
    intent: {
      type: "select-marker",
      kind: "weather",
      stationId: "station-2",
      lon: -20.1,
      lat: 64.02,
    },
    expected: createBaseState({
      selectedStationId: "station-2",
      activeInfoMode: "weather",
      mapFocusTarget: { lon: -20.1, lat: 64.02 },
    }),
  },
  {
    name: "select road should clear others and set road selection",
    state: createBaseState({
      activePoiId: "poi-2",
      poiFocusEnabled: true,
      selectedStationId: "station-5",
      activeInfoMode: "weather",
    }),
    intent: {
      type: "select-marker",
      kind: "road",
      roadSegmentId: "road-9",
      lon: -19.2,
      lat: 63.7,
    },
    expected: createBaseState({
      selectedRoadSegmentId: "road-9",
      activeInfoMode: "road",
      mapFocusTarget: { lon: -19.2, lat: 63.7 },
    }),
  },
  {
    name: "select travel should keep current mode and set travel focus",
    state: createBaseState({
      activePoiId: "poi-3",
      poiFocusEnabled: true,
      selectedRoadSegmentId: "road-1",
      activeInfoMode: "road",
    }),
    intent: {
      type: "select-marker",
      kind: "travel",
      travelItemId: "travel-item-2",
      lon: -18.5,
      lat: 64.4,
    },
    expected: createBaseState({
      activeTravelItemId: "travel-item-2",
      activeInfoMode: "road",
      mapFocusTarget: { lon: -18.5, lat: 64.4 },
    }),
  },
  {
    name: "clear blank-map should clear selections but keep mode",
    state: createBaseState({
      activePoiId: "poi-9",
      poiFocusEnabled: true,
      selectedStationId: "station-1",
      selectedRoadSegmentId: "road-2",
      activeTravelItemId: "travel-7",
      activeInfoMode: "weather",
      mapFocusTarget: { lon: -18.1, lat: 63.9 },
    }),
    intent: {
      type: "clear-interaction",
      source: "blank-map",
    },
    expected: createBaseState({
      activeInfoMode: "weather",
    }),
  },
  {
    name: "clear panel-close should clear selections and mode",
    state: createBaseState({
      selectedStationId: "station-3",
      activeInfoMode: "weather",
      mapFocusTarget: { lon: -17.8, lat: 63.6 },
    }),
    intent: {
      type: "clear-interaction",
      source: "panel-close",
    },
    expected: createBaseState(),
  },
  {
    name: "clear mode-switch should clear selections and mode",
    state: createBaseState({
      selectedRoadSegmentId: "road-8",
      activeInfoMode: "road",
      mapFocusTarget: { lon: -21.2, lat: 64.0 },
    }),
    intent: {
      type: "clear-interaction",
      source: "mode-switch",
    },
    expected: createBaseState(),
  },
];

test("transitionMarkerInteraction should preserve frozen phase-2 behavior", () => {
  for (const transitionCase of cases) {
    const next = transitionMarkerInteraction(
      transitionCase.state,
      transitionCase.intent,
    );
    assert.deepEqual(next, transitionCase.expected, transitionCase.name);
  }
});