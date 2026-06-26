"use client";

import { RegionSelector } from "@/src/components/panel/RegionSelector";
import { StatusPanel } from "@/src/components/panel/StatusPanel";
import { useWorkspaceData } from "@/src/components/providers/WorkspaceProvider";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * ControlPanel：操作面板島（client island）。
 *
 * 職責單一＝「操作 + 呈現摘要」。意圖狀態（region）讀寫自 Zustand store；
 * 後端資料讀自 WorkspaceProvider（Context）。不持有資料、不負責抓取——
 * 與 MapCanvas 為對等兄弟，兩者透過 store / context 連動，而非父子關係。
 */
export function ControlPanel() {
  const region = useWorkspaceStore((s) => s.region);
  const setRegion = useWorkspaceStore((s) => s.setRegion);
  const { data, loading, error, refetch } = useWorkspaceData();

  return (
    <div className="space-y-4">
      <RegionSelector value={region} onChange={setRegion} disabled={loading} />
      <StatusPanel
        data={data}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
