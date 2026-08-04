"use client";

import { Button } from "@/src/components/ui/button";
import { REGION_LABELS } from "@/src/lib/config/app";
import type { Region } from "@/src/types";

const REGIONS: Region[] = ["south", "west", "north", "east", "all"];

export type RegionSelectorProps = {
  value: Region;
  onChange: (region: Region) => void;
  onSelect?: (region: Region) => void;
  disabled?: boolean;
};

/**
 * region 切換按鈕列。純呈現 + 回呼，不持有狀態。
 */
export function RegionSelector({
  value,
  onChange,
  onSelect,
  disabled = false,
}: RegionSelectorProps) {
  return (
    <nav aria-label="選擇地區" className="flex flex-wrap gap-2">
      {REGIONS.map((region) => {
        const active = region === value;
        return (
          <Button
            key={region}
            type="button"
            size="sm"
            variant={active ? "default" : "secondary"}
            onClick={() => {
              onChange(region);
              onSelect?.(region);
            }}
            disabled={disabled}
            aria-pressed={active}
          >
            {REGION_LABELS[region]}
          </Button>
        );
      })}
    </nav>
  );
}
