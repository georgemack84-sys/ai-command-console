import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";

export type RiskEscalationOutcome =
  | "OBSERVE"
  | "REVIEW"
  | "GOVERNANCE_REVIEW"
  | "CONSTITUTIONAL_REVIEW"
  | "FREEZE_REQUIRED";

export type IntegrityState =
  | "VALID"
  | "MISSING"
  | "CORRUPTED"
  | "UNKNOWN";

export type ReplayIntegrityState =
  | "STABLE"
  | "UNSTABLE"
  | "MISMATCHED"
  | "UNKNOWN";

export type RecommendationScope =
  | "NARROW"
  | "STANDARD"
  | "BROAD"
  | "UNKNOWN";

export type RiskEscalationReasonCode =
  | "RISK_DETECTED"
  | "CONFIDENCE_COLLAPSE"
  | "HIGH_UNCERTAINTY"
  | "GOVERNANCE_CONFLICT"
  | "LINEAGE_MISSING"
  | "LINEAGE_CORRUPTED"
  | "REPLAY_INSTABILITY"
  | "REPLAY_MISMATCH"
  | "APPROVAL_INSTABILITY"
  | "APPROVAL_UNKNOWN"
  | "AUTHORITY_AMBIGUITY"
  | "POLICY_CONFLICT"
  | "POLICY_UNKNOWN"
  | "EVIDENCE_INCOMPLETE"
  | "BROAD_SCOPE"
  | "TENANT_ISOLATION_VIOLATION"
  | "FAIL_CLOSED_UNCERTAINTY";

export type RiskEscalationInput = Readonly<{
  confidence_score: number;
  confidence_collapse: boolean;
  risk_score: number;
  uncertainty_score: number;
  lineage_integrity: IntegrityState;
  replay_integrity: ReplayIntegrityState;
  governance_conflict: boolean;
  approval_instability: boolean | "UNKNOWN";
  authority_ambiguity: boolean;
  policy_conflict: boolean | "UNKNOWN";
  evidence_completeness: number;
  recommendation_scope: RecommendationScope;
  tenant_id: string;
  recommendation_id: string;
  timestamp: string;
  version: string;
  policy_version?: string;
  weight_version?: string;
  lineage_tenant_id?: string;
  replay_tenant_id?: string;
}>;

export type EscalationPressureFactors = Readonly<{
  confidence_pressure: number;
  uncertainty_pressure: number;
  governance_pressure: number;
  lineage_pressure: number;
  replay_pressure: number;
  approval_pressure: number;
  policy_pressure: number;
}>;

export type EscalationPressureWeights = Readonly<{
  version: string;
  confidence_pressure: number;
  uncertainty_pressure: number;
  governance_pressure: number;
  lineage_pressure: number;
  replay_pressure: number;
  approval_pressure: number;
  policy_pressure: number;
}>;

export type EscalationLineageRecord = Readonly<{
  lineage_id: string;
  source_input_hash: string;
  pressure_hash: string;
  weight_version: string;
  policy_version: string;
  escalation_path: readonly RiskEscalationOutcome[];
  reason_codes: readonly RiskEscalationReasonCode[];
  recommendation_hash: string;
  replay_references: readonly string[];
  lineage_hash: string;
}>;

export type EscalationCertification = Readonly<{
  certified: boolean;
  deterministic: boolean;
  replayable: boolean;
  advisory_only: true;
  governance_authoritative: true;
  authority_bounded: true;
  certification_hash: string;
}>;

export type EscalationRecommendation = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  risk_score: number;
  confidence_score: number;
  uncertainty_score: number;
  governance_pressure: number;
  lineage_integrity: IntegrityState;
  replay_integrity: ReplayIntegrityState;
  escalation_pressure: number;
  recommended_escalation: RiskEscalationOutcome;
  reason_codes: readonly RiskEscalationReasonCode[];
  rationale_summary: string;
  policy_references: readonly string[];
  input_hash: string;
  evaluation_hash: string;
  timestamp: string;
  version: string;
  pressure_factors: EscalationPressureFactors;
  pressure_weights: EscalationPressureWeights;
  lineage: EscalationLineageRecord;
  certification: EscalationCertification;
  advisory_only: true;
  execution_permitted: false;
  authority_changed: false;
  mutation_performed: false;
  replay_mode: "READ_ONLY";
  tenant_isolated: boolean;
  may_execute: false;
  may_schedule: false;
  may_mutate_state: false;
  may_change_approval: false;
  may_change_authority: false;
  may_route_workflow: false;
  may_freeze: false;
}>;

export const ESCALATION_PRESSURE_WEIGHTS: EscalationPressureWeights = Object.freeze({
  version: "risk-escalation-weights/v1",
  confidence_pressure: 0.18,
  uncertainty_pressure: 0.16,
  governance_pressure: 0.16,
  lineage_pressure: 0.16,
  replay_pressure: 0.14,
  approval_pressure: 0.1,
  policy_pressure: 0.1,
});

const ESCALATION_POLICY_VERSION = "risk-escalation-policy/v1";

function clampScore(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function pressureForLineage(state: IntegrityState): number {
  switch (state) {
    case "VALID":
      return 0;
    case "UNKNOWN":
      return 0.85;
    case "MISSING":
    case "CORRUPTED":
      return 1;
  }
}

function pressureForReplay(state: ReplayIntegrityState): number {
  switch (state) {
    case "STABLE":
      return 0;
    case "UNSTABLE":
      return 0.75;
    case "UNKNOWN":
      return 0.85;
    case "MISMATCHED":
      return 1;
  }
}

function pressureForTriState(state: boolean | "UNKNOWN", activePressure: number): number {
  return state === "UNKNOWN" ? 1 : state ? activePressure : 0;
}

function normalizeInput(input: RiskEscalationInput): RiskEscalationInput {
  return Object.freeze({
    ...input,
    confidence_score: clampScore(input.confidence_score),
    risk_score: clampScore(input.risk_score),
    uncertainty_score: clampScore(input.uncertainty_score),
    evidence_completeness: clampScore(input.evidence_completeness),
    policy_version: input.policy_version ?? ESCALATION_POLICY_VERSION,
    weight_version: input.weight_version ?? ESCALATION_PRESSURE_WEIGHTS.version,
  });
}

export function calculateEscalationPressure(
  input: RiskEscalationInput,
): EscalationPressureFactors {
  const normalized = normalizeInput(input);

  return Object.freeze({
    confidence_pressure: clampScore(
      normalized.confidence_collapse ? Math.max(0.75, 1 - normalized.confidence_score) : 1 - normalized.confidence_score,
    ),
    uncertainty_pressure: normalized.uncertainty_score,
    governance_pressure: normalized.governance_conflict ? 1 : 0,
    lineage_pressure: pressureForLineage(normalized.lineage_integrity),
    replay_pressure: pressureForReplay(normalized.replay_integrity),
    approval_pressure: pressureForTriState(normalized.approval_instability, 0.75),
    policy_pressure: pressureForTriState(normalized.policy_conflict, 0.85),
  });
}

export function calculateWeightedEscalationPressure(input: {
  factors: EscalationPressureFactors;
  weights?: EscalationPressureWeights;
  riskScore: number;
  evidenceCompleteness: number;
  recommendationScope: RecommendationScope;
}): number {
  const weights = input.weights ?? ESCALATION_PRESSURE_WEIGHTS;
  const factorPressure = Number((
    input.factors.confidence_pressure * weights.confidence_pressure
    + input.factors.uncertainty_pressure * weights.uncertainty_pressure
    + input.factors.governance_pressure * weights.governance_pressure
    + input.factors.lineage_pressure * weights.lineage_pressure
    + input.factors.replay_pressure * weights.replay_pressure
    + input.factors.approval_pressure * weights.approval_pressure
    + input.factors.policy_pressure * weights.policy_pressure
  ).toFixed(4));
  const riskPressure = input.riskScore * 0.2;
  const evidencePressure = (1 - input.evidenceCompleteness) * 0.08;
  const scopePressure = input.recommendationScope === "BROAD"
    ? 0.08
    : input.recommendationScope === "UNKNOWN"
      ? 0.1
      : 0;

  return clampScore(factorPressure + riskPressure + evidencePressure + scopePressure);
}

function addReason(
  reasons: RiskEscalationReasonCode[],
  reason: RiskEscalationReasonCode,
): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

export function generateEscalationReasons(
  input: RiskEscalationInput,
): readonly RiskEscalationReasonCode[] {
  const normalized = normalizeInput(input);
  const reasons: RiskEscalationReasonCode[] = [];

  if (normalized.risk_score > 0) addReason(reasons, "RISK_DETECTED");
  if (normalized.confidence_collapse) addReason(reasons, "CONFIDENCE_COLLAPSE");
  if (normalized.uncertainty_score >= 0.6) addReason(reasons, "HIGH_UNCERTAINTY");
  if (normalized.governance_conflict) addReason(reasons, "GOVERNANCE_CONFLICT");
  if (normalized.lineage_integrity === "MISSING") addReason(reasons, "LINEAGE_MISSING");
  if (normalized.lineage_integrity === "CORRUPTED" || normalized.lineage_integrity === "UNKNOWN") {
    addReason(reasons, "LINEAGE_CORRUPTED");
  }
  if (normalized.replay_integrity === "UNSTABLE" || normalized.replay_integrity === "UNKNOWN") {
    addReason(reasons, "REPLAY_INSTABILITY");
  }
  if (normalized.replay_integrity === "MISMATCHED") addReason(reasons, "REPLAY_MISMATCH");
  if (normalized.approval_instability === true) addReason(reasons, "APPROVAL_INSTABILITY");
  if (normalized.approval_instability === "UNKNOWN") addReason(reasons, "APPROVAL_UNKNOWN");
  if (normalized.authority_ambiguity) addReason(reasons, "AUTHORITY_AMBIGUITY");
  if (normalized.policy_conflict === true) addReason(reasons, "POLICY_CONFLICT");
  if (normalized.policy_conflict === "UNKNOWN") addReason(reasons, "POLICY_UNKNOWN");
  if (normalized.evidence_completeness < 1) addReason(reasons, "EVIDENCE_INCOMPLETE");
  if (normalized.recommendation_scope === "BROAD" || normalized.recommendation_scope === "UNKNOWN") {
    addReason(reasons, "BROAD_SCOPE");
  }
  if (
    (normalized.lineage_tenant_id !== undefined && normalized.lineage_tenant_id !== normalized.tenant_id)
    || (normalized.replay_tenant_id !== undefined && normalized.replay_tenant_id !== normalized.tenant_id)
  ) {
    addReason(reasons, "TENANT_ISOLATION_VIOLATION");
  }
  if (
    normalized.lineage_integrity !== "VALID"
    || normalized.replay_integrity === "MISMATCHED"
    || normalized.approval_instability === "UNKNOWN"
    || normalized.policy_conflict === "UNKNOWN"
    || normalized.authority_ambiguity
  ) {
    addReason(reasons, "FAIL_CLOSED_UNCERTAINTY");
  }

  return Object.freeze([...reasons].sort());
}

export function validateEscalationPolicy(input: RiskEscalationInput): readonly RiskEscalationReasonCode[] {
  const reasons: RiskEscalationReasonCode[] = [];
  const normalized = normalizeInput(input);

  if (normalized.policy_conflict === true) addReason(reasons, "POLICY_CONFLICT");
  if (normalized.policy_conflict === "UNKNOWN" || !normalized.policy_version) addReason(reasons, "POLICY_UNKNOWN");

  return Object.freeze([...reasons].sort());
}

export function evaluateGovernancePressure(input: RiskEscalationInput): number {
  return calculateEscalationPressure(input).governance_pressure;
}

function recommendEscalation(input: {
  pressure: number;
  reasons: readonly RiskEscalationReasonCode[];
}): RiskEscalationOutcome {
  const failClosedReasons: readonly RiskEscalationReasonCode[] = [
    "LINEAGE_MISSING",
    "LINEAGE_CORRUPTED",
    "REPLAY_MISMATCH",
    "APPROVAL_UNKNOWN",
    "POLICY_UNKNOWN",
    "TENANT_ISOLATION_VIOLATION",
  ];

  if (failClosedReasons.some((reason) => input.reasons.includes(reason))) {
    return "FREEZE_REQUIRED";
  }
  if (input.reasons.includes("AUTHORITY_AMBIGUITY") || input.pressure >= 0.78) {
    return "CONSTITUTIONAL_REVIEW";
  }
  if (input.reasons.includes("GOVERNANCE_CONFLICT") || input.reasons.includes("POLICY_CONFLICT") || input.pressure >= 0.58) {
    return "GOVERNANCE_REVIEW";
  }
  if (input.reasons.includes("CONFIDENCE_COLLAPSE") || input.reasons.includes("REPLAY_INSTABILITY") || input.pressure >= 0.32) {
    return "REVIEW";
  }

  return "OBSERVE";
}

function buildEscalationPath(outcome: RiskEscalationOutcome): readonly RiskEscalationOutcome[] {
  const path: RiskEscalationOutcome[] = ["OBSERVE"];
  if (outcome === "OBSERVE") return Object.freeze(path);
  path.push("REVIEW");
  if (outcome === "REVIEW") return Object.freeze(path);
  path.push("GOVERNANCE_REVIEW");
  if (outcome === "GOVERNANCE_REVIEW") return Object.freeze(path);
  path.push("CONSTITUTIONAL_REVIEW");
  if (outcome === "CONSTITUTIONAL_REVIEW") return Object.freeze(path);
  path.push("FREEZE_REQUIRED");
  return Object.freeze(path);
}

export function buildEscalationRationale(input: {
  outcome: RiskEscalationOutcome;
  reasons: readonly RiskEscalationReasonCode[];
}): string {
  return input.reasons.length === 0
    ? `${input.outcome}: no elevated risk signals were present.`
    : `${input.outcome}: ${input.reasons.join(", ")}.`;
}

export function recordEscalationLineage(input: {
  normalizedInput: RiskEscalationInput;
  factors: EscalationPressureFactors;
  pressure: number;
  outcome: RiskEscalationOutcome;
  reasons: readonly RiskEscalationReasonCode[];
  recommendationHash: string;
}): EscalationLineageRecord {
  const sourceInputHash = hashConfidenceValue("risk-escalation-input", canonicalizeConfidenceToString(input.normalizedInput));
  const pressureHash = hashConfidenceValue("risk-escalation-pressure", canonicalizeConfidenceToString({
    factors: input.factors,
    pressure: input.pressure,
    weights: ESCALATION_PRESSURE_WEIGHTS,
  }));
  const path = buildEscalationPath(input.outcome);
  const lineageCore = Object.freeze({
    source_input_hash: sourceInputHash,
    pressure_hash: pressureHash,
    weight_version: input.normalizedInput.weight_version ?? ESCALATION_PRESSURE_WEIGHTS.version,
    policy_version: input.normalizedInput.policy_version ?? ESCALATION_POLICY_VERSION,
    escalation_path: path,
    reason_codes: input.reasons,
    recommendation_hash: input.recommendationHash,
    replay_references: Object.freeze([
      `tenant:${input.normalizedInput.tenant_id}`,
      `recommendation:${input.normalizedInput.recommendation_id}`,
      `version:${input.normalizedInput.version}`,
    ]),
  });

  const lineageHash = hashConfidenceValue("risk-escalation-lineage", canonicalizeConfidenceToString(lineageCore));

  return Object.freeze({
    lineage_id: `risk-escalation-lineage:${lineageHash}`,
    ...lineageCore,
    lineage_hash: lineageHash,
  });
}

export function certifyEscalationRecommendation(input: {
  recommendationHash: string;
  lineageHash: string;
  replayable: boolean;
}): EscalationCertification {
  const core = Object.freeze({
    deterministic: true,
    replayable: input.replayable,
    advisory_only: true as const,
    governance_authoritative: true as const,
    authority_bounded: true as const,
    recommendationHash: input.recommendationHash,
    lineageHash: input.lineageHash,
  });

  return Object.freeze({
    certified: input.replayable,
    deterministic: true,
    replayable: input.replayable,
    advisory_only: true as const,
    governance_authoritative: true as const,
    authority_bounded: true as const,
    certification_hash: hashConfidenceValue("risk-escalation-certification", canonicalizeConfidenceToString(core)),
  });
}

export function evaluateRiskEscalation(input: RiskEscalationInput): EscalationRecommendation {
  const normalized = normalizeInput(input);
  const factors = calculateEscalationPressure(normalized);
  const escalationPressure = calculateWeightedEscalationPressure({
    factors,
    riskScore: normalized.risk_score,
    evidenceCompleteness: normalized.evidence_completeness,
    recommendationScope: normalized.recommendation_scope,
  });
  const reasons = generateEscalationReasons(normalized);
  const outcome = recommendEscalation({
    pressure: escalationPressure,
    reasons,
  });
  const policyReferences = Object.freeze([
    normalized.policy_version ?? ESCALATION_POLICY_VERSION,
    normalized.weight_version ?? ESCALATION_PRESSURE_WEIGHTS.version,
  ].sort());
  const tenantIsolated = !reasons.includes("TENANT_ISOLATION_VIOLATION");
  const evaluationCore = Object.freeze({
    recommendation_id: normalized.recommendation_id,
    tenant_id: normalized.tenant_id,
    risk_score: normalized.risk_score,
    confidence_score: normalized.confidence_score,
    uncertainty_score: normalized.uncertainty_score,
    governance_pressure: factors.governance_pressure,
    lineage_integrity: normalized.lineage_integrity,
    replay_integrity: normalized.replay_integrity,
    escalation_pressure: escalationPressure,
    recommended_escalation: outcome,
    reason_codes: reasons,
    policy_references: policyReferences,
    timestamp: normalized.timestamp,
    version: normalized.version,
    pressure_factors: factors,
    pressure_weights: ESCALATION_PRESSURE_WEIGHTS,
    advisory_only: true as const,
    execution_permitted: false as const,
    authority_changed: false as const,
    mutation_performed: false as const,
    replay_mode: "READ_ONLY" as const,
    tenant_isolated: tenantIsolated,
  });
  const inputHash = hashConfidenceValue("risk-escalation-input", canonicalizeConfidenceToString(normalized));
  const evaluationHash = hashConfidenceValue("risk-escalation-evaluation", canonicalizeConfidenceToString(evaluationCore));
  const lineage = recordEscalationLineage({
    normalizedInput: normalized,
    factors,
    pressure: escalationPressure,
    outcome,
    reasons,
    recommendationHash: evaluationHash,
  });
  const certification = certifyEscalationRecommendation({
    recommendationHash: evaluationHash,
    lineageHash: lineage.lineage_hash,
    replayable: tenantIsolated && outcome !== "FREEZE_REQUIRED",
  });

  return Object.freeze({
    ...evaluationCore,
    rationale_summary: buildEscalationRationale({ outcome, reasons }),
    input_hash: inputHash,
    evaluation_hash: evaluationHash,
    lineage,
    certification,
    may_execute: false as const,
    may_schedule: false as const,
    may_mutate_state: false as const,
    may_change_approval: false as const,
    may_change_authority: false as const,
    may_route_workflow: false as const,
    may_freeze: false as const,
  });
}

export function replayRiskEscalation(input: {
  sourceInput: RiskEscalationInput;
  expected: EscalationRecommendation;
}): Readonly<{
  replay_mode: "READ_ONLY";
  reproduced: boolean;
  replay_hash: string;
  reasons: readonly string[];
}> {
  const replayed = evaluateRiskEscalation(input.sourceInput);
  const reproduced = replayed.evaluation_hash === input.expected.evaluation_hash
    && replayed.recommended_escalation === input.expected.recommended_escalation
    && replayed.escalation_pressure === input.expected.escalation_pressure
    && replayed.rationale_summary === input.expected.rationale_summary
    && replayed.lineage.lineage_hash === input.expected.lineage.lineage_hash;

  return Object.freeze({
    replay_mode: "READ_ONLY" as const,
    reproduced,
    replay_hash: hashConfidenceValue("risk-escalation-replay", canonicalizeConfidenceToString({
      expected: input.expected.evaluation_hash,
      replayed: replayed.evaluation_hash,
      reproduced,
    })),
    reasons: Object.freeze(reproduced ? [] : ["REPLAY_MISMATCH"]),
  });
}

export const EscalationPressureCalculator = Object.freeze({
  calculate: calculateEscalationPressure,
  calculateWeighted: calculateWeightedEscalationPressure,
});

export const EscalationReasonGenerator = Object.freeze({
  generate: generateEscalationReasons,
});

export const GovernancePressureEvaluator = Object.freeze({
  evaluate: evaluateGovernancePressure,
});

export const EscalationPolicyValidator = Object.freeze({
  validate: validateEscalationPolicy,
});

export const EscalationLineageRecorder = Object.freeze({
  record: recordEscalationLineage,
});

export const EscalationCertificationService = Object.freeze({
  certify: certifyEscalationRecommendation,
});

export const EscalationRecommendationModel = Object.freeze({
  recommend: recommendEscalation,
});

export const EscalationReplayService = Object.freeze({
  replay: replayRiskEscalation,
});

export const RiskEscalationEngine = Object.freeze({
  evaluate: evaluateRiskEscalation,
});
