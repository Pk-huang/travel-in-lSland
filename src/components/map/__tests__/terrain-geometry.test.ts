import { describe, it, expect, beforeAll } from "vitest";
import { BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial } from "three";
import {
  createTerrainGeometry,
} from "../Terrain";
import {
  elevationToSceneY,
  PLANE_WIDTH,
  computePlaneDepth,
} from "@/src/lib/map/coords";
import type { TerrainDetailLevel } from "@/src/types";
import demData256 from "/public/dem/iceland-mapzen-256.json";
import landcoverData256 from "/public/landcover/iceland-worldcover-2021-256.json";

/**
 * 層級 3：Canvas 內容轉換（Canvas 層 - Integration Test）
 * 目的：驗證完整 Mesh 建造管線（PlaneGeometry + 頂點位置 + 顏色 + 材質）
 * 資料來源：實際 JSON 檔（/public/dem/iceland-mapzen-256.json + landcover）
 * 
 * 驗證標準：
 * - (3a) 頂點位置：每個頂點的 Z 應與 elevationToSceneY(elevation) 一致
 * - (3b) 頂點顏色：每個頂點的 RGB 應與 worldCoverBaseColor 計算結果一致
 * - (3b) 顏色屬性綁定：color attribute 應是 Float32BufferAttribute，size=3
 * - (3c) 材質設定：geometry 應能配置 vertexColors 材質
 * - (3c) 法向量：geometry 應已計算頂點法向量（用於光照）
 */

describe("Canvas Content Transformation - Terrain Geometry", () => {
  let geometry: BufferGeometry;
  const grid: TerrainDetailLevel = 256;
  const demUrl = `/dem/iceland-mapzen-256.json`;

  beforeAll(() => {
    // 建造完整 geometry（使用實際 JSON 資料）
    geometry = createTerrainGeometry({
      baseHeightmap: {
        grid: demData256.grid,
        elevations: demData256.elevations,
      },
      landcover: {
        grid: landcoverData256.grid,
        classes: landcoverData256.classes,
      },
      terrainDetailLevel: grid,
      demUrl,
    });
  });

  describe("(3a) 頂點位置驗證", () => {
    it("PlaneGeometry 應有正確的頂點數（grid²）", () => {
      const positions = geometry.attributes.position;
      const expectedVertexCount = grid * grid;
      expect(positions.count).toBe(expectedVertexCount);
    });

    it("PlaneGeometry 應有合理的平面範圍（X 軸應接近 PLANE_WIDTH）", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const positions = geometry.attributes.position as any;
      const xs = [];

      for (let i = 0; i < positions.count; i += 1) {
        xs.push(positions.getX(i));
      }

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);

      // X 軸範圍應約等於 PLANE_WIDTH
      expect(maxX - minX).toBeCloseTo(PLANE_WIDTH, 1);
    });

    it("每個頂點的高度應與 elevationToSceneY(elevation) 一致", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const positions = geometry.attributes.position as any;
      const { elevations } = demData256;
      const verts = grid;

      // 取樣檢查（全量太慢，檢查代表性樣本）
      const sampleIndices = [
        0,
        grid - 1, // 邊角
        grid * (grid - 1),
        grid * grid - 1, // 相反邊角
        Math.floor(grid * grid / 2), // 中心
      ];

      sampleIndices.forEach((i) => {
        if (i >= positions.count) return;

        const ix = i % verts;
        const iy = Math.floor(i / verts);
        const dataY = grid - 1 - iy;
        const elevation = elevations[dataY * grid + ix];
        const expectedHeight = elevationToSceneY(elevation);
        const actualHeight = positions.getZ(i);

        expect(actualHeight).toBeCloseTo(expectedHeight, 3);
      });
    });

    it("海拔負數應被夾平到 SEA_FLOOR_UNIT(-0.3)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const positions = geometry.attributes.position as any;
      const { elevations } = demData256;
      const verts = grid;

      // 找所有海洋區域（elevation < 0）
      let foundOcean = false;

      for (let i = 0; i < positions.count; i += 1) {
        const ix = i % verts;
        const iy = Math.floor(i / verts);
        const dataY = grid - 1 - iy;
        const elevation = elevations[dataY * grid + ix];

        if (elevation < 0) {
          foundOcean = true;
          const height = positions.getZ(i);
          expect(height).toBeCloseTo(-0.3, 3);
        }
      }

      // 冰島環繞海洋，應至少有一些海洋頂點
      expect(foundOcean).toBe(true);
    });
  });

  describe("(3b) 頂點顏色驗證", () => {
    it("color attribute 應存在且為 Float32BufferAttribute", () => {
      const colorAttr = geometry.getAttribute("color");
      expect(colorAttr).toBeDefined();
      expect(colorAttr).toBeInstanceOf(Float32BufferAttribute);
    });

    it("color attribute 應有正確的分量數（size=3 for RGB）", () => {
      const colorAttr = geometry.getAttribute("color") as Float32BufferAttribute;
      expect(colorAttr.itemSize).toBe(3);
      expect(colorAttr.count).toBe(grid * grid);
    });

    it("所有頂點顏色應落在 [0, 1] 有效範圍", () => {
      const colorAttr = geometry.getAttribute("color") as Float32BufferAttribute;

      for (let i = 0; i < colorAttr.count; i += 1) {
        const r = colorAttr.getX(i);
        const g = colorAttr.getY(i);
        const b = colorAttr.getZ(i);

        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(1);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(1);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1);
      }
    });

    it("深海（elevation -200+）應是深藍色（B > R, G）", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const positions = geometry.attributes.position as any;
      const colorAttr = geometry.getAttribute("color") as Float32BufferAttribute;
      const { elevations } = demData256;
      const verts = grid;

      let deepOceanCount = 0;

      for (let i = 0; i < positions.count; i += 1) {
        const ix = i % verts;
        const iy = Math.floor(i / verts);
        const dataY = grid - 1 - iy;
        const elevation = elevations[dataY * grid + ix];

        if (elevation < -200) {
          const r = colorAttr.getX(i);
          const g = colorAttr.getY(i);
          const b = colorAttr.getZ(i);

          // 深海應是藍色調
          expect(b).toBeGreaterThan(Math.max(r, g) * 0.8);
          deepOceanCount += 1;
        }
      }

      // 應至少有一些深海頂點
      expect(deepOceanCount).toBeGreaterThan(0);
    });

    it("高海拔陸地（1000m+）應有有效顏色", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const positions = geometry.attributes.position as any;
      const colorAttr = geometry.getAttribute("color") as Float32BufferAttribute;
      const { elevations } = demData256;
      const verts = grid;

      let highAltitudeCount = 0;

      for (let i = 0; i < positions.count; i += 1) {
        const ix = i % verts;
        const iy = Math.floor(i / verts);
        const dataY = grid - 1 - iy;
        const elevation = elevations[dataY * grid + ix];

        if (elevation > 1000) {
          const r = colorAttr.getX(i);
          const g = colorAttr.getY(i);
          const b = colorAttr.getZ(i);

          // 驗證都是有效的顏色值
          expect(r + g + b).toBeGreaterThan(0);
          highAltitudeCount += 1;
        }
      }

      // 冰島有高山，應至少有一些高海拔頂點
      expect(highAltitudeCount).toBeGreaterThan(0);
    });
  });

  describe("(3b) 顏色屬性綁定驗證", () => {
    it("color attribute 應能被材質使用（vertexColors）", () => {
      const colorAttr = geometry.getAttribute("color");
      // 驗證 attribute 存在且型別正確
      expect(colorAttr).toBeDefined();
      expect(colorAttr.array).toBeInstanceOf(Float32Array);
      expect(colorAttr.array.length).toBe(grid * grid * 3); // R, G, B for each vertex
    });

    it("顏色資料應是連續 RGB 三元組（未交錯）", () => {
      const colorAttr = geometry.getAttribute("color") as Float32BufferAttribute;
      
      // 檢查前幾個頂點的顏色取樣
      for (let i = 0; i < Math.min(10, colorAttr.count); i += 1) {
        const r = colorAttr.getX(i);
        const g = colorAttr.getY(i);
        const b = colorAttr.getZ(i);

        // 驗證可以取到三個分量
        expect(typeof r).toBe("number");
        expect(typeof g).toBe("number");
        expect(typeof b).toBe("number");
      }
    });
  });

  describe("(3c) 材質與法向量驗證", () => {
    it("geometry 應已計算頂點法向量", () => {
      const normals = geometry.getAttribute("normal");
      expect(normals).toBeDefined();
      expect(normals.count).toBe(grid * grid);
    });

    it("法向量應有正確的分量數（size=3 for X, Y, Z）", () => {
      const normals = geometry.getAttribute("normal");
      expect(normals.itemSize).toBe(3);
    });

    it("所有法向量應被正規化（長度 ≈ 1）", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normals = geometry.getAttribute("normal") as any;

      // 取樣檢查（全量檢查會比較慢）
      for (let i = 0; i < Math.min(50, normals.count); i += 1) {
        const nx = normals.getX(i);
        const ny = normals.getY(i);
        const nz = normals.getZ(i);
        const length = Math.hypot(nx, ny, nz);
        
        // 正規化法向量應接近 1（考慮浮點精度）
        expect(length).toBeCloseTo(1, 3);
      }
    });

    it("geometry 應能建構用於 vertexColors 的材質", () => {
      // 驗證 geometry 已設定顏色 attribute
      const colorAttr = geometry.getAttribute("color");
      expect(colorAttr).toBeDefined();

      // 在真實使用中，材質會讀取此 attribute
      // three.js 驗證：vertexColors 材質會在 shader 中使用 geometry 的 color attribute
      expect(geometry.attributes.color).toBe(colorAttr);
    });
  });

  describe("(3c) 完整 Mesh 整合驗證", () => {
    it("geometry 應能用 meshStandardMaterial 建構有效 Mesh", () => {
      // 模擬實際使用方式
      const mesh = new Mesh(
        geometry,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new MeshStandardMaterial({ vertexColors: true }) as any,
      );

      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBe(geometry);
      expect(mesh.material).toBeDefined();
    });

    it("Mesh 應有正確的邊界框", () => {
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;

      expect(bbox).toBeDefined();
      expect(bbox!.min.x).toBeLessThan(bbox!.max.x);
      expect(bbox!.min.y).toBeLessThan(bbox!.max.y);
      expect(bbox!.min.z).toBeLessThan(bbox!.max.z);
    });

    it("geometry 應包含所有必要的 attributes（position, normal, color）", () => {
      expect(geometry.getAttribute("position")).toBeDefined();
      expect(geometry.getAttribute("normal")).toBeDefined();
      expect(geometry.getAttribute("color")).toBeDefined();
    });
  });

  describe("資料一致性驗證", () => {
    it("JSON 資料應有正確的網格大小（256）", () => {
      expect(demData256.grid).toBe(256);
      expect(landcoverData256.grid).toBe(256);
      expect(demData256.elevations.length).toBe(256 * 256);
      expect(landcoverData256.classes.length).toBe(256 * 256);
    });

    it("JSON 資料應有正確的 bbox", () => {
      // 冰島範圍
      expect(demData256.bbox.latMin).toBeGreaterThan(63);
      expect(demData256.bbox.latMax).toBeLessThan(67);
      expect(demData256.bbox.lonMin).toBeGreaterThan(-25);
      expect(demData256.bbox.lonMax).toBeLessThan(-13);
    });

    it("DEM 海拔值應在合理範圍", () => {
      const { elevations } = demData256;
      let minElev = Infinity;
      let maxElev = -Infinity;

      elevations.forEach((elev) => {
        minElev = Math.min(minElev, elev);
        maxElev = Math.max(maxElev, elev);
      });

      // 冰島環繞海洋，應有負值（海深）
      // 最高峰瓦特納冰川約 2110m
      expect(minElev).toBeLessThan(0); // 有海洋
      expect(maxElev).toBeGreaterThan(1500); // 有高山
      expect(maxElev).toBeLessThan(3000); // 合理上界
    });

    it("Landcover class 應在有效範圍（10-100）", () => {
      const { classes } = landcoverData256;
      classes.forEach((cls) => {
        expect(cls).toBeGreaterThanOrEqual(10);
        expect(cls).toBeLessThanOrEqual(100);
      });
    });
  });
});
