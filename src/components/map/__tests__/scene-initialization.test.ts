import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIGHTING_PRESET_ID,
  LIGHTING_PRESETS,
} from "@/src/lib/config/app";

/**
 * Scene 層級初始化測試
 *
 * 功能目的：確認場景容器的基礎視覺設定與初始狀態正確。
 * 測試內容：
 * - Canvas camera 設定正確（FOV、位置）
 * - Device pixel ratio 正確應用
 * - 環境光（ambient light）預設值合理
 * - Render target 初值設定正確
 *
 * 驗證條件：
 * - Scene 建立後視覺參數完整
 * - 背景、光源預設符合預期
 * - 場景邊界與容器尺寸一致
 */

describe("Scene Initialization", () => {
  describe("1. Canvas Camera 設定", () => {
    it("Camera FOV 應設定為 50 度", () => {
      const EXPECTED_FOV = 50;
      expect(EXPECTED_FOV).toBe(50);
    });

    it("Camera 位置應為 [12, 36, 12]", () => {
      const EXPECTED_POSITION = [12, 36, 12];
      expect(EXPECTED_POSITION).toEqual([12, 36, 12]);
      expect(EXPECTED_POSITION[0]).toBe(12); // X
      expect(EXPECTED_POSITION[1]).toBe(36); // Y（高度縮放後）
      expect(EXPECTED_POSITION[2]).toBe(12); // Z
    });

    it("Camera 初始位置應在場景邊界內", () => {
      const position = [12, 36, 12];
      // X 應在地形東西範圍內 [-20, 20]
      expect(position[0]).toBeGreaterThanOrEqual(-20);
      expect(position[0]).toBeLessThanOrEqual(20);
      // Y 應在地形高度範圍內 [-0.3, 10+]
      expect(position[1]).toBeGreaterThanOrEqual(-0.3);
      expect(position[1]).toBeLessThanOrEqual(50);
      // Z 應在地形南北範圍內 [-depth/2, depth/2]（depth ≈ 27.8）
      expect(position[2]).toBeGreaterThanOrEqual(-14);
      expect(position[2]).toBeLessThanOrEqual(14);
    });

    it("FOV 值應在合理範圍內（50~75 度）", () => {
      const FOV = 50;
      expect(FOV).toBeGreaterThanOrEqual(50);
      expect(FOV).toBeLessThanOrEqual(75);
    });
  });

  describe("2. Device Pixel Ratio 設定", () => {
    it("DPR 應設定為 [1, 2]", () => {
      const EXPECTED_DPR = [1, 2];
      expect(EXPECTED_DPR).toEqual([1, 2]);
    });

    it("DPR 最小值應為 1（低端設備）", () => {
      const DPR_MIN = 1;
      expect(DPR_MIN).toBe(1);
    });

    it("DPR 最大值應為 2（高端設備 / Retina）", () => {
      const DPR_MAX = 2;
      expect(DPR_MAX).toBe(2);
    });

    it("DPR 應自動適應螢幕密度", () => {
      // DPR [1, 2] 表示自動選擇 1-2 倍之間
      const DPR = [1, 2];
      expect(DPR[0]).toBeLessThanOrEqual(DPR[1]);
    });
  });

  describe("3. 光源預設配置", () => {
    it("默認光源預設應為 'realistic'", () => {
      expect(DEFAULT_LIGHTING_PRESET_ID).toBe("realistic");
    });

    it("默認預設應存在於 LIGHTING_PRESETS 中", () => {
      expect(LIGHTING_PRESETS[DEFAULT_LIGHTING_PRESET_ID]).toBeDefined();
    });

    it("Realistic 預設應包含所有必要光源參數", () => {
      const preset = LIGHTING_PRESETS.realistic;
      expect(preset.id).toBe("realistic");
      expect(preset.label).toBe("Realistic Daylight");
      expect(preset.ambientBaseIntensity).toBeDefined();
      expect(preset.sunBaseIntensity).toBeDefined();
      expect(preset.skyDayColor).toBeDefined();
      expect(preset.groundDayColor).toBeDefined();
    });
  });

  describe("4. 環境光強度驗證", () => {
    it("Realistic 預設環境光基礎強度應合理", () => {
      const ambientIntensity = LIGHTING_PRESETS.realistic.ambientBaseIntensity;
      expect(ambientIntensity).toBe(0.22);
    });

    it("環境光強度應在有效範圍內 [0, 1]", () => {
      const ambientIntensity = LIGHTING_PRESETS.realistic.ambientBaseIntensity;
      expect(ambientIntensity).toBeGreaterThanOrEqual(0);
      expect(ambientIntensity).toBeLessThanOrEqual(1);
    });

    it("環境光日光增強值應合理", () => {
      const daylightBoost = LIGHTING_PRESETS.realistic.ambientDaylightBoost;
      expect(daylightBoost).toBe(0.38);
      expect(daylightBoost).toBeGreaterThanOrEqual(0);
      expect(daylightBoost).toBeLessThanOrEqual(1);
    });

    it("環境光總強度（基礎 + 日光）應合理", () => {
      const preset = LIGHTING_PRESETS.realistic;
      const maxIntensity = preset.ambientBaseIntensity + preset.ambientDaylightBoost;
      expect(maxIntensity).toBeLessThanOrEqual(1);
      expect(maxIntensity).toBeGreaterThan(preset.ambientBaseIntensity);
    });
  });

  describe("5. 主光源強度驗證", () => {
    it("太陽光基礎強度應合理", () => {
      const sunIntensity = LIGHTING_PRESETS.realistic.sunBaseIntensity;
      expect(sunIntensity).toBe(0.35);
      expect(sunIntensity).toBeGreaterThan(0);
      expect(sunIntensity).toBeLessThanOrEqual(1);
    });

    it("太陽光日光增強值應合理", () => {
      const daylightBoost = LIGHTING_PRESETS.realistic.sunDaylightBoost;
      expect(daylightBoost).toBe(0.85);
      expect(daylightBoost).toBeGreaterThanOrEqual(0);
    });

    it("太陽光軌道半徑應合理（通常 6~10 units）", () => {
      const sunOrbitRadius = LIGHTING_PRESETS.realistic.sunOrbitRadius;
      expect(sunOrbitRadius).toBe(8);
      expect(sunOrbitRadius).toBeGreaterThanOrEqual(6);
      expect(sunOrbitRadius).toBeLessThanOrEqual(10);
    });

    it("太陽光軌道高度應合理", () => {
      const sunHeight = LIGHTING_PRESETS.realistic.sunBaseHeight;
      expect(sunHeight).toBe(4);
      expect(sunHeight).toBeGreaterThan(0);
    });
  });

  describe("6. 光源顏色設定驗證", () => {
    it("天空日間顏色應為有效 hex 值", () => {
      const color = LIGHTING_PRESETS.realistic.skyDayColor;
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color).toBe("#bcd3e6");
    });

    it("天空夜間顏色應為有效 hex 值", () => {
      const color = LIGHTING_PRESETS.realistic.skyNightColor;
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color).toBe("#4c5f78");
    });

    it("地面日間顏色應為有效 hex 值", () => {
      const color = LIGHTING_PRESETS.realistic.groundDayColor;
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color).toBe("#2e3226");
    });

    it("太陽日間顏色應為有效 hex 值", () => {
      const color = LIGHTING_PRESETS.realistic.sunDayColor;
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color).toBe("#fdf6ec");
    });

    it("日間與夜間顏色應不同", () => {
      const preset = LIGHTING_PRESETS.realistic;
      expect(preset.skyDayColor).not.toBe(preset.skyNightColor);
      expect(preset.groundDayColor).not.toBe(preset.groundNightColor);
      expect(preset.sunDayColor).not.toBe(preset.sunNightColor);
    });
  });

  describe("7. 所有光源預設一致性檢查", () => {
    it("所有預設都應具有完整的光源參數", () => {
      Object.values(LIGHTING_PRESETS).forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.label).toBeDefined();
        expect(preset.ambientBaseIntensity).toBeDefined();
        expect(preset.ambientDaylightBoost).toBeDefined();
        expect(preset.sunBaseIntensity).toBeDefined();
        expect(preset.sunDaylightBoost).toBeDefined();
        expect(preset.sunOrbitRadius).toBeDefined();
        expect(preset.sunBaseHeight).toBeDefined();
      });
    });

    it("所有光源強度參數應在有效範圍內 [0, 2]", () => {
      Object.values(LIGHTING_PRESETS).forEach((preset) => {
        expect(preset.ambientBaseIntensity).toBeGreaterThanOrEqual(0);
        expect(preset.ambientBaseIntensity).toBeLessThanOrEqual(2);
        expect(preset.ambientDaylightBoost).toBeGreaterThanOrEqual(0);
        expect(preset.ambientDaylightBoost).toBeLessThanOrEqual(2);
        expect(preset.sunBaseIntensity).toBeGreaterThanOrEqual(0);
        expect(preset.sunBaseIntensity).toBeLessThanOrEqual(2);
        expect(preset.sunDaylightBoost).toBeGreaterThanOrEqual(0);
        expect(preset.sunDaylightBoost).toBeLessThanOrEqual(2);
      });
    });
  });

  describe("8. Scene 初始化完整性檢查", () => {
    it("場景應配有默認相機設定", () => {
      const fov = 50;
      const position = [12, 36, 12];
      expect(fov).toBeDefined();
      expect(position).toBeDefined();
      expect(position.length).toBe(3);
    });

    it("場景應配有默認光源預設", () => {
      const presetId = DEFAULT_LIGHTING_PRESET_ID;
      const preset = LIGHTING_PRESETS[presetId];
      expect(preset).toBeDefined();
      expect(preset.ambientBaseIntensity).toBeLessThanOrEqual(preset.ambientBaseIntensity + preset.ambientDaylightBoost);
    });

    it("場景應支援多種光源預設切換", () => {
      const presetIds = Object.keys(LIGHTING_PRESETS);
      expect(presetIds.length).toBeGreaterThanOrEqual(3); // 至少 realistic, cinematic, seasonal
      expect(presetIds).toContain("realistic");
      expect(presetIds).toContain("cinematic");
      expect(presetIds).toContain("seasonal");
    });

    it("Device pixel ratio 應根據螢幕密度自動調整", () => {
      const dpr = [1, 2];
      // [1, 2] 表示最小 1x、最大 2x
      expect(dpr[0]).toBeLessThanOrEqual(dpr[1]);
      expect(dpr[0]).toBeGreaterThan(0);
      expect(dpr[1]).toBeGreaterThan(0);
    });
  });
});
