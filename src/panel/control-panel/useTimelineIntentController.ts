"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useWorkspaceStore, type PlaybackSpeed } from "@/src/lib/store/workspace";

const HOUR_OFFSETS = [-6, -3, 0, 3, 6, 9, 12, 18, 24] as const;
const PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [0.5, 1, 2] as const;
const MINUTE_MS = 60_000;
const TICK_MS = 200;
const BASE_ADVANCE_MINUTES_PER_SECOND = 24;

type UseTimelineIntentControllerResult = {
  selectedTime: number | null;
  playbackState: "playing" | "paused";
  playbackSpeed: PlaybackSpeed;
  playbackSpeeds: readonly PlaybackSpeed[];
  totalMinutes: number;
  selectedMinuteOffset: number;
  hourOffsets: readonly number[];
  onPlayPause: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onResetTime: () => void;
  onTimeChange: (time: number) => void;
  formatTimeLabel: (value: number | null) => string;
  formatOffsetLabel: (offset: number) => string;
};

export function useTimelineIntentController(): UseTimelineIntentControllerResult {
  const selectedTime = useWorkspaceStore((s) => s.time);
  const playbackState = useWorkspaceStore((s) => s.playbackState);
  const playbackSpeed = useWorkspaceStore((s) => s.playbackSpeed);
  const setTime = useWorkspaceStore((s) => s.setTime);
  const play = useWorkspaceStore((s) => s.play);
  const pause = useWorkspaceStore((s) => s.pause);
  const setSpeed = useWorkspaceStore((s) => s.setSpeed);

  const slots = useMemo(() => {
    const base = new Date();
    base.setMinutes(0, 0, 0);

    return HOUR_OFFSETS.map((offset) => {
      const date = new Date(base);
      date.setHours(base.getHours() + offset);
      return { offset, ms: date.getTime() };
    });
  }, []);

  const windowStartMs = slots[0].ms;
  const windowEndMs = slots[slots.length - 1].ms;
  const totalMinutes = Math.max(1, Math.round((windowEndMs - windowStartMs) / MINUTE_MS));
  const nowSlotIndex = HOUR_OFFSETS.indexOf(0);
  const effectiveTimeMs = Math.min(
    Math.max(selectedTime ?? slots[nowSlotIndex].ms, windowStartMs),
    windowEndMs,
  );
  const selectedMinuteOffset = Math.round((effectiveTimeMs - windowStartMs) / MINUTE_MS);

  const timerIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (playbackState !== "playing") {
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      return;
    }

    const intervalMs = TICK_MS;
    const advanceMs =
      (BASE_ADVANCE_MINUTES_PER_SECOND * MINUTE_MS * playbackSpeed * intervalMs) / 1000;

    const timer = window.setInterval(() => {
      const currentMs = Math.min(
        Math.max(selectedTime ?? Date.now(), windowStartMs),
        windowEndMs,
      );
      const nextMs = currentMs + advanceMs;

      if (nextMs >= windowEndMs) {
        setTime(windowEndMs);
        pause();
        return;
      }

      setTime(Math.round(nextMs));
    }, intervalMs);

    timerIdRef.current = timer;
    return () => window.clearInterval(timer);
  }, [pause, playbackSpeed, playbackState, selectedTime, setTime, windowEndMs, windowStartMs]);

  const onPlayPause = useCallback(() => {
    if (playbackState === "playing") {
      pause();
      return;
    }
    play();
  }, [pause, play, playbackState]);

  const onSpeedChange = useCallback(
    (speed: PlaybackSpeed) => {
      setSpeed(speed);
    },
    [setSpeed],
  );

  const onResetTime = useCallback(() => {
    setTime(null);
  }, [setTime]);

  const onTimeChange = useCallback(
    (time: number) => {
      setTime(windowStartMs + time * MINUTE_MS);
    },
    [setTime, windowStartMs],
  );

  const formatTimeLabel = useCallback((value: number | null) => {
    if (!value) return "現在";

    const date = new Date(value);
    return date.toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, []);

  const formatOffsetLabel = useCallback((offset: number) => {
    if (offset === 0) return "現在";
    return offset > 0 ? `+${offset}h` : `${offset}h`;
  }, []);

  return {
    selectedTime,
    playbackState,
    playbackSpeed,
    playbackSpeeds: PLAYBACK_SPEEDS,
    totalMinutes,
    selectedMinuteOffset,
    hourOffsets: HOUR_OFFSETS,
    onPlayPause,
    onSpeedChange,
    onResetTime,
    onTimeChange,
    formatTimeLabel,
    formatOffsetLabel,
  };
}
