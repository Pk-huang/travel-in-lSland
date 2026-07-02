/**
 * 冰島地圖座標映射（經緯度 → three.js 場景 XZ）。
 *
 * 單一真相源：bbox 與水平尺度與 Terrain 完全一致，確保測站等點位精準落在地形上。
 * 場景約定：X=東西、Y=高度、Z=南北；地形平面中心在世界原點。
 *
 * 方位對齊（與 Terrain 的 PlaneGeometry 繞 X 軸 −90° 躺平後一致）：
 * - 經度：西(lonMin) → x = −W/2、東(lonMax) → x = +W/2（對應頂點 ix 西→東）。
 * - 緯度：南(latMin) → z = +D/2、北(latMax) → z = −D/2（對應 elevations 南→北，旋轉後南在 +Z）。
 */

/** 冰島涵蓋範圍（與 scripts/fetch-dem.mjs 的 BBOX 同值，為單一真相源）。 */
export const ICELAND_BBOX = {
  latMin: 63.3,
  latMax: 66.6,
  lonMin: -24.6,
  lonMax: -13.4,
} as const;

/** 地形平面東西向邊長（units），與 Terrain 的 PLANE_WIDTH 一致。 */
export const PLANE_WIDTH = 40;

/** 每度緯度約略公里數（地表近似值）。 */
const KM_PER_DEG_LAT = 111.32;

/**
 * 依 bbox 推算平面南北向邊長（units），與 Terrain 同一套長寬比校正。
 * 東西實距用中心緯度的餘弦收斂（經線越往高緯越靠近）。
 */
export function computePlaneDepth(): number {
  const centerLatRad =
    (((ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2) * Math.PI) / 180;
  const eastWestKm =
    (ICELAND_BBOX.lonMax - ICELAND_BBOX.lonMin) *
    KM_PER_DEG_LAT *
    Math.cos(centerLatRad);
  const northSouthKm = (ICELAND_BBOX.latMax - ICELAND_BBOX.latMin) * KM_PER_DEG_LAT;
  return PLANE_WIDTH * (northSouthKm / eastWestKm);
}

/**
 * 經緯度 → 場景平面座標 { x, z }（單位 units，未含高度 Y）。
 * 高度 Y 由後續步驟以 heightmap 取樣補上（測站貼地形表面）。
 */
export function lonLatToSceneXZ(
  lon: number,
  lat: number,
): { x: number; z: number } {
  const planeDepth = computePlaneDepth();
  const x =
    ((lon - ICELAND_BBOX.lonMin) / (ICELAND_BBOX.lonMax - ICELAND_BBOX.lonMin) -
      0.5) *
    PLANE_WIDTH;
  const z =
    ((ICELAND_BBOX.latMax - lat) / (ICELAND_BBOX.latMax - ICELAND_BBOX.latMin) -
      0.5) *
    planeDepth;
  return { x, z };
}

// --- 高度換算（與 Terrain 對齊的共用公式；測站等點位貼地形用） ---
//
// 單一真相源：Terrain 與 StationLayer 皆從此處取用高度常數與公式（2026-07-02 收斂完成），
// 不再各自持有同值常數。

/** 垂直誇張倍率（地形與點位共用）。 */
export const VERTICAL_EXAGGERATION = 25;

/** 海床夾平高度（unit，地形與點位共用）。 */
export const SEA_FLOOR_UNIT = -0.3;

/** heightmap 取樣所需的最小結構。 */
export type HeightmapGrid = {
  grid: number;
  bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number };
  elevations: number[]; // 長度 grid²，row-major（南→北、每列西→東），單位公尺
};

/** 水平 units → km 換算係數（東西向，餘弦收斂）。 */
export function computeKmPerUnit(): number {
  const centerLatRad =
    (((ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2) * Math.PI) / 180;
  const eastWestKm =
    (ICELAND_BBOX.lonMax - ICELAND_BBOX.lonMin) *
    KM_PER_DEG_LAT *
    Math.cos(centerLatRad);
  return eastWestKm / PLANE_WIDTH;
}

/**
 * 海拔（公尺）→ 場景高度 Y（unit）；與 Terrain 建地形同一條公式。
 * 海拔 < 0 夾平到 SEA_FLOOR_UNIT（海岸線裁切），陸地為真實比例 × 垂直誇張倍率。
 */
export function elevationToSceneY(meters: number): number {
  if (meters < 0) return SEA_FLOOR_UNIT;
  return (meters / 1000 / computeKmPerUnit()) * VERTICAL_EXAGGERATION;
}

/**
 * 依經緯度在 heightmap 取最近格點的海拔（公尺）。
 * 取樣索引與 Terrain 寫入頂點時的 elevations[iy*grid+ix] 對齊：
 * ix 西→東、iy 南→北，故地理位置與地形表面一致。
 */
export function sampleElevationMeters(
  heightmap: HeightmapGrid,
  lon: number,
  lat: number,
): number {
  const { grid, bbox, elevations } = heightmap;
  const fx = (lon - bbox.lonMin) / (bbox.lonMax - bbox.lonMin);
  const fy = (lat - bbox.latMin) / (bbox.latMax - bbox.latMin); // 南→北
  const clampedX = Math.min(1, Math.max(0, fx));
  const clampedY = Math.min(1, Math.max(0, fy));
  const ix = Math.round(clampedX * (grid - 1));
  const iy = Math.round(clampedY * (grid - 1));
  return elevations[iy * grid + ix];
}
