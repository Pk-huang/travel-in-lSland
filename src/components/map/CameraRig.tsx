"use client";

import { OrbitControls } from "@react-three/drei";

/**
 * CameraRig：相機操控裝置（rig = 相機 + 控制的整套）。
 *
 * 把相機控制獨立成一支，與 Terrain/光分離，方便除錯：
 * 「轉不動 / 翻到地底 / 縮太近遠」都看這支。
 *
 * 本版：僅切分，尚未加任何限制（純 OrbitControls + 慣性）。
 * 後續再逐步加：縮放範圍、不鑽地底、平移邊界、注視點 target。
 *
 * 命名避開 drei 內建的 <MapControls>，以免混淆。
 */
export function CameraRig() {
  return <OrbitControls enableDamping />;
}
