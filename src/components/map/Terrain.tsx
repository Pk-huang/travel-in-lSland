"use client";

/**
 * Terrain：地形地塊。
 *
 * 子步驟 2a-i（本版）：只是一塊完全平坦的平面，先確認方位正確。
 * - planeGeometry 預設「站」在 XY 平面、面朝 +Z（像一面牆）。
 * - 繞 X 軸轉 -90° 後，平躺在 XZ 平面、面朝上（像地板），符合俯瞰地圖直覺。
 * - 座標約定（保留給後續）：1 unit = 1 km，平面中心 = 冰島大致中心。
 *
 * 後續：2a-ii 加入高度起伏、2c 高度上色、2-1b 換成真實 DEM。
 */
export function Terrain() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 40, 128, 128]} />
      <meshStandardMaterial color="#3a4a5a" flatShading />
    </mesh>
  );
}
