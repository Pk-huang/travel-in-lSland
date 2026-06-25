"use client";

import { REGION_LABELS } from "@/src/lib/config/app";
import type { Region } from "@/src/types";

const REGIONS: Region[] = ["south", "west", "north", "east", "all"];

export type RegionSelectorProps = {
  value: Region;
  onChange: (region: Region) => void;
  disabled?: boolean;
};

/**
 * region 切換按鈕列。純呈現 + 回呼，不持有狀態。
 */
export function RegionSelector({
  value,
  onChange,
  disabled = false,
}: RegionSelectorProps) {
  return (
    <nav aria-label="選擇地區" style={styles.row}>
      {REGIONS.map((region) => {
        const active = region === value;
        return (
          <button
            key={region}
            type="button"
            onClick={() => onChange(region)}
            disabled={disabled}
            aria-pressed={active}
            style={{
              ...styles.button,
              ...(active ? styles.active : {}),
              ...(disabled ? styles.disabled : {}),
            }}
          >
            {REGION_LABELS[region]}
          </button>
        );
      })}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  button: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #2a3b52",
    background: "#101a2b",
    color: "#cfe0f5",
    cursor: "pointer",
    fontSize: 14,
  },
  active: {
    background: "#2d6cdf",
    borderColor: "#2d6cdf",
    color: "#fff",
    fontWeight: 600,
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
