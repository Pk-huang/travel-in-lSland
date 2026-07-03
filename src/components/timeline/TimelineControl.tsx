"use client";

import { useMemo } from "react";
import { Clock, RotateCcw } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useWorkspaceStore } from "@/src/lib/store/workspace";
import { cn } from "@/src/lib/utils";

/**
 * TimelineControl：底部時間軸控制器。
 *
 * 子步驟 2-3a（本版）：建立 2D 時間軸 UI，將使用者選擇寫入 Zustand 的 time 意圖狀態。
 *
 * - 本步只建立「時間意圖」：拖曳 range → setTime(ISO string)。
 * - 3D 場景讀取 time 並改變光影/鏡頭，留待 2-3b。
 * - 使用原生 input[type="range"]，避免為了單一控制先新增 UI 套件。
 */
const HOUR_OFFSETS = [-6, -3, 0, 3, 6, 9, 12, 18, 24] as const;

function formatTimeLabel(value: string | null): string {
  if (!value) return "現在";
  const date = new Date(value);
  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatOffsetLabel(offset: number): string {
  if (offset === 0) return "現在";
  return offset > 0 ? `+${offset}h` : `${offset}h`;
}

export function TimelineControl() {
  const selectedTime = useWorkspaceStore((s) => s.time);
  const setTime = useWorkspaceStore((s) => s.setTime);

  const slots = useMemo(() => {
    const base = new Date();
    base.setMinutes(0, 0, 0);
    return HOUR_OFFSETS.map((offset) => {
      const date = new Date(base);
      date.setHours(base.getHours() + offset);
      return { offset, iso: date.toISOString() };
    });
  }, []);

  const selectedIndex = Math.max(
    0,
    selectedTime
      ? slots.findIndex((slot) => slot.iso === selectedTime)
      : HOUR_OFFSETS.indexOf(0),
  );

  return (
    <section className="pointer-events-auto absolute right-4 bottom-4 left-4 z-20 mx-auto max-w-3xl rounded-xl border border-white/10 bg-black/45 px-4 py-3 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Clock className="size-4" />
          <span>時間軸</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/75">
            {formatTimeLabel(selectedTime)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTime(null)}
          aria-label="重設為現在"
          className="size-8 text-white hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <input
        type="range"
        min={0}
        max={slots.length - 1}
        step={1}
        value={selectedIndex}
        onChange={(event) => setTime(slots[Number(event.currentTarget.value)].iso)}
        aria-label="選擇時間"
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-sky-300",
          "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-200",
        )}
      />

      <div className="mt-2 grid grid-cols-9 text-center text-[11px] text-white/60">
        {HOUR_OFFSETS.map((offset) => (
          <span key={offset}>{formatOffsetLabel(offset)}</span>
        ))}
      </div>
    </section>
  );
}
