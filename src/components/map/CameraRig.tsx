"use client";

import { useEffect, useRef, type ElementRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import {
  useWorkspaceStore,
  type TerrainDetailLevel,
} from "@/src/lib/store/workspace";
import {
  isHeightmapReadyForDetailLevel,
  preloadHeightmapForDetailLevel,
} from "@/src/lib/map/use-heightmap";
import {
  isLandcoverReadyForDetailLevel,
  preloadLandcoverForDetailLevel,
} from "@/src/lib/map/use-landcover";

const DEM_NEAR_ENTER_DISTANCE = 10;
const DEM_FAR_ENTER_DISTANCE = 11;
const DEM_SWITCH_COOLDOWN_MS = 300;

/**
 * CameraRig：相機操控裝置（rig = 相機 + 控制的整套）。
 *
 * 把相機控制獨立成一支，與 Terrain/光分離，方便除錯：
 * 「轉不動 / 翻到地底 / 縮太近遠」都看這支。
 *
 * 本版：僅切分，尚未加任何限制（純 OrbitControls + 慣性）。
 * 後續再逐步加：縮放範圍、不鑽地底、平移邊界、注視點 target。
 *
 * 命名避開 drei 內建的 <MapControls>，以免混淆。
 */
export function CameraRig() {
  const controlsRef = useRef<ElementRef<typeof OrbitControls> | null>(null);
  const terrainDetailLevel = useWorkspaceStore((s) => s.terrainDetailLevel);
  const setCameraDistance = useWorkspaceStore((s) => s.setCameraDistance);
  const setTerrainDetailLevel = useWorkspaceStore((s) => s.setTerrainDetailLevel);
  const lastDistanceRef = useRef<number | null>(null);
  const detailLevelRef = useRef(useWorkspaceStore.getState().terrainDetailLevel);
  const lastSwitchAtRef = useRef(0);
  const pendingTargetLevelRef = useRef<TerrainDetailLevel | null>(null);
  const pendingRequestIdRef = useRef(0);

  useEffect(() => {
    detailLevelRef.current = terrainDetailLevel;
  }, [terrainDetailLevel]);

  const switchDetailLevel = (target: TerrainDetailLevel, distance: number) => {
    detailLevelRef.current = target;
    lastSwitchAtRef.current = performance.now();
    setTerrainDetailLevel(target);
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[CameraRig] terrainDetailLevel -> ${target} | distance=${distance.toFixed(2)} | cooldown=${DEM_SWITCH_COOLDOWN_MS}ms`,
      );
    }
  };

  const requestSwitchWhenReady = (target: TerrainDetailLevel, distance: number) => {
    const currentDetailLevel = detailLevelRef.current;
    if (target === currentDetailLevel) return;

    const heightmapReady = isHeightmapReadyForDetailLevel(target);
    const landcoverReady = isLandcoverReadyForDetailLevel(target);
    if (heightmapReady && landcoverReady) {
      switchDetailLevel(target, distance);
      return;
    }

    if (pendingTargetLevelRef.current === target) {
      return;
    }

    pendingTargetLevelRef.current = target;
    const requestId = ++pendingRequestIdRef.current;

    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[CameraRig] wait data ready | target=${target} | demReady=${heightmapReady} | landcoverReady=${landcoverReady}`,
      );
    }

    void Promise.all([
      preloadHeightmapForDetailLevel(target),
      preloadLandcoverForDetailLevel(target),
    ]).then(() => {
      if (pendingRequestIdRef.current !== requestId) return;
      pendingTargetLevelRef.current = null;

      const latestDistance = lastDistanceRef.current ?? distance;
      const cooldownReady =
        performance.now() - lastSwitchAtRef.current >= DEM_SWITCH_COOLDOWN_MS;
      const stillEligible =
        target === "near"
          ? latestDistance <= DEM_NEAR_ENTER_DISTANCE
          : latestDistance >= DEM_FAR_ENTER_DISTANCE;
      if (!cooldownReady || !stillEligible) return;

      if (detailLevelRef.current !== target) {
        switchDetailLevel(target, latestDistance);
      }
    });
  };

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const now = performance.now();
    const distance = controls.object.position.distanceTo(controls.target);
    const previousDistance = lastDistanceRef.current;
    lastDistanceRef.current = distance;
    const currentDetailLevel = detailLevelRef.current;
    if (
      currentDetailLevel === "far" &&
      distance <= DEM_NEAR_ENTER_DISTANCE &&
      now - lastSwitchAtRef.current >= DEM_SWITCH_COOLDOWN_MS
    ) {
      requestSwitchWhenReady("near", distance);
    } else if (
      currentDetailLevel === "near" &&
      distance >= DEM_FAR_ENTER_DISTANCE &&
      now - lastSwitchAtRef.current >= DEM_SWITCH_COOLDOWN_MS
    ) {
      requestSwitchWhenReady("far", distance);
    }

    if (previousDistance !== null && Math.abs(previousDistance - distance) < 0.02) return;
    setCameraDistance(distance);
  });

  return <OrbitControls ref={controlsRef} enableDamping />;
}
