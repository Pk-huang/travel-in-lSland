import { AppShell } from "@/src/app-shell/AppShell";
import { WorkspaceProvider } from "@/src/components/providers/WorkspaceProvider";

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
      <WorkspaceProvider>
        <AppShell />
      </WorkspaceProvider>
    </main>
  );
}
