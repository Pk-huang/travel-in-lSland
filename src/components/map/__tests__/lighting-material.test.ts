import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIGHTING_PRESET_ID,
  LIGHTING_PRESETS,
} from "@/src/lib/config/app";
import {
  computeLighting,
  hexToRgb,
  mixHexColor,
  rgbToHex,
} from "@/src/components/map/Lighting";

/**
 * 光影與場景參數測試
 *
 * 功能目的：驗證光源計算、應用、時間轉換、顏色混合的正確性。
 *
 * 測試範圍：
 * - 色彩轉換函式（hex ↔ RGB、日夜色混合）
 * - 日光與強度計算（daylight、環境光、主光源強度）
 * - 太陽位置軌跡（軌道、高度、角度）
 * - 三預設差異驗證（视覺參數不同）
 * - 邊界與特殊情況（無效日期 fallback、數值 clamp）
 *
 * 不在此測試的項目（已歸屬其他）：
 * × 預設參數存在性 → scene-initialization.test.ts
 * × Material & Geometry 綁定 → material-geometry.test.ts（後續）
 * × 陰影參數 → 未實現
 * × 時間軸 UI 互動 → E2E 測試
 */

describe("光影與場景參數", () => {
  describe("1. 色彩轉換函式", () => {
    it("hexToRgb: '#bcd3e6' 應轉換為 [188, 211, 230]", () => {
      const rgb = hexToRgb("#bcd3e6");
      expect(rgb[0]).toBe(188);
      expect(rgb[1]).toBe(211);
      expect(rgb[2]).toBe(230);
    });

    it("hexToRgb: '#000000' 應為 [0, 0, 0]", () => {
      const rgb = hexToRgb("#000000");
      expect(rgb[0]).toBe(0);
      expect(rgb[1]).toBe(0);
      expect(rgb[2]).toBe(0);
    });

    it("hexToRgb: '#ffffff' 應為 [255, 255, 255]", () => {
      const rgb = hexToRgb("#ffffff");
      expect(rgb[0]).toBe(255);
      expect(rgb[1]).toBe(255);
      expect(rgb[2]).toBe(255);
    });

    it("hexToRgb: 無效格式應 fallback 為 [255, 255, 255]", () => {
      const rgb = hexToRgb("invalid");
      expect(rgb[0]).toBe(255);
      expect(rgb[1]).toBe(255);
      expect(rgb[2]).toBe(255);
    });

    it("rgbToHex: [188, 211, 230] 應轉換為 '#bcd3e6'", () => {
      const hex = rgbToHex(188, 211, 230);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      // 轉換回來驗證往返正確
      const roundTrip = hexToRgb(hex);
      expect(roundTrip[0]).toBe(188);
      expect(roundTrip[1]).toBe(211);
      expect(roundTrip[2]).toBe(230);
    });

    it("rgbToHex: 轉換結果應使用小寫且 padding 為 2 位", () => {
      const hex = rgbToHex(15, 15, 15);
      expect(hex).toBe("#0f0f0f");
    });

    it("mixHexColor: t=0 時應全夜間色", () => {
      const result = mixHexColor("#4c5f78", "#bcd3e6", 0);
      const rgb = hexToRgb(result);
      const nightRgb = hexToRgb("#4c5f78");
      expect(rgb[0]).toBe(nightRgb[0]);
      expect(rgb[1]).toBe(nightRgb[1]);
      expect(rgb[2]).toBe(nightRgb[2]);
    });

    it("mixHexColor: t=1 時應全日間色", () => {
      const result = mixHexColor("#4c5f78", "#bcd3e6", 1);
      const rgb = hexToRgb(result);
      const dayRgb = hexToRgb("#bcd3e6");
      expect(rgb[0]).toBe(dayRgb[0]);
      expect(rgb[1]).toBe(dayRgb[1]);
      expect(rgb[2]).toBe(dayRgb[2]);
    });

    it("mixHexColor: t=0.5 時應在中間值", () => {
      const result = mixHexColor("#000000", "#ffffff", 0.5);
      const rgb = hexToRgb(result);
      // 中間值應接近 [127, 127, 127]
      expect(Math.abs(rgb[0] - 127)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb[1] - 127)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb[2] - 127)).toBeLessThanOrEqual(2);
    });

    it("mixHexColor: 平滑漸層 - 相鄰 t 值顏色差異應平順", () => {
      const t1 = 0.2;
      const t2 = 0.25;
      const color1 = hexToRgb(mixHexColor("#4c5f78", "#bcd3e6", t1));
      const color2 = hexToRgb(mixHexColor("#4c5f78", "#bcd3e6", t2));

      const diffR = Math.abs(color1[0] - color2[0]);
      const diffG = Math.abs(color1[1] - color2[1]);
      const diffB = Math.abs(color1[2] - color2[2]);

      // 0.05 差異的 t 值色差應 < 10
      expect(Math.max(diffR, diffG, diffB)).toBeLessThan(10);
    });
  });

  describe("2. 日光與強度計算", () => {
    it("computeLighting: 日間（UTC 12:00） daylight 應接近 1", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      expect(lighting.daylight).toBeGreaterThan(0.8);
      expect(lighting.daylight).toBeLessThanOrEqual(1);
    });

    it("computeLighting: 夜間（UTC 0:00） daylight 應為 0", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 0, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      expect(lighting.daylight).toBe(0);
    });

    it("computeLighting: 日光值隨 UTC 時間變化", () => {
      const daylights = [];
      for (let utcHour = 0; utcHour < 24; utcHour++) {
        const date = new Date(Date.UTC(2026, 0, 15, utcHour, 0));
        const preset = LIGHTING_PRESETS.realistic;
        const lighting = computeLighting(date, preset, undefined);
        daylights.push(lighting.daylight);
      }

      // 應該有白天和夜晚的變化
      const maxDaylight = Math.max(...daylights);
      const minDaylight = Math.min(...daylights);
      expect(maxDaylight).toBeGreaterThan(0.5);
      expect(minDaylight).toBe(0);
    });

    it("computeLighting: 環境光強度 daylight=0 時應為基礎值", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 0, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      // daylight=0 時，ambientIntensity = ambientBaseIntensity
      expect(lighting.ambientIntensity).toBeCloseTo(preset.ambientBaseIntensity, 2);
    });

    it("computeLighting: 環境光強度 daylight=1 時應為基礎 + 日光增強", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      const expected = preset.ambientBaseIntensity + preset.ambientDaylightBoost;
      expect(lighting.ambientIntensity).toBeCloseTo(expected, 1);
    });

    it("computeLighting: 主光強度 daylight=0 時應為基礎值", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 0, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      expect(lighting.sunIntensity).toBeCloseTo(preset.sunBaseIntensity, 2);
    });

    it("computeLighting: 主光強度 daylight=1 時應為基礎 + 日光增強", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      const expected = preset.sunBaseIntensity + preset.sunDaylightBoost;
      expect(lighting.sunIntensity).toBeCloseTo(expected, 1);
    });

    it("computeLighting: daylight 值應始終 [0, 1]（已 clamp）", () => {
      // 測試多個時間點
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(Date.UTC(2026, 0, 15, hour, 0));
        const preset = LIGHTING_PRESETS.realistic;
        const lighting = computeLighting(date, preset, undefined);

        expect(lighting.daylight).toBeGreaterThanOrEqual(0);
        expect(lighting.daylight).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("3. 太陽位置軌跡", () => {
    it("computeLighting: sunPosition 應在軌道半徑上", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      const radius = Math.sqrt(
        lighting.sunPosition[0] ** 2 + lighting.sunPosition[2] ** 2,
      );
      expect(radius).toBeCloseTo(preset.sunOrbitRadius, 1);
    });

    it("computeLighting: 日間 sunHeight 應 > 夜間 sunHeight", () => {
      const dateDay = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const dateNight = new Date(Date.UTC(2026, 0, 15, 0, 0));
      const preset = LIGHTING_PRESETS.realistic;

      const lightingDay = computeLighting(dateDay, preset, undefined);
      const lightingNight = computeLighting(dateNight, preset, undefined);

      expect(lightingDay.sunPosition[1]).toBeGreaterThan(
        lightingNight.sunPosition[1],
      );
    });

    it("computeLighting: sunHeight daylight=0 時應為基礎值", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 0, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      expect(lighting.sunPosition[1]).toBeCloseTo(preset.sunBaseHeight, 2);
    });

    it("computeLighting: sunHeight daylight=1 時應為基礎 + 日光增強", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      const expected =
        preset.sunBaseHeight + preset.sunDaylightHeightBoost;
      expect(lighting.sunPosition[1]).toBeCloseTo(expected, 1);
    });

    it("computeLighting: sunAngle 隨時間連續變化", () => {
      const angles = [];
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(Date.UTC(2026, 0, 15, hour, 0));
        const preset = LIGHTING_PRESETS.realistic;
        const lighting = computeLighting(date, preset, undefined);
        angles.push(lighting.sunAngle);
      }

      // 角度應單調遞增（或接近 2π 時重置）
      for (let i = 0; i < angles.length - 1; i++) {
        const angleDiff = angles[i + 1] - angles[i];
        // 差異應為正或接近 -2π
        expect(angleDiff > -1 || angleDiff < -6).toBe(true);
      }
    });

    it("computeLighting: 太陽位置 XZ 應涵蓋完整圓周軌跡", () => {
      const positions = [];
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(Date.UTC(2026, 0, 15, hour, 0));
        const preset = LIGHTING_PRESETS.realistic;
        const lighting = computeLighting(date, preset, undefined);
        positions.push({
          x: lighting.sunPosition[0],
          z: lighting.sunPosition[2],
        });
      }

      // 應包含正面、負面的 x 和 z 分量
      const xValues = positions.map((p) => p.x);
      const zValues = positions.map((p) => p.z);

      expect(Math.max(...xValues)).toBeGreaterThan(0);
      expect(Math.min(...xValues)).toBeLessThan(0);
      expect(Math.max(...zValues)).toBeGreaterThan(0);
      expect(Math.min(...zValues)).toBeLessThan(0);
    });
  });

  describe("4. 色彩計算與混合", () => {
    it("computeLighting: 日間色彩應比夜間色彩更亮", () => {
      const dateDay = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const dateNight = new Date(Date.UTC(2026, 0, 15, 0, 0));
      const preset = LIGHTING_PRESETS.realistic;

      const lightingDay = computeLighting(dateDay, preset, undefined);
      const lightingNight = computeLighting(dateNight, preset, undefined);

      // 天空色日間應比夜間更亮
      const dayRgb = hexToRgb(lightingDay.skyColor);
      const nightRgb = hexToRgb(lightingNight.skyColor);
      const dayBrightness = dayRgb[0] + dayRgb[1] + dayRgb[2];
      const nightBrightness = nightRgb[0] + nightRgb[1] + nightRgb[2];

      expect(dayBrightness).toBeGreaterThan(nightBrightness);
    });

    it("computeLighting: skyColor、groundColor、sunColor 應有有效 hex 格式", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      expect(lighting.skyColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(lighting.groundColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(lighting.sunColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("computeLighting: 日間色應接近預設日間色", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      // daylight=1 時，色彩應接近日間色
      const skyRgb = hexToRgb(lighting.skyColor);
      const presetRgb = hexToRgb(preset.skyDayColor);

      // 允許小誤差
      expect(Math.abs(skyRgb[0] - presetRgb[0])).toBeLessThan(5);
      expect(Math.abs(skyRgb[1] - presetRgb[1])).toBeLessThan(5);
      expect(Math.abs(skyRgb[2] - presetRgb[2])).toBeLessThan(5);
    });
  });

  describe("5. 三預設差異驗證", () => {
    it("realistic vs cinematic: 環境光基礎強度不同", () => {
      const dateNight = new Date(Date.UTC(2026, 0, 15, 0, 0));

      const realistic = computeLighting(
        dateNight,
        LIGHTING_PRESETS.realistic,
        undefined,
      );
      const cinematic = computeLighting(
        dateNight,
        LIGHTING_PRESETS.cinematic,
        undefined,
      );

      // realistic.ambientBaseIntensity = 0.22
      // cinematic.ambientBaseIntensity = 0.14
      expect(realistic.ambientIntensity).toBeGreaterThan(
        cinematic.ambientIntensity,
      );
    });

    it("cinematic: 日光增強更強（高對比）", () => {
      const dateDay = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.cinematic;
      const lighting = computeLighting(dateDay, preset, undefined);

      // cinematic.sunDaylightBoost = 1.25（最高）
      const expected =
        preset.sunBaseIntensity + preset.sunDaylightBoost;
      expect(lighting.sunIntensity).toBeCloseTo(expected, 1);
    });

    it("seasonal: 所有預設參數都已定義", () => {
      const preset = LIGHTING_PRESETS.seasonal;

      expect(preset.ambientBaseIntensity).toBeDefined();
      expect(preset.ambientDaylightBoost).toBeDefined();
      expect(preset.sunBaseIntensity).toBeDefined();
      expect(preset.sunDaylightBoost).toBeDefined();
      expect(preset.sunOrbitRadius).toBeDefined();
      expect(preset.sunBaseHeight).toBeDefined();
      expect(preset.sunDaylightHeightBoost).toBeDefined();
    });

    it("三預設的日間色彩應不同", () => {
      const dateDay = new Date(Date.UTC(2026, 0, 15, 12, 0));

      const realistic = computeLighting(
        dateDay,
        LIGHTING_PRESETS.realistic,
        undefined,
      );
      const cinematic = computeLighting(
        dateDay,
        LIGHTING_PRESETS.cinematic,
        undefined,
      );
      const seasonal = computeLighting(
        dateDay,
        LIGHTING_PRESETS.seasonal,
        undefined,
      );

      // 三預設色彩應不同
      expect(realistic.skyColor).not.toBe(cinematic.skyColor);
      expect(cinematic.skyColor).not.toBe(seasonal.skyColor);
      expect(seasonal.skyColor).not.toBe(realistic.skyColor);
    });

    it("所有預設強度範圍應合理 [0, 2]", () => {
      Object.values(LIGHTING_PRESETS).forEach((preset) => {
        expect(preset.ambientBaseIntensity).toBeGreaterThanOrEqual(0);
        expect(preset.ambientBaseIntensity).toBeLessThanOrEqual(2);
        expect(preset.sunBaseIntensity).toBeGreaterThanOrEqual(0);
        expect(preset.sunBaseIntensity).toBeLessThanOrEqual(2);
      });
    });
  });

  describe("6. 邊界與特殊情況", () => {
    it("computeLighting: 無效日期（NaN） fallback 為當下時間", () => {
      const invalidDate = new Date(NaN);
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(invalidDate, preset, undefined);

      // 應產生有效的計算結果，不拋出錯誤
      expect(lighting.daylight).toBeGreaterThanOrEqual(0);
      expect(lighting.daylight).toBeLessThanOrEqual(1);
      expect(lighting.ambientIntensity).toBeGreaterThanOrEqual(0);
    });

    it("computeLighting: hour 欄位應正確計算", () => {
      // 直接建立本地時間 2026-01-15 14:30
      const date = new Date(2026, 0, 15, 14, 30);
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      // 應為 14.5
      expect(lighting.hour).toBeCloseTo(14.5, 1);
    });

    it("computeLighting: timeMs 應對應輸入日期", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;
      const lighting = computeLighting(date, preset, undefined);

      expect(lighting.timeMs).toBe(date.getTime());
    });

    it("computeLighting: 多次呼叫同日期應產生相同結果", () => {
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0));
      const preset = LIGHTING_PRESETS.realistic;

      const lighting1 = computeLighting(date, preset, undefined);
      const lighting2 = computeLighting(date, preset, undefined);

      expect(lighting1.daylight).toBe(lighting2.daylight);
      expect(lighting1.ambientIntensity).toBe(lighting2.ambientIntensity);
      expect(lighting1.sunIntensity).toBe(lighting2.sunIntensity);
      expect(lighting1.skyColor).toBe(lighting2.skyColor);
    });

    it("DEFAULT_LIGHTING_PRESET_ID 應為 'realistic'", () => {
      expect(DEFAULT_LIGHTING_PRESET_ID).toBe("realistic");
    });
  });
});
