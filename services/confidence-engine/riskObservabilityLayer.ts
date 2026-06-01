import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type { ConfidenceReplayResult } from "./confidenceLineageReplayFramework";
import type { GovernanceAwareCautionBridgeResult } from "./governanceAwareCautionBridge";
import type { EscalationRecommendation } from "./riskEscalationLayer";
import type { ContainmentRecommendation } from "./scopeTighteningFramework";

export type RiskObservabilityStatus =
  | "VISIBLE"
  | "LIMIT_VISIBILITY"
  | "FREEZE_OBSERVABILITY_RESULT";

export type RiskObservabilityReasonCode =
  | "TENANT_MISMATCH"
  | "RECOMMENDATION_MISMATCH"
  | "VISIBILITY_PERMISSION_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "HASH_MISMATCH"
  | "POLICY_MISSING"
  | "CORRELATION_BROKEN"
  | "REPLAY_INVALID"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type RiskObservabilityRequest = Readonly<{
  tenant_id: string;
  recommendation_id: string;
  confidence_output: GovernanceAwareCautionBridgeResult;
  escalation_output: EscalationRecommendation;
  containment_output: ContainmentRecommendation;
  replay_result: ConfidenceReplayResult;
  visibility_permissions: readonly string[];
  requested_at: string;
  version: string;
}>;

export type ObservabilityCorrelationRecord = Readonly<{
  correlation_id: string;
  from: "CAUTION" | "ESCALATION" | "CONTAINMENT" | "REPLAY";
  to: "ESCALATION" | "CONTAINMENT" | "REPLAY" | "LINEAGE";
  from_hash: string;
  to_hash: string;
  valid: boolean;
  reason_codes: readonly RiskObservabilityReasonCode[];
}>;

export type ObservabilityCertification = Readonly<{
  certified: boolean;
  deterministic: boolean;
  read_only: true;
  tenant_isolated: boolean;
  authority_bounded: true;
  visibility_only: true;
  certification_hash: string;
}>;

export type RiskObservabilityView = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  confidence_state: Readonly<{
    governance_pressure: string;
    required_action: string;
    replay_safe: boolean;
    fail_closed: boolean;
  }>;
  risk_state: Readonly<{
    risk_score: number;
    confidence_score: number;
    uncertainty_score: number;
    escalation_pressure: number;
    pressure_progression: readonly number[];
  }>;
  escalation_state: Readonly<{
    recommended_escalation: string;
    governance_pressure: number;
    reason_codes: readonly string[];
  }>;
  containment_state: Readonly<{
    containment_level: string;
    scope_limit: number;
    branch_limit: number;
    optimization_limit: number;
    alternative_limit: number;
  }>;
  lineage_state: Readonly<{
    complete: boolean;
    backward_trace: readonly string[];
    forward_trace: readonly string[];
    chain_hash: string;
  }>;
  replay_state: Readonly<{
    replay_status: string;
    replay_hash: string;
    chronology_valid: boolean;
    replay_mode: "READ_ONLY";
  }>;
  policy_state: Readonly<{
    policy_versions: readonly string[];
    weight_versions: readonly string[];
    aligned: boolean;
  }>;
  integrity_status: RiskObservabilityStatus;
  reason_codes: readonly RiskObservabilityReasonCode[];
  correlation_chain: readonly ObservabilityCorrelationRecord[];
  hash_validation_status: Readonly<{
    input_hashes_valid: boolean;
    output_hashes_valid: boolean;
  }>;
  timestamps: readonly string[];
  version: string;
}>;

export type RiskObservabilityRecord = Readonly<{
  view: RiskObservabilityView;
  certification: ObservabilityCertification;
  observability_hash: string;
  generated_at: string;
  read_only: true;
  advisory_only: true;
  authority_changed: false;
  mutation_performed: false;
  execution_permitted: false;
  may_execute: false;
  may_schedule: false;
  may_mutate_state: false;
  may_approve: false;
  may_change_authority: false;
  may_route_workflow: false;
}>;

const REQUIRED_VISIBILITY_PERMISSION = "risk-observability:read";

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: RiskObservabilityReasonCode[], reason: RiskObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function outputHash(output: GovernanceAwareCautionBridgeResult | EscalationRecommendation | ContainmentRecommendation): string {
  if ("canonicalBridgeHash" in output) return output.canonicalBridgeHash;
  return output.evaluation_hash;
}

export function validateTenantVisibility(request: RiskObservabilityRequest): readonly RiskObservabilityReasonCode[] {
  const reasons: RiskObservabilityReasonCode[] = [];

  if (!request.visibility_permissions.includes(REQUIRED_VISIBILITY_PERMISSION)) {
    addReason(reasons, "VISIBILITY_PERMISSION_MISSING");
  }
  if (request.escalation_output.tenant_id !== request.tenant_id) addReason(reasons, "TENANT_MISMATCH");
  if (request.containment_output.tenant_id !== request.tenant_id) addReason(reasons, "TENANT_MISMATCH");
  if (request.replay_result.tenant_id !== request.tenant_id) addReason(reasons, "TENANT_MISMATCH");
  if (request.escalation_output.recommendation_id !== request.recommendation_id) addReason(reasons, "RECOMMENDATION_MISMATCH");
  if (request.containment_output.recommendation_id !== request.recommendation_id) addReason(reasons, "RECOMMENDATION_MISMATCH");
  if (request.replay_result.recommendation_id !== request.recommendation_id) addReason(reasons, "RECOMMENDATION_MISMATCH");
  if (request.confidence_output.recommendationId !== request.recommendation_id) addReason(reasons, "RECOMMENDATION_MISMATCH");

  return normalizeStrings(reasons) as readonly RiskObservabilityReasonCode[];
}

export function correlateRiskOutputs(request: RiskObservabilityRequest): readonly ObservabilityCorrelationRecord[] {
  const pairs = [
    {
      from: "CAUTION" as const,
      to: "ESCALATION" as const,
      from_hash: request.confidence_output.canonicalBridgeHash,
      to_hash: request.escalation_output.evaluation_hash,
      valid: request.confidence_output.recommendationId === request.escalation_output.recommendation_id,
    },
    {
      from: "ESCALATION" as const,
      to: "CONTAINMENT" as const,
      from_hash: request.escalation_output.evaluation_hash,
      to_hash: request.containment_output.evaluation_hash,
      valid: request.escalation_output.recommendation_id === request.containment_output.recommendation_id
        && request.escalation_output.tenant_id === request.containment_output.tenant_id,
    },
    {
      from: "CONTAINMENT" as const,
      to: "REPLAY" as const,
      from_hash: request.containment_output.evaluation_hash,
      to_hash: request.replay_result.replay_hash,
      valid: request.replay_result.reconstructed_outputs.containment?.evaluation_hash === request.containment_output.evaluation_hash,
    },
    {
      from: "REPLAY" as const,
      to: "LINEAGE" as const,
      from_hash: request.replay_result.replay_hash,
      to_hash: request.replay_result.lineage_chain.chain_hash,
      valid: request.replay_result.chronology_validation.valid,
    },
  ];

  return Object.freeze(pairs.map((pair) => {
    const reasons: RiskObservabilityReasonCode[] = [];
    if (!pair.valid) addReason(reasons, "CORRELATION_BROKEN");

    return Object.freeze({
      correlation_id: hashConfidenceValue("risk-observability-correlation", canonicalizeConfidenceToString(pair)),
      ...pair,
      reason_codes: normalizeStrings(reasons) as readonly RiskObservabilityReasonCode[],
    });
  }));
}

export function validateObservabilityHashes(request: RiskObservabilityRequest): RiskObservabilityView["hash_validation_status"] {
  return Object.freeze({
    input_hashes_valid: request.replay_result.input_hash_validation.valid,
    output_hashes_valid: request.replay_result.output_hash_validation.valid
      && request.replay_result.reconstructed_outputs.caution?.canonicalBridgeHash === request.confidence_output.canonicalBridgeHash
      && request.replay_result.reconstructed_outputs.escalation?.evaluation_hash === request.escalation_output.evaluation_hash
      && request.replay_result.reconstructed_outputs.containment?.evaluation_hash === request.containment_output.evaluation_hash,
  });
}

export function generateObservabilityReasons(request: RiskObservabilityRequest): readonly RiskObservabilityReasonCode[] {
  const reasons: RiskObservabilityReasonCode[] = [...validateTenantVisibility(request)];
  const correlations = correlateRiskOutputs(request);
  const hashes = validateObservabilityHashes(request);

  if (!hashes.input_hashes_valid || !hashes.output_hashes_valid) addReason(reasons, "HASH_MISMATCH");
  if (request.replay_result.replay_status !== "REPLAY_VERIFIED") addReason(reasons, "REPLAY_INVALID");
  if (!request.replay_result.chronology_validation.valid || request.replay_result.lineage_chain.records.length < 3) {
    addReason(reasons, "LINEAGE_INCOMPLETE");
  }
  if (request.replay_result.policy_versions.length === 0) addReason(reasons, "POLICY_MISSING");
  if (correlations.some((correlation) => !correlation.valid)) addReason(reasons, "CORRELATION_BROKEN");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");

  return normalizeStrings(reasons) as readonly RiskObservabilityReasonCode[];
}

function resolveStatus(reasons: readonly RiskObservabilityReasonCode[]): RiskObservabilityStatus {
  if (
    reasons.includes("TENANT_MISMATCH")
    || reasons.includes("VISIBILITY_PERMISSION_MISSING")
    || reasons.includes("POLICY_MISSING")
    || reasons.includes("CORRELATION_BROKEN")
  ) {
    return "FREEZE_OBSERVABILITY_RESULT";
  }
  if (
    reasons.includes("LINEAGE_INCOMPLETE")
    || reasons.includes("HASH_MISMATCH")
    || reasons.includes("REPLAY_INVALID")
  ) {
    return "LIMIT_VISIBILITY";
  }

  return "VISIBLE";
}

export function aggregateRiskTelemetry(request: RiskObservabilityRequest): RiskObservabilityView["risk_state"] {
  return Object.freeze({
    risk_score: request.escalation_output.risk_score,
    confidence_score: request.escalation_output.confidence_score,
    uncertainty_score: request.escalation_output.uncertainty_score,
    escalation_pressure: request.escalation_output.escalation_pressure,
    pressure_progression: Object.freeze([
      request.escalation_output.pressure_factors.confidence_pressure,
      request.escalation_output.pressure_factors.uncertainty_pressure,
      request.escalation_output.governance_pressure,
      request.containment_output.containment_pressure,
    ]),
  });
}

export function buildObservabilityProjection(request: RiskObservabilityRequest): RiskObservabilityView {
  const reasons = generateObservabilityReasons(request);
  const correlations = correlateRiskOutputs(request);
  const hashValidation = validateObservabilityHashes(request);
  const policyVersions = normalizeStrings([
    ...request.escalation_output.policy_references,
    ...request.containment_output.policy_references,
    ...request.replay_result.policy_versions,
  ]);
  const weightVersions = normalizeStrings([
    request.escalation_output.pressure_weights.version,
    request.containment_output.lineage.weight_version,
    ...request.replay_result.weight_versions,
  ]);

  return Object.freeze({
    recommendation_id: request.recommendation_id,
    tenant_id: request.tenant_id,
    confidence_state: Object.freeze({
      governance_pressure: request.confidence_output.governancePressure,
      required_action: request.confidence_output.requiredAction,
      replay_safe: request.confidence_output.replaySafe,
      fail_closed: request.confidence_output.failClosed,
    }),
    risk_state: aggregateRiskTelemetry(request),
    escalation_state: Object.freeze({
      recommended_escalation: request.escalation_output.recommended_escalation,
      governance_pressure: request.escalation_output.governance_pressure,
      reason_codes: request.escalation_output.reason_codes,
    }),
    containment_state: Object.freeze({
      containment_level: request.containment_output.containment_level,
      scope_limit: request.containment_output.scope_limit,
      branch_limit: request.containment_output.branch_limit,
      optimization_limit: request.containment_output.optimization_limit,
      alternative_limit: request.containment_output.alternative_limit,
    }),
    lineage_state: Object.freeze({
      complete: request.replay_result.lineage_chain.records.length === 3 && request.replay_result.chronology_validation.valid,
      backward_trace: request.replay_result.lineage_chain.backward_trace,
      forward_trace: request.replay_result.lineage_chain.forward_trace,
      chain_hash: request.replay_result.lineage_chain.chain_hash,
    }),
    replay_state: Object.freeze({
      replay_status: request.replay_result.replay_status,
      replay_hash: request.replay_result.replay_hash,
      chronology_valid: request.replay_result.chronology_validation.valid,
      replay_mode: "READ_ONLY" as const,
    }),
    policy_state: Object.freeze({
      policy_versions: policyVersions,
      weight_versions: weightVersions,
      aligned: policyVersions.length > 0 && weightVersions.length > 0,
    }),
    integrity_status: resolveStatus(reasons),
    reason_codes: reasons,
    correlation_chain: correlations,
    hash_validation_status: hashValidation,
    timestamps: normalizeStrings([
      request.requested_at,
      request.escalation_output.timestamp,
      request.containment_output.timestamp,
      request.replay_result.replay_timestamp,
    ]),
    version: request.version,
  });
}

export function certifyObservabilityView(input: {
  view: RiskObservabilityView;
  observabilityHash: string;
}): ObservabilityCertification {
  const tenantIsolated = !input.view.reason_codes.includes("TENANT_MISMATCH");
  const certified = input.view.integrity_status === "VISIBLE";

  return Object.freeze({
    certified,
    deterministic: true,
    read_only: true as const,
    tenant_isolated: tenantIsolated,
    authority_bounded: true as const,
    visibility_only: true as const,
    certification_hash: hashConfidenceValue("risk-observability-certification", canonicalizeConfidenceToString({
      status: input.view.integrity_status,
      tenantIsolated,
      observabilityHash: input.observabilityHash,
    })),
  });
}

export function buildRiskObservabilityRecord(request: RiskObservabilityRequest): RiskObservabilityRecord {
  const view = buildObservabilityProjection(request);
  const observabilityHash = hashConfidenceValue("risk-observability-record", canonicalizeConfidenceToString(view));
  const certification = certifyObservabilityView({
    view,
    observabilityHash,
  });

  return Object.freeze({
    view,
    certification,
    observability_hash: observabilityHash,
    generated_at: request.requested_at,
    read_only: true as const,
    advisory_only: true as const,
    authority_changed: false as const,
    mutation_performed: false as const,
    execution_permitted: false as const,
    may_execute: false as const,
    may_schedule: false as const,
    may_mutate_state: false as const,
    may_approve: false as const,
    may_change_authority: false as const,
    may_route_workflow: false as const,
  });
}

export const RiskTelemetryAggregator = Object.freeze({
  aggregate: aggregateRiskTelemetry,
});

export const RiskCorrelationService = Object.freeze({
  correlate: correlateRiskOutputs,
});

export const ObservabilityProjectionBuilder = Object.freeze({
  build: buildObservabilityProjection,
});

export const ObservabilityViewModel = Object.freeze({
  build: buildRiskObservabilityRecord,
});

export const ObservabilityBoundaryValidator = Object.freeze({
  validate: validateTenantVisibility,
});

export const ObservabilityCertificationService = Object.freeze({
  certify: certifyObservabilityView,
});

export const ObservabilityHashValidator = Object.freeze({
  validate: validateObservabilityHashes,
});

export const TenantVisibilityValidator = Object.freeze({
  validate: validateTenantVisibility,
});

export const ObservabilityReasonGenerator = Object.freeze({
  generate: generateObservabilityReasons,
});

export const RiskObservabilityEngine = Object.freeze({
  build: buildRiskObservabilityRecord,
});
