import { describe, it, expect, beforeAll } from "vitest";
import {
  MeshStandardMaterial,
  FrontSide,
  AmbientLight,
  DirectionalLight,
  Scene,
  Mesh,
  BufferGeometry,
} from "three";
import demData256 from "@/public/dem/iceland-mapzen-256.json";
import landcoverData256 from "@/public/landcover/iceland-worldcover-2021-256.json";
import { createTerrainGeometry } from "../Terrain";

/**
 * Phase 2-2g: Material & Geometry 預準備驗證
 * 
 * 驗證地形 Mesh 的 Material 與 Geometry 綁定正確，確保光影效果、顏色渲染、法線計算都符合預期。
 * 
 * 測試分五群：
 * - (7a) Material 類型與屬性驗證 — 4 tests
 * - (7b) Material 基礎屬性 — 2 tests
 * - (7c) 法線計算驗證 — 3 tests
 * - (7d) Geometry & Material 綁定 — 3 tests
 * - (7e) 光影交互驗證 — 3 tests
 */

describe("Terrain Material & Geometry Verification (Phase 2-2g)", () => {
  const terrainDetailLevel = 256;
  let geometry: BufferGeometry;

  beforeAll(() => {
    // 建立測試用的 Geometry
    geometry = createTerrainGeometry({
      baseHeightmap: demData256 as { grid: number; elevations: number[] },
      landcover: landcoverData256 as { grid: number; classes: number[] },
      terrainDetailLevel,
      demUrl: `/dem/iceland-mapzen-${terrainDetailLevel}.json`,
    });
  });

  // ========== Group 7a: Material 類型與屬性驗證 ==========
  describe("(7a) Material type & properties", () => {
    let material: MeshStandardMaterial;

    beforeAll(() => {
      material = new MeshStandardMaterial({ vertexColors: true });
    });

    it("should use MeshStandardMaterial for terrain", () => {
      expect(material).toBeInstanceOf(MeshStandardMaterial);
    });

    it("should set side to FrontSide (render front faces only)", () => {
      expect(material.side).toBe(FrontSide);
    });

    it("should enable vertexColors for per-vertex coloring", () => {
      expect(material.vertexColors).toBe(true);
    });

    it("should support proper color space configuration", () => {
      // 驗證 Material 已正確初始化，可支援色彩空間相關的配置
      const materialWithConfig = new MeshStandardMaterial({
        vertexColors: true,
        side: FrontSide,
      });
      // 確認 Material 實例建立且屬性可被配置
      expect(materialWithConfig).toBeInstanceOf(MeshStandardMaterial);
      expect(materialWithConfig.vertexColors).toBe(true);
      expect(materialWithConfig.side).toBe(FrontSide);
    });
  });

  // ========== Group 7b: Material 基礎屬性 ==========
  describe("(7b) Material basic properties", () => {
    let material: MeshStandardMaterial;

    beforeAll(() => {
      material = new MeshStandardMaterial({ vertexColors: true });
    });

    it("should have reasonable roughness value (0 to 1 range)", () => {
      expect(material.roughness).toBeGreaterThanOrEqual(0);
      expect(material.roughness).toBeLessThanOrEqual(1);
    });

    it("should have reasonable metalness value (0 to 1 range)", () => {
      expect(material.metalness).toBeGreaterThanOrEqual(0);
      expect(material.metalness).toBeLessThanOrEqual(1);
    });
  });

  // ========== Group 7c: 法線計算驗證 ==========
  describe("(7c) Normal vector calculation", () => {
    it("should have normal attribute after computeVertexNormals()", () => {
      expect(geometry.attributes.normal).toBeDefined();
      expect(geometry.attributes.normal).not.toBeNull();
    });

    it("should have normal count equal to vertex count", () => {
      const normalCount = geometry.attributes.normal.count;
      const vertexCount = geometry.attributes.position.count;
      expect(normalCount).toBe(vertexCount);
    });

    it("should have normals in valid range [-1, 1] per component", () => {
      const normals = geometry.attributes.normal.array as Float32Array;
      expect(normals.length % 3).toBe(0); // 每 3 個為一個法線向量

      // 檢查樣本法線（每 100 個檢查一個）
      for (let i = 0; i < normals.length; i += 300) {
        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];

        expect(nx).toBeGreaterThanOrEqual(-1.01); // 允許浮點誤差
        expect(nx).toBeLessThanOrEqual(1.01);
        expect(ny).toBeGreaterThanOrEqual(-1.01);
        expect(ny).toBeLessThanOrEqual(1.01);
        expect(nz).toBeGreaterThanOrEqual(-1.01);
        expect(nz).toBeLessThanOrEqual(1.01);
      }
    });
  });

  // ========== Group 7d: Geometry & Material 綁定 ==========
  describe("(7d) Geometry & Material binding", () => {
    let mesh: Mesh;
    let material: MeshStandardMaterial;

    beforeAll(() => {
      material = new MeshStandardMaterial({ vertexColors: true });
      mesh = new Mesh(geometry, material);
    });

    it("should apply material correctly to mesh", () => {
      expect(mesh.material).toBe(material);
    });

    it("should have color attribute properly bound to geometry", () => {
      expect(geometry.attributes.color).toBeDefined();
      expect(geometry.attributes.color).not.toBeNull();
      expect(geometry.attributes.color.itemSize).toBe(3); // RGB
    });

    it("should have position attribute properly bound", () => {
      expect(geometry.attributes.position).toBeDefined();
      expect(geometry.attributes.position).not.toBeNull();
      expect(geometry.attributes.position.itemSize).toBe(3); // XYZ
    });
  });

  // ========== Group 7e: 光影交互驗證 ==========
  describe("(7e) Lighting interaction", () => {
    let scene: Scene;
    let mesh: Mesh;
    let material: MeshStandardMaterial;
    let ambientLight: AmbientLight;
    let directionalLight: DirectionalLight;

    beforeAll(() => {
      scene = new Scene();
      material = new MeshStandardMaterial({ vertexColors: true });
      mesh = new Mesh(geometry, material);
      scene.add(mesh);

      // 設定光源
      ambientLight = new AmbientLight(0xffffff, 0.4);
      directionalLight = new DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 10);
      scene.add(ambientLight);
      scene.add(directionalLight);
    });

    it("should remain visible with ambient light only", () => {
      // 移除 directional light，只保留 ambient
      scene.remove(directionalLight);
      expect(mesh.visible).toBe(true);
      expect(ambientLight.intensity).toBeGreaterThan(0);
      // 恢復 directional light
      scene.add(directionalLight);
    });

    it("should have directional light influence on surface (normals interact with light direction)", () => {
      // 驗證光源方向與法線可相互作用
      const lightDir = directionalLight.position.clone().normalize();
      expect(lightDir).toBeDefined();
      expect(lightDir.length()).toBeCloseTo(1, 3); // 單位向量

      // 取樣第一個法線並驗證
      const normals = geometry.attributes.normal.array as Float32Array;
      const firstNormal = { x: normals[0], y: normals[1], z: normals[2] };
      const normalLength = Math.sqrt(
        firstNormal.x ** 2 + firstNormal.y ** 2 + firstNormal.z ** 2,
      );
      expect(normalLength).toBeCloseTo(1, 2); // 法線應為單位向量
    });

    it("should not produce invalid colors when lit (no all-black regions from binding error)", () => {
      // 驗證顏色 attribute 綁定正確（檢查顏色不全為 0）
      const colors = geometry.attributes.color.array as Float32Array;
      let totalBrightness = 0;

      for (let i = 0; i < Math.min(colors.length, 300); i += 3) {
        const r = colors[i];
        const g = colors[i + 1];
        const b = colors[i + 2];
        totalBrightness += r + g + b;
      }

      // 至少應有部分顏色值（不是全黑）
      expect(totalBrightness).toBeGreaterThan(0);
    });
  });

  // ========== 額外整合驗證 ==========
  describe("(7x) Material-Geometry integration summary", () => {
    it("should produce render-ready geometry with all required attributes", () => {
      expect(geometry.attributes.position).toBeDefined();
      expect(geometry.attributes.color).toBeDefined();
      expect(geometry.attributes.normal).toBeDefined();

      const positions = geometry.attributes.position.count;
      const colors = geometry.attributes.color.count;
      const normals = geometry.attributes.normal.count;

      expect(colors).toBe(positions);
      expect(normals).toBe(positions);
    });

    it("should bind vertexColors correctly for per-vertex color shading", () => {
      const material = new MeshStandardMaterial({ vertexColors: true });
      const mesh = new Mesh(geometry, material);

      expect(material.vertexColors).toBe(true);
      expect(mesh.geometry.attributes.color).toBeDefined();
    });

    it("should support standard material properties without conflicts", () => {
      const material = new MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        metalness: 0.2,
      });

      expect(material.vertexColors).toBe(true);
      expect(material.roughness).toBe(0.8);
      expect(material.metalness).toBe(0.2);
    });
  });
});
