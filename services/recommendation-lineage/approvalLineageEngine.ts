import type {
  ApprovalLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { resolveApprovalDependencies } from "./approvalDependencyResolver";
import { trackOperatorInterventions } from "./operatorInterventionTracker";
import { validateApprovalLineage } from "./approvalLineageValidator";

export function buildApprovalLineage(input: RecommendationLineageInput): {
  record: ApprovalLineageRecord;
  interventions: readonly string[];
  errors: readonly RecommendationLineageError[];
} {
  const record = resolveApprovalDependencies(input);
  return Object.freeze({
    record,
    interventions: trackOperatorInterventions(record),
    errors: validateApprovalLineage(record),
  });
}
