"use client";

import { Suspense } from "react";

import { FloatingPanel } from "@/src/components/panel/FloatingPanel";

export function PanelShell() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Suspense fallback={null}>
        <FloatingPanel />
      </Suspense>
    </div>
  );
}
