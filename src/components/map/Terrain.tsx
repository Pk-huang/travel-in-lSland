"use client";

import { useMemo } from "react";
import {
  PlaneGeometry,
  Float32BufferAttribute,
  Color,
  type BufferGeometry,
} from "three";

import {
  PLANE_WIDTH,
  computePlaneDepth,
  elevationToSceneY,
} from "@/src/lib/map/coords";
import { useHeightmap } from "@/src/lib/map/use-heightmap";

/**
 * Terrain：地形地塊。
 *
 * 技術債收斂（2026-07-02）：地形數值與公式改用共用模組 coords.ts，達成單一真相源。
 *
 * - heightmap 讀取改用 useHeightmap hook（與測站共用，不再各自 fetch）。
 * - 水平尺度 computePlaneDepth()、高度換算 elevationToSceneY(meters) 皆來自 coords，
 *   與 StationLayer 共用同一套 bbox/公式，確保測站精準貼合地形。
 * - 頂點與 heightmap 一對一對齊：PlaneGeometry segments = grid-1 → 頂點數 = grid×grid，
 *   ix/iy 直接對應 elevations[iy*grid+ix]，無需內插。
 * - elevationToColor 為 Terrain 專屬色帶（非座標邏輯），保留於本檔。
 *
 * 座標約定（保留）：中心 = 冰島大致中心。
 * 後續：正式配色、光影微調。
 */

/** 依真實海拔（公尺）回傳顏色；海陸分界對齊真實 0m。冰島風低彩度色帶。 */
function elevationToColor(meters: number, targetColor: Color) {
  if (meters < -200) return targetColor.set("#17324f"); // 深海
  if (meters < 0) return targetColor.set("#2a5f86"); // 淺海
  if (meters < 30) return targetColor.set("#55603f"); // 海岸低地（黑沙苔綠）
  if (meters < 400) return targetColor.set("#6f8450"); // 低地苔原
  if (meters < 900) return targetColor.set("#7d7259"); // 玄武岩高地
  return targetColor.set("#eef2f5"); // 雪線
}

export function Terrain() {
  const heightmap = useHeightmap();

  const geometry = useMemo(() => {
    if (!heightmap) return null;
    const { grid, elevations } = heightmap;

    const planeDepth = computePlaneDepth(); // 與 coords 共用的南北長寬比校正
    const segments = grid - 1; // 頂點數 = grid，與 heightmap 一對一對齊
    const geo = new PlaneGeometry(PLANE_WIDTH, planeDepth, segments, segments);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const vertexColor = new Color();
    const verts = segments + 1; // = grid
    for (let i = 0; i < positions.count; i++) {
      const ix = i % verts; // 東西格點索引（0..grid-1）
      const iy = Math.floor(i / verts); // 南北格點索引
      const meters = elevations[iy * grid + ix];
      // 海拔 → 場景高度：與測站共用同一條公式（含 <0 海床夾平、海岸線裁切）
      const height = elevationToSceneY(meters);
      positions.setZ(i, height); // 旋轉前的 Z → 旋轉後的高度(世界 Y)
      elevationToColor(meters, vertexColor);
      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo as unknown as BufferGeometry;
  }, [heightmap]);

  // heightmap 尚未載入 → 先不畫（loading fallback 由 MapCanvasLoader 提供）
  if (!geometry) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry as never}>
      {/* 逐頂點上色：顏色來自 geometry 的 color attribute。 */}
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  );
}
