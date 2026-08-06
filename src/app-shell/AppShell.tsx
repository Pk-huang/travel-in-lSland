"use client";

import { MapCanvasLoader } from "@/src/components/map/MapCanvasLoader";
import { ShellUiStateProvider } from "@/src/app-shell/ShellUiState";
import { PanelModule } from "@/src/PanelModule";

export function AppShell() {
  return (
    <ShellUiStateProvider>
      <MapCanvasLoader />
      <PanelModule />
    </ShellUiStateProvider>
  );
}
