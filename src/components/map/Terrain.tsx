"use client";

import { useMemo } from "react";
import { PlaneGeometry, type BufferGeometry } from "three";

/**
 * Terrain：地形地塊。
 *
 * 子步驟 2a-ii（本版）：在躺平的平面上以程式化高度加入起伏，先確認「綠軸(Y)=高度」方向正確。
 * - planeGeometry 預設站在 XY 平面；繞 X 軸 -90° 後躺成 XZ 地板，local Z 變成世界 Y(高度)。
 * - 用 sin/cos 疊加產生丘陵起伏（暫代真實 DEM），重算法線讓 flatShading 有立體面。
 * - 座標約定（保留）：1 unit = 1 km，中心 = 冰島大致中心。
 *
 * 後續：2c 高度上色 + 海平面、2-1b 換真實 DEM。
 */
export function Terrain() {
  const geometry = useMemo(() => {
    const seg = 128;
    const size = 40;
    const geo = new PlaneGeometry(size, size, seg, seg);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // 旋轉前的 Y → 旋轉後的南北(Z)
      const h =
        Math.sin(x * 0.4) * Math.cos(y * 0.4) * 1.5 +
        Math.sin(x * 0.15 + y * 0.1) * 2.5;
      pos.setZ(i, h); // 旋轉前的 Z → 旋轉後的高度(世界 Y)
    }
    geo.computeVertexNormals();
    return geo as unknown as BufferGeometry;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry as never}>
      {/* 開發期：強烈黃色實心，確認地形起伏無誤。正式配色留待 2c 高度上色。 */}
      <meshStandardMaterial color="#ffcc00" flatShading />
    </mesh>
  );
}

