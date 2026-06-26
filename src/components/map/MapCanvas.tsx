"use client";

import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { REGION_LABELS } from "@/src/lib/config/app";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * MapCanvas：3D 地圖島（client island）— 全螢幕背景層，目前為 placeholder 空殼。
 *
 * 版面定位採 Google Maps 風格：地圖鋪滿整個視口當底層背景（z 最低），
 * 操作面板（FloatingPanel）浮在其上。MapCanvas 自身只負責「填滿父容器」，
 * 由 page 的 relative 容器決定它鋪滿全螢幕。
 *
 * 與 ControlPanel 為對等兄弟：同樣讀 store.region 與 Context 的 data，
 * 證明兄弟連動（切 region 時此處的測站數同步變動）。
 *
 * Phase 2-1 起，將把下方佔位區換成 <Canvas>（@react-three/fiber）：
 *   - 2-1：地形 + OrbitControls
 *   - 2-2：以 data.weather 的 lat/lon 用 InstancedMesh 畫 43 個測站點位
 * 屆時版面/兄弟關係/資料流不需更動，只替換佔位內容。
 */
export function MapCanvas() {
  const region = useWorkspaceStore((s) => s.region);
  const { data, loading } = useWorkspaceData();
  const stationCount = data?.weather.length ?? 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_center,_oklch(0.22_0.03_250)_0%,_oklch(0.13_0.02_250)_100%)]">
      <span className="text-muted-foreground text-sm tracking-wide uppercase">
        3D 地圖（建置中）
      </span>
      <p className="text-foreground/80 text-sm">
        {REGION_LABELS[region]} ·{" "}
        {loading ? "載入測站中…" : `${stationCount} 個測站待渲染`}
      </p>
      <p className="text-muted-foreground max-w-xs text-center text-xs">
        Phase 2-1 將在此掛載 Three.js 場景；目前先驗證版面與資料連動。
      </p>
    </div>
  );
}

