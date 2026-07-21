import { Suspense } from "react";

import { MapCanvasLoader } from "@/src/components/map/MapCanvasLoader";
import { FloatingPanel } from "@/src/components/panel/FloatingPanel";
import { InfoModeDock } from "@/src/components/panel/InfoModeDock";
import { WorkspaceProvider } from "@/src/components/providers/WorkspaceProvider";
import { TimelineControl } from "@/src/components/timeline/TimelineControl";

/**
 * 首頁：Server Component（全螢幕版面外框，Google Maps 風格）。
 *
 * 結構分層：
 *   - MapCanvas：鋪滿視口的地圖背景（底層）
 *   - FloatingPanel：浮在地圖之上、可收合的操作面板（內含 ControlPanel）
 *
 * 兩者為對等 client 島，透過 Zustand store（意圖狀態）與 WorkspaceProvider
 * （後端資料）連動，彼此為兄弟而非父子。詳見 IMPLEMENTATION_PROGRESS_LOG.md 1.5-3。
 */
export default function HomePage() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* WorkspaceProvider 在頂層抓一次資料，供兩島共用 */}
      <WorkspaceProvider>
        {/* 底層：全螢幕地圖背景（dynamic import，three.js 不進首包） */}
        <MapCanvasLoader />
        {/* 上層：浮動操作面板（pointer-events 由子層各自開啟） */}
        <div className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <FloatingPanel />
          </Suspense>
          <InfoModeDock />
          <TimelineControl />
        </div>
      </WorkspaceProvider>
    </main>
  );
}
