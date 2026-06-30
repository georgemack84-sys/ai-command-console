import type {
  SourceAlignment,
  SourceAlignmentSummary,
  SteamMovementDirection,
} from "./types";

function compareDirections(left: SteamMovementDirection, right: SteamMovementDirection): number {
  return left.localeCompare(right);
}

export function summarizeSourceAlignment(
  alignments: readonly Omit<SourceAlignment, "aligned">[],
): SourceAlignmentSummary {
  if (alignments.length === 0) {
    return Object.freeze({
      aligned_source_count: 0,
      total_source_count: 0,
      alignment_ratio: 0,
      majority_direction: "UP",
    });
  }

  const counts = new Map<SteamMovementDirection, number>();
  for (const alignment of alignments) {
    counts.set(alignment.movement_direction, (counts.get(alignment.movement_direction) ?? 0) + 1);
  }

  const orderedDirections = [...counts.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return compareDirections(left[0], right[0]);
  });
  const majorityDirection = orderedDirections[0][0];
  const alignedSourceCount = orderedDirections[0][1];
  const totalSourceCount = alignments.length;

  return Object.freeze({
    aligned_source_count: alignedSourceCount,
    total_source_count: totalSourceCount,
    alignment_ratio: Number((alignedSourceCount / totalSourceCount).toFixed(4)),
    majority_direction: majorityDirection,
  });
}

export function applyAlignmentFlags(
  alignments: readonly Omit<SourceAlignment, "aligned">[],
  summary: SourceAlignmentSummary,
): SourceAlignment[] {
  return alignments
    .map((alignment) =>
      Object.freeze({
        ...alignment,
        aligned: alignment.movement_direction === summary.majority_direction,
      }))
    .sort((left, right) => {
      if (left.source_id !== right.source_id) {
        return left.source_id.localeCompare(right.source_id);
      }
      return left.timestamp.localeCompare(right.timestamp);
    });
}
