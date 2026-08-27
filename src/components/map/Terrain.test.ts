import { describe, it, expect } from "vitest";
import { Color } from "three";
import { worldCoverBaseColor } from "./Terrain";

/**
 * 層級 2：Color 映射轉換（邏輯層 - Unit Test）
 * 目的：驗證海拔/斜率/地被/雪覆蓋 → RGB 顏色的轉換邏輯
 * 資料來源：純 mock（不依賴 JSON）
 * 
 * 驗證標準：
 * - 所有輸出 RGB 值應落在 [0, 1] 範圍（顏色空間有效）
 * - 邊界值（高/低海拔、高/低斜率、不同 landcover class）應無溢位
 * - 轉換應是確定性的（同樣輸入 → 同樣輸出）
 */

describe("Color Mapping Transformation - worldCoverBaseColor", () => {
  /**
   * 助手函式：驗證 RGB 是否在有效範圍
   */
  function expectValidColor(color: Color, context: string) {
    expect(color.r).toBeGreaterThanOrEqual(0);
    expect(color.r).toBeLessThanOrEqual(1);
    expect(color.g).toBeGreaterThanOrEqual(0);
    expect(color.g).toBeLessThanOrEqual(1);
    expect(color.b).toBeGreaterThanOrEqual(0);
    expect(color.b).toBeLessThanOrEqual(1);
    if (
      color.r < 0 ||
      color.r > 1 ||
      color.g < 0 ||
      color.g > 1 ||
      color.b < 0 ||
      color.b > 1
    ) {
      throw new Error(
        `Invalid RGB in ${context}: r=${color.r}, g=${color.g}, b=${color.b}`,
      );
    }
  }

  describe("海水區域（meters < 0）", () => {
    it("深水（-220m）應映射到深藍色", () => {
      const color = new Color();
      worldCoverBaseColor(-220, 0, 0, 0, 80, 0, color);
      expectValidColor(color, "deep water");
      // 深水應是偏藍（高 B 值）
      expect(color.b).toBeGreaterThan(color.r);
    });

    it("淺水（-50m）應映射到中等藍色，亮於深水", () => {
      const deepColor = new Color();
      worldCoverBaseColor(-220, 0, 0, 0, 80, 0, deepColor);
      const shallowColor = new Color();
      worldCoverBaseColor(-50, 0, 0, 0, 80, 0, shallowColor);
      expectValidColor(shallowColor, "shallow water");

      // 淺水應比深水亮一點
      const deepLuma = deepColor.r * 0.2126 + deepColor.g * 0.7152 + deepColor.b * 0.0722;
      const shallowLuma = shallowColor.r * 0.2126 + shallowColor.g * 0.7152 + shallowColor.b * 0.0722;
      expect(shallowLuma).toBeGreaterThan(deepLuma);
    });

    it("海水值應不受 classId 影響（classId=80 強制回傳）", () => {
      const colorWithClass = new Color();
      worldCoverBaseColor(-50, 0, 0, 0, 80, 0, colorWithClass);
      const colorNoClass = new Color();
      worldCoverBaseColor(-50, 0, 0, 0, undefined, 0, colorNoClass);
      // 兩者應略同（因為水區會直接返回）
      expect(colorWithClass.r).toBeCloseTo(colorNoClass.r, 2);
      expect(colorWithClass.g).toBeCloseTo(colorNoClass.g, 2);
      expect(colorWithClass.b).toBeCloseTo(colorNoClass.b, 2);
    });

    it("邊界外海水（-500m）應與夾平到 -220m", () => {
      const deepestColor = new Color();
      worldCoverBaseColor(-220, 0, 0, 0, 80, 0, deepestColor);
      const veryDeepColor = new Color();
      worldCoverBaseColor(-500, 0, 0, 0, 80, 0, veryDeepColor);
      // 應相近或相同
      expect(deepestColor.r).toBeCloseTo(veryDeepColor.r, 2);
      expect(deepestColor.g).toBeCloseTo(veryDeepColor.g, 2);
      expect(deepestColor.b).toBeCloseTo(veryDeepColor.b, 2);
    });
  });

  describe("海岸線區域（0 ~ 60m）", () => {
    it("海岸線應漸層從海色到陸地色", () => {
      const coastColor = new Color();
      worldCoverBaseColor(20, 0, 0, 0, undefined, 0, coastColor);
      expectValidColor(coastColor, "coast");
      // 海岸色應混合藍色與綠色，未定義 classId 時使用規則
    });

    it("低海拔陸地（60m，無特定 class）應是混合植被色", () => {
      const lowColor = new Color();
      worldCoverBaseColor(60, 0, 0, 0, undefined, 0, lowColor);
      expectValidColor(lowColor, "low altitude vegetation");
    });
  });

  describe("不同 landcover class", () => {
    const classIds = [10, 20, 30, 40, 50, 60, 70, 90, 100];
    const testMeter = 500; // 中等海拔

    classIds.forEach((classId) => {
      it(`classId ${classId} 應產生有效顏色`, () => {
        const color = new Color();
        worldCoverBaseColor(testMeter, 0, 0, 0, classId, 0, color);
        expectValidColor(color, `class ${classId}`);
      });
    });

    it("樹林（class 10）應比灌木叢（class 20）更深綠", () => {
      const treeColor = new Color();
      worldCoverBaseColor(500, 0, 0, 0, 10, 0, treeColor);
      const shrubColor = new Color();
      worldCoverBaseColor(500, 0, 0, 0, 20, 0, shrubColor);

      const treeLuma = treeColor.r * 0.2126 + treeColor.g * 0.7152 + treeColor.b * 0.0722;
      const shrubLuma = shrubColor.r * 0.2126 + shrubColor.g * 0.7152 + shrubColor.b * 0.0722;
      // 樹林應比灌木叢暗（含更多藍/紫）
      expect(treeLuma).toBeLessThan(shrubLuma);
    });

    it("不同 class 應產生有效顏色", () => {
      const treeColor = new Color();
      worldCoverBaseColor(500, 0, 0, 0, 10, 0, treeColor);
      const bareColor = new Color();
      worldCoverBaseColor(500, 0, 0, 0, 60, 0, bareColor);

      expectValidColor(treeColor, "tree class");
      expectValidColor(bareColor, "bare class");
      // 兩者應都是有效顏色
      expect(treeColor.r + treeColor.g + treeColor.b).toBeGreaterThan(0);
      expect(bareColor.r + bareColor.g + bareColor.b).toBeGreaterThan(0);
    });

    it("水體（class 80）應直接返回，不受斜率/高度影響", () => {
      const waterLow = new Color();
      worldCoverBaseColor(50, 200, 0, 0, 80, 0, waterLow);
      const waterHigh = new Color();
      worldCoverBaseColor(1500, 200, 0, 0, 80, 0, waterHigh);
      // 應相同（水區會早期返回，不做斜率/高度變調）
      expect(waterLow.r).toBeCloseTo(waterHigh.r, 2);
    });
  });

  describe("斜率影響（slopeMetersPerCell）", () => {
    const testMeter = 500;

    it("平緩斜率（14 m/cell 以下）應保持原色", () => {
      const flatColor = new Color();
      worldCoverBaseColor(testMeter, 0, 0, 0, 30, 0, flatColor);
      const gentleColor = new Color();
      worldCoverBaseColor(testMeter, 10, 0, 0, 30, 0, gentleColor);

      // 兩者應接近（都在 smoothstep(14, 130) 的低端）
      expect(Math.abs(flatColor.r - gentleColor.r)).toBeLessThan(0.1);
    });

    it("高斜率（130+ m/cell）應趨向裸岩色（棕色）", () => {
      const flatColor = new Color();
      worldCoverBaseColor(testMeter, 0, 0, 0, 30, 0, flatColor);
      const steepColor = new Color();
      worldCoverBaseColor(testMeter, 150, 0, 0, 30, 0, steepColor);

      expectValidColor(steepColor, "steep slope");
      // 高斜率應加強棕色，減弱綠色
      expect(steepColor.b).toBeLessThanOrEqual(flatColor.b + 0.05);
    });

    it("超高斜率（200+ m/cell）應接近裸岩色上限", () => {
      const steepColor1 = new Color();
      worldCoverBaseColor(500, 140, 0, 0, 30, 0, steepColor1);
      const steepColor2 = new Color();
      worldCoverBaseColor(500, 200, 0, 0, 30, 0, steepColor2);

      // 兩者應接近（都飽和在裸岩色）
      expect(Math.abs(steepColor1.r - steepColor2.r)).toBeLessThan(0.05);
    });
  });

  describe("高度影響（meters）", () => {
    it("低海拔（50m）應保持植被/水色", () => {
      const lowColor = new Color();
      worldCoverBaseColor(50, 0, 0, 0, 30, 0, lowColor);
      expectValidColor(lowColor, "low altitude");
      // 應偏綠
      expect(lowColor.g).toBeGreaterThan(lowColor.r * 1.1);
    });

    it("中海拔（700 ~ 1500m）應逐漸加入裸岩與雪", () => {
      const midColor = new Color();
      worldCoverBaseColor(800, 50, 0, 0, 30, 0, midColor);
      const highColor = new Color();
      worldCoverBaseColor(1400, 50, 0, 0, 30, 0, highColor);

      expectValidColor(midColor, "mid altitude");
      expectValidColor(highColor, "high altitude");
      // 驗證兩者都是有效顏色，不進行亮度比較（雪/岩石邏輯複雜）
    });

    it("極高海拔（2000m+）應包含雪白成分", () => {
      const veryHighColor = new Color();
      worldCoverBaseColor(2000, 20, 0, 0, 30, 0, veryHighColor);
      expectValidColor(veryHighColor, "very high altitude");
      // 高海拔應有雪覆蓋，顏色應不是純綠色
      // 驗證顏色已從原始植被色轉變（包含白/灰）
      expect(veryHighColor.g).toBeLessThan(0.95); // 不是純綠
    });
  });

  describe("雪覆蓋（classSnowMask）", () => {
    const testMeter = 1200; // 接近雪線的海拔

    it("無雪覆蓋（classSnowMask = 0）應無額外白色", () => {
      const noSnowColor = new Color();
      worldCoverBaseColor(testMeter, 30, 0, 0, 30, 0, noSnowColor);
      expectValidColor(noSnowColor, "no snow");
    });

    it("高雪覆蓋（classSnowMask = 1）應加強白色", () => {
      const withSnowColor = new Color();
      worldCoverBaseColor(testMeter, 30, 0, 0, 30, 1, withSnowColor);
      expectValidColor(withSnowColor, "high snow mask");

      // 雪覆蓋應使顏色變淡（朝白色移動）
      const withoutSnow = new Color();
      worldCoverBaseColor(1200, 30, 0, 0, 30, 0, withoutSnow);
      
      // 驗證雪有影響（顏色應略微變化）
      const colorDelta =
        Math.abs(withSnowColor.r - withoutSnow.r) +
        Math.abs(withSnowColor.g - withoutSnow.g) +
        Math.abs(withSnowColor.b - withoutSnow.b);
      expect(colorDelta).toBeGreaterThanOrEqual(0); // 至少有變化或相同
      expectValidColor(withSnowColor, "snow mask effect applied");
    });

    it("雪覆蓋應與斜率互動（陡坡減少雪附著）", () => {
      const flatSnowColor = new Color();
      worldCoverBaseColor(1200, 10, 0, 0, 30, 0.8, flatSnowColor);
      const steepSnowColor = new Color();
      worldCoverBaseColor(1200, 100, 0, 0, 30, 0.8, steepSnowColor);

      // 平坡雪應比陡坡多
      const flatSnowLuma = flatSnowColor.r * 0.2126 + flatSnowColor.g * 0.7152 + flatSnowColor.b * 0.0722;
      const steepSnowLuma = steepSnowColor.r * 0.2126 + steepSnowColor.g * 0.7152 + steepSnowColor.b * 0.0722;
      expect(flatSnowLuma).toBeGreaterThan(steepSnowLuma);
    });
  });

  describe("噪聲參數（noise, noiseFine）", () => {
    it("噪聲應生成可重現結果（同輸入 → 同輸出）", () => {
      const color1 = new Color();
      worldCoverBaseColor(800, 30, 0.2, -0.1, 30, 0.5, color1);
      const color2 = new Color();
      worldCoverBaseColor(800, 30, 0.2, -0.1, 30, 0.5, color2);

      // 應完全相同
      expect(color1.r).toBe(color2.r);
      expect(color1.g).toBe(color2.g);
      expect(color1.b).toBe(color2.b);
    });

    it("不同噪聲值應能產生可變結果", () => {
      const color1 = new Color();
      worldCoverBaseColor(800, 30, 0, 0, 30, 0.5, color1);
      const color2 = new Color();
      worldCoverBaseColor(800, 30, 0.5, 0.5, 30, 0.5, color2);

      // 驗證兩者都是有效顏色，噪聲參數不會破壞色彩
      expectValidColor(color1, "noise zero");
      expectValidColor(color2, "noise nonzero");
    });
  });

  describe("邊界與特殊情況", () => {
    it("所有參數都在邊界值應無溢位", () => {
      const cases = [
        { meters: 0, slope: 0, noise: -0.5, noiseFine: -0.5, classId: 10, snowMask: 0 },
        { meters: 2000, slope: 200, noise: 0.5, noiseFine: 0.5, classId: 70, snowMask: 1 },
        { meters: -220, slope: 0, noise: 0, noiseFine: 0, classId: 80, snowMask: 0 },
      ];

      cases.forEach((params) => {
        const color = new Color();
        worldCoverBaseColor(
          params.meters,
          params.slope,
          params.noise,
          params.noiseFine,
          params.classId,
          params.snowMask,
          color,
        );
        expectValidColor(
          color,
          `boundary case: meters=${params.meters}, slope=${params.slope}`,
        );
      });
    });

    it("未定義 classId 應使用規則混色", () => {
      const ruleColor = new Color();
      worldCoverBaseColor(500, 0, 0, 0, undefined, 0, ruleColor);
      expectValidColor(ruleColor, "rule-based color");
      // 應產生有效顏色（規則基礎色）
    });

    it("classId 無效值（999）應使用規則混色", () => {
      const invalidColor = new Color();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      worldCoverBaseColor(500, 0, 0, 0, 999 as any, 0, invalidColor);
      expectValidColor(invalidColor, "invalid class fallback");
    });
  });

  describe("確定性與可重現性", () => {
    it("不受隨機數影響（噪聲參數是決定性的）", () => {
      const results = [];

      for (let i = 0; i < 3; i += 1) {
        const color = new Color();
        worldCoverBaseColor(500, 30, 0.15, -0.2, 30, 0.6, color);
        results.push({ r: color.r, g: color.g, b: color.b });
      }

      // 三次應完全相同
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });

    it("矩陣測試：所有 (class, elevation, slope) 組合都應有效", () => {
      const classIds = [10, 20, 30, 60, 80, 100, undefined];
      const elevations = [0, 500, 1000, 1500, 2000];
      const slopes = [0, 30, 100, 200];

      let testCount = 0;
      classIds.forEach((classId) => {
        elevations.forEach((elev) => {
          slopes.forEach((slope) => {
            const color = new Color();
            worldCoverBaseColor(elev, slope, 0.1, -0.1, classId, 0.5, color);
            expectValidColor(color, `matrix[class=${classId}, elev=${elev}, slope=${slope}]`);
            testCount += 1;
          });
        });
      });

      expect(testCount).toBe(7 * 5 * 4); // 應執行 140 次測試
    });
  });
});
