import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalCertificationResult } from "@/services/constitutional-certification/certificationStateTypes";
import type { ConstitutionalReadinessResult } from "@/services/constitutional-readiness-scoring/readinessStateTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { DecisionIntentBoundaryResult } from "@/services/decision-intent-boundary/decisionIntentStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RecommendationLineageResult } from "@/services/recommendation-lineage/recommendationLineageStateTypes";
import type { RuntimeAdmissibilityResult } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";
import type { OperationalProposal } from "./operationalProposal";
import type { ProposalIntegrityErrorCode } from "./proposalIntegrityErrorCodes";
import type { ProposalIntegrityStatus } from "./proposalIntegrityStatus";
import type { ScopeBoundary } from "./scopeBoundary";

export type ProposalIntegrityError = Readonly<{
  code: ProposalIntegrityErrorCode;
  message: string;
  path: string;
}>;

export type ProposalIntegrityInput = Readonly<{
  proposalId: string;
  proposalType: string;
  title: string;
  summary: string;
  scopeBoundaries: readonly ScopeBoundary[];
  decisionIntentBoundaryResult: DecisionIntentBoundaryResult;
  recommendationLineageResult: RecommendationLineageResult;
  constitutionalCertificationResult: ConstitutionalCertificationResult;
  constitutionalReadinessResult: ConstitutionalReadinessResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  runtimeAdmissibilityResult: RuntimeAdmissibilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: ProposalIntegrityLineageLedger;
  existingAuditLedger?: readonly ProposalIntegrityLedgerEntry[];
  existingSealedProposal?: SealedProposalRecord;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ProposalGovernanceBinding = Readonly<{
  governanceSnapshotId: string;
  governanceHash: string;
  governanceBound: boolean;
  policyHash: string;
  deterministicHash: string;
}>;

export type ProposalReplayBinding = Readonly<{
  replaySnapshotId: string;
  replayHash: string;
  replayBound: boolean;
  historicalOnly: boolean;
  deterministicHash: string;
}>;

export type ProposalApprovalBinding = Readonly<{
  approvalDependencyIds: readonly string[];
  approvalHash: string;
  approvalBound: boolean;
  interventionIds: readonly string[];
  deterministicHash: string;
}>;

export type ProposalLineageBinding = Readonly<{
  recommendationLineageHash: string;
  recommendationSnapshotHash: string;
  lineageBound: boolean;
  deterministicHash: string;
}>;

export type ProposalIntegrityEvidence = Readonly<{
  evidenceId: string;
  proposalId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type ProposalSnapshot = Readonly<{
  snapshotId: string;
  proposalId: string;
  proposalHash: string;
  replayHash: string;
  auditHash: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  snapshotHash: string;
}>;

export type SealedProposalRecord = Readonly<{
  proposalId: string;
  proposalHash: string;
  replayHash: string;
  auditHash: string;
  sealedAt: string;
  status: Extract<ProposalIntegrityStatus, "sealed" | "replay_verified" | "frozen" | "revoked" | "superseded">;
  immutable: true;
  sealHash: string;
}>;

export type ProposalIntegrityLineageEntry = Readonly<{
  entryId: string;
  proposalId: string;
  recommendationId: string;
  status: ProposalIntegrityStatus;
  proposalHash: string;
  createdAt: string;
  deterministicHash: string;
}>;

export type ProposalIntegrityLineageLedger = Readonly<{
  entries: readonly ProposalIntegrityLineageEntry[];
  lineageHash: string;
}>;

export type ProposalIntegrityLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ProposalIntegrityForensicExport = Readonly<{
  exportId: string;
  proposalId: string;
  proposalHash: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
  exportHash: string;
}>;

export type ProposalIntegrityResult = Readonly<{
  proposal: OperationalProposal;
  governanceBinding: ProposalGovernanceBinding;
  replayBinding: ProposalReplayBinding;
  approvalBinding: ProposalApprovalBinding;
  lineageBinding: ProposalLineageBinding;
  snapshot: ProposalSnapshot;
  sealedRecord: SealedProposalRecord;
  evidence: ProposalIntegrityEvidence;
  lineage: ProposalIntegrityLineageLedger;
  auditLedger: readonly ProposalIntegrityLedgerEntry[];
  forensicExport: ProposalIntegrityForensicExport;
  status: ProposalIntegrityStatus;
  warnings: readonly string[];
  errors: readonly ProposalIntegrityError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
