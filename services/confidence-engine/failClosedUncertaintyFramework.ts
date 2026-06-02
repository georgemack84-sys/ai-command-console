import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";

export type UncertaintySourcePhase =
  | "GOVERNANCE_AWARE_CAUTION"
  | "RISK_ESCALATION"
  | "SCOPE_TIGHTENING"
  | "CONFIDENCE_LINEAGE_REPLAY"
  | "RISK_OBSERVABILITY"
  | "OPERATOR_RISK_VISIBILITY";

export type UncertaintyType =
  | "CONFIDENCE_COLLAPSE"
  | "LINEAGE_CORRUPTION"
  | "REPLAY_MISMATCH"
  | "POLICY_GAP"
  | "APPROVAL_INSTABILITY"
  | "TENANT_MISMATCH"
  | "AUTHORITY_AMBIGUITY"
  | "HASH_MISMATCH"
  | "MISSING_LINEAGE"
  | "PARTIAL_REPLAY"
  | "VISIBILITY_BOUNDARY_VIOLATION"
  | "MISSING_GOVERNANCE_REFERENCE"
  | "CHRONOLOGY_CORRUPTION"
  | "CONTAINMENT_INCONSISTENCY"
  | "ESCALATION_INCONSISTENCY"
  | "OBSERVABILITY_CORRUPTION"
  | "OPERATOR_VISIBILITY_CORRUPTION";

export type UncertaintySeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type FailClosedOutcome =
  | "LIMIT_SCOPE"
  | "LIMIT_VISIBILITY"
  | "FREEZE_RECOMMENDATIONS"
  | "FREEZE_REPLAY_RESULT"
  | "FREEZE_OBSERVABILITY_RESULT"
  | "FREEZE_OPERATOR_VIEW"
  | "FREEZE_REQUIRED"
  | "FAIL_REPLAY"
  | "BLOCK_RESULT"
  | "ESCALATE";

export type UncertaintyReasonCode =
  | "CONFIDENCE_COLLAPSE_DETECTED"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "REPLAY_MISMATCH_DETECTED"
  | "POLICY_GAP_DETECTED"
  | "APPROVAL_INSTABILITY_DETECTED"
  | "TENANT_MISMATCH_DETECTED"
  | "AUTHORITY_AMBIGUITY_DETECTED"
  | "HASH_MISMATCH_DETECTED"
  | "MISSING_LINEAGE_DETECTED"
  | "PARTIAL_REPLAY_DETECTED"
  | "VISIBILITY_BOUNDARY_VIOLATION_DETECTED"
  | "MISSING_GOVERNANCE_REFERENCE_DETECTED"
  | "CHRONOLOGY_CORRUPTION_DETECTED"
  | "CONTAINMENT_INCONSISTENCY_DETECTED"
  | "ESCALATION_INCONSISTENCY_DETECTED"
  | "OBSERVABILITY_CORRUPTION_DETECTED"
  | "OPERATOR_VISIBILITY_CORRUPTION_DETECTED"
  | "CROSS_TENANT_UNCERTAINTY_BLOCKED"
  | "POLICY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "HASH_REFERENCE_MISSING"
  | "FAIL_CLOSED_RESTRICTION_APPLIED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "READ_ONLY_REPLAY";

export type UncertaintySignal = Readonly<{
  signal_id: string;
  tenant_id: string;
  recommendation_id: string;
  source_phase: UncertaintySourcePhase;
  uncertainty_type: UncertaintyType;
  trigger_source: string;
  source_hash: string;
  policy_references: readonly string[];
  lineage_references: readonly string[];
  replay_references: readonly string[];
  reason_codes: readonly string[];
  timestamp: string;
  version: string;
  severity_hint?: UncertaintySeverity;
}>;

export type UncertaintyAssessment = Readonly<{
  tenant_id: string;
  recommendation_id: string;
  uncertainty_type: UncertaintyType;
  severity: UncertaintySeverity;
  detected_sources: readonly UncertaintySourcePhase[];
  recommended_outcome: FailClosedOutcome;
  reason_codes: readonly UncertaintyReasonCode[];
  policy_references: readonly string[];
  signal_hashes: readonly string[];
  assessment_hash: string;
  weight_version: "fail-closed-uncertainty-weights/v1";
}>;

export type FailClosedDecision = Readonly<{
  decision_id: string;
  tenant_id: string;
  recommendation_id: string;
  uncertainty_type: UncertaintyType;
  severity: UncertaintySeverity;
  detected_sources: readonly UncertaintySourcePhase[];
  recommended_outcome: FailClosedOutcome;
  reason_codes: readonly UncertaintyReasonCode[];
  policy_references: readonly string[];
  input_hash: string;
  evaluation_hash: string;
  lineage_references: readonly string[];
  replay_references: readonly string[];
  timestamp: string;
  version: string;
  advisory_only: true;
  execution_permitted: false;
  authority_changed: false;
  mutation_performed: false;
  replay_mode: "READ_ONLY";
  may_execute: false;
  may_schedule: false;
  may_mutate_state: false;
  may_change_approval: false;
  may_change_authority: false;
  may_route_workflow: false;
  may_remediate: false;
}>;

export type UncertaintyLineageRecord = Readonly<{
  lineage_id: string;
  decision_id: string;
  tenant_id: string;
  recommendation_id: string;
  source_phases: readonly UncertaintySourcePhase[];
  detected_uncertainty: UncertaintyType;
  severity: UncertaintySeverity;
  policy_versions: readonly string[];
  hash_references: readonly string[];
  reason_codes: readonly UncertaintyReasonCode[];
  timestamps: readonly string[];
  trigger_sources: readonly string[];
  recommended_restriction: FailClosedOutcome;
  replay_references: readonly string[];
  lineage_hash: string;
}>;

export type UncertaintyReplayRecord = Readonly<{
  replay_id: string;
  decision_id: string;
  tenant_id: string;
  recommendation_id: string;
  replay_status: "REPLAY_VERIFIED" | "FREEZE_REPLAY_RESULT" | "FAIL_REPLAY";
  replayed_severity: UncertaintySeverity;
  replayed_outcome: FailClosedOutcome;
  replayed_reason_codes: readonly UncertaintyReasonCode[];
  chronology_valid: boolean;
  source_lineage_hash: string;
  replay_hash: string;
  replay_mode: "READ_ONLY";
  advisory_only: true;
  execution_permitted: false;
}>;

export type UncertaintyCertification = Readonly<{
  certified: boolean;
  deterministic: true;
  replayable: boolean;
  read_only: true;
  advisory_only: true;
  tenant_isolated: boolean;
  authority_bounded: true;
  fail_closed: true;
  fail_open_possible: false;
  certification_hash: string;
}>;

export type FailClosedUncertaintyRequest = Readonly<{
  tenant_id: string;
  recommendation_id: string;
  signals: readonly UncertaintySignal[];
  timestamp: string;
  version: string;
  policy_version?: string;
}>;

export type FailClosedUncertaintyRecord = Readonly<{
  assessment: UncertaintyAssessment;
  decision: FailClosedDecision;
  lineage: UncertaintyLineageRecord;
  replay: UncertaintyReplayRecord;
  certification: UncertaintyCertification;
  record_hash: string;
  generated_at: string;
  read_only: true;
  advisory_only: true;
  authority_changed: false;
  mutation_performed: false;
  execution_permitted: false;
  may_execute: false;
  may_schedule: false;
  may_mutate_state: false;
  may_change_approval: false;
  may_change_authority: false;
  may_route_workflow: false;
  may_remediate: false;
}>;

const DEFAULT_POLICY_VERSION = "fail-closed-uncertainty-policy/v1";
const WEIGHT_VERSION = "fail-closed-uncertainty-weights/v1";

const SEVERITY_RANK: Record<UncertaintySeverity, number> = Object.freeze({
  LOW: 0,
  MODERATE: 1,
  HIGH: 2,
  CRITICAL: 3,
});

const OUTCOME_RANK: Record<FailClosedOutcome, number> = Object.freeze({
  LIMIT_SCOPE: 0,
  LIMIT_VISIBILITY: 1,
  ESCALATE: 2,
  FREEZE_RECOMMENDATIONS: 3,
  FREEZE_REPLAY_RESULT: 4,
  FREEZE_OBSERVABILITY_RESULT: 5,
  FREEZE_OPERATOR_VIEW: 6,
  FAIL_REPLAY: 7,
  FREEZE_REQUIRED: 8,
  BLOCK_RESULT: 9,
});

const TYPE_RULES: Record<UncertaintyType, Readonly<{
  severity: UncertaintySeverity;
  outcome: FailClosedOutcome;
  reason: UncertaintyReasonCode;
}>> = Object.freeze({
  CONFIDENCE_COLLAPSE: Object.freeze({
    severity: "MODERATE",
    outcome: "LIMIT_SCOPE",
    reason: "CONFIDENCE_COLLAPSE_DETECTED",
  }),
  LINEAGE_CORRUPTION: Object.freeze({
    severity: "CRITICAL",
    outcome: "FREEZE_REPLAY_RESULT",
    reason: "LINEAGE_CORRUPTION_DETECTED",
  }),
  REPLAY_MISMATCH: Object.freeze({
    severity: "CRITICAL",
    outcome: "FREEZE_REPLAY_RESULT",
    reason: "REPLAY_MISMATCH_DETECTED",
  }),
  POLICY_GAP: Object.freeze({
    severity: "CRITICAL",
    outcome: "BLOCK_RESULT",
    reason: "POLICY_GAP_DETECTED",
  }),
  APPROVAL_INSTABILITY: Object.freeze({
    severity: "HIGH",
    outcome: "FREEZE_REQUIRED",
    reason: "APPROVAL_INSTABILITY_DETECTED",
  }),
  TENANT_MISMATCH: Object.freeze({
    severity: "CRITICAL",
    outcome: "BLOCK_RESULT",
    reason: "TENANT_MISMATCH_DETECTED",
  }),
  AUTHORITY_AMBIGUITY: Object.freeze({
    severity: "CRITICAL",
    outcome: "BLOCK_RESULT",
    reason: "AUTHORITY_AMBIGUITY_DETECTED",
  }),
  HASH_MISMATCH: Object.freeze({
    severity: "CRITICAL",
    outcome: "BLOCK_RESULT",
    reason: "HASH_MISMATCH_DETECTED",
  }),
  MISSING_LINEAGE: Object.freeze({
    severity: "HIGH",
    outcome: "FREEZE_REPLAY_RESULT",
    reason: "MISSING_LINEAGE_DETECTED",
  }),
  PARTIAL_REPLAY: Object.freeze({
    severity: "HIGH",
    outcome: "FAIL_REPLAY",
    reason: "PARTIAL_REPLAY_DETECTED",
  }),
  VISIBILITY_BOUNDARY_VIOLATION: Object.freeze({
    severity: "CRITICAL",
    outcome: "FREEZE_OPERATOR_VIEW",
    reason: "VISIBILITY_BOUNDARY_VIOLATION_DETECTED",
  }),
  MISSING_GOVERNANCE_REFERENCE: Object.freeze({
    severity: "CRITICAL",
    outcome: "BLOCK_RESULT",
    reason: "MISSING_GOVERNANCE_REFERENCE_DETECTED",
  }),
  CHRONOLOGY_CORRUPTION: Object.freeze({
    severity: "CRITICAL",
    outcome: "FAIL_REPLAY",
    reason: "CHRONOLOGY_CORRUPTION_DETECTED",
  }),
  CONTAINMENT_INCONSISTENCY: Object.freeze({
    severity: "HIGH",
    outcome: "FREEZE_RECOMMENDATIONS",
    reason: "CONTAINMENT_INCONSISTENCY_DETECTED",
  }),
  ESCALATION_INCONSISTENCY: Object.freeze({
    severity: "HIGH",
    outcome: "ESCALATE",
    reason: "ESCALATION_INCONSISTENCY_DETECTED",
  }),
  OBSERVABILITY_CORRUPTION: Object.freeze({
    severity: "HIGH",
    outcome: "FREEZE_OBSERVABILITY_RESULT",
    reason: "OBSERVABILITY_CORRUPTION_DETECTED",
  }),
  OPERATOR_VISIBILITY_CORRUPTION: Object.freeze({
    severity: "CRITICAL",
    outcome: "FREEZE_OPERATOR_VIEW",
    reason: "OPERATOR_VISIBILITY_CORRUPTION_DETECTED",
  }),
});

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: UncertaintyReasonCode[], reason: UncertaintyReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function strictestSeverity(values: readonly UncertaintySeverity[]): UncertaintySeverity {
  return values.reduce((strictest, value) => (
    SEVERITY_RANK[value] > SEVERITY_RANK[strictest] ? value : strictest
  ), "LOW" as UncertaintySeverity);
}

function strictestOutcome(values: readonly FailClosedOutcome[]): FailClosedOutcome {
  return values.reduce((strictest, value) => (
    OUTCOME_RANK[value] > OUTCOME_RANK[strictest] ? value : strictest
  ), "LIMIT_SCOPE" as FailClosedOutcome);
}

function signalHash(signal: UncertaintySignal): string {
  return hashConfidenceValue("uncertainty-signal", canonicalizeConfidenceToString(signal));
}

function validateBoundary(request: FailClosedUncertaintyRequest): readonly UncertaintyReasonCode[] {
  const reasons: UncertaintyReasonCode[] = [];

  if (request.signals.some((signal) => signal.tenant_id !== request.tenant_id)) {
    addReason(reasons, "CROSS_TENANT_UNCERTAINTY_BLOCKED");
  }
  if (request.signals.some((signal) => signal.policy_references.length === 0)) {
    addReason(reasons, "POLICY_REFERENCE_MISSING");
  }
  if (request.signals.some((signal) => signal.source_hash.length === 0)) {
    addReason(reasons, "HASH_REFERENCE_MISSING");
  }
  if (request.signals.some((signal) => signal.lineage_references.length === 0)) {
    addReason(reasons, "LINEAGE_REFERENCE_MISSING");
  }
  if (request.signals.some((signal) => signal.replay_references.length === 0)) {
    addReason(reasons, "REPLAY_REFERENCE_MISSING");
  }
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");

  return normalizeStrings(reasons) as readonly UncertaintyReasonCode[];
}

export function classifyUncertainty(signals: readonly UncertaintySignal[]): readonly UncertaintyType[] {
  return Object.freeze([...new Set(signals.map((signal) => signal.uncertainty_type))].sort() as UncertaintyType[]);
}

export function calculateUncertaintySeverity(signals: readonly UncertaintySignal[]): UncertaintySeverity {
  if (signals.length === 0) return "LOW";
  return strictestSeverity(signals.map((signal) => {
    const baseSeverity = TYPE_RULES[signal.uncertainty_type].severity;
    if (!signal.severity_hint) return baseSeverity;
    return strictestSeverity([baseSeverity, signal.severity_hint]);
  }));
}

export function resolveFailClosedOutcome(signals: readonly UncertaintySignal[]): FailClosedOutcome {
  if (signals.length === 0) return "LIMIT_SCOPE";
  return strictestOutcome(signals.map((signal) => TYPE_RULES[signal.uncertainty_type].outcome));
}

export function generateUncertaintyReasons(request: FailClosedUncertaintyRequest): readonly UncertaintyReasonCode[] {
  const reasons: UncertaintyReasonCode[] = [...validateBoundary(request)];

  for (const signal of request.signals) {
    addReason(reasons, TYPE_RULES[signal.uncertainty_type].reason);
    for (const reason of signal.reason_codes) {
      if (reason.length > 0) addReason(reasons, "FAIL_CLOSED_RESTRICTION_APPLIED");
    }
  }
  addReason(reasons, "FAIL_CLOSED_RESTRICTION_APPLIED");
  addReason(reasons, "READ_ONLY_REPLAY");

  return normalizeStrings(reasons) as readonly UncertaintyReasonCode[];
}

export function assessUncertainty(request: FailClosedUncertaintyRequest): UncertaintyAssessment {
  const uncertaintyTypes = classifyUncertainty(request.signals);
  const uncertaintyType = uncertaintyTypes.at(-1) ?? "CONFIDENCE_COLLAPSE";
  const severity = strictestSeverity([
    calculateUncertaintySeverity(request.signals),
    request.signals.some((signal) => signal.tenant_id !== request.tenant_id) ? "CRITICAL" : "LOW",
    request.signals.some((signal) => signal.policy_references.length === 0) ? "CRITICAL" : "LOW",
    request.signals.some((signal) => signal.source_hash.length === 0) ? "CRITICAL" : "LOW",
  ]);
  const recommendedOutcome = strictestOutcome([
    resolveFailClosedOutcome(request.signals),
    request.signals.some((signal) => signal.tenant_id !== request.tenant_id) ? "BLOCK_RESULT" : "LIMIT_SCOPE",
    request.signals.some((signal) => signal.policy_references.length === 0) ? "BLOCK_RESULT" : "LIMIT_SCOPE",
    request.signals.some((signal) => signal.source_hash.length === 0) ? "BLOCK_RESULT" : "LIMIT_SCOPE",
  ]);
  const signalHashes = normalizeStrings(request.signals.map(signalHash));
  const detectedSources = normalizeStrings(request.signals.map((signal) => signal.source_phase)) as readonly UncertaintySourcePhase[];
  const policyReferences = normalizeStrings([
    request.policy_version ?? DEFAULT_POLICY_VERSION,
    ...request.signals.flatMap((signal) => signal.policy_references),
  ]);
  const reasonCodes = generateUncertaintyReasons(request);
  const assessmentCore = Object.freeze({
    tenant_id: request.tenant_id,
    recommendation_id: request.recommendation_id,
    uncertainty_type: uncertaintyType,
    severity,
    detected_sources: detectedSources,
    recommended_outcome: recommendedOutcome,
    reason_codes: reasonCodes,
    policy_references: policyReferences,
    signal_hashes: signalHashes,
    weight_version: WEIGHT_VERSION,
  });

  return Object.freeze({
    ...assessmentCore,
    assessment_hash: hashConfidenceValue("uncertainty-assessment", canonicalizeConfidenceToString(assessmentCore)),
  });
}

export function buildFailClosedDecision(request: FailClosedUncertaintyRequest): FailClosedDecision {
  const assessment = assessUncertainty(request);
  const lineageReferences = normalizeStrings(request.signals.flatMap((signal) => signal.lineage_references));
  const replayReferences = normalizeStrings(request.signals.flatMap((signal) => signal.replay_references));
  const inputCore = Object.freeze({
    tenant_id: request.tenant_id,
    recommendation_id: request.recommendation_id,
    signals: request.signals.map((signal) => Object.freeze({
      signal_id: signal.signal_id,
      tenant_id: signal.tenant_id,
      recommendation_id: signal.recommendation_id,
      source_phase: signal.source_phase,
      uncertainty_type: signal.uncertainty_type,
      source_hash: signal.source_hash,
    })),
  });
  const inputHash = hashConfidenceValue("uncertainty-input", canonicalizeConfidenceToString(inputCore));
  const decisionCore = Object.freeze({
    tenant_id: request.tenant_id,
    recommendation_id: request.recommendation_id,
    uncertainty_type: assessment.uncertainty_type,
    severity: assessment.severity,
    detected_sources: assessment.detected_sources,
    recommended_outcome: assessment.recommended_outcome,
    reason_codes: assessment.reason_codes,
    policy_references: assessment.policy_references,
    input_hash: inputHash,
    lineage_references: lineageReferences,
    replay_references: replayReferences,
    timestamp: request.timestamp,
    version: request.version,
  });
  const evaluationHash = hashConfidenceValue("fail-closed-decision", canonicalizeConfidenceToString(decisionCore));

  return Object.freeze({
    decision_id: hashConfidenceValue("fail-closed-decision-id", evaluationHash),
    ...decisionCore,
    evaluation_hash: evaluationHash,
    advisory_only: true as const,
    execution_permitted: false as const,
    authority_changed: false as const,
    mutation_performed: false as const,
    replay_mode: "READ_ONLY" as const,
    may_execute: false as const,
    may_schedule: false as const,
    may_mutate_state: false as const,
    may_change_approval: false as const,
    may_change_authority: false as const,
    may_route_workflow: false as const,
    may_remediate: false as const,
  });
}

export function recordUncertaintyLineage(input: {
  request: FailClosedUncertaintyRequest;
  decision: FailClosedDecision;
}): UncertaintyLineageRecord {
  const lineageCore = Object.freeze({
    decision_id: input.decision.decision_id,
    tenant_id: input.decision.tenant_id,
    recommendation_id: input.decision.recommendation_id,
    source_phases: input.decision.detected_sources,
    detected_uncertainty: input.decision.uncertainty_type,
    severity: input.decision.severity,
    policy_versions: input.decision.policy_references,
    hash_references: normalizeStrings([
      input.decision.input_hash,
      input.decision.evaluation_hash,
      ...input.request.signals.map((signal) => signal.source_hash),
    ]),
    reason_codes: input.decision.reason_codes,
    timestamps: normalizeStrings([
      input.request.timestamp,
      ...input.request.signals.map((signal) => signal.timestamp),
    ]),
    trigger_sources: normalizeStrings(input.request.signals.map((signal) => signal.trigger_source)),
    recommended_restriction: input.decision.recommended_outcome,
    replay_references: input.decision.replay_references,
  });
  const lineageHash = hashConfidenceValue("uncertainty-lineage", canonicalizeConfidenceToString(lineageCore));

  return Object.freeze({
    lineage_id: hashConfidenceValue("uncertainty-lineage-id", lineageHash),
    ...lineageCore,
    lineage_hash: lineageHash,
  });
}

export function replayUncertaintyDecision(input: {
  decision: FailClosedDecision;
  lineage: UncertaintyLineageRecord;
}): UncertaintyReplayRecord {
  const chronologyValid = input.lineage.timestamps.length > 0
    && input.lineage.decision_id === input.decision.decision_id
    && input.lineage.recommended_restriction === input.decision.recommended_outcome
    && input.lineage.severity === input.decision.severity;
  const replayStatus = chronologyValid
    ? "REPLAY_VERIFIED"
    : input.decision.recommended_outcome === "FAIL_REPLAY"
      ? "FAIL_REPLAY"
      : "FREEZE_REPLAY_RESULT";
  const replayCore = Object.freeze({
    decision_id: input.decision.decision_id,
    tenant_id: input.decision.tenant_id,
    recommendation_id: input.decision.recommendation_id,
    replay_status: replayStatus,
    replayed_severity: input.decision.severity,
    replayed_outcome: input.decision.recommended_outcome,
    replayed_reason_codes: input.decision.reason_codes,
    chronology_valid: chronologyValid,
    source_lineage_hash: input.lineage.lineage_hash,
  });
  const replayHash = hashConfidenceValue("uncertainty-replay", canonicalizeConfidenceToString(replayCore));

  return Object.freeze({
    replay_id: hashConfidenceValue("uncertainty-replay-id", replayHash),
    ...replayCore,
    replay_hash: replayHash,
    replay_mode: "READ_ONLY" as const,
    advisory_only: true as const,
    execution_permitted: false as const,
  });
}

export function certifyUncertaintyDecision(input: {
  request: FailClosedUncertaintyRequest;
  decision: FailClosedDecision;
  replay: UncertaintyReplayRecord;
}): UncertaintyCertification {
  const tenantIsolated = input.request.signals.every((signal) => signal.tenant_id === input.request.tenant_id);
  const replayable = input.replay.replay_status === "REPLAY_VERIFIED";
  const certificationCore = Object.freeze({
    decision_id: input.decision.decision_id,
    tenantIsolated,
    replayable,
    severity: input.decision.severity,
    outcome: input.decision.recommended_outcome,
  });

  return Object.freeze({
    certified: tenantIsolated && replayable,
    deterministic: true as const,
    replayable,
    read_only: true as const,
    advisory_only: true as const,
    tenant_isolated: tenantIsolated,
    authority_bounded: true as const,
    fail_closed: true as const,
    fail_open_possible: false as const,
    certification_hash: hashConfidenceValue("uncertainty-certification", canonicalizeConfidenceToString(certificationCore)),
  });
}

export function buildFailClosedUncertaintyRecord(
  request: FailClosedUncertaintyRequest,
): FailClosedUncertaintyRecord {
  const assessment = assessUncertainty(request);
  const decision = buildFailClosedDecision(request);
  const lineage = recordUncertaintyLineage({ request, decision });
  const replay = replayUncertaintyDecision({ decision, lineage });
  const certification = certifyUncertaintyDecision({ request, decision, replay });
  const recordCore = Object.freeze({
    assessment,
    decision,
    lineage,
    replay,
    certification,
  });

  return Object.freeze({
    ...recordCore,
    record_hash: hashConfidenceValue("fail-closed-uncertainty-record", canonicalizeConfidenceToString(recordCore)),
    generated_at: request.timestamp,
    read_only: true as const,
    advisory_only: true as const,
    authority_changed: false as const,
    mutation_performed: false as const,
    execution_permitted: false as const,
    may_execute: false as const,
    may_schedule: false as const,
    may_mutate_state: false as const,
    may_change_approval: false as const,
    may_change_authority: false as const,
    may_route_workflow: false as const,
    may_remediate: false as const,
  });
}

export const UncertaintyClassifier = Object.freeze({
  classify: classifyUncertainty,
});

export const UncertaintySeverityCalculator = Object.freeze({
  calculate: calculateUncertaintySeverity,
});

export const UncertaintyLineageRecorder = Object.freeze({
  record: recordUncertaintyLineage,
});

export const UncertaintyReplayService = Object.freeze({
  replay: replayUncertaintyDecision,
});

export const UncertaintyCertificationService = Object.freeze({
  certify: certifyUncertaintyDecision,
});

export const UncertaintyBoundaryValidator = Object.freeze({
  validate: validateBoundary,
});

export const UncertaintyReasonGenerator = Object.freeze({
  generate: generateUncertaintyReasons,
});

export const UncertaintyPolicyValidator = Object.freeze({
  validate: (request: FailClosedUncertaintyRequest) => Object.freeze({
    policy_available: request.signals.every((signal) => signal.policy_references.length > 0),
    policy_version: request.policy_version ?? DEFAULT_POLICY_VERSION,
  }),
});

export const UncertaintyIntegrityEvaluator = Object.freeze({
  assess: assessUncertainty,
});

export const FailClosedUncertaintyEngine = Object.freeze({
  build: buildFailClosedUncertaintyRecord,
});
