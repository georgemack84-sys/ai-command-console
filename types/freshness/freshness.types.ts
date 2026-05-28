import type { DriftRecord } from "./drift.types";

export type ProposalFreshnessStatus =
  | "fresh"
  | "revalidation_required"
  | "stale"
  | "expired"
  | "frozen";

export type ProposalConfidenceState =
  | "stable"
  | "degrading"
  | "unstable"
  | "invalid";

export type ReplayIntegrityState =
  | "verified"
  | "mismatch"
  | "quarantined";

export type GovernanceCompatibilityState =
  | "compatible"
  | "review_required"
  | "invalid";

export interface ProposalFreshnessState {
  proposalId: string;
  freshnessStatus: ProposalFreshnessStatus;
  confidenceState: ProposalConfidenceState;
  replayIntegrity: ReplayIntegrityState;
  governanceCompatibility: GovernanceCompatibilityState;
  detectedDrifts: readonly DriftRecord[];
  lastValidatedAt: string;
  expiresAt: string;
}

export interface FreshnessDecision {
  mayAdvanceLifecycle: false;
  mayAuthorizeExecution: false;
  mayGenerateApproval: false;
  mayRepairReplay: false;
  mayResumeCoordination: false;
}

export type FreshnessAuditEvent = Readonly<{
  eventId: string;
  eventType:
    | "freshness.validated"
    | "freshness.revalidation-required"
    | "freshness.stale"
    | "freshness.expired"
    | "freshness.frozen"
    | "drift.detected"
    | "replay.quarantined";
  proposalId: string;
  stateHash: string;
  createdAt: string;
  eventHash: string;
}>;

export type FreshnessWindow = Readonly<{
  policyId: string;
  maxAgeMs: number;
  revalidationLeadMs: number;
  staleLeadMs: number;
  expiresAt: string;
  policyHash: string;
}>;
