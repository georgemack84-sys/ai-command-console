import type {
  GovernanceLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { resolveGovernanceSnapshot } from "./governanceSnapshotResolver";
import { validateGovernanceLineage } from "./governanceLineageValidator";

export function buildGovernanceLineage(input: RecommendationLineageInput): {
  record: GovernanceLineageRecord;
  errors: readonly RecommendationLineageError[];
} {
  const record = resolveGovernanceSnapshot(input);
  return Object.freeze({
    record,
    errors: validateGovernanceLineage(record),
  });
}
