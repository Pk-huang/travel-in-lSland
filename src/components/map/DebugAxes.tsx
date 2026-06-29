"use client";

/**
 * DebugAxes：誇張版三軸輔助線（開發用，確認方位後可移除）。
 *
 * 用三條細長 box 當軸，顏色鮮豔、長度誇張，比內建 axesHelper 好辨識：
 *   - 紅 = X（東西）
 *   - 綠 = Y（高度，往上）
 *   - 藍 = Z（南北）
 * 每軸只往「正方向」延伸：box 長度 = len，往中心偏移 len/2 讓一端貼原點。
 */
export function DebugAxes({ len = 16, thick = 0.25 }: { len?: number; thick?: number }) {
  return (
    <group>
      {/* X 紅 */}
      <mesh position={[len / 2, 0, 0]}>
        <boxGeometry args={[len, thick, thick]} />
        <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={0.6} />
      </mesh>
      {/* Y 綠 */}
      <mesh position={[0, len / 2, 0]}>
        <boxGeometry args={[thick, len, thick]} />
        <meshStandardMaterial color="#00e676" emissive="#00e676" emissiveIntensity={0.6} />
      </mesh>
      {/* Z 藍 */}
      <mesh position={[0, 0, len / 2]}>
        <boxGeometry args={[thick, thick, len]} />
        <meshStandardMaterial color="#2979ff" emissive="#2979ff" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}
