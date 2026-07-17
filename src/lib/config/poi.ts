import type { PointOfInterest } from "@/src/types";

/**
 * 固定景點清單：先供景點模式與壓測腳本共用。
 * 後續 UI/相機轉場都只讀這份設定，不把鏡位參數散落在各元件。
 */
export const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: "thingvellir-rift",
    label: "Thingvellir Rift",
    lat: 64.2786082,
    lon: -21.0819412,
    cameraView: {
      distance: 3.9,
      polarAngle: 1.04,
      azimuthAngle: -0.18,
    },
  },
  {
    id: "jokulsarlon-glacier",
    label: "Jokulsarlon Glacier Lagoon",
    lat: 64.0783208,
    lon: -16.2274213,
    cameraView: {
      distance: 4.3,
      polarAngle: 0.94,
      azimuthAngle: 0.36,
    },
  },
];

export function getPointOfInterestById(id: string | null): PointOfInterest | null {
  if (!id) return null;
  return POINTS_OF_INTEREST.find((poi) => poi.id === id) ?? null;
}