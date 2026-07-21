"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ElementRef } from "react";
import { Spherical, Vector3 } from "three";

import { findPointOfInterestById } from "@/src/lib/config/poi";
import { useWorkspacePois } from "@/src/components/providers/WorkspaceProvider";
import {
  elevationToSceneY,
  lonLatToSceneXZ,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";
import { useWorkspaceStore } from "@/src/lib/store/workspace";

const DEFAULT_CAMERA_POSITION = new Vector3(12, 12, 12);
const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0);
const CAMERA_TRANSITION_MS = 900;
const POI_FOCUS_DISTANCE_MULTIPLIER = 2;
const CAMERA_HEIGHT_SCALE = 3;
const CAMERA_DISTANCE_SCALE = 3;
const CAMERA_MIN_DISTANCE = 6;
const CAMERA_MAX_DISTANCE = 90;
const CAMERA_MIN_POLAR_ANGLE = 0.35;
const CAMERA_MAX_POLAR_ANGLE = 1.45;
const MARKER_FOCUS_VIEW = {
  distance: 4,
  polarAngle: 1.05,
  azimuthAngle: 0.2,
};

const DEFAULT_CAMERA_POSITION_SCALED = new Vector3(
  DEFAULT_CAMERA_POSITION.x,
  DEFAULT_CAMERA_POSITION.y * CAMERA_HEIGHT_SCALE,
  DEFAULT_CAMERA_POSITION.z,
);

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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
  const heightmap = useHeightmap();
  const { points: pointsOfInterest } = useWorkspacePois();
  const activePoiId = useWorkspaceStore((s) => s.activePoiId);
  const poiFocusEnabled = useWorkspaceStore((s) => s.poiFocusEnabled);
  const mapFocusTarget = useWorkspaceStore((s) => s.mapFocusTarget);
  const activePoi = useMemo(
    () => findPointOfInterestById(pointsOfInterest, activePoiId),
    [activePoiId, pointsOfInterest],
  );
  const transitionRef = useRef<null | {
    startAt: number;
    fromPosition: Vector3;
    fromTarget: Vector3;
    toPosition: Vector3;
    toTarget: Vector3;
  }>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.minDistance = CAMERA_MIN_DISTANCE;
    controls.maxDistance = CAMERA_MAX_DISTANCE;
    controls.minPolarAngle = CAMERA_MIN_POLAR_ANGLE;
    controls.maxPolarAngle = CAMERA_MAX_POLAR_ANGLE;

    const nextTarget = DEFAULT_CAMERA_TARGET.clone();
    const nextPosition = DEFAULT_CAMERA_POSITION_SCALED.clone();
    let focusDistance = CAMERA_MIN_DISTANCE;

    if (poiFocusEnabled && activePoi) {
      const { x, z } = lonLatToSceneXZ(activePoi.lon, activePoi.lat);
      const surfaceY = heightmap
        ? elevationToSceneY(sampleElevationMeters(heightmap, activePoi.lon, activePoi.lat))
        : 0;
      nextTarget.set(x, surfaceY, z);

      focusDistance =
        activePoi.cameraView.distance * POI_FOCUS_DISTANCE_MULTIPLIER * CAMERA_DISTANCE_SCALE;

      const spherical = new Spherical(
        focusDistance,
        activePoi.cameraView.polarAngle,
        activePoi.cameraView.azimuthAngle,
      );
      const offset = new Vector3().setFromSpherical(spherical);
      nextPosition.copy(nextTarget).add(offset);
    } else if (mapFocusTarget) {
      const { x, z } = lonLatToSceneXZ(mapFocusTarget.lon, mapFocusTarget.lat);
      const surfaceY = heightmap
        ? elevationToSceneY(sampleElevationMeters(heightmap, mapFocusTarget.lon, mapFocusTarget.lat))
        : 0;
      nextTarget.set(x, surfaceY, z);

      focusDistance =
        MARKER_FOCUS_VIEW.distance * POI_FOCUS_DISTANCE_MULTIPLIER * CAMERA_DISTANCE_SCALE;

      const spherical = new Spherical(
        focusDistance,
        MARKER_FOCUS_VIEW.polarAngle,
        MARKER_FOCUS_VIEW.azimuthAngle,
      );
      const offset = new Vector3().setFromSpherical(spherical);
      nextPosition.copy(nextTarget).add(offset);
    }

    transitionRef.current = {
      startAt: performance.now(),
      fromPosition: controls.object.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition: nextPosition,
      toTarget: nextTarget,
    };
  }, [activePoi, heightmap, mapFocusTarget, poiFocusEnabled]);

  useFrame(() => {
    const controls = controlsRef.current;
    const transition = transitionRef.current;
    if (!controls || !transition) return;

    const elapsed = performance.now() - transition.startAt;
    const progress = Math.min(1, elapsed / CAMERA_TRANSITION_MS);
    const easedProgress = easeInOutCubic(progress);

    controls.object.position.lerpVectors(
      transition.fromPosition,
      transition.toPosition,
      easedProgress,
    );
    controls.target.lerpVectors(
      transition.fromTarget,
      transition.toTarget,
      easedProgress,
    );
    controls.update();

    if (progress >= 1) {
      transitionRef.current = null;
    }
  });

  return <OrbitControls ref={controlsRef} enableDamping />;
}
