"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlaneGeometry,
  Float32BufferAttribute,
  Color,
  type BufferGeometry,
} from "three";

/**
 * Terrain：地形地塊。
 *
 * 子步驟 2-1b b-3-ii（本版）：以真實 DEM heightmap 取代 sin 假高度。
 *
 * - fetch 靜態 heightmap（public/dem），拿到後才建 geometry（useMemo 依賴 heightmap）。
 * - 頂點與 heightmap 一對一對齊：PlaneGeometry segments = grid-1 → 頂點數 = grid×grid，
 *   ix/iy 直接對應 elevations[iy*grid+ix]，無需內插。
 * - 單位換算：公尺 ÷ 500（垂直誇張 2×，1000m→2units），落在 unit 尺度便於觀察與沿用色帶。
 * - 高度寫進 local Z（旋轉後成世界 Y）；依高度查色帶逐頂點上色。
 *
 * 座標約定（保留）：1 unit = 1 km，中心 = 冰島大致中心。
 * 後續：b-4 高度比例/海陸校正、b-5 海岸線裁切。
 */

/** heightmap JSON 結構（由 scripts/fetch-dem.mjs 產生）。 */
type HeightmapData = {
  grid: number;
  min: number;
  max: number;
  elevations: number[]; // 長度 grid²，row-major（南→北、每列西→東），單位公尺
};

/** 公尺 → unit 的垂直縮放（÷500 = 垂直誇張 2×）。 */
const METERS_PER_UNIT = 500;

/** 依高度回傳顏色（height 單位為 unit，約 -3.2 ~ 4）。分層清楚便於驗證。 */
function heightToColor(height: number, targetColor: Color) {
  if (height < -1) return targetColor.set("#1f4e79"); // 深海
  if (height < 0) return targetColor.set("#3d85c6"); // 淺海
  if (height < 0.6) return targetColor.set("#e0c772"); // 海岸沙地
  if (height < 1.8) return targetColor.set("#5a8f3c"); // 草原陸地
  if (height < 2.8) return targetColor.set("#7a6a55"); // 岩石高地
  return targetColor.set("#f5f5f5"); // 雪線
}

export function Terrain() {
  const [heightmap, setHeightmap] = useState<HeightmapData | null>(null);

  // 讀取真實高程靜態檔（一次）
  useEffect(() => {
    let alive = true;
    fetch("/dem/iceland-mapzen-128.json")
      .then((res) => res.json())
      .then((data: HeightmapData) => {
        if (alive) setHeightmap(data);
      })
      .catch((err) => console.error("[Terrain] heightmap 載入失敗：", err));
    return () => {
      alive = false;
    };
  }, []);

  const geometry = useMemo(() => {
    if (!heightmap) return null;
    const { grid, elevations } = heightmap;
    const segments = grid - 1; // 頂點數 = grid，與 heightmap 一對一對齊
    const size = 40;
    const geo = new PlaneGeometry(size, size, segments, segments);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const vertexColor = new Color();
    const verts = segments + 1; // = grid
    for (let i = 0; i < positions.count; i++) {
      const ix = i % verts; // 東西格點索引（0..grid-1）
      const iy = Math.floor(i / verts); // 南北格點索引
      const meters = elevations[iy * grid + ix];
      const height = meters / METERS_PER_UNIT; // 公尺 → unit
      positions.setZ(i, height); // 旋轉前的 Z → 旋轉後的高度(世界 Y)
      heightToColor(height, vertexColor);
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
