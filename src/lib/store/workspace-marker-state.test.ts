import { beforeEach, describe, expect, it } from "vitest";

import { useWorkspaceStore } from "./workspace";

describe("workspace marker state consistency", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...useWorkspaceStore.getInitialState() });
  });

  it("starts with the map info panel collapsed", () => {
    expect(useWorkspaceStore.getState().activeInfoPanelSection).toBeNull();
    expect(useWorkspaceStore.getState().isMapInfoOpen).toBe(false);
  });

  it("changes map modes without opening the info panel", () => {
    for (const mode of ["weather", "poi", "road"] as const) {
      useWorkspaceStore.getState().setActiveInfoPanelSection(mode);
      expect(useWorkspaceStore.getState().activeInfoPanelSection).toBe(mode);
      expect(useWorkspaceStore.getState().isMapInfoOpen).toBe(false);
    }
  });

  it("preserves mode and marker selection when the info panel closes", () => {
    const state = useWorkspaceStore.getState();
    state.setActiveInfoPanelSection("weather");
    state.selectStation("station-a");
    state.setMapInfoOpen(true);
    expect(useWorkspaceStore.getState().isMapInfoOpen).toBe(true);

    state.setActiveInfoPanelSection("road");
    expect(useWorkspaceStore.getState().isMapInfoOpen).toBe(true);
    state.setMapInfoOpen(false);
    expect(useWorkspaceStore.getState().activeInfoPanelSection).toBe("road");
    expect(useWorkspaceStore.getState().selectedStationId).toBe("station-a");
    expect(useWorkspaceStore.getState().isMapInfoOpen).toBe(false);
  });

  it("clears stale marker state when a new marker is selected", () => {
    const state = useWorkspaceStore.getState();

    state.setActivePoi("poi-1");
    state.setPoiFocusEnabled(true);
    state.setActiveInfoPanelSection("poi");
    state.setMapFocusTarget({ lon: -21.94, lat: 64.15 });
    state.selectStation("station-2");

    expect(useWorkspaceStore.getState().activePoiId).toBe("poi-1");
    expect(useWorkspaceStore.getState().selectedStationId).toBe("station-2");

    state.setActivePoi("poi-3");
    state.setMapFocusTarget({ lon: -18.5, lat: 64.4 });
    state.setPoiFocusEnabled(true);

    expect(useWorkspaceStore.getState().activePoiId).toBe("poi-3");
    expect(useWorkspaceStore.getState().selectedStationId).toBe("station-2");

    state.clearPoiFocus();
    expect(useWorkspaceStore.getState().activePoiId).toBeNull();
    expect(useWorkspaceStore.getState().poiFocusEnabled).toBe(false);
    expect(useWorkspaceStore.getState().mapFocusTarget).toBeNull();
  });

  it("keeps current mode when blank-map clear runs", () => {
    const state = useWorkspaceStore.getState();
    state.setActiveInfoPanelSection("weather");
    state.selectStation("station-a");
    state.setActivePoi("poi-a");
    state.setPoiFocusEnabled(true);
    state.setMapFocusTarget({ lon: -20, lat: 63 });

    state.clearPoiFocus();

    expect(useWorkspaceStore.getState().activeInfoPanelSection).toBe("weather");
    expect(useWorkspaceStore.getState().selectedStationId).toBe("station-a");
  });
});
