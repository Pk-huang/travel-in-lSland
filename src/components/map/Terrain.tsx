"use client";

import { useMemo } from "react";
import {
  PlaneGeometry,
  Float32BufferAttribute,
  Color,
  type BufferGeometry,
} from "three";

/**
 * Terrain：地形地塊。
 *
 * 子步驟 2c（本版）：依高度做逐頂點上色（vertex colors）。
 * - 高度寫進 local Z（旋轉後成世界 Y）。
 * - 同一迴圈順便依高度查色帶（海→岸→陸→岩→雪），寫入 color attribute。
 * - material 開 vertexColors，GPU 會在三角形內插值出漸層。
 * - 開發期用較強烈、分層清楚的顏色，確認分層正確；正式微調留待之後。
 *
 * 座標約定（保留）：1 unit = 1 km，中心 = 冰島大致中心。
 * 後續：海平面水面 mesh、CameraRig、2-1b 換真實 DEM。
 */

/** 依高度回傳顏色（height 約 -4 ~ +4）。分層清楚便於驗證。 */
function heightToColor(height: number, targetColor: Color) {
  if (height < -1) return targetColor.set("#1f4e79"); // 深海
  if (height < 0) return targetColor.set("#3d85c6"); // 淺海
  if (height < 0.6) return targetColor.set("#e0c772"); // 海岸沙地
  if (height < 1.8) return targetColor.set("#5a8f3c"); // 草原陸地
  if (height < 2.8) return targetColor.set("#7a6a55"); // 岩石高地
  return targetColor.set("#f5f5f5"); // 雪線
}

export function Terrain() {
  const geometry = useMemo(() => {
    const segments = 128;
    const size = 40;
    const geo = new PlaneGeometry(size, size, segments, segments);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const vertexColor = new Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i); // 旋轉前的 Y → 旋轉後的南北(Z)
      const height =
        Math.sin(x * 0.4) * Math.cos(z * 0.4) * 1.5 +
        Math.sin(x * 0.15 + z * 0.1) * 2.5;
      positions.setZ(i, height); // 旋轉前的 Z → 旋轉後的高度(世界 Y)
      heightToColor(height, vertexColor);
      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo as unknown as BufferGeometry;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry as never}>
      {/* 逐頂點上色：顏色來自 geometry 的 color attribute。 */}
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  );
}
