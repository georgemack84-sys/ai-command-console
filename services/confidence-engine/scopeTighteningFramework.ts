import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  IntegrityState,
  ReplayIntegrityState,
  RiskEscalationOutcome,
} from "./riskEscalationLayer";

export type ContainmentLevel =
  | "NO_RESTRICTION"
  | "LIMIT_SCOPE"
  | "MINIMAL_SCOPE"
  | "STRICT_SCOPE"
  | "FREEZE_RECOMMENDATIONS";

export type ContainmentReasonCode =
  | "ESCALATION_PRESSURE"
  | "CONFIDENCE_COLLAPSE"
  | "SEVERE_UNCERTAINTY"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_AMBIGUITY"
  | "REPLAY_INSTABILITY"
  | "REPLAY_MISMATCH"
  | "LINEAGE_MISSING"
  | "LINEAGE_CORRUPTED"
  | "APPROVAL_INSTABILITY"
  | "APPROVAL_UNKNOWN"
  | "POLICY_CONFLICT"
  | "POLICY_UNAVAILABLE"
  | "BROAD_RECOMMENDATION_SURFACE"
  | "TENANT_ISOLATION_VIOLATION"
  | "SCOPE_EXPANSION_BLOCKED";

export type ScopeTighteningInput = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  confidence_score: number;
  risk_score: number;
  uncertainty_score: number;
  escalation_pressure: number;
  recommended_escalation: RiskEscalationOutcome;
  governance_pressure: number;
  lineage_integrity: IntegrityState;
  replay_integrity: ReplayIntegrityState;
  authority_ambiguity: boolean;
  approval_instability: boolean | "UNKNOWN";
  policy_conflict: boolean | "UNKNOWN";
  recommendation_count: number;
  branch_count: number;
  optimization_depth: number;
  alternative_paths: number;
  timestamp: string;
  version: string;
  policy_version?: string;
  weight_version?: string;
  lineage_tenant_id?: string;
  replay_tenant_id?: string;
}>;

export type ContainmentPressureFactors = Readonly<{
  confidence_pressure: number;
  uncertainty_pressure: number;
  governance_pressure: number;
  replay_pressure: number;
  lineage_pressure: number;
  authority_pressure: number;
  approval_pressure: number;
}>;

export type ContainmentPressureWeights = Readonly<{
  version: string;
  confidence_pressure: number;
  uncertainty_pressure: number;
  governance_pressure: number;
  replay_pressure: number;
  lineage_pressure: number;
  authority_pressure: number;
  approval_pressure: number;
}>;

export type ContainmentLineageRecord = Readonly<{
  lineage_id: string;
  source_input_hash: string;
  pressure_hash: string;
  weight_version: string;
  policy_version: string;
  constraint_decisions: Readonly<{
    scope_limit: number;
    branch_limit: number;
    optimization_limit: number;
    alternative_limit: number;
  }>;
  containment_outcome: ContainmentLevel;
  reason_codes: readonly ContainmentReasonCode[];
  policy_references: readonly string[];
  recommendation_hash: string;
  replay_references: readonly string[];
  lineage_hash: string;
}>;

export type ContainmentCertification = Readonly<{
  certified: boolean;
  deterministic: boolean;
  replayable: boolean;
  advisory_only: true;
  governance_authoritative: true;
  authority_bounded: true;
  scope_expansion_blocked: true;
  certification_hash: string;
}>;

export type ContainmentRecommendation = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  containment_level: ContainmentLevel;
  scope_limit: number;
  branch_limit: number;
  optimization_limit: number;
  alternative_limit: number;
  reason_codes: readonly ContainmentReasonCode[];
  rationale_summary: string;
  pressure_scores: ContainmentPressureFactors;
  containment_pressure: number;
  policy_references: readonly string[];
  input_hash: string;
  evaluation_hash: string;
  timestamp: string;
  version: string;
  lineage: ContainmentLineageRecord;
  certification: ContainmentCertification;
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
  may_expand_scope: false;
}>;

export const CONTAINMENT_PRESSURE_WEIGHTS: ContainmentPressureWeights = Object.freeze({
  version: "scope-tightening-weights/v1",
  confidence_pressure: 0.14,
  uncertainty_pressure: 0.18,
  governance_pressure: 0.16,
  replay_pressure: 0.14,
  lineage_pressure: 0.16,
  authority_pressure: 0.12,
  approval_pressure: 0.1,
});

const CONTAINMENT_POLICY_VERSION = "scope-tightening-policy/v1";

const CONTAINMENT_RANK: Record<ContainmentLevel, number> = Object.freeze({
  NO_RESTRICTION: 0,
  LIMIT_SCOPE: 1,
  MINIMAL_SCOPE: 2,
  STRICT_SCOPE: 3,
  FREEZE_RECOMMENDATIONS: 4,
});

function clampScore(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function clampCount(value: number): number {
  return Math.max(0, Math.floor(value));
}

function pressureForLineage(state: IntegrityState): number {
  switch (state) {
    case "VALID":
      return 0;
    case "UNKNOWN":
      return 0.8;
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

function pressureForApproval(state: boolean | "UNKNOWN"): number {
  return state === "UNKNOWN" ? 1 : state ? 0.7 : 0;
}

function normalizeInput(input: ScopeTighteningInput): ScopeTighteningInput {
  return Object.freeze({
    ...input,
    confidence_score: clampScore(input.confidence_score),
    risk_score: clampScore(input.risk_score),
    uncertainty_score: clampScore(input.uncertainty_score),
    escalation_pressure: clampScore(input.escalation_pressure),
    governance_pressure: clampScore(input.governance_pressure),
    recommendation_count: clampCount(input.recommendation_count),
    branch_count: clampCount(input.branch_count),
    optimization_depth: clampCount(input.optimization_depth),
    alternative_paths: clampCount(input.alternative_paths),
    policy_version: input.policy_version ?? CONTAINMENT_POLICY_VERSION,
    weight_version: input.weight_version ?? CONTAINMENT_PRESSURE_WEIGHTS.version,
  });
}

export function calculateContainmentPressure(
  input: ScopeTighteningInput,
): ContainmentPressureFactors {
  const normalized = normalizeInput(input);

  return Object.freeze({
    confidence_pressure: normalized.confidence_score <= 0.35
      ? Math.max(0.8, 1 - normalized.confidence_score)
      : clampScore(1 - normalized.confidence_score),
    uncertainty_pressure: normalized.uncertainty_score,
    governance_pressure: normalized.governance_pressure,
    replay_pressure: pressureForReplay(normalized.replay_integrity),
    lineage_pressure: pressureForLineage(normalized.lineage_integrity),
    authority_pressure: normalized.authority_ambiguity ? 1 : 0,
    approval_pressure: pressureForApproval(normalized.approval_instability),
  });
}

export function calculateWeightedContainmentPressure(input: {
  factors: ContainmentPressureFactors;
  escalationPressure: number;
  riskScore: number;
  recommendationCount: number;
  branchCount: number;
  optimizationDepth: number;
  alternativePaths: number;
  weights?: ContainmentPressureWeights;
}): number {
  const weights = input.weights ?? CONTAINMENT_PRESSURE_WEIGHTS;
  const factorPressure = Number((
    input.factors.confidence_pressure * weights.confidence_pressure
    + input.factors.uncertainty_pressure * weights.uncertainty_pressure
    + input.factors.governance_pressure * weights.governance_pressure
    + input.factors.replay_pressure * weights.replay_pressure
    + input.factors.lineage_pressure * weights.lineage_pressure
    + input.factors.authority_pressure * weights.authority_pressure
    + input.factors.approval_pressure * weights.approval_pressure
  ).toFixed(4));
  const surfacePressure = Math.min(0.16, (
    Math.min(input.recommendationCount, 10)
    + Math.min(input.branchCount, 10)
    + Math.min(input.optimizationDepth, 10)
    + Math.min(input.alternativePaths, 10)
  ) / 250);

  return clampScore(
    factorPressure
    + input.escalationPressure * 0.18
    + input.riskScore * 0.1
    + surfacePressure,
  );
}

function addReason(reasons: ContainmentReasonCode[], reason: ContainmentReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export function generateContainmentReasons(
  input: ScopeTighteningInput,
): readonly ContainmentReasonCode[] {
  const normalized = normalizeInput(input);
  const reasons: ContainmentReasonCode[] = [];

  if (normalized.escalation_pressure >= 0.32 || normalized.recommended_escalation !== "OBSERVE") {
    addReason(reasons, "ESCALATION_PRESSURE");
  }
  if (normalized.confidence_score <= 0.35) addReason(reasons, "CONFIDENCE_COLLAPSE");
  if (normalized.uncertainty_score >= 0.82) addReason(reasons, "SEVERE_UNCERTAINTY");
  if (normalized.governance_pressure >= 0.58 || normalized.recommended_escalation === "GOVERNANCE_REVIEW") {
    addReason(reasons, "GOVERNANCE_CONFLICT");
  }
  if (normalized.authority_ambiguity) addReason(reasons, "AUTHORITY_AMBIGUITY");
  if (normalized.replay_integrity === "UNSTABLE" || normalized.replay_integrity === "UNKNOWN") {
    addReason(reasons, "REPLAY_INSTABILITY");
  }
  if (normalized.replay_integrity === "MISMATCHED") addReason(reasons, "REPLAY_MISMATCH");
  if (normalized.lineage_integrity === "MISSING") addReason(reasons, "LINEAGE_MISSING");
  if (normalized.lineage_integrity === "CORRUPTED" || normalized.lineage_integrity === "UNKNOWN") {
    addReason(reasons, "LINEAGE_CORRUPTED");
  }
  if (normalized.approval_instability === true) addReason(reasons, "APPROVAL_INSTABILITY");
  if (normalized.approval_instability === "UNKNOWN") addReason(reasons, "APPROVAL_UNKNOWN");
  if (normalized.policy_conflict === true) addReason(reasons, "POLICY_CONFLICT");
  if (normalized.policy_conflict === "UNKNOWN" || !normalized.policy_version) addReason(reasons, "POLICY_UNAVAILABLE");
  if (
    normalized.recommendation_count > 3
    || normalized.branch_count > 2
    || normalized.optimization_depth > 2
    || normalized.alternative_paths > 2
  ) {
    addReason(reasons, "BROAD_RECOMMENDATION_SURFACE");
  }
  if (
    (normalized.lineage_tenant_id !== undefined && normalized.lineage_tenant_id !== normalized.tenant_id)
    || (normalized.replay_tenant_id !== undefined && normalized.replay_tenant_id !== normalized.tenant_id)
  ) {
    addReason(reasons, "TENANT_ISOLATION_VIOLATION");
  }

  return Object.freeze([...reasons].sort());
}

export function validateContainmentPolicy(input: ScopeTighteningInput): readonly ContainmentReasonCode[] {
  const normalized = normalizeInput(input);
  const reasons: ContainmentReasonCode[] = [];

  if (normalized.policy_conflict === true) addReason(reasons, "POLICY_CONFLICT");
  if (normalized.policy_conflict === "UNKNOWN" || !normalized.policy_version) addReason(reasons, "POLICY_UNAVAILABLE");

  return Object.freeze([...reasons].sort());
}

export function evaluateContainmentBoundary(input: ScopeTighteningInput): Readonly<{
  tenant_isolated: boolean;
  scope_expansion_blocked: true;
  reasons: readonly ContainmentReasonCode[];
}> {
  const reasons = generateContainmentReasons(input).filter((reason) =>
    reason === "TENANT_ISOLATION_VIOLATION" || reason === "SCOPE_EXPANSION_BLOCKED");

  return Object.freeze({
    tenant_isolated: !reasons.includes("TENANT_ISOLATION_VIOLATION"),
    scope_expansion_blocked: true as const,
    reasons: Object.freeze(reasons),
  });
}

function chooseContainment(input: {
  pressure: number;
  reasons: readonly ContainmentReasonCode[];
  escalation: RiskEscalationOutcome;
}): ContainmentLevel {
  if (
    input.escalation === "FREEZE_REQUIRED"
    || input.reasons.includes("LINEAGE_MISSING")
    || input.reasons.includes("LINEAGE_CORRUPTED")
    || input.reasons.includes("REPLAY_MISMATCH")
    || input.reasons.includes("POLICY_UNAVAILABLE")
    || input.reasons.includes("TENANT_ISOLATION_VIOLATION")
    || input.reasons.includes("SEVERE_UNCERTAINTY")
  ) {
    return "FREEZE_RECOMMENDATIONS";
  }
  if (input.reasons.includes("AUTHORITY_AMBIGUITY") || input.pressure >= 0.74) {
    return "MINIMAL_SCOPE";
  }
  if (
    input.escalation === "CONSTITUTIONAL_REVIEW"
    || input.reasons.includes("REPLAY_INSTABILITY")
    || input.pressure >= 0.58
  ) {
    return "STRICT_SCOPE";
  }
  if (
    input.escalation === "GOVERNANCE_REVIEW"
    || input.reasons.includes("GOVERNANCE_CONFLICT")
    || input.reasons.includes("CONFIDENCE_COLLAPSE")
    || input.reasons.includes("APPROVAL_UNKNOWN")
    || input.pressure >= 0.32
  ) {
    return "LIMIT_SCOPE";
  }

  return "NO_RESTRICTION";
}

function constraintsForLevel(
  input: ScopeTighteningInput,
  level: ContainmentLevel,
): Readonly<{
  scope_limit: number;
  branch_limit: number;
  optimization_limit: number;
  alternative_limit: number;
}> {
  const normalized = normalizeInput(input);
  const base = Object.freeze({
    scope_limit: normalized.recommendation_count,
    branch_limit: normalized.branch_count,
    optimization_limit: normalized.optimization_depth,
    alternative_limit: normalized.alternative_paths,
  });

  switch (level) {
    case "NO_RESTRICTION":
      return base;
    case "LIMIT_SCOPE":
      return Object.freeze({
        scope_limit: Math.min(base.scope_limit, Math.max(1, Math.floor(base.scope_limit * 0.75))),
        branch_limit: Math.min(base.branch_limit, Math.max(1, Math.floor(base.branch_limit * 0.75))),
        optimization_limit: Math.min(base.optimization_limit, Math.max(1, Math.floor(base.optimization_limit * 0.75))),
        alternative_limit: Math.min(base.alternative_limit, Math.max(1, Math.floor(base.alternative_limit * 0.75))),
      });
    case "MINIMAL_SCOPE":
      return Object.freeze({
        scope_limit: Math.min(base.scope_limit, 1),
        branch_limit: Math.min(base.branch_limit, 1),
        optimization_limit: Math.min(base.optimization_limit, 1),
        alternative_limit: Math.min(base.alternative_limit, 1),
      });
    case "STRICT_SCOPE":
      return Object.freeze({
        scope_limit: Math.min(base.scope_limit, 1),
        branch_limit: Math.min(base.branch_limit, 1),
        optimization_limit: 0,
        alternative_limit: 0,
      });
    case "FREEZE_RECOMMENDATIONS":
      return Object.freeze({
        scope_limit: 0,
        branch_limit: 0,
        optimization_limit: 0,
        alternative_limit: 0,
      });
  }
}

function blocksExpansion(
  input: ScopeTighteningInput,
  constraints: ReturnType<typeof constraintsForLevel>,
): boolean {
  const normalized = normalizeInput(input);

  return constraints.scope_limit <= normalized.recommendation_count
    && constraints.branch_limit <= normalized.branch_count
    && constraints.optimization_limit <= normalized.optimization_depth
    && constraints.alternative_limit <= normalized.alternative_paths;
}

export function buildContainmentRationale(input: {
  level: ContainmentLevel;
  reasons: readonly ContainmentReasonCode[];
}): string {
  return input.reasons.length === 0
    ? `${input.level}: recommendation surface remains bounded.`
    : `${input.level}: ${input.reasons.join(", ")}.`;
}

export function recordContainmentLineage(input: {
  normalizedInput: ScopeTighteningInput;
  factors: ContainmentPressureFactors;
  pressure: number;
  level: ContainmentLevel;
  reasons: readonly ContainmentReasonCode[];
  constraints: ReturnType<typeof constraintsForLevel>;
  recommendationHash: string;
  policyReferences: readonly string[];
}): ContainmentLineageRecord {
  const sourceInputHash = hashConfidenceValue("scope-tightening-input", canonicalizeConfidenceToString(input.normalizedInput));
  const pressureHash = hashConfidenceValue("scope-tightening-pressure", canonicalizeConfidenceToString({
    factors: input.factors,
    pressure: input.pressure,
    weights: CONTAINMENT_PRESSURE_WEIGHTS,
  }));
  const lineageCore = Object.freeze({
    source_input_hash: sourceInputHash,
    pressure_hash: pressureHash,
    weight_version: input.normalizedInput.weight_version ?? CONTAINMENT_PRESSURE_WEIGHTS.version,
    policy_version: input.normalizedInput.policy_version ?? CONTAINMENT_POLICY_VERSION,
    constraint_decisions: input.constraints,
    containment_outcome: input.level,
    reason_codes: input.reasons,
    policy_references: input.policyReferences,
    recommendation_hash: input.recommendationHash,
    replay_references: Object.freeze([
      `tenant:${input.normalizedInput.tenant_id}`,
      `recommendation:${input.normalizedInput.recommendation_id}`,
      `version:${input.normalizedInput.version}`,
    ]),
  });
  const lineageHash = hashConfidenceValue("scope-tightening-lineage", canonicalizeConfidenceToString(lineageCore));

  return Object.freeze({
    lineage_id: `scope-tightening-lineage:${lineageHash}`,
    ...lineageCore,
    lineage_hash: lineageHash,
  });
}

export function certifyContainmentRecommendation(input: {
  recommendationHash: string;
  lineageHash: string;
  replayable: boolean;
  scopeExpansionBlocked: boolean;
}): ContainmentCertification {
  const core = Object.freeze({
    recommendationHash: input.recommendationHash,
    lineageHash: input.lineageHash,
    replayable: input.replayable,
    scopeExpansionBlocked: input.scopeExpansionBlocked,
    advisoryOnly: true,
  });

  return Object.freeze({
    certified: input.replayable && input.scopeExpansionBlocked,
    deterministic: true,
    replayable: input.replayable,
    advisory_only: true as const,
    governance_authoritative: true as const,
    authority_bounded: true as const,
    scope_expansion_blocked: true as const,
    certification_hash: hashConfidenceValue("scope-tightening-certification", canonicalizeConfidenceToString(core)),
  });
}

export function evaluateScopeTightening(input: ScopeTighteningInput): ContainmentRecommendation {
  const normalized = normalizeInput(input);
  const factors = calculateContainmentPressure(normalized);
  const containmentPressure = calculateWeightedContainmentPressure({
    factors,
    escalationPressure: normalized.escalation_pressure,
    riskScore: normalized.risk_score,
    recommendationCount: normalized.recommendation_count,
    branchCount: normalized.branch_count,
    optimizationDepth: normalized.optimization_depth,
    alternativePaths: normalized.alternative_paths,
  });
  const reasons = generateContainmentReasons(normalized);
  const level = chooseContainment({
    pressure: containmentPressure,
    reasons,
    escalation: normalized.recommended_escalation,
  });
  const policyReferences = Object.freeze([
    normalized.policy_version ?? CONTAINMENT_POLICY_VERSION,
    normalized.weight_version ?? CONTAINMENT_PRESSURE_WEIGHTS.version,
  ].sort());
  const constraints = constraintsForLevel(normalized, level);
  const boundary = evaluateContainmentBoundary(normalized);
  const evaluationCore = Object.freeze({
    recommendation_id: normalized.recommendation_id,
    tenant_id: normalized.tenant_id,
    containment_level: level,
    ...constraints,
    reason_codes: reasons,
    pressure_scores: factors,
    containment_pressure: containmentPressure,
    policy_references: policyReferences,
    timestamp: normalized.timestamp,
    version: normalized.version,
    advisory_only: true as const,
    execution_permitted: false as const,
    authority_changed: false as const,
    mutation_performed: false as const,
    replay_mode: "READ_ONLY" as const,
    tenant_isolated: boundary.tenant_isolated,
  });
  const inputHash = hashConfidenceValue("scope-tightening-input", canonicalizeConfidenceToString(normalized));
  const evaluationHash = hashConfidenceValue("scope-tightening-evaluation", canonicalizeConfidenceToString(evaluationCore));
  const lineage = recordContainmentLineage({
    normalizedInput: normalized,
    factors,
    pressure: containmentPressure,
    level,
    reasons,
    constraints,
    recommendationHash: evaluationHash,
    policyReferences,
  });
  const expansionBlocked = blocksExpansion(normalized, constraints);
  const certification = certifyContainmentRecommendation({
    recommendationHash: evaluationHash,
    lineageHash: lineage.lineage_hash,
    replayable: boundary.tenant_isolated && expansionBlocked,
    scopeExpansionBlocked: expansionBlocked,
  });

  return Object.freeze({
    ...evaluationCore,
    rationale_summary: buildContainmentRationale({ level, reasons }),
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
    may_expand_scope: false as const,
  });
}

export function replayScopeTightening(input: {
  sourceInput: ScopeTighteningInput;
  expected: ContainmentRecommendation;
}): Readonly<{
  replay_mode: "READ_ONLY";
  reproduced: boolean;
  replay_hash: string;
  reasons: readonly string[];
}> {
  const replayed = evaluateScopeTightening(input.sourceInput);
  const reproduced = replayed.evaluation_hash === input.expected.evaluation_hash
    && replayed.containment_level === input.expected.containment_level
    && replayed.scope_limit === input.expected.scope_limit
    && replayed.branch_limit === input.expected.branch_limit
    && replayed.optimization_limit === input.expected.optimization_limit
    && replayed.alternative_limit === input.expected.alternative_limit
    && replayed.rationale_summary === input.expected.rationale_summary
    && replayed.lineage.lineage_hash === input.expected.lineage.lineage_hash;

  return Object.freeze({
    replay_mode: "READ_ONLY" as const,
    reproduced,
    replay_hash: hashConfidenceValue("scope-tightening-replay", canonicalizeConfidenceToString({
      expected: input.expected.evaluation_hash,
      replayed: replayed.evaluation_hash,
      reproduced,
    })),
    reasons: Object.freeze(reproduced ? [] : ["SCOPE_TIGHTENING_REPLAY_MISMATCH"]),
  });
}

export const ContainmentPressureCalculator = Object.freeze({
  calculate: calculateContainmentPressure,
  calculateWeighted: calculateWeightedContainmentPressure,
});

export const ContainmentReasonGenerator = Object.freeze({
  generate: generateContainmentReasons,
});

export const ContainmentPolicyValidator = Object.freeze({
  validate: validateContainmentPolicy,
});

export const ContainmentBoundaryEvaluator = Object.freeze({
  evaluate: evaluateContainmentBoundary,
});

export const ContainmentRecommendationModel = Object.freeze({
  rank: CONTAINMENT_RANK,
});

export const ContainmentLineageRecorder = Object.freeze({
  record: recordContainmentLineage,
});

export const ContainmentReplayService = Object.freeze({
  replay: replayScopeTightening,
});

export const ContainmentCertificationService = Object.freeze({
  certify: certifyContainmentRecommendation,
});

export const ScopeTighteningEngine = Object.freeze({
  evaluate: evaluateScopeTightening,
});
