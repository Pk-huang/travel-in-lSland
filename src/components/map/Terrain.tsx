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
import {
  computeSpotLodInfluence,
  type SpotLodFocusZone,
} from "@/src/lib/map/spot-lod";
import { useLandcover } from "@/src/lib/map/use-landcover";
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

const COLOR_DEEP_WATER = new Color("#123b60");
const COLOR_SHALLOW_WATER = new Color("#2f739d");
const COLOR_COAST = new Color("#657754");
const COLOR_VEGETATION = new Color("#7f9a5f");
const COLOR_BARE_GROUND = new Color("#7a6f56");
const COLOR_BARE_STEEP = new Color("#665c49");
const COLOR_SNOW = new Color("#d8d8d2");

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function hashNoise(ix: number, iy: number) {
  const seed = ((ix * 73856093) ^ (iy * 19349663)) >>> 0;
  return (seed & 1023) / 1023 - 0.5;
}

function applyWorldCoverClassColor(classId: number | undefined, targetColor: Color) {
  switch (classId) {
    case 10:
      return targetColor.set("#456f3a"); // Tree cover
    case 20:
      return targetColor.set("#7f8a4e"); // Shrubland
    case 30:
      return targetColor.set("#96a65f"); // Grassland
    case 40:
      return targetColor.set("#958264"); // Cropland（冰島稀少，轉低飽和農地色）
    case 50:
      return targetColor.set("#746d60"); // Built-up
    case 60:
      return targetColor.copy(COLOR_BARE_GROUND); // Bare / sparse vegetation
    case 70:
      return targetColor.set("#bdbcb4"); // Snow / ice（收斂到更接近地表的冷灰）
    case 80:
      return targetColor.copy(COLOR_SHALLOW_WATER); // Permanent water
    case 90:
      return targetColor.set("#4a7f74"); // Herbaceous wetland
    case 95:
      return targetColor.set("#4e8769"); // Mangroves（冰島幾乎不會出現）
    case 100:
      return targetColor.set("#9aa26f"); // Moss and lichen
    default:
      return null;
  }
}

/**
 * L0 底色骨架：以 WorldCover 思維做分類混色（海域/植被/裸地/雪），
 * 先用可重現規則建立可視語意，後續再替換成真實 landcover raster。
 */
function worldCoverBaseColor(
  meters: number,
  slopeMetersPerCell: number,
  noise: number,
  noiseFine: number,
  classId: number | undefined,
  classSnowMask: number,
  targetColor: Color,
) {
  if (meters < 0) {
    const deepFactor = smoothstep(-220, 0, meters);
    return targetColor.copy(COLOR_DEEP_WATER).lerp(COLOR_SHALLOW_WATER, deepFactor);
  }

  const classColor = applyWorldCoverClassColor(classId, targetColor);
  if (!classColor) {
    const coastBlend = smoothstep(0, 60, meters);
    targetColor.copy(COLOR_COAST).lerp(COLOR_VEGETATION, coastBlend);
  }

  if (classId === 80) {
    return targetColor;
  }

  // 坡度越高越接近裸岩；高海拔也提高裸岩權重。
  const slopeBlend = smoothstep(14, 130, slopeMetersPerCell);
  const altitudeRockBlend = smoothstep(700, 1500, meters);
  const rockBlend = clamp01(Math.max(slopeBlend, altitudeRockBlend * 0.66));
  targetColor.lerp(COLOR_BARE_GROUND, rockBlend);
  targetColor.lerp(COLOR_BARE_STEEP, slopeBlend * 0.48);

  // 雪覆蓋採漸層並受坡度影響，避免硬切等高線。
  const localSnowFactor = smoothstep(0.18, 0.86, classSnowMask);
  const fineNoiseScale = 1 - localSnowFactor * 0.78;
  const noiseMeters = noise * 120 + noiseFine * (34 * fineNoiseScale);
  const snowFromHeight = smoothstep(1180, 1980, meters + noiseMeters);
  const snowSlopePenalty = smoothstep(45, 140, slopeMetersPerCell);
  const snowClassBoost = classSnowMask * 0.14;
  const snowRaw = clamp01(
    snowFromHeight * (1 - snowSlopePenalty * 0.5) * 0.56 + snowClassBoost,
  );
  const snowRawDenoised = snowRaw * (1 - localSnowFactor * 0.28) + snowFromHeight * (localSnowFactor * 0.28);
  // 羽化雪邊界：將中段過渡拉長，降低邊界斷層感。
  const snowFeathered = smoothstep(0.08, 0.92, snowRawDenoised);
  const snowBlend = Math.min(0.6, snowFeathered);
  targetColor.lerp(COLOR_SNOW, snowBlend);

  return targetColor;
}

type TerrainProps = {
  spotLodFocusZone?: SpotLodFocusZone | null;
};

export function Terrain({ spotLodFocusZone = null }: TerrainProps) {
  const preferredHeightmapUrl = spotLodFocusZone
    ? "/dem/iceland-mapzen-1080.json"
    : "/dem/iceland-mapzen-768.json";
  const heightmap = useHeightmap(preferredHeightmapUrl);
  const landcover = useLandcover(heightmap?.grid ?? null);

  const geometry = useMemo(() => {
    if (!heightmap) return null;
    const { grid, elevations } = heightmap;
    const classes = landcover?.grid === grid ? landcover.classes : null;

    const planeDepth = computePlaneDepth(); // 與 coords 共用的南北長寬比校正
    const segments = grid - 1; // 頂點數 = grid，與 heightmap 一對一對齊
    const geo = new PlaneGeometry(PLANE_WIDTH, planeDepth, segments, segments);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const vertexColor = new Color();
    let brightVertexCount = 0;
    let maxSpotLodInfluence = 0;

    const cellWidthKm = PLANE_WIDTH / (grid - 1);
    const cellDepthKm = planeDepth / (grid - 1);
    const cellMeters = Math.min(cellWidthKm, cellDepthKm) * 1000;

    const getElevation = (x: number, y: number) =>
      elevations[Math.max(0, Math.min(grid - 1, y)) * grid + Math.max(0, Math.min(grid - 1, x))];

    const getClass = (x: number, y: number) => {
      if (!classes) return undefined;
      const clampedX = Math.max(0, Math.min(grid - 1, x));
      const clampedY = Math.max(0, Math.min(grid - 1, y));
      return classes[clampedY * grid + clampedX];
    };

    // 5x5 高斯近似雪遮罩，進一步平滑雪區邊界與顆粒感。
    const sampleSnowMask = (x: number, y: number) => {
      if (!classes) return 0;
      const kernel = [
        [1, 4, 7, 4, 1],
        [4, 16, 26, 16, 4],
        [7, 26, 41, 26, 7],
        [4, 16, 26, 16, 4],
        [1, 4, 7, 4, 1],
      ];
      let weightedSnow = 0;
      let totalWeight = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          const weight = kernel[ky + 2][kx + 2];
          const neighborClass = getClass(x + kx, y + ky);
          if (neighborClass === 70) weightedSnow += weight;
          totalWeight += weight;
        }
      }
      return totalWeight > 0 ? weightedSnow / totalWeight : 0;
    };

    const verts = segments + 1; // = grid
    for (let i = 0; i < positions.count; i++) {
      const ix = i % verts; // 東西格點索引（0..grid-1）
      const iy = Math.floor(i / verts); // 南北格點索引
      const meters = elevations[iy * grid + ix];
      const classId = classes ? classes[iy * grid + ix] : undefined;
      const classSnowMask = sampleSnowMask(ix, iy);

      const east = getElevation(ix + 1, iy);
      const west = getElevation(ix - 1, iy);
      const north = getElevation(ix, iy + 1);
      const south = getElevation(ix, iy - 1);
      const gradientX = (east - west) / (2 * cellMeters);
      const gradientY = (north - south) / (2 * cellMeters);
      const slopeMetersPerCell = Math.hypot(gradientX, gradientY) * cellMeters;

      // 海拔 → 場景高度：與測站共用同一條公式（含 <0 海床夾平、海岸線裁切）
      const height = elevationToSceneY(meters);
      positions.setZ(i, height); // 旋轉前的 Z → 旋轉後的高度(世界 Y)

      const noise = hashNoise(ix, iy);
      const noiseFine = hashNoise(ix * 5 + 11, iy * 5 + 7);
      worldCoverBaseColor(
        meters,
        slopeMetersPerCell,
        noise,
        noiseFine,
        classId,
        classSnowMask,
        vertexColor,
      );
      const luma = vertexColor.r * 0.2126 + vertexColor.g * 0.7152 + vertexColor.b * 0.0722;
      if (luma > 0.86) brightVertexCount += 1;

      if (spotLodFocusZone) {
        const dx = positions.getX(i) - spotLodFocusZone.centerX;
        const dz = positions.getY(i) - spotLodFocusZone.centerZ;
        const distanceKm = Math.hypot(dx, dz);
        const influence = computeSpotLodInfluence(distanceKm, spotLodFocusZone);
        if (influence > maxSpotLodInfluence) {
          maxSpotLodInfluence = influence;
        }
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    if (process.env.NODE_ENV !== "production") {
      const brightRatio = brightVertexCount / positions.count;
      if (brightRatio > 0.45) {
        console.warn(
          `[Terrain] bright vertex ratio high: ${(brightRatio * 100).toFixed(1)}% (check landcover/snow blend)`,
        );
      }

      if (spotLodFocusZone) {
        console.info(
          `[Terrain] Spot LOD source active: ${spotLodFocusZone.poiId} dem=${preferredHeightmapUrl} radius=${spotLodFocusZone.radiusKm.toFixed(2)}km falloff=${spotLodFocusZone.falloffKm.toFixed(2)}km maxInfluence=${maxSpotLodInfluence.toFixed(2)}`,
        );
      }
    }

    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo as unknown as BufferGeometry;
  }, [heightmap, landcover, preferredHeightmapUrl, spotLodFocusZone]);

  // heightmap 尚未載入 → 先不畫（loading fallback 由 MapCanvasLoader 提供）
  if (!geometry) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry as never}>
      {/* 逐頂點上色：顏色來自 geometry 的 color attribute。 */}
      <meshStandardMaterial vertexColors />
    </mesh>
  );
}
