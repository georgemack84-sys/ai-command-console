import type { EscalationAuthorityContract, EscalationDecision, ConfidenceRiskProfile, FreezeRecommendationPropagation, PauseRecommendationPropagation } from "./escalationContracts";
import type { EscalationLineageLedger, EscalationReplayGraph } from "./escalationLineage";
import type { EscalationError } from "./escalationErrors";

export type GovernanceAwareEscalationRecord = Readonly<{
  decision: EscalationDecision;
  authorityContract: EscalationAuthorityContract;
  confidenceProfile: ConfidenceRiskProfile;
  freezePropagation: FreezeRecommendationPropagation;
  pausePropagation: PauseRecommendationPropagation;
  replayGraph: EscalationReplayGraph;
  lineage: EscalationLineageLedger;
  warnings: readonly string[];
  errors: readonly EscalationError[];
  escalationHash: string;
  derivedOnly: true;
}>;

export type GovernanceAwareEscalationInput = Readonly<{
  coordinationId: string;
  freshnessEvaluation: import("@/services/freshness/proposalFreshnessEngine").ProposalFreshnessEvaluation;
  lifecycle: import("@/types/lifecycle").LifecycleComputation;
  readinessGate: import("@/services/constitutional-autonomy-readiness-gate").ConstitutionalAutonomyReadinessGateRecord;
  proposal: import("@/types/proposal-lifecycle-engine").ProposalRecord;
  correlationComputation: import("@/services/intent-correlation-engine/correlationTypes").CorrelationComputation;
  coordinationRecord: import("@/types/intent-coordination-governance-core").IntentCoordinationGovernanceRecord;
  createdAt: string;
  existingLineage?: EscalationLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;
