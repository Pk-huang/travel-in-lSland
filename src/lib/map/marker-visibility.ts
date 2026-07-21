export type MarkerVisibilityCandidate = {
  markerId: string;
  priority: number;
  alwaysVisible: boolean;
  isHovered: boolean;
};

/**
 * 共同圖釘顯示規則：
 * - 異常與目前 hover 的圖釘永遠保留。
 * - 其餘依 priority 由高到低補滿預設顯示數量。
 */
export function selectVisibleMarkerIds(
  candidates: MarkerVisibilityCandidate[],
  defaultVisibleCount: number,
) {
  const visibleIds = new Set<string>();

  for (const candidate of candidates) {
    if (candidate.alwaysVisible || candidate.isHovered) {
      visibleIds.add(candidate.markerId);
    }
  }

  const remainingCandidates = candidates
    .filter((candidate) => !visibleIds.has(candidate.markerId))
    .sort((left, right) => right.priority - left.priority);

  for (const candidate of remainingCandidates) {
    if (visibleIds.size >= defaultVisibleCount) {
      break;
    }
    visibleIds.add(candidate.markerId);
  }

  return visibleIds;
}
