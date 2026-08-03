"use client";

import { PanelFeatureBlocks } from "@/src/panel/feature-blocks/PanelFeatureBlocks";
import { PanelShell } from "@/src/panel/shell/PanelShell";

export function PanelModule() {
  return (
    <>
      <PanelShell />
      <PanelFeatureBlocks />
    </>
  );
}
