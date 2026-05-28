import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ControlledAutonomyReadinessGateResult } from "@/services/controlled-autonomy-readiness-gate/controlledAutonomyReadinessGate";

export type AuthorityClass = "A0" | "A1" | "A2" | "A3" | "A4";

export type AuthorityBoundaryErrorCode =
  | "CONSTITUTIONAL_AUTHORITY_GOVERNANCE_MISSING"
  | "CONSTITUTIONAL_AUTHORITY_REPLAY_INVALID"
  | "CONSTITUTIONAL_AUTHORITY_INHERITANCE_AMBIGUOUS"
  | "CONSTITUTIONAL_AUTHORITY_CEILING_VIOLATION"
  | "CONSTITUTIONAL_AUTHORITY_DRIFT_DETECTED"
  | "CONSTITUTIONAL_AUTHORITY_RECURSIVE_DELEGATION"
  | "CONSTITUTIONAL_AUTHORITY_PRIVILEGE_ELEVATION"
  | "CONSTITUTIONAL_AUTHORITY_SYNTHETIC_EMERGENCE"
  | "CONSTITUTIONAL_AUTHORITY_CONTAINMENT_FAILURE"
  | "CONSTITUTIONAL_AUTHORITY_VALIDATOR_MISMATCH"
  | "CONSTITUTIONAL_AUTHORITY_TOPOLOGY_DRIFT"
  | "CONSTITUTIONAL_AUTHORITY_OPERATOR_SUPREMACY_FAILURE"
  | "CONSTITUTIONAL_AUTHORITY_REVOCATION_REQUIRED"
  | "CONSTITUTIONAL_AUTHORITY_LINEAGE_MISSING";

export type AuthorityBoundaryError = Readonly<{
  code: AuthorityBoundaryErrorCode;
  message: string;
  path: string;
}>;

export type ConstitutionalAuthorityBoundaryInput = Readonly<{
  boundaryId: string;
  controlledAutonomyReadinessGateResult: ControlledAutonomyReadinessGateResult;
  requestedAuthorityClass: AuthorityClass;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: AuthorityBoundaryLineageLedger;
  existingReplayLedger?: readonly AuthorityBoundaryLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type AuthorityClassRecord = Readonly<{
  authorityClass: AuthorityClass;
  description: string;
  governanceBound: true;
  replaySafe: true;
  advisoryOnly: boolean;
  operatorOverrideAllowed: true;
  deniedOperations: readonly string[];
  deterministicHash: string;
}>;

export type AuthorityLineageRecord = Readonly<{
  lineageId: string;
  authorityClass: AuthorityClass;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  approvalLineageBound: boolean;
  escalationLineageBound: boolean;
  deterministicHash: string;
}>;

export type AuthorityRevocationRecord = Readonly<{
  revocationId: string;
  revoked: boolean;
  reason: string | null;
  downstreamInvalidated: boolean;
  deterministicHash: string;
}>;

export type AuthorityBoundaryRecord = Readonly<{
  boundaryId: string;
  coordinationId: string;
  gateId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  authorityClass: AuthorityClass;
  certificationState: "CERTIFIED" | "CONDITIONAL" | "FROZEN" | "DISPUTED" | "INVALID" | "REVOKED";
  replaySafe: boolean;
  governanceBound: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type AuthorityBoundaryAuthorityContract = Readonly<{
  executionAuthority: false;
  orchestrationAuthority: false;
  schedulingAuthority: false;
  runtimeMutationAuthority: false;
  governanceMutationAuthority: false;
  authoritySynthesis: false;
  capabilityAcquisition: false;
  approvalInheritance: false;
  recursiveDelegation: false;
  operatorSupremacyRequired: true;
}>;

export type AuthorityBoundaryEvidence = Readonly<{
  evidenceId: string;
  boundaryId: string;
  gateEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type AuthorityBoundaryLineageEntry = Readonly<{
  entryId: string;
  boundaryId: string;
  coordinationId: string;
  authorityClass: AuthorityClass;
  certificationState: AuthorityBoundaryRecord["certificationState"];
  createdAt: string;
  deterministicHash: string;
}>;

export type AuthorityBoundaryLineageLedger = Readonly<{
  entries: readonly AuthorityBoundaryLineageEntry[];
  lineageHash: string;
}>;

export type AuthorityBoundaryLedgerEntry = ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ConstitutionalAuthorityBoundaryResult = Readonly<{
  record: AuthorityBoundaryRecord;
  authorityContract: AuthorityBoundaryAuthorityContract;
  authorityClasses: readonly AuthorityClassRecord[];
  lineageValidation: AuthorityLineageRecord;
  revocation: AuthorityRevocationRecord;
  evidence: AuthorityBoundaryEvidence;
  lineage: AuthorityBoundaryLineageLedger;
  replayLedger: readonly AuthorityBoundaryLedgerEntry[];
  warnings: readonly string[];
  errors: readonly AuthorityBoundaryError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
