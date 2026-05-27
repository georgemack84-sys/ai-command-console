import type { SemanticFinding } from "./types/constitutionalEnforcementTypes";

const SEVERITY_ORDER: Record<SemanticFinding["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function orderSemanticFindingsDeterministically(
  findings: readonly SemanticFinding[],
): readonly SemanticFinding[] {
  return Object.freeze(
    [...findings].sort((left, right) =>
      SEVERITY_ORDER[left.severity]
      - SEVERITY_ORDER[right.severity]
      || left.category.localeCompare(right.category)
      || left.description.localeCompare(right.description)
      || left.detectedAt.localeCompare(right.detectedAt)
      || left.findingId.localeCompare(right.findingId)),
  );
}
