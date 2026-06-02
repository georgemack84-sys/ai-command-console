import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type { RiskObservabilityRecord, RiskObservabilityReasonCode } from "./riskObservabilityLayer";

export type OperatorRiskPriority = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type OperatorVisibilityStatus =
  | "VISIBLE"
  | "LIMIT_VISIBILITY"
  | "FREEZE_OPERATOR_VIEW";

export type OperatorVisibilityReasonCode =
  | "TENANT_MISMATCH"
  | "RECOMMENDATION_MISMATCH"
  | "VISIBILITY_PERMISSION_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_INVALID"
  | "POLICY_UNAVAILABLE"
  | "HASH_MISMATCH"
  | "VISIBILITY_BOUNDARY_VIOLATION"
  | "OBSERVABILITY_FROZEN"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "READ_ONLY_VISIBILITY";

export type OperatorRiskVisibilityRequest = Readonly<{
  tenant_id: string;
  recommendation_id: string;
  observability_record: RiskObservabilityRecord;
  operator_permissions: readonly string[];
  requested_at: string;
  version: string;
}>;

export type OperatorReasonChainEntry = Readonly<{
  code: OperatorVisibilityReasonCode;
  source: string;
  explanation: string;
}>;

export type OperatorRiskTimelineEvent = Readonly<{
  phase: "CAUTION" | "RISK_ESCALATION" | "SCOPE_TIGHTENING" | "REPLAY" | "OBSERVABILITY";
  timestamp: string;
  lineage_id: string | null;
  source_hash: string;
  summary: string;
  reason_codes: readonly string[];
}>;

export type OperatorRiskTimeline = Readonly<{
  events: readonly OperatorRiskTimelineEvent[];
  timeline_hash: string;
}>;

export type OperatorRiskSummary = Readonly<{
  risk_level_summary: string;
  confidence_summary: string;
  escalation_summary: string;
  containment_summary: string;
  replay_summary: string;
  lineage_summary: string;
  policy_alignment_summary: string;
  risk_priority: OperatorRiskPriority;
  reason_chain: readonly OperatorReasonChainEntry[];
}>;

export type OperatorVisibilityProjection = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  risk_level_summary: string;
  confidence_summary: string;
  escalation_summary: string;
  containment_summary: string;
  replay_summary: string;
  lineage_summary: string;
  policy_alignment_summary: string;
  risk_priority: OperatorRiskPriority;
  reason_chain: readonly OperatorReasonChainEntry[];
  timeline_summary: OperatorRiskTimeline;
  integrity_status: string;
  visibility_status: OperatorVisibilityStatus;
  timestamps: readonly string[];
  version: string;
}>;

export type OperatorRiskCertification = Readonly<{
  certified: boolean;
  deterministic: true;
  read_only: true;
  advisory_only: true;
  tenant_isolated: boolean;
  authority_bounded: true;
  visibility_only: true;
  certification_hash: string;
}>;

export type OperatorRiskVisibilityRecord = Readonly<{
  projection: OperatorVisibilityProjection;
  summary: OperatorRiskSummary;
  certification: OperatorRiskCertification;
  visibility_hash: string;
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
  may_remediate: false;
}>;

const REQUIRED_OPERATOR_PERMISSION = "operator-risk:read";

const PHASE_ORDER: Record<OperatorRiskTimelineEvent["phase"], number> = Object.freeze({
  CAUTION: 0,
  RISK_ESCALATION: 1,
  SCOPE_TIGHTENING: 2,
  REPLAY: 3,
  OBSERVABILITY: 4,
});

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: OperatorVisibilityReasonCode[], reason: OperatorVisibilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function mapObservabilityReason(reason: RiskObservabilityReasonCode): OperatorVisibilityReasonCode | null {
  switch (reason) {
    case "TENANT_MISMATCH":
      return "TENANT_MISMATCH";
    case "RECOMMENDATION_MISMATCH":
      return "RECOMMENDATION_MISMATCH";
    case "VISIBILITY_PERMISSION_MISSING":
      return "VISIBILITY_PERMISSION_MISSING";
    case "LINEAGE_INCOMPLETE":
      return "LINEAGE_INCOMPLETE";
    case "HASH_MISMATCH":
      return "HASH_MISMATCH";
    case "POLICY_MISSING":
      return "POLICY_UNAVAILABLE";
    case "CORRELATION_BROKEN":
      return "VISIBILITY_BOUNDARY_VIOLATION";
    case "REPLAY_INVALID":
      return "REPLAY_INVALID";
    case "AUTHORITY_BOUNDARY_PRESERVED":
      return "AUTHORITY_BOUNDARY_PRESERVED";
  }
}

function visibilityReasons(request: OperatorRiskVisibilityRequest): readonly OperatorVisibilityReasonCode[] {
  const reasons: OperatorVisibilityReasonCode[] = [];
  const view = request.observability_record.view;

  if (!request.operator_permissions.includes(REQUIRED_OPERATOR_PERMISSION)) {
    addReason(reasons, "VISIBILITY_PERMISSION_MISSING");
  }
  if (request.tenant_id !== view.tenant_id) addReason(reasons, "TENANT_MISMATCH");
  if (request.recommendation_id !== view.recommendation_id) addReason(reasons, "RECOMMENDATION_MISMATCH");
  if (view.integrity_status === "FREEZE_OBSERVABILITY_RESULT") addReason(reasons, "OBSERVABILITY_FROZEN");
  if (!view.lineage_state.complete) addReason(reasons, "LINEAGE_INCOMPLETE");
  if (view.replay_state.replay_status !== "REPLAY_VERIFIED" || !view.replay_state.chronology_valid) {
    addReason(reasons, "REPLAY_INVALID");
  }
  if (!view.policy_state.aligned || view.policy_state.policy_versions.length === 0) {
    addReason(reasons, "POLICY_UNAVAILABLE");
  }
  if (!view.hash_validation_status.input_hashes_valid || !view.hash_validation_status.output_hashes_valid) {
    addReason(reasons, "HASH_MISMATCH");
  }
  for (const reason of view.reason_codes) {
    const mapped = mapObservabilityReason(reason);
    if (mapped) addReason(reasons, mapped);
  }
  addReason(reasons, "READ_ONLY_VISIBILITY");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");

  return normalizeStrings(reasons) as readonly OperatorVisibilityReasonCode[];
}

function resolveVisibilityStatus(reasons: readonly OperatorVisibilityReasonCode[]): OperatorVisibilityStatus {
  if (
    reasons.includes("TENANT_MISMATCH")
    || reasons.includes("RECOMMENDATION_MISMATCH")
    || reasons.includes("VISIBILITY_PERMISSION_MISSING")
    || reasons.includes("POLICY_UNAVAILABLE")
    || reasons.includes("VISIBILITY_BOUNDARY_VIOLATION")
    || reasons.includes("OBSERVABILITY_FROZEN")
  ) {
    return "FREEZE_OPERATOR_VIEW";
  }
  if (
    reasons.includes("LINEAGE_INCOMPLETE")
    || reasons.includes("REPLAY_INVALID")
    || reasons.includes("HASH_MISMATCH")
  ) {
    return "LIMIT_VISIBILITY";
  }

  return "VISIBLE";
}

export function projectOperatorPriority(input: {
  observabilityRecord: RiskObservabilityRecord;
  visibilityStatus: OperatorVisibilityStatus;
}): OperatorRiskPriority {
  const view = input.observabilityRecord.view;
  if (
    input.visibilityStatus === "FREEZE_OPERATOR_VIEW"
    || view.containment_state.containment_level === "FREEZE_RECOMMENDATIONS"
    || view.escalation_state.recommended_escalation === "FREEZE_REQUIRED"
    || view.replay_state.replay_status !== "REPLAY_VERIFIED"
  ) {
    return "CRITICAL";
  }
  if (
    input.visibilityStatus === "LIMIT_VISIBILITY"
    || view.containment_state.containment_level === "STRICT_SCOPE"
    || view.containment_state.containment_level === "MINIMAL_SCOPE"
    || view.escalation_state.recommended_escalation === "CONSTITUTIONAL_REVIEW"
    || view.risk_state.escalation_pressure >= 0.7
  ) {
    return "HIGH";
  }
  if (
    view.containment_state.containment_level === "LIMIT_SCOPE"
    || view.escalation_state.recommended_escalation === "REVIEW"
    || view.escalation_state.recommended_escalation === "GOVERNANCE_REVIEW"
    || view.risk_state.risk_score >= 0.35
    || view.risk_state.uncertainty_score >= 0.35
  ) {
    return "MODERATE";
  }

  return "LOW";
}

export function explainRisk(record: RiskObservabilityRecord): string {
  const risk = record.view.risk_state;
  return `Risk score ${risk.risk_score.toFixed(4)}, confidence ${risk.confidence_score.toFixed(4)}, uncertainty ${risk.uncertainty_score.toFixed(4)}, escalation pressure ${risk.escalation_pressure.toFixed(4)}.`;
}

export function explainEscalation(record: RiskObservabilityRecord): string {
  const escalation = record.view.escalation_state;
  const reasons = escalation.reason_codes.length > 0 ? escalation.reason_codes.join(", ") : "none";
  return `Escalation recommendation ${escalation.recommended_escalation} from governance pressure ${escalation.governance_pressure.toFixed(4)} with reason codes ${reasons}.`;
}

export function explainContainment(record: RiskObservabilityRecord): string {
  const containment = record.view.containment_state;
  return `Containment ${containment.containment_level} limits scope ${containment.scope_limit}, branches ${containment.branch_limit}, optimizations ${containment.optimization_limit}, alternatives ${containment.alternative_limit}.`;
}

export function summarizeReplay(record: RiskObservabilityRecord): string {
  const replay = record.view.replay_state;
  return `Replay status ${replay.replay_status}; chronology valid ${String(replay.chronology_valid)}; replay hash ${replay.replay_hash}.`;
}

export function summarizeLineage(record: RiskObservabilityRecord): string {
  const lineage = record.view.lineage_state;
  return `Lineage complete ${String(lineage.complete)} with ${lineage.backward_trace.length} backward refs, ${lineage.forward_trace.length} forward refs, chain hash ${lineage.chain_hash}.`;
}

export function buildOperatorReasonChain(
  reasons: readonly OperatorVisibilityReasonCode[],
): readonly OperatorReasonChainEntry[] {
  return Object.freeze(reasons.map((code) => Object.freeze({
    code,
    source: sourceForReason(code),
    explanation: explanationForReason(code),
  })));
}

function sourceForReason(code: OperatorVisibilityReasonCode): string {
  switch (code) {
    case "TENANT_MISMATCH":
    case "RECOMMENDATION_MISMATCH":
    case "VISIBILITY_PERMISSION_MISSING":
      return "operator-risk-visibility-request";
    case "LINEAGE_INCOMPLETE":
      return "confidence-lineage";
    case "REPLAY_INVALID":
      return "confidence-replay";
    case "POLICY_UNAVAILABLE":
      return "policy-alignment";
    case "HASH_MISMATCH":
      return "hash-validation";
    case "VISIBILITY_BOUNDARY_VIOLATION":
    case "OBSERVABILITY_FROZEN":
      return "risk-observability";
    case "AUTHORITY_BOUNDARY_PRESERVED":
    case "READ_ONLY_VISIBILITY":
      return "operator-risk-visibility";
  }
}

function explanationForReason(code: OperatorVisibilityReasonCode): string {
  switch (code) {
    case "TENANT_MISMATCH":
      return "Requested tenant does not match the tenant-scoped observability record.";
    case "RECOMMENDATION_MISMATCH":
      return "Requested recommendation does not match the observability record.";
    case "VISIBILITY_PERMISSION_MISSING":
      return "Operator read permission is missing, so the view fails closed.";
    case "LINEAGE_INCOMPLETE":
      return "Lineage is incomplete, so summaries cannot infer missing ancestry.";
    case "REPLAY_INVALID":
      return "Replay is not verified, so operator visibility is constrained.";
    case "POLICY_UNAVAILABLE":
      return "Policy references are unavailable or unaligned.";
    case "HASH_MISMATCH":
      return "Input or output hash validation failed.";
    case "VISIBILITY_BOUNDARY_VIOLATION":
      return "Source observability correlations did not preserve the visibility boundary.";
    case "OBSERVABILITY_FROZEN":
      return "Source observability result is frozen and cannot be expanded into a full operator view.";
    case "AUTHORITY_BOUNDARY_PRESERVED":
      return "The layer preserved advisory-only authority boundaries.";
    case "READ_ONLY_VISIBILITY":
      return "Operator output is read-only visibility and cannot execute or mutate state.";
  }
}

export function buildOperatorRiskSummary(input: {
  record: RiskObservabilityRecord;
  priority: OperatorRiskPriority;
  reasonChain: readonly OperatorReasonChainEntry[];
}): OperatorRiskSummary {
  const view = input.record.view;
  const policyVersions = view.policy_state.policy_versions.length > 0
    ? view.policy_state.policy_versions.join(", ")
    : "none";
  const confidence = view.confidence_state;

  return Object.freeze({
    risk_level_summary: explainRisk(input.record),
    confidence_summary: `Confidence governance pressure ${confidence.governance_pressure}; required action ${confidence.required_action}; replay safe ${String(confidence.replay_safe)}; fail closed ${String(confidence.fail_closed)}.`,
    escalation_summary: explainEscalation(input.record),
    containment_summary: explainContainment(input.record),
    replay_summary: summarizeReplay(input.record),
    lineage_summary: summarizeLineage(input.record),
    policy_alignment_summary: `Policy alignment ${String(view.policy_state.aligned)} with policy versions ${policyVersions}.`,
    risk_priority: input.priority,
    reason_chain: input.reasonChain,
  });
}

export function buildOperatorRiskTimeline(record: RiskObservabilityRecord): OperatorRiskTimeline {
  const lineageRecords = record.view.lineage_state.backward_trace;
  const events: OperatorRiskTimelineEvent[] = [
    {
      phase: "CAUTION",
      timestamp: record.view.timestamps[0] ?? record.generated_at,
      lineage_id: lineageRecords[0] ?? null,
      source_hash: record.view.correlation_chain[0]?.from_hash ?? "",
      summary: `Caution state required action ${record.view.confidence_state.required_action}.`,
      reason_codes: record.view.reason_codes,
    },
    {
      phase: "RISK_ESCALATION",
      timestamp: record.view.timestamps[1] ?? record.generated_at,
      lineage_id: lineageRecords[1] ?? null,
      source_hash: record.view.correlation_chain[0]?.to_hash ?? "",
      summary: explainEscalation(record),
      reason_codes: record.view.escalation_state.reason_codes,
    },
    {
      phase: "SCOPE_TIGHTENING",
      timestamp: record.view.timestamps[2] ?? record.generated_at,
      lineage_id: lineageRecords[2] ?? null,
      source_hash: record.view.correlation_chain[1]?.to_hash ?? "",
      summary: explainContainment(record),
      reason_codes: record.view.reason_codes,
    },
    {
      phase: "REPLAY",
      timestamp: record.view.timestamps[3] ?? record.generated_at,
      lineage_id: null,
      source_hash: record.view.replay_state.replay_hash,
      summary: summarizeReplay(record),
      reason_codes: record.view.reason_codes,
    },
    {
      phase: "OBSERVABILITY",
      timestamp: record.generated_at,
      lineage_id: null,
      source_hash: record.observability_hash,
      summary: `Observability integrity ${record.view.integrity_status}.`,
      reason_codes: record.view.reason_codes,
    },
  ];
  const sortedEvents = Object.freeze(events
    .sort((left, right) => PHASE_ORDER[left.phase] - PHASE_ORDER[right.phase])
    .map((event) => Object.freeze({
      ...event,
      reason_codes: normalizeStrings(event.reason_codes),
    })));

  return Object.freeze({
    events: sortedEvents,
    timeline_hash: hashConfidenceValue("operator-risk-timeline", canonicalizeConfidenceToString(sortedEvents)),
  });
}

export function validateOperatorVisibility(request: OperatorRiskVisibilityRequest): readonly OperatorVisibilityReasonCode[] {
  return visibilityReasons(request);
}

export function buildOperatorVisibilityProjection(request: OperatorRiskVisibilityRequest): OperatorVisibilityProjection {
  const reasons = validateOperatorVisibility(request);
  const visibilityStatus = resolveVisibilityStatus(reasons);
  const priority = projectOperatorPriority({
    observabilityRecord: request.observability_record,
    visibilityStatus,
  });
  const reasonChain = buildOperatorReasonChain(reasons);
  const summary = buildOperatorRiskSummary({
    record: request.observability_record,
    priority,
    reasonChain,
  });

  return Object.freeze({
    recommendation_id: request.recommendation_id,
    tenant_id: request.tenant_id,
    risk_level_summary: summary.risk_level_summary,
    confidence_summary: summary.confidence_summary,
    escalation_summary: summary.escalation_summary,
    containment_summary: summary.containment_summary,
    replay_summary: summary.replay_summary,
    lineage_summary: summary.lineage_summary,
    policy_alignment_summary: summary.policy_alignment_summary,
    risk_priority: priority,
    reason_chain: reasonChain,
    timeline_summary: buildOperatorRiskTimeline(request.observability_record),
    integrity_status: request.observability_record.view.integrity_status,
    visibility_status: visibilityStatus,
    timestamps: normalizeStrings([
      request.requested_at,
      request.observability_record.generated_at,
      ...request.observability_record.view.timestamps,
    ]),
    version: request.version,
  });
}

export function certifyOperatorRiskVisibility(input: {
  projection: OperatorVisibilityProjection;
  visibilityHash: string;
}): OperatorRiskCertification {
  const tenantIsolated = !input.projection.reason_chain.some((entry) => entry.code === "TENANT_MISMATCH");
  const certified = input.projection.visibility_status === "VISIBLE";

  return Object.freeze({
    certified,
    deterministic: true as const,
    read_only: true as const,
    advisory_only: true as const,
    tenant_isolated: tenantIsolated,
    authority_bounded: true as const,
    visibility_only: true as const,
    certification_hash: hashConfidenceValue("operator-risk-certification", canonicalizeConfidenceToString({
      certified,
      tenantIsolated,
      visibilityHash: input.visibilityHash,
      visibilityStatus: input.projection.visibility_status,
    })),
  });
}

export function buildOperatorRiskVisibilityRecord(
  request: OperatorRiskVisibilityRequest,
): OperatorRiskVisibilityRecord {
  const projection = buildOperatorVisibilityProjection(request);
  const visibilityHash = hashConfidenceValue("operator-risk-visibility-record", canonicalizeConfidenceToString(projection));
  const summary = Object.freeze({
    risk_level_summary: projection.risk_level_summary,
    confidence_summary: projection.confidence_summary,
    escalation_summary: projection.escalation_summary,
    containment_summary: projection.containment_summary,
    replay_summary: projection.replay_summary,
    lineage_summary: projection.lineage_summary,
    policy_alignment_summary: projection.policy_alignment_summary,
    risk_priority: projection.risk_priority,
    reason_chain: projection.reason_chain,
  } satisfies OperatorRiskSummary);
  const certification = certifyOperatorRiskVisibility({
    projection,
    visibilityHash,
  });

  return Object.freeze({
    projection,
    summary,
    certification,
    visibility_hash: visibilityHash,
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
    may_remediate: false as const,
  });
}

export const OperatorRiskSummaryBuilder = Object.freeze({
  build: buildOperatorRiskSummary,
});

export const RiskExplanationService = Object.freeze({
  explain: explainRisk,
});

export const ContainmentExplanationService = Object.freeze({
  explain: explainContainment,
});

export const EscalationExplanationService = Object.freeze({
  explain: explainEscalation,
});

export const ReplaySummaryService = Object.freeze({
  summarize: summarizeReplay,
});

export const LineageSummaryService = Object.freeze({
  summarize: summarizeLineage,
});

export const OperatorPriorityProjectionService = Object.freeze({
  project: projectOperatorPriority,
});

export const OperatorVisibilityValidator = Object.freeze({
  validate: validateOperatorVisibility,
});

export const OperatorRiskCertificationService = Object.freeze({
  certify: certifyOperatorRiskVisibility,
});

export const OperatorRiskVisibilityEngine = Object.freeze({
  build: buildOperatorRiskVisibilityRecord,
});
