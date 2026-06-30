"use client";

import dynamic from "next/dynamic";

/**
 * MapCanvasLoader：MapCanvas 的動態載入器（client island）。
 *
 * 目的：
 * - 讓 three.js / R3F 只在瀏覽器端載入，不打進首屏 SSR 與初始 JS bundle。
 * - WebGL 僅 client，ssr:false 可避免伺服器嘗試渲染。
 * - 提供 loading fallback，下載 three.js chunk 期間先顯示佔位（避免空白/閃爍）。
 *
 * 註：ssr:false 的 dynamic import 不能放在 Server Component，
 * 因此包成這支 client 載入器，再由 page（Server Component）引用。
 */
const MapCanvas = dynamic(
  () => import("@/src/components/map/MapCanvas").then((mod) => mod.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_oklch(0.22_0.03_250)_0%,_oklch(0.13_0.02_250)_100%)]">
        <p className="text-muted-foreground text-sm">地圖載入中…</p>
      </div>
    ),
  },
);

export function MapCanvasLoader() {
  return <MapCanvas />;
}
