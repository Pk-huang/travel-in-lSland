"use client";

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

const ALERT_COLOR: Record<AlertLevel, string> = {
  low: "#3fb950",
  medium: "#d29922",
  high: "#f85149",
};

const ROAD_COLOR: Record<RoadStatus, string> = {
  open: "#3fb950",
  caution: "#d29922",
  closed: "#f85149",
};

/**
 * 天氣 / 路況摘要面板。純呈現，依 props 顯示 loading / error / 資料三種狀態。
 */
export function StatusPanel({ data, loading, error, onRetry }: StatusPanelProps) {
  if (loading && !data) {
    return <p style={styles.muted}>載入中…</p>;
  }

  if (error) {
    return (
      <div style={styles.errorBox}>
        <p style={{ margin: 0 }}>資料載入失敗：{error}</p>
        <button type="button" onClick={onRetry} style={styles.retry}>
          重試
        </button>
      </div>
    );
  }

  if (!data) {
    return <p style={styles.muted}>尚無資料。</p>;
  }

  const { meta, summary, weather, roads } = data;

  return (
    <section>
      {/* 摘要 + 資料狀態 */}
      <div style={styles.summaryRow}>
        <Metric label="風險分數" value={summary.riskScore} />
        <Metric label="高風險路段" value={summary.highRiskSegments} />
        <Metric label="天氣測站" value={weather.length} />
        <div style={styles.metaBadge}>
          <span>cache: {meta.cache}</span>
          {meta.fallback && <span style={styles.fallback}>備援資料</span>}
        </div>
      </div>

      <div style={styles.columns}>
        {/* 天氣 */}
        <div style={styles.column}>
          <h2 style={styles.h2}>天氣（{weather.length}）</h2>
          <ul style={styles.list}>
            {weather.slice(0, 20).map((w, i) => (
              <li key={`${w.lat}-${w.lon}-${i}`} style={styles.item}>
                <span style={{ ...styles.dot, background: ALERT_COLOR[w.alertLevel] }} />
                <span style={styles.coord}>
                  {w.lat.toFixed(2)}, {w.lon.toFixed(2)}
                </span>
                <span style={styles.value}>{w.temperatureC.toFixed(1)}°C</span>
                <span style={styles.muted}>風 {w.windSpeedMs.toFixed(1)} m/s</span>
              </li>
            ))}
          </ul>
          {weather.length > 20 && (
            <p style={styles.muted}>…另有 {weather.length - 20} 站</p>
          )}
        </div>

        {/* 路況 */}
        <div style={styles.column}>
          <h2 style={styles.h2}>路況（{roads.length}）</h2>
          <ul style={styles.list}>
            {roads.slice(0, 20).map((r) => (
              <li key={r.segmentId} style={styles.item}>
                <span style={{ ...styles.dot, background: ROAD_COLOR[r.status] }} />
                <span style={styles.roadName}>{r.name}</span>
                <span style={styles.value}>{r.status}</span>
                {r.reason && <span style={styles.muted}>{r.reason}</span>}
              </li>
            ))}
          </ul>
          {roads.length > 20 && (
            <p style={styles.muted}>…另有 {roads.length - 20} 段</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.metric}>
      <span style={styles.metricValue}>{value}</span>
      <span style={styles.metricLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  muted: { color: "#8a9bb3", fontSize: 13, margin: "4px 0" },
  errorBox: {
    padding: 16,
    border: "1px solid #f85149",
    borderRadius: 8,
    background: "#2a1416",
    color: "#ffd7d5",
  },
  retry: {
    marginTop: 8,
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #f85149",
    background: "transparent",
    color: "#ffd7d5",
    cursor: "pointer",
  },
  summaryRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 24,
    padding: 16,
    marginBottom: 20,
    borderRadius: 10,
    background: "#101a2b",
    border: "1px solid #2a3b52",
  },
  metric: { display: "flex", flexDirection: "column" },
  metricValue: { fontSize: 24, fontWeight: 700, color: "#fff" },
  metricLabel: { fontSize: 12, color: "#8a9bb3" },
  metaBadge: {
    marginLeft: "auto",
    display: "flex",
    gap: 10,
    fontSize: 12,
    color: "#8a9bb3",
  },
  fallback: { color: "#d29922", fontWeight: 600 },
  columns: { display: "flex", flexWrap: "wrap", gap: 24 },
  column: { flex: "1 1 320px", minWidth: 0 },
  h2: { fontSize: 16, margin: "0 0 12px", color: "#cfe0f5" },
  list: { listStyle: "none", margin: 0, padding: 0 },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 0",
    borderBottom: "1px solid #1a2638",
    fontSize: 13,
  },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  coord: { color: "#cfe0f5", fontVariantNumeric: "tabular-nums", minWidth: 110 },
  roadName: { color: "#cfe0f5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  value: { color: "#fff", fontWeight: 600 },
};
