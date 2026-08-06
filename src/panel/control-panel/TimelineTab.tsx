"use client";

import { Clock, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import type { PlaybackSpeed } from "@/src/lib/store/workspace";
import { cn } from "@/src/lib/utils";
import { useTimelineIntentController } from "./useTimelineIntentController";

export function TimelineTab() {
  const {
    selectedTime,
    playbackState,
    playbackSpeed,
    playbackSpeeds,
    totalMinutes,
    selectedMinuteOffset,
    hourOffsets,
    onPlayPause,
    onSpeedChange,
    onResetTime,
    onTimeChange,
    formatTimeLabel,
    formatOffsetLabel,
  } = useTimelineIntentController();

  return (
    <section className="mx-auto w-full space-y-3 rounded-lg border border-white/10 bg-black/15 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Clock className="size-4" />
          <span>時間軸</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/75">
            {formatTimeLabel(selectedTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            aria-label={playbackState === "playing" ? "暫停播放" : "開始播放"}
            className="size-8 text-white hover:bg-white/10 hover:text-white"
          >
            {playbackState === "playing" ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>

          <label htmlFor="timeline-speed" className="sr-only">
            播放速度
          </label>
          <select
            id="timeline-speed"
            name="timeline-speed"
            value={String(playbackSpeed)}
            onChange={(event) => onSpeedChange(Number(event.currentTarget.value) as PlaybackSpeed)}
            className="h-8 rounded-md border border-white/20 bg-black/30 px-2 text-xs text-white outline-none transition focus:border-white/40"
            aria-label="播放速度"
          >
            {playbackSpeeds.map((speed) => (
              <option key={speed} value={speed} className="bg-zinc-900 text-white">
                {speed}x
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={onResetTime}
            aria-label="重設為現在"
            className="size-8 text-white hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={totalMinutes}
        step={1}
        value={selectedMinuteOffset}
        onChange={(event) => onTimeChange(Number(event.currentTarget.value))}
        aria-label="選擇時間"
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-sky-300",
          "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-200",
        )}
      />

      <div className="grid grid-cols-9 text-center text-[11px] text-white/60">
        {hourOffsets.map((offset) => (
          <span key={offset}>{formatOffsetLabel(offset)}</span>
        ))}
      </div>
    </section>
  );
}
