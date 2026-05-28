import type { ConstitutionalAttackResult } from "@/types/constitutional-attack-engine";
import type { RecommendationEvidenceRecord } from "./recommendationEvidence";
import type { RecommendationIntegrityError } from "./recommendationErrors";
import type { RecommendationLineage } from "./recommendationLineage";
import type {
  AuthorityDriftInspection,
  ConfidenceIntegrityInspection,
  EscalationIntegrityInspection,
  GovernanceBindingInspection,
  RecommendationIntegrityInspection,
  RecommendationReplayInspection,
  RecommendationReplayLedgerEntry,
} from "./recommendationReplay";
import type { RecommendationIntegrityState } from "./recommendationStates";
import type { RecommendationViolation } from "./recommendationViolations";
import type { RecommendationWeakness } from "./recommendationWeaknesses";

export interface RecommendationIntegrityAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly approvalInheritance: false;
  readonly authorityInheritance: false;
  readonly autonomousIntervention: false;
  readonly workflowContinuation: false;
}

export type RecommendationIntegrityInput = Readonly<{
  recommendationId: string;
  attackResult: ConstitutionalAttackResult;
  deterministicSeed: string;
  createdAt: string;
  existingLineage?: RecommendationLineage;
  existingReplayLedger?: readonly RecommendationReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type RecommendationIntegrityRecord = Readonly<{
  recommendationId: string;
  coordinationId: string;
  attackId: string;
  recommendationState: RecommendationIntegrityState;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type RecommendationIntegrityResult = Readonly<{
  record: RecommendationIntegrityRecord;
  authorityContract: RecommendationIntegrityAuthorityContract;
  weaknesses: readonly RecommendationWeakness[];
  violations: readonly RecommendationViolation[];
  lineage: RecommendationLineage;
  replayLedger: readonly RecommendationReplayLedgerEntry[];
  evidence: RecommendationEvidenceRecord;
  integrityInspection: RecommendationIntegrityInspection;
  replayInspection: RecommendationReplayInspection;
  governanceInspection: GovernanceBindingInspection;
  confidenceInspection: ConfidenceIntegrityInspection;
  escalationInspection: EscalationIntegrityInspection;
  authorityDriftInspection: AuthorityDriftInspection;
  warnings: readonly string[];
  errors: readonly RecommendationIntegrityError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
