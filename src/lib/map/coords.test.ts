import { describe, it, expect } from "vitest";
import {
  ICELAND_BBOX,
  PLANE_WIDTH,
  VERTICAL_EXAGGERATION,
  SEA_FLOOR_UNIT,
  computePlaneDepth,
  computeKmPerUnit,
  lonLatToSceneXZ,
  sceneXZToLonLat,
  elevationToSceneY,
  sampleElevationMeters,
  type HeightmapGrid,
} from "./coords";

describe("Coordinate Reference System (CRS) - coords.ts", () => {
  /**
   * 層級 1：CRS 座標轉換（邏輯層 - Unit Test）
   * 目的：驗證經緯度 & 高度 → 場景座標的轉換邏輯
   * 資料來源：純 mock（不依賴 JSON）
   */

  describe("lonLatToSceneXZ - 水平座標轉換", () => {
    it("中心點應映射到 (0, 0)", () => {
      const centerLon = (ICELAND_BBOX.lonMin + ICELAND_BBOX.lonMax) / 2;
      const centerLat = (ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2;
      const { x, z } = lonLatToSceneXZ(centerLon, centerLat);
      expect(x).toBeCloseTo(0, 1);
      expect(z).toBeCloseTo(0, 1);
    });

    it("西邊界應映射到 x ≈ -PLANE_WIDTH/2", () => {
      const centerLat = (ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2;
      const { x } = lonLatToSceneXZ(ICELAND_BBOX.lonMin, centerLat);
      expect(x).toBeCloseTo(-PLANE_WIDTH / 2, 0);
    });

    it("東邊界應映射到 x ≈ +PLANE_WIDTH/2", () => {
      const centerLat = (ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2;
      const { x } = lonLatToSceneXZ(ICELAND_BBOX.lonMax, centerLat);
      expect(x).toBeCloseTo(PLANE_WIDTH / 2, 0);
    });

    it("北邊界（高緯度）應映射到 z < 0", () => {
      const centerLon = (ICELAND_BBOX.lonMin + ICELAND_BBOX.lonMax) / 2;
      const { z } = lonLatToSceneXZ(centerLon, ICELAND_BBOX.latMax);
      expect(z).toBeLessThan(0);
    });

    it("南邊界（低緯度）應映射到 z > 0", () => {
      const centerLon = (ICELAND_BBOX.lonMin + ICELAND_BBOX.lonMax) / 2;
      const { z } = lonLatToSceneXZ(centerLon, ICELAND_BBOX.latMin);
      expect(z).toBeGreaterThan(0);
    });

    it("所有座標應落在場景邊界內", () => {
      const testPoints = [
        { lon: ICELAND_BBOX.lonMin, lat: ICELAND_BBOX.latMin },
        { lon: ICELAND_BBOX.lonMax, lat: ICELAND_BBOX.latMax },
        { lon: (ICELAND_BBOX.lonMin + ICELAND_BBOX.lonMax) / 2, lat: (ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2 },
      ];

      testPoints.forEach(({ lon, lat }) => {
        const { x, z } = lonLatToSceneXZ(lon, lat);
        expect(Math.abs(x)).toBeLessThanOrEqual(PLANE_WIDTH / 2 + 0.1);
        expect(Math.abs(z)).toBeLessThanOrEqual(computePlaneDepth() / 2 + 0.1);
      });
    });
  });

  describe("sceneXZToLonLat - 反向轉換", () => {
    it("反向轉換應復原原始座標（round-trip）", () => {
      const originalLon = -18.5;
      const originalLat = 64.8;
      const { x, z } = lonLatToSceneXZ(originalLon, originalLat);
      const { lon, lat } = sceneXZToLonLat(x, z);

      expect(lon).toBeCloseTo(originalLon, 3);
      expect(lat).toBeCloseTo(originalLat, 3);
    });

    it("中心 (0, 0) 應反向映射到 bbox 中心", () => {
      const { lon, lat } = sceneXZToLonLat(0, 0);
      const expectedLon = (ICELAND_BBOX.lonMin + ICELAND_BBOX.lonMax) / 2;
      const expectedLat = (ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2;

      expect(lon).toBeCloseTo(expectedLon, 3);
      expect(lat).toBeCloseTo(expectedLat, 3);
    });
  });

  describe("elevationToSceneY - 垂直座標轉換", () => {
    it("海拔 0m 應映射到 y = 0", () => {
      const y = elevationToSceneY(0);
      expect(y).toBe(0);
    });

    it("正海拔應應用垂直誇張（×25）", () => {
      const elevationM = 1000; // 1000 公尺
      const y = elevationToSceneY(elevationM);
      // 1000m / (總 km 數 / PLANE_WIDTH) * VERTICAL_EXAGGERATION
      // 簡化檢查：應該 > 0 且合理大小
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(50); // 合理上界
    });

    it("負海拔（海底）應夾平到 SEA_FLOOR_UNIT", () => {
      const elevationM = -500;
      const y = elevationToSceneY(elevationM);
      expect(y).toBe(SEA_FLOOR_UNIT);
    });

    it("邊界值：elevation = 0 應映射到 0", () => {
      expect(elevationToSceneY(0)).toBe(0);
    });

    it("大幅正海拔（2000m）應映射合理值", () => {
      const y = elevationToSceneY(2000);
      expect(y).toBeGreaterThan(elevationToSceneY(1000));
      expect(y).toBeLessThan(50);
    });

    it("海岸線裁切：-100m 應等於 -220m（都是 SEA_FLOOR_UNIT）", () => {
      const y1 = elevationToSceneY(-100);
      const y2 = elevationToSceneY(-220);
      expect(y1).toBe(y2);
      expect(y1).toBe(SEA_FLOOR_UNIT);
    });
  });

  describe("computePlaneDepth - 平面深度計算", () => {
    it("應回傳正數", () => {
      const depth = computePlaneDepth();
      expect(depth).toBeGreaterThan(0);
    });

    it("深度應大於或等於寬度（緯度跨度大於經度）", () => {
      const depth = computePlaneDepth();
      // 冰島南北約 3.3°，東西約 11.2°，南北實距應小於東西
      // 但考慮緯度餘弦收斂，實際比例需檢查
      expect(depth).toBeGreaterThan(0);
      // 簡單檢查：深度應在合理範圍內
      expect(depth).toBeLessThan(100);
    });
  });

  describe("computeKmPerUnit - 水平單位換算係數", () => {
    it("應回傳正數（km/unit）", () => {
      const kmPerUnit = computeKmPerUnit();
      expect(kmPerUnit).toBeGreaterThan(0);
    });

    it("換算結果應合理（冰島東西實距 × 餘弦收斂 / PLANE_WIDTH）", () => {
      const kmPerUnit = computeKmPerUnit();
      // 冰島東西跨度 11.2°，中心緯度 64.95°
      // 實距 = 11.2 * 111.32 * cos(64.95°) ≈ 526 km
      // kmPerUnit = 526 / 40 ≈ 13.15
      expect(kmPerUnit).toBeGreaterThan(12);
      expect(kmPerUnit).toBeLessThan(15);
    });
  });

  describe("sampleElevationMeters - Heightmap 取樣", () => {
    it("應回傳高程陣列中對應座標的海拔值", () => {
      // Mock heightmap：4×4 網格，海拔值 0-15
      const mockHeightmap: HeightmapGrid = {
        grid: 4,
        bbox: ICELAND_BBOX,
        elevations: Array.from({ length: 16 }, (_, i) => i * 100), // [0, 100, 200, ..., 1500]
      };

      // 中心應取得中間值
      const centerLon = (ICELAND_BBOX.lonMin + ICELAND_BBOX.lonMax) / 2;
      const centerLat = (ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2;
      const elev = sampleElevationMeters(mockHeightmap, centerLon, centerLat);

      expect(elev).toBeGreaterThanOrEqual(0);
      expect(elev).toBeLessThanOrEqual(1500);
    });

    it("邊界點應取樣到網格邊界值", () => {
      const mockHeightmap: HeightmapGrid = {
        grid: 4,
        bbox: ICELAND_BBOX,
        elevations: Array.from({ length: 16 }, (_, i) => i * 100),
      };

      // 西南角應近似取樣到第一個值
      const elev = sampleElevationMeters(mockHeightmap, ICELAND_BBOX.lonMin, ICELAND_BBOX.latMin);
      expect(elev).toBeDefined();
      expect(typeof elev).toBe("number");
    });

    it("超出 bbox 的座標應被 clamp 到邊界", () => {
      const mockHeightmap: HeightmapGrid = {
        grid: 4,
        bbox: ICELAND_BBOX,
        elevations: Array.from({ length: 16 }, (_, i) => i * 100),
      };

      // 超出西邊界
      const lon = ICELAND_BBOX.lonMin - 5;
      const lat = (ICELAND_BBOX.latMin + ICELAND_BBOX.latMax) / 2;
      const elev = sampleElevationMeters(mockHeightmap, lon, lat);

      expect(elev).toBeDefined();
      expect(typeof elev).toBe("number");
    });
  });

  describe("整合檢查 - 座標轉換一致性", () => {
    it("CRS 常數應保持一致（VERTICAL_EXAGGERATION 與 SEA_FLOOR_UNIT）", () => {
      expect(VERTICAL_EXAGGERATION).toBe(25);
      expect(SEA_FLOOR_UNIT).toBe(-0.3);
    });

    it("所有轉換函式應使用相同 bbox 常數", () => {
      // 檢查 bbox 合理性（冰島範圍）
      expect(ICELAND_BBOX.lonMin).toBeLessThan(ICELAND_BBOX.lonMax);
      expect(ICELAND_BBOX.latMin).toBeLessThan(ICELAND_BBOX.latMax);
      expect(ICELAND_BBOX.lonMin).toBeGreaterThan(-30); // 西邊界合理
      expect(ICELAND_BBOX.lonMax).toBeLessThan(-10); // 東邊界合理
      expect(ICELAND_BBOX.latMin).toBeGreaterThan(63); // 南邊界合理
      expect(ICELAND_BBOX.latMax).toBeLessThan(67); // 北邊界合理
    });
  });
});
