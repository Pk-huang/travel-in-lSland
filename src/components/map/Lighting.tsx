"use client";

import { useMemo } from "react";

import { useWorkspaceStore } from "@/src/lib/store/workspace";

/**
 * Lighting：3D 場景光照層。
 *
 * 子步驟 2-3b（本版）：讀取時間軸 time，讓場景光照隨時間變化。
 *
 * - time = null 時使用瀏覽器當下時間（「現在」）。
 * - 白天/夜晚只做保守亮度差異，避免整個場景被洗白。
 * - 方向光位置依小時沿水平面旋轉，形成時間推進感。
 * - 不使用 useFrame：只有 time 改變時才重新計算光照，避免每幀重建。
 */
export function computeLighting(date: Date) {
  const validDate = Number.isFinite(date.getTime()) ? date : new Date();
  const hour = validDate.getHours() + validDate.getMinutes() / 60;
  const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const ambientIntensity = 0.22 + daylight * 0.38;
  const sunIntensity = 0.35 + daylight * 0.85;
  const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
  const sunHeight = 4 + daylight * 4;

  return {
    hour,
    daylight,
    skyColor: daylight > 0.2 ? "#bcd3e6" : "#4c5f78",
    groundColor: daylight > 0.2 ? "#2e3226" : "#171b20",
    ambientIntensity,
    sunIntensity,
    sunColor: daylight > 0.2 ? "#fdf6ec" : "#7fa8d8",
    sunPosition: [Math.cos(sunAngle) * 8, sunHeight, Math.sin(sunAngle) * 8] as const,
  };
}

export function Lighting() {
  const selectedTime = useWorkspaceStore((s) => s.time);

  const lighting = useMemo(() => {
    return computeLighting(selectedTime ? new Date(selectedTime) : new Date());
  }, [selectedTime]);

  return (
    <>
      <hemisphereLight
        color={lighting.skyColor}
        groundColor={lighting.groundColor}
        intensity={lighting.ambientIntensity}
      />
      <directionalLight
        position={lighting.sunPosition}
        intensity={lighting.sunIntensity}
        color={lighting.sunColor}
      />
    </>
  );
}
