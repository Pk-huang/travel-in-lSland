"use client";

/**
 * SeaLevel：海平面水面。
 *
 * 一塊半透明藍色平面，躺在 y=0（海平面高度）。
 * 地形低於 0 的頂點（深海/淺海）會被這塊水面蓋住，自然形成「海」的視覺。
 *
 * - 與 Terrain 為兄弟層，獨立成檔：壞掉只壞海面，地形仍在（故障定位）。
 * - 範圍略大於地形（44 > 40），確保島緣外也是海，不露出底色。
 * - 繞 X 軸 -90° 躺平至 XZ 平面，與地形同方位。
 * - transparent + opacity 讓水下地形若隱若現。
 *
 * 後續：水面波動、反射、透明度微調。
 */
export function SeaLevel() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[44, 44]} />
      <meshStandardMaterial
        color="#3d85c6"
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}
