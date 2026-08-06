"use client";

import { Button } from "@/src/components/ui/button";
import { REGION_LABELS } from "@/src/lib/config/app";
import type { Region } from "@/src/types";
import { useDisplaySettingsController } from "./useDisplaySettingsController";

const REGIONS: Region[] = ["south", "west", "north", "east", "all"];

export function DisplayTab() {
  const { region, regionLabel, loading, onRegionChange, onRegionSelect } = useDisplaySettingsController();

  return (
    <section className="mx-auto w-full space-y-3 rounded-lg border border-white/10 bg-black/15 p-3">
      <div>
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">顯示控制</p>
        <p className="text-[11px] text-white/55">
          區域切換已從左側移入這裡，左側面板現在只負責資訊顯示。
        </p>
      </div>

      <nav aria-label="選擇地區" className="flex flex-wrap gap-2">
        {REGIONS.map((nextRegion) => {
          const active = nextRegion === region;

          return (
            <Button
              key={nextRegion}
              type="button"
              size="sm"
              variant={active ? "default" : "secondary"}
              onClick={() => {
                onRegionChange(nextRegion);
                onRegionSelect(nextRegion);
              }}
              disabled={loading}
              aria-pressed={active}
            >
              {REGION_LABELS[nextRegion]}
            </Button>
          );
        })}
      </nav>

      <p className="text-[11px] text-white/55">
        目前區域：{regionLabel}（{REGION_LABELS[region]}），切換後會更新左側摘要與地圖資料。
      </p>
    </section>
  );
}
