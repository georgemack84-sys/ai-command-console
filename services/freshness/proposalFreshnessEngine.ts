import type { ConstitutionalAutonomyReadinessGateRecord } from "@/services/constitutional-autonomy-readiness-gate";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { CorrelationComputation } from "@/services/intent-correlation-engine/correlationTypes";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { LifecycleComputation } from "@/types/lifecycle";
import type {
  CoordinationFreezeRecord,
  FreshnessAuditEvent,
  FreshnessDecision,
  FreshnessError,
  ProposalFreshnessState,
  ReplayRevalidationRecord,
  StaleClassification,
} from "@/types/freshness";
import { guardFreshnessMetadata, createFreshnessError } from "./freshnessGuards";
import { resolveFreshnessPolicy } from "./freshnessPolicyResolver";
import { resolveFreshnessStatus } from "./freshnessWindowManager";
import { detectCoordinationDrift } from "@/services/drift/coordinationDriftDetector";
import { coordinateFreshnessRevalidation } from "./freshnessRevalidationCoordinator";
import { appendFreshnessLedger, type FreshnessLineageLedger } from "./freshnessAppendOnlyLedger";
import { buildFreshnessAuditEvents } from "./freshnessAuditLineage";
import { hashFreshnessValue } from "./freshnessHasher";

export type ProposalFreshnessEvaluationInput = Readonly<{
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  readinessGate: ConstitutionalAutonomyReadinessGateRecord;
  escalation: ConstitutionalEscalationRecord;
  correlationComputation: CorrelationComputation;
  evaluatedAt: string;
  observedEnvironmentHash?: string;
  metadata?: Readonly<Record<string, unknown>>;
  existingLineage?: FreshnessLineageLedger;
}>;

export type ProposalFreshnessEvaluation = Readonly<{
  state: ProposalFreshnessState;
  decision: FreshnessDecision;
  replayRevalidation: ReplayRevalidationRecord;
  freeze: CoordinationFreezeRecord;
  classification: StaleClassification;
  policy: import("@/types/freshness").FreshnessWindow;
  lineage: FreshnessLineageLedger;
  auditEvents: readonly FreshnessAuditEvent[];
  warnings: readonly string[];
  errors: readonly FreshnessError[];
  freshnessHash: string;
}>;

export function evaluateProposalFreshness(input: ProposalFreshnessEvaluationInput): ProposalFreshnessEvaluation {
  const guardErrors = guardFreshnessMetadata(input.metadata);
  const policy = resolveFreshnessPolicy({
    proposalId: input.proposal.proposalId,
    lifecycleState: input.lifecycle.record.resultingState,
    lastValidatedAt: input.lifecycle.record.createdAt,
  });
  const drift = detectCoordinationDrift({
    proposalId: input.proposal.proposalId,
    confidenceScore: input.readinessGate.proposalView.confidenceScore,
    proposalGovernanceHash: input.proposal.governanceBinding.policySnapshotHash,
    lifecycleGovernanceHash: input.lifecycle.record.replayBinding.governanceSnapshotHash,
    replayValid: input.proposal.replayBinding.valid && input.lifecycle.record.replayBinding.valid,
    lifecycleReplayHash: input.lifecycle.record.replayBinding.replaySnapshotHash,
    proposalReplayHash: input.proposal.replayBinding.replaySnapshotHash,
    readinessPolicyView: input.readinessGate.certification.dashboardViews.governanceView,
    expectedEnvironmentHash: input.readinessGate.replayBinding.snapshotLineageHash,
    observedEnvironmentHash: input.observedEnvironmentHash,
    createdAt: input.evaluatedAt,
  });

  const freshnessStatus = resolveFreshnessStatus({
    validatedAt: input.lifecycle.record.createdAt,
    evaluatedAt: input.evaluatedAt,
    window: policy,
  });

  const state: ProposalFreshnessState = Object.freeze({
    proposalId: input.proposal.proposalId,
    freshnessStatus: drift.replayIntegrity === "quarantined" ? "frozen" : freshnessStatus,
    confidenceState: drift.confidenceState,
    replayIntegrity: drift.replayIntegrity,
    governanceCompatibility: drift.governanceCompatibility,
    detectedDrifts: drift.report.drifts as import("@/types/freshness").DriftRecord[],
    lastValidatedAt: input.lifecycle.record.createdAt,
    expiresAt: policy.expiresAt,
  });

  const coordinated = coordinateFreshnessRevalidation({
    state,
    proposalReplayHash: input.proposal.replayBinding.replaySnapshotHash,
    lifecycleReplayHash: input.lifecycle.record.replayBinding.replaySnapshotHash,
    lifecycleEntries: input.lifecycle.lineage.entries.length,
    currentLifecycleState: input.lifecycle.record.currentState,
    resultingLifecycleState: input.lifecycle.record.resultingState,
    correlationEntries: input.correlationComputation.lineage.entries.length,
    lifecycleImmutable: input.lifecycle.record.immutable,
    readinessDerivedOnly: input.readinessGate.derivedOnly,
    escalationDerivedOnly: input.escalation.derivedOnly,
    createdAt: input.evaluatedAt,
    metadata: input.metadata,
  });

  const finalState: ProposalFreshnessState = coordinated.freeze.frozen
    ? Object.freeze({ ...state, freshnessStatus: "frozen", replayIntegrity: coordinated.replayRevalidation.replayIntegrity })
    : Object.freeze({ ...state, replayIntegrity: coordinated.replayRevalidation.replayIntegrity });

  const stateHash = hashFreshnessValue("proposal-freshness-state", {
    state: finalState,
    classification: coordinated.classification,
    decision: coordinated.decision,
    policy,
  });
  const lineage = appendFreshnessLedger({
    existing: input.existingLineage,
    state: finalState,
    stateHash,
    createdAt: input.evaluatedAt,
  });
  const auditEvents = buildFreshnessAuditEvents({
    state: finalState,
    freeze: coordinated.freeze,
    stateHash,
    createdAt: input.evaluatedAt,
  });

  const policyErrors =
    finalState.freshnessStatus === "revalidation_required" || finalState.freshnessStatus === "stale" || finalState.freshnessStatus === "expired"
      ? [createFreshnessError(
        "FRESHNESS_REVALIDATION_REQUIRED",
        "Proposal freshness window requires explicit revalidation before trust can continue.",
        "freshnessStatus",
      )]
      : [];
  const trustErrors =
    input.metadata?.["trustIncreaseRequested"] === true
      ? [createFreshnessError(
        "FRESHNESS_TRUST_ACCUMULATION_REJECTED",
        "Freshness validation may not accumulate trust automatically.",
        "metadata.trustIncreaseRequested",
      )]
      : [];

  const errors = Object.freeze([
    ...guardErrors,
    ...drift.errors,
    ...coordinated.errors,
    ...policyErrors,
    ...trustErrors,
  ]);

  return Object.freeze({
    state: finalState,
    decision: coordinated.decision,
    replayRevalidation: coordinated.replayRevalidation,
    freeze: coordinated.freeze,
    classification: coordinated.classification,
    policy,
    lineage,
    auditEvents,
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...input.lifecycle.warnings,
      ...input.readinessGate.warnings,
      ...input.escalation.warnings,
      "Freshness validation remains externally invoked and never auto-renews trust.",
    ]),
    errors,
    freshnessHash: hashFreshnessValue("proposal-freshness-evaluation", {
      finalState,
      coordinated,
      policy,
      lineage,
      auditEvents,
      errors,
    }),
  });
}
