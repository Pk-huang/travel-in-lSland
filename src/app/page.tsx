"use client";

import { useState } from "react";

import { RegionSelector } from "@/src/components/RegionSelector";
import { StatusPanel } from "@/src/components/StatusPanel";
import { useIcelandStatus } from "@/src/lib/client/use-iceland-status";
import { DEFAULT_REGION } from "@/src/lib/config/app";
import type { Region } from "@/src/types";

/**
 * 首頁：最小資料面板（Phase 1.5-1）。
 *
 * 註：目前整頁標 "use client" 為快速 demo 的簡化做法。
 * 正確的島嶼架構（page=Server、僅互動元件下放為 client）為已記錄技術債，
 * 將於 Phase 2 一併補齊。詳見 IMPLEMENTATION_PROGRESS_LOG.md。
 */
export default function HomePage() {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const { data, loading, error, refetch } = useIcelandStatus(region);

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>Iceland Insight</h1>
        <p style={styles.subtitle}>即時冰島天氣與路況（最小版）</p>
      </header>

      <RegionSelector value={region} onChange={setRegion} disabled={loading} />
      <StatusPanel
        data={data}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 20px 64px",
  },
  header: { marginBottom: 24 },
  title: { fontSize: 28, margin: 0, color: "#fff" },
  subtitle: { margin: "4px 0 0", color: "#8a9bb3", fontSize: 14 },
};
