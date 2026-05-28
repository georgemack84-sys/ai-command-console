import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalAuthorityBoundaryResult } from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";

export type ConstitutionalReplayStabilityErrorCode =
  | "CONSTITUTIONAL_REPLAY_STABILITY_GOVERNANCE_MISSING"
  | "CONSTITUTIONAL_REPLAY_STABILITY_REPLAY_CORRUPTION"
  | "CONSTITUTIONAL_REPLAY_STABILITY_DRIFT_DETECTED"
  | "CONSTITUTIONAL_REPLAY_STABILITY_TOPOLOGY_MUTATION"
  | "CONSTITUTIONAL_REPLAY_STABILITY_INFERRED_RECONSTRUCTION"
  | "CONSTITUTIONAL_REPLAY_STABILITY_OVERRIDE_CORRUPTION"
  | "CONSTITUTIONAL_REPLAY_STABILITY_ESCALATION_CORRUPTION"
  | "CONSTITUTIONAL_REPLAY_STABILITY_CONFIDENCE_CORRUPTION"
  | "CONSTITUTIONAL_REPLAY_STABILITY_VALIDATOR_MISMATCH"
  | "CONSTITUTIONAL_REPLAY_STABILITY_LINEAGE_BREAK"
  | "CONSTITUTIONAL_REPLAY_STABILITY_CONTAINMENT_FAILURE"
  | "CONSTITUTIONAL_REPLAY_STABILITY_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_REPLAY_STABILITY_BOUNDARY_VIOLATION";

export type ConstitutionalReplayStabilityError = Readonly<{
  code: ConstitutionalReplayStabilityErrorCode;
  message: string;
  path: string;
}>;

export type ConstitutionalReplayStabilityInput = Readonly<{
  replayId: string;
  constitutionalAuthorityBoundaryResult: ConstitutionalAuthorityBoundaryResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: ReplayStabilityLineageLedger;
  existingReplayLedger?: readonly ReplayStabilityLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ReplayStabilityClassification =
  | "STABLE"
  | "DEGRADED"
  | "FROZEN"
  | "DISPUTED"
  | "INVALID"
  | "REVOKED";

export type HistoricalGovernanceSnapshot = Readonly<{
  governanceSnapshotId: string;
  replaySnapshotId: string;
  authorityBoundaryId: string;
  validatorVersionId: string;
  governanceHash: string;
}>;

export type ReplayBindingRecord = Readonly<{
  bindingId: string;
  governanceBound: boolean;
  replayBound: boolean;
  approvalBound: boolean;
  escalationBound: boolean;
  deterministicHash: string;
}>;

export type ReplayStateRecord = Readonly<{
  replayId: string;
  recommendationState: "advisory" | "bounded" | "frozen";
  escalationState: "stable" | "frozen" | "disputed";
  approvalState: "stable" | "frozen" | "disputed";
  overrideState: "preserved" | "frozen";
  governanceSnapshotId: string;
  replaySnapshotId: string;
  deterministicHash: string;
}>;

export type ReplayConfidenceEvolution = Readonly<{
  replayId: string;
  confidenceScore: number;
  previousConfidenceScore: number;
  volatilityDetected: boolean;
  confidenceHash: string;
}>;

export type ReplayEscalationReconstruction = Readonly<{
  replayId: string;
  escalationState: "stable" | "frozen" | "disputed";
  escalationHash: string;
}>;

export type ReplayOverridePropagation = Readonly<{
  replayId: string;
  operatorSupremacyPreserved: boolean;
  overrideHash: string;
}>;

export type ReplayForensicExport = Readonly<{
  exportId: string;
  replayId: string;
  evidenceHash: string;
  lineageHash: string;
  governanceHash: string;
  escalationHash: string;
  confidenceHash: string;
  overrideHash: string;
  exportHash: string;
}>;

export type ReplayIntegrityReport = Readonly<{
  reportId: string;
  replayId: string;
  classification: ReplayStabilityClassification;
  driftDetected: boolean;
  replayDeterministic: boolean;
  reasons: readonly string[];
  reportHash: string;
}>;

export type ReplayStabilityEvidence = Readonly<{
  evidenceId: string;
  replayId: string;
  authorityEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type ReplayStabilityLineageEntry = Readonly<{
  entryId: string;
  replayId: string;
  coordinationId: string;
  classification: ReplayStabilityClassification;
  createdAt: string;
  deterministicHash: string;
}>;

export type ReplayStabilityLineageLedger = Readonly<{
  entries: readonly ReplayStabilityLineageEntry[];
  lineageHash: string;
}>;

export type ReplayStabilityLedgerEntry = ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ConstitutionalReplayStabilityRecord = Readonly<{
  replayId: string;
  coordinationId: string;
  boundaryId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  classification: ReplayStabilityClassification;
  replayDeterministic: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ConstitutionalReplayStabilityResult = Readonly<{
  record: ConstitutionalReplayStabilityRecord;
  historicalGovernance: HistoricalGovernanceSnapshot;
  replayBinding: ReplayBindingRecord;
  replayState: ReplayStateRecord;
  confidenceEvolution: ReplayConfidenceEvolution;
  escalationReconstruction: ReplayEscalationReconstruction;
  overridePropagation: ReplayOverridePropagation;
  evidence: ReplayStabilityEvidence;
  forensicExport: ReplayForensicExport;
  integrityReport: ReplayIntegrityReport;
  lineage: ReplayStabilityLineageLedger;
  replayLedger: readonly ReplayStabilityLedgerEntry[];
  warnings: readonly string[];
  errors: readonly ConstitutionalReplayStabilityError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
