"use client";

import { InfoModeDock } from "@/src/components/panel/InfoModeDock";
import { WeatherDrawer } from "@/src/components/panel/WeatherDrawer";
import { TimelineControl } from "@/src/components/timeline/TimelineControl";

export function PanelFeatureBlocks() {
  return (
    <>
      <WeatherDrawer />
      <InfoModeDock />
      <TimelineControl />
    </>
  );
}
