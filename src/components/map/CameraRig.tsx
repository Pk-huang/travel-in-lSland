"use client";

import { useRef, type ElementRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { useWorkspaceStore } from "@/src/lib/store/workspace";

const DEM_NEAR_ENTER_DISTANCE = 10;
const DEM_FAR_ENTER_DISTANCE = 11;

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
  const setCameraDistance = useWorkspaceStore((s) => s.setCameraDistance);
  const setTerrainDetailLevel = useWorkspaceStore((s) => s.setTerrainDetailLevel);
  const lastDistanceRef = useRef<number | null>(null);
  const detailLevelRef = useRef(useWorkspaceStore.getState().terrainDetailLevel);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const distance = controls.object.position.distanceTo(controls.target);
    const currentDetailLevel = detailLevelRef.current;
    if (
      currentDetailLevel === "far" &&
      distance <= DEM_NEAR_ENTER_DISTANCE
    ) {
      detailLevelRef.current = "near";
      setTerrainDetailLevel("near");
      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[CameraRig] terrainDetailLevel -> near | distance=${distance.toFixed(2)} (<= ${DEM_NEAR_ENTER_DISTANCE})`,
        );
      }
    } else if (
      currentDetailLevel === "near" &&
      distance >= DEM_FAR_ENTER_DISTANCE
    ) {
      detailLevelRef.current = "far";
      setTerrainDetailLevel("far");
      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[CameraRig] terrainDetailLevel -> far  | distance=${distance.toFixed(2)} (>= ${DEM_FAR_ENTER_DISTANCE})`,
        );
      }
    }

    const lastDistance = lastDistanceRef.current;
    if (lastDistance !== null && Math.abs(lastDistance - distance) < 0.02) return;
    lastDistanceRef.current = distance;
    setCameraDistance(distance);
  });

  return <OrbitControls ref={controlsRef} enableDamping />;
}
