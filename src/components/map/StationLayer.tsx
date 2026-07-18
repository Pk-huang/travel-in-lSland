"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D } from "three";

import type { WeatherConditions, AlertLevel } from "@/src/types";
import {
  lonLatToSceneXZ,
  elevationToSceneY,
  sampleElevationMeters,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";

/**
 * StationLayer：氣象測站點位層。
 *
 * 子步驟 2-2d（本版）：依 alertLevel 逐站上風險色。
 *
 * - 資料由 MapCanvas 以 prop 傳入（R3F Canvas 是獨立 render root，context 不穿透）。
 * - 水平座標 lonLatToSceneXZ(lon,lat) → (x,z)；高度 Y 以 sampleElevationMeters + elevationToSceneY
 *   取該點地形表面高度（與 Terrain 同一條公式），再加半徑讓球坐在地表上。
 * - 風險色：依 alertLevel（low/medium/high）寫入 InstancedMesh 的 instanceColor（每站不同色）。
 * - InstancedMesh：共用一顆小球 geometry，一次 draw call 擺 N 個位置（效能優先）。
 * - 每個 instance 的 matrix 以 useMemo 預算，不在 render loop 重建。
 */

/** 風險等級 → 顏色（low 綠、medium 琥珀、high 紅）。 */
const ALERT_COLOR: Record<AlertLevel, string> = {
  low: "#3fb950",
  medium: "#f0a92b",
  high: "#f0553a",
};

/** 測站小球半徑（unit）。 */
const STATION_RADIUS = 0.35;

/** 球心相對地表再抬高的偏移（unit），讓球明顯坐在地表上而非陷入。 */
const STATION_SURFACE_OFFSET = 0.15;

export function StationLayer({ stations }: { stations: WeatherConditions[] }) {
  const heightmap = useHeightmap();

  // 預算每個測站的世界座標（水平來自映射，高度來自 heightmap 取樣）
  const positions = useMemo(
    () =>
      stations.map((station) => {
        const { x, z } = lonLatToSceneXZ(station.lon, station.lat);
        const surfaceY = heightmap
          ? elevationToSceneY(
              sampleElevationMeters(heightmap, station.lon, station.lat),
            )
          : 0;
        const y = surfaceY + STATION_RADIUS + STATION_SURFACE_OFFSET;
        return { x, y, z };
      }),
    [stations, heightmap],
  );

  const groupedPositions = useMemo(
    () => ({
      low: positions.filter((_, i) => stations[i].alertLevel === "low"),
      medium: positions.filter((_, i) => stations[i].alertLevel === "medium"),
      high: positions.filter((_, i) => stations[i].alertLevel === "high"),
    }),
    [positions, stations],
  );

  return (
    <group>
      <AlertStationInstances
        positions={groupedPositions.low}
        color={ALERT_COLOR.low}
      />
      <AlertStationInstances
        positions={groupedPositions.medium}
        color={ALERT_COLOR.medium}
      />
      <AlertStationInstances
        positions={groupedPositions.high}
        color={ALERT_COLOR.high}
      />
    </group>
  );
}

function AlertStationInstances({
  positions,
  color,
}: {
  positions: Array<{ x: number; y: number; z: number }>;
  color: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    positions.forEach((pos, i) => {
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  if (positions.length === 0) {
    return null;
  }

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[STATION_RADIUS, 8, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}
