"use client";

import { Suspense } from "react";

import { MapCanvasLoader } from "@/src/components/map/MapCanvasLoader";
import { FloatingPanel } from "@/src/components/panel/FloatingPanel";
import { InfoModeDock } from "@/src/components/panel/InfoModeDock";
import { WeatherDrawer } from "@/src/components/panel/WeatherDrawer";
import { TimelineControl } from "@/src/components/timeline/TimelineControl";
import { SharedViewStateProvider } from "@/src/app-shell/SharedViewState";

export function AppShell() {
  return (
    <SharedViewStateProvider>
      <MapCanvasLoader />
      <div className="pointer-events-none absolute inset-0">
        <Suspense fallback={null}>
          <FloatingPanel />
        </Suspense>
        <WeatherDrawer />
        <InfoModeDock />
        <TimelineControl />
      </div>
    </SharedViewStateProvider>
  );
}
