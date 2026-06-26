"use client";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type {
  AlertLevel,
  IcelandStatusResponse,
  RoadStatus,
} from "@/src/types";

export type StatusPanelProps = {
  data: IcelandStatusResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

/** 警示等級 → 圓點顏色（語意色，非主題色，故用固定 Tailwind 色階）。 */
const ALERT_DOT: Record<AlertLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

const ROAD_DOT: Record<RoadStatus, string> = {
  open: "bg-emerald-500",
  caution: "bg-amber-500",
  closed: "bg-red-500",
};

/**
 * 天氣 / 路況摘要面板。純呈現，依 props 顯示 loading / error / 資料三種狀態。
 */
export function StatusPanel({ data, loading, error, onRetry }: StatusPanelProps) {
  if (loading && !data) {
    return <p className="text-muted-foreground text-sm">載入中…</p>;
  }

  if (error) {
    return (
      <Card className="border-destructive/60">
        <CardContent className="space-y-3 pt-6">
          <p className="text-destructive text-sm">資料載入失敗：{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            重試
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">尚無資料。</p>;
  }

  const { meta, summary, weather, roads } = data;

  return (
    <section className="space-y-4">
      {/* 摘要 + 資料狀態 */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 pt-6">
          <Metric label="風險分數" value={summary.riskScore} />
          <Metric label="高風險路段" value={summary.highRiskSegments} />
          <Metric label="天氣測站" value={weather.length} />
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary">cache: {meta.cache}</Badge>
            {meta.fallback && <Badge variant="destructive">備援資料</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {/* 天氣 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">天氣（{weather.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {weather.slice(0, 20).map((w, i) => (
                <li
                  key={`${w.lat}-${w.lon}-${i}`}
                  className="flex items-center gap-2.5 py-1.5 text-sm"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${ALERT_DOT[w.alertLevel]}`}
                  />
                  <span className="text-muted-foreground min-w-[110px] tabular-nums">
                    {w.lat.toFixed(2)}, {w.lon.toFixed(2)}
                  </span>
                  <span className="font-semibold">
                    {w.temperatureC.toFixed(1)}°C
                  </span>
                  <span className="text-muted-foreground">
                    風 {w.windSpeedMs.toFixed(1)} m/s
                  </span>
                </li>
              ))}
            </ul>
            {weather.length > 20 && (
              <p className="text-muted-foreground mt-2 text-xs">
                …另有 {weather.length - 20} 站
              </p>
            )}
          </CardContent>
        </Card>

        {/* 路況 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">路況（{roads.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {roads.slice(0, 20).map((r) => (
                <li
                  key={r.segmentId}
                  className="flex items-center gap-2.5 py-1.5 text-sm"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${ROAD_DOT[r.status]}`}
                  />
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="font-semibold">{r.status}</span>
                  {r.reason && (
                    <span className="text-muted-foreground">{r.reason}</span>
                  )}
                </li>
              ))}
            </ul>
            {roads.length > 20 && (
              <p className="text-muted-foreground mt-2 text-xs">
                …另有 {roads.length - 20} 段
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
