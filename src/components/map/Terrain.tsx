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
 * 子步驟 2-1b b-5（本版）：海岸線裁切。
 *
 * - fetch 靜態 heightmap（public/dem），拿到後才建 geometry（useMemo 依賴 heightmap）。
 * - 頂點與 heightmap 一對一對齊：PlaneGeometry segments = grid-1 → 頂點數 = grid×grid，
 *   ix/iy 直接對應 elevations[iy*grid+ix]，無需內插。
 * - 水平比例：由 bbox 推真實東西/南北公里數，修正平面長寬比（不再是正方形）。
 * - 垂直高度：公尺→km→除以水平尺度得真實比例，再乘 VERTICAL_EXAGGERATION 誇張倍率。
 * - 海岸線裁切：海拔 < 0 的頂點高度夾平到 SEA_FLOOR_UNIT（藏在半透明海面下），
 *   消除深達 -1592m 的「碗」，島形輪廓＝自然 0m 邊界。
 * - 逐頂點上色改用「真實海拔（公尺）」查色帶，海陸分界精準對齊真實 0m。
 *
 * 座標約定（保留）：中心 = 冰島大致中心。
 * 後續：正式配色、光影微調。
 */

/** heightmap JSON 結構（由 scripts/fetch-dem.mjs 產生）。 */
type HeightmapData = {
  grid: number;
  min: number;
  max: number;
  bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number };
  elevations: number[]; // 長度 grid²，row-major（南→北、每列西→東），單位公尺
};

/** 地形平面東西向邊長（units）；南北邊長由 bbox 長寬比推得。 */
const PLANE_WIDTH = 40;

/** 每度緯度約略公里數（地表近似值）。 */
const KM_PER_DEG_LAT = 111.32;

/**
 * 垂直誇張倍率。
 * 冰島最高約 2000m，但東西跨幅逾 500km；照真實比例山高不到水平的 0.3%，幾乎看不見。
 * 資料視覺化慣例：垂直放大讓地形起伏可辨。25× 約略沿用先前觀感，之後可再微調。
 */
const VERTICAL_EXAGGERATION = 25;

/**
 * 海床夾平高度（unit）。
 * 海拔 < 0 的頂點一律壓到這個淺淺的固定值，剛好藏在 y=0 的半透明海面（SeaLevel）下方，
 * 消除原本深達 -1592m 的大碗，讓島形輪廓＝自然 0m 海岸線。
 *
 * TODO（水下地形，之後可加回）：目前為求島形乾淨，把海底一律壓平、犧牲真實深度。
 *   若日後想呈現海底峽谷／大陸棚等水下起伏，改法：
 *     海拔 < 0 時改用 `((meters / 1000) / kmPerUnit) * VERTICAL_EXAGGERATION`
 *     （與陸地同一條公式，保留真實深度），並把 SeaLevel 調更透明以看穿水下。
 *   heightmap 已含負值高程（min -1592m），資料端無需重抓，純顯示端切換。
 */
const SEA_FLOOR_UNIT = -0.3;

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
    const { grid, elevations, bbox } = heightmap;

    // 由 bbox 推真實水平尺度（誠實比例，不用魔術數字）
    const centerLatRad = (((bbox.latMin + bbox.latMax) / 2) * Math.PI) / 180;
    const eastWestKm =
      (bbox.lonMax - bbox.lonMin) * KM_PER_DEG_LAT * Math.cos(centerLatRad);
    const northSouthKm = (bbox.latMax - bbox.latMin) * KM_PER_DEG_LAT;
    const kmPerUnit = eastWestKm / PLANE_WIDTH; // 水平 units → km 換算
    const planeDepth = PLANE_WIDTH * (northSouthKm / eastWestKm); // 修正南北長寬比

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
      // 海拔 < 0：夾平到海床固定值（海岸線裁切）；陸地：真實比例 × 垂直誇張倍率
      const height =
        meters < 0
          ? SEA_FLOOR_UNIT
          : ((meters / 1000) / kmPerUnit) * VERTICAL_EXAGGERATION;
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
