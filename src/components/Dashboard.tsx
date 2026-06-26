"use client";

import { useState } from "react";

import { RegionSelector } from "@/src/components/RegionSelector";
import { StatusPanel } from "@/src/components/StatusPanel";
import { useIcelandStatus } from "@/src/lib/client/use-iceland-status";
import { DEFAULT_REGION } from "@/src/lib/config/app";
import type { Region } from "@/src/types";

/**
 * Dashboard：互動島（client island）。
 *
 * 持有 region state 與資料抓取（useIcelandStatus），是頁面唯一需要 hydrate 的區塊。
 * page.tsx 維持 Server Component（靜態外框/標題不送 JS），互動邏輯全部收斂在此。
 *
 * 後續（Phase 2）3D 地圖、時間軸等互動元件都掛在此島或其子樹，
 * 屆時再把版面改為 grid 三欄；目前先維持最小搬移。
 */
export function Dashboard() {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const { data, loading, error, refetch } = useIcelandStatus(region);

  return (
    <>
      <RegionSelector value={region} onChange={setRegion} disabled={loading} />
      <StatusPanel
        data={data}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </>
  );
}
