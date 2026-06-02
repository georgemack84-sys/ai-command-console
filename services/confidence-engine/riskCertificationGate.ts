import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type { ConfidenceLineageRecord, ConfidenceReplayResult } from "./confidenceLineageReplayFramework";
import type { FailClosedUncertaintyRecord } from "./failClosedUncertaintyFramework";
import type { GovernanceAwareCautionBridgeResult } from "./governanceAwareCautionBridge";
import type { OperatorRiskVisibilityRecord } from "./operatorRiskVisibilityLayer";
import type { RiskObservabilityRecord } from "./riskObservabilityLayer";
import type { EscalationRecommendation } from "./riskEscalationLayer";
import type { ContainmentRecommendation } from "./scopeTighteningFramework";

export type RiskCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type RiskCertificationPhase =
  | "GOVERNANCE_AWARE_CAUTION"
  | "RISK_ESCALATION"
  | "SCOPE_TIGHTENING"
  | "CONFIDENCE_LINEAGE_REPLAY"
  | "RISK_OBSERVABILITY"
  | "OPERATOR_RISK_VISIBILITY"
  | "FAIL_CLOSED_UNCERTAINTY";

export type RiskCertificationReasonCode =
  | "PHASE_EVIDENCE_VALID"
  | "PHASE_EVIDENCE_MISSING"
  | "CROSS_PHASE_LINK_VALID"
  | "CROSS_PHASE_LINK_BROKEN"
  | "TENANT_VALID"
  | "TENANT_MISMATCH"
  | "LINEAGE_COMPLETE"
  | "LINEAGE_GAP"
  | "REPLAY_REPRODUCIBLE"
  | "REPLAY_MISMATCH"
  | "HASH_VALID"
  | "HASH_MISMATCH"
  | "AUTHORITY_CONTAINED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "GOVERNANCE_PRESERVED"
  | "GOVERNANCE_BOUNDARY_BROKEN"
  | "UNCERTAINTY_FAIL_CLOSED"
  | "UNCERTAINTY_ESCALATED_CONDITION"
  | "CERTIFICATION_REPLAY_READ_ONLY";

export type CrossPhaseValidationResult = Readonly<{
  from: RiskCertificationPhase;
  to: RiskCertificationPhase;
  valid: boolean;
  expected_hash?: string;
  actual_hash?: string;
  reason_codes: readonly RiskCertificationReasonCode[];
  validation_hash: string;
}>;

export type CertificationSummary = Readonly<{
  phase_count: number;
  failure_count: number;
  conditional_count: number;
  authority_bounded: boolean;
  tenant_isolated: boolean;
  replayable: boolean;
  fail_closed: boolean;
  summary_hash: string;
}>;

export type CertificationLineageRecord = Readonly<{
  lineage_id: string;
  tenant_id: string;
  validated_phases: readonly RiskCertificationPhase[];
  phase_hashes: readonly string[];
  cross_phase_hashes: readonly string[];
  reason_codes: readonly RiskCertificationReasonCode[];
  timestamps: readonly string[];
  lineage_hash: string;
}>;

export type RiskCertificationResult = Readonly<{
  certification_id: string;
  tenant_id: string;
  certification_state: RiskCertificationState;
  validated_phases: readonly RiskCertificationPhase[];
  validation_results: readonly CrossPhaseValidationResult[];
  failed_requirements: readonly string[];
  reason_codes: readonly RiskCertificationReasonCode[];
  authority_validation: boolean;
  governance_validation: boolean;
  lineage_validation: boolean;
  replay_validation: boolean;
  hash_validation: boolean;
  tenant_validation: boolean;
  timestamp: string;
  version: string;
}>;

export type RiskCertificationRequest = Readonly<{
  tenant_id: string;
  recommendation_id: string;
  caution_output: GovernanceAwareCautionBridgeResult;
  escalation_output: EscalationRecommendation;
  containment_output: ContainmentRecommendation;
  lineage_records: readonly ConfidenceLineageRecord[];
  replay_result: ConfidenceReplayResult;
  observability_record: RiskObservabilityRecord;
  operator_visibility_record: OperatorRiskVisibilityRecord;
  uncertainty_record: FailClosedUncertaintyRecord;
  timestamp: string;
  version: string;
}>;

export type RiskCertificationRecord = Readonly<{
  result: RiskCertificationResult;
  lineage: CertificationLineageRecord;
  summary: CertificationSummary;
  certification_hash: string;
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

const PHASES: readonly RiskCertificationPhase[] = Object.freeze([
  "GOVERNANCE_AWARE_CAUTION",
  "RISK_ESCALATION",
  "SCOPE_TIGHTENING",
  "CONFIDENCE_LINEAGE_REPLAY",
  "RISK_OBSERVABILITY",
  "OPERATOR_RISK_VISIBILITY",
  "FAIL_CLOSED_UNCERTAINTY",
]);

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: RiskCertificationReasonCode[], reason: RiskCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function phaseHash(request: RiskCertificationRequest, phase: RiskCertificationPhase): string {
  switch (phase) {
    case "GOVERNANCE_AWARE_CAUTION":
      return request.caution_output.canonicalBridgeHash;
    case "RISK_ESCALATION":
      return request.escalation_output.evaluation_hash;
    case "SCOPE_TIGHTENING":
      return request.containment_output.evaluation_hash;
    case "CONFIDENCE_LINEAGE_REPLAY":
      return request.replay_result.replay_hash;
    case "RISK_OBSERVABILITY":
      return request.observability_record.observability_hash;
    case "OPERATOR_RISK_VISIBILITY":
      return request.operator_visibility_record.visibility_hash;
    case "FAIL_CLOSED_UNCERTAINTY":
      return request.uncertainty_record.record_hash;
  }
}

function buildValidation(input: {
  from: RiskCertificationPhase;
  to: RiskCertificationPhase;
  valid: boolean;
  expectedHash?: string;
  actualHash?: string;
  reasons?: readonly RiskCertificationReasonCode[];
}): CrossPhaseValidationResult {
  const reasons: RiskCertificationReasonCode[] = [...input.reasons ?? []];
  addReason(reasons, input.valid ? "CROSS_PHASE_LINK_VALID" : "CROSS_PHASE_LINK_BROKEN");
  const core = Object.freeze({
    from: input.from,
    to: input.to,
    valid: input.valid,
    expected_hash: input.expectedHash,
    actual_hash: input.actualHash,
    reason_codes: normalizeStrings(reasons) as readonly RiskCertificationReasonCode[],
  });

  return Object.freeze({
    ...core,
    validation_hash: hashConfidenceValue("risk-certification-cross-phase", canonicalizeConfidenceToString(core)),
  });
}

export function validateCrossPhaseIntegrity(request: RiskCertificationRequest): readonly CrossPhaseValidationResult[] {
  return Object.freeze([
    buildValidation({
      from: "GOVERNANCE_AWARE_CAUTION",
      to: "RISK_ESCALATION",
      valid: request.caution_output.recommendationId === request.escalation_output.recommendation_id,
      expectedHash: request.caution_output.canonicalBridgeHash,
      actualHash: request.escalation_output.lineage.replay_references[0],
    }),
    buildValidation({
      from: "RISK_ESCALATION",
      to: "SCOPE_TIGHTENING",
      valid: request.escalation_output.recommendation_id === request.containment_output.recommendation_id
        && request.escalation_output.tenant_id === request.containment_output.tenant_id,
      expectedHash: request.escalation_output.evaluation_hash,
      actualHash: request.containment_output.lineage.replay_references[0],
    }),
    buildValidation({
      from: "SCOPE_TIGHTENING",
      to: "CONFIDENCE_LINEAGE_REPLAY",
      valid: request.replay_result.reconstructed_outputs.containment?.evaluation_hash === request.containment_output.evaluation_hash,
      expectedHash: request.containment_output.evaluation_hash,
      actualHash: request.replay_result.reconstructed_outputs.containment?.evaluation_hash,
    }),
    buildValidation({
      from: "CONFIDENCE_LINEAGE_REPLAY",
      to: "RISK_OBSERVABILITY",
      valid: request.observability_record.view.replay_state.replay_hash === request.replay_result.replay_hash
        && request.observability_record.view.correlation_chain.every((correlation) => correlation.valid),
      expectedHash: request.replay_result.replay_hash,
      actualHash: request.observability_record.view.replay_state.replay_hash,
    }),
    buildValidation({
      from: "RISK_OBSERVABILITY",
      to: "OPERATOR_RISK_VISIBILITY",
      valid: request.operator_visibility_record.projection.recommendation_id === request.observability_record.view.recommendation_id
        && request.operator_visibility_record.projection.tenant_id === request.observability_record.view.tenant_id
        && request.operator_visibility_record.projection.integrity_status === request.observability_record.view.integrity_status,
      expectedHash: request.observability_record.observability_hash,
      actualHash: request.operator_visibility_record.projection.timeline_summary.events.at(-1)?.source_hash,
    }),
    buildValidation({
      from: "OPERATOR_RISK_VISIBILITY",
      to: "FAIL_CLOSED_UNCERTAINTY",
      valid: request.uncertainty_record.lineage.hash_references.includes(request.operator_visibility_record.visibility_hash),
      expectedHash: request.operator_visibility_record.visibility_hash,
      actualHash: request.uncertainty_record.lineage.hash_references.find((hash) => hash === request.operator_visibility_record.visibility_hash),
    }),
  ]);
}

export function validateCertificationHashes(request: RiskCertificationRequest): boolean {
  const observabilityHash = hashConfidenceValue("risk-observability-record", canonicalizeConfidenceToString(request.observability_record.view));
  const operatorHash = hashConfidenceValue("operator-risk-visibility-record", canonicalizeConfidenceToString(request.operator_visibility_record.projection));
  const uncertaintyCore = Object.freeze({
    assessment: request.uncertainty_record.assessment,
    decision: request.uncertainty_record.decision,
    lineage: request.uncertainty_record.lineage,
    replay: request.uncertainty_record.replay,
    certification: request.uncertainty_record.certification,
  });
  const uncertaintyHash = hashConfidenceValue("fail-closed-uncertainty-record", canonicalizeConfidenceToString(uncertaintyCore));

  return observabilityHash === request.observability_record.observability_hash
    && operatorHash === request.operator_visibility_record.visibility_hash
    && uncertaintyHash === request.uncertainty_record.record_hash
    && request.replay_result.output_hash_validation.valid
    && request.replay_result.input_hash_validation.valid;
}

export function validateAuthorityContainment(request: RiskCertificationRequest): boolean {
  return request.caution_output.advisoryOnly
    && !request.caution_output.authorityChanged
    && !request.caution_output.mutationPerformed
    && request.escalation_output.advisory_only
    && !request.escalation_output.execution_permitted
    && !request.escalation_output.authority_changed
    && !request.escalation_output.mutation_performed
    && !request.escalation_output.may_execute
    && !request.escalation_output.may_route_workflow
    && request.containment_output.advisory_only
    && !request.containment_output.execution_permitted
    && !request.containment_output.authority_changed
    && !request.containment_output.mutation_performed
    && !request.containment_output.may_execute
    && !request.containment_output.may_route_workflow
    && request.replay_result.advisory_only
    && !request.replay_result.execution_permitted
    && !request.replay_result.authority_changed
    && !request.replay_result.mutation_performed
    && !request.replay_result.may_execute
    && !request.replay_result.may_route_workflow
    && request.observability_record.advisory_only
    && !request.observability_record.execution_permitted
    && !request.observability_record.authority_changed
    && !request.observability_record.mutation_performed
    && !request.observability_record.may_execute
    && !request.observability_record.may_route_workflow
    && request.operator_visibility_record.advisory_only
    && !request.operator_visibility_record.execution_permitted
    && !request.operator_visibility_record.authority_changed
    && !request.operator_visibility_record.mutation_performed
    && !request.operator_visibility_record.may_execute
    && !request.operator_visibility_record.may_route_workflow
    && request.uncertainty_record.advisory_only
    && !request.uncertainty_record.execution_permitted
    && !request.uncertainty_record.authority_changed
    && !request.uncertainty_record.mutation_performed
    && !request.uncertainty_record.may_execute
    && !request.uncertainty_record.may_route_workflow;
}

function validateTenant(request: RiskCertificationRequest): boolean {
  return request.escalation_output.tenant_id === request.tenant_id
    && request.containment_output.tenant_id === request.tenant_id
    && request.replay_result.tenant_id === request.tenant_id
    && request.observability_record.view.tenant_id === request.tenant_id
    && request.operator_visibility_record.projection.tenant_id === request.tenant_id
    && request.uncertainty_record.decision.tenant_id === request.tenant_id
    && request.lineage_records.every((record) => record.tenant_id === request.tenant_id);
}

function validateLineage(request: RiskCertificationRequest): boolean {
  const phases = normalizeStrings(request.lineage_records.map((record) => record.source_phase));
  return request.lineage_records.length >= 3
    && phases.includes("GOVERNANCE_AWARE_CAUTION")
    && phases.includes("RISK_ESCALATION")
    && phases.includes("SCOPE_TIGHTENING")
    && request.replay_result.lineage_chain.records.length >= 3
    && request.replay_result.lineage_chain.chain_hash.length > 0
    && request.uncertainty_record.lineage.lineage_hash.length > 0;
}

function validateReplay(request: RiskCertificationRequest): boolean {
  return request.replay_result.replay_status === "REPLAY_VERIFIED"
    && request.replay_result.chronology_validation.valid
    && request.uncertainty_record.replay.replay_status === "REPLAY_VERIFIED"
    && request.uncertainty_record.replay.chronology_valid;
}

function validateGovernance(request: RiskCertificationRequest): boolean {
  return request.caution_output.controlledAutonomyTrajectoryPreserved
    && request.escalation_output.certification.governance_authoritative
    && request.containment_output.certification.governance_authoritative
    && request.replay_result.certification.governance_authoritative
    && request.uncertainty_record.certification.fail_closed
    && !request.uncertainty_record.certification.fail_open_possible;
}

function generateReasons(input: {
  crossPhaseValid: boolean;
  tenantValid: boolean;
  lineageValid: boolean;
  replayValid: boolean;
  hashValid: boolean;
  authorityValid: boolean;
  governanceValid: boolean;
  conditional: boolean;
}): readonly RiskCertificationReasonCode[] {
  const reasons: RiskCertificationReasonCode[] = [];

  addReason(reasons, "PHASE_EVIDENCE_VALID");
  addReason(reasons, input.crossPhaseValid ? "CROSS_PHASE_LINK_VALID" : "CROSS_PHASE_LINK_BROKEN");
  addReason(reasons, input.tenantValid ? "TENANT_VALID" : "TENANT_MISMATCH");
  addReason(reasons, input.lineageValid ? "LINEAGE_COMPLETE" : "LINEAGE_GAP");
  addReason(reasons, input.replayValid ? "REPLAY_REPRODUCIBLE" : "REPLAY_MISMATCH");
  addReason(reasons, input.hashValid ? "HASH_VALID" : "HASH_MISMATCH");
  addReason(reasons, input.authorityValid ? "AUTHORITY_CONTAINED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.governanceValid ? "GOVERNANCE_PRESERVED" : "GOVERNANCE_BOUNDARY_BROKEN");
  addReason(reasons, "UNCERTAINTY_FAIL_CLOSED");
  addReason(reasons, "CERTIFICATION_REPLAY_READ_ONLY");
  if (input.conditional) addReason(reasons, "UNCERTAINTY_ESCALATED_CONDITION");

  return normalizeStrings(reasons) as readonly RiskCertificationReasonCode[];
}

function failedRequirements(input: {
  crossPhaseValid: boolean;
  tenantValid: boolean;
  lineageValid: boolean;
  replayValid: boolean;
  hashValid: boolean;
  authorityValid: boolean;
  governanceValid: boolean;
}): readonly string[] {
  const failed: string[] = [];
  if (!input.crossPhaseValid) failed.push("cross_phase_integrity");
  if (!input.tenantValid) failed.push("tenant_isolation");
  if (!input.lineageValid) failed.push("lineage_completeness");
  if (!input.replayValid) failed.push("replay_reproducibility");
  if (!input.hashValid) failed.push("hash_integrity");
  if (!input.authorityValid) failed.push("authority_containment");
  if (!input.governanceValid) failed.push("governance_preservation");
  return normalizeStrings(failed);
}

export function buildRiskCertificationResult(request: RiskCertificationRequest): RiskCertificationResult {
  const validationResults = validateCrossPhaseIntegrity(request);
  const crossPhaseValid = validationResults.every((result) => result.valid);
  const tenantValid = validateTenant(request);
  const lineageValid = validateLineage(request);
  const replayValid = validateReplay(request);
  const hashValid = validateCertificationHashes(request);
  const authorityValid = validateAuthorityContainment(request);
  const governanceValid = validateGovernance(request);
  const failed = failedRequirements({
    crossPhaseValid,
    tenantValid,
    lineageValid,
    replayValid,
    hashValid,
    authorityValid,
    governanceValid,
  });
  const conditional = failed.length === 0
    && (request.uncertainty_record.decision.severity === "HIGH"
      || request.uncertainty_record.decision.severity === "CRITICAL");
  const state: RiskCertificationState = failed.length > 0 ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";
  const reasonCodes = generateReasons({
    crossPhaseValid,
    tenantValid,
    lineageValid,
    replayValid,
    hashValid,
    authorityValid,
    governanceValid,
    conditional,
  });
  const resultCore = Object.freeze({
    tenant_id: request.tenant_id,
    certification_state: state,
    validated_phases: PHASES,
    validation_results: validationResults,
    failed_requirements: failed,
    reason_codes: reasonCodes,
    authority_validation: authorityValid,
    governance_validation: governanceValid,
    lineage_validation: lineageValid,
    replay_validation: replayValid,
    hash_validation: hashValid,
    tenant_validation: tenantValid,
    timestamp: request.timestamp,
    version: request.version,
  });

  return Object.freeze({
    certification_id: hashConfidenceValue("risk-certification-id", canonicalizeConfidenceToString(resultCore)),
    ...resultCore,
  });
}

export function recordCertificationLineage(input: {
  request: RiskCertificationRequest;
  result: RiskCertificationResult;
}): CertificationLineageRecord {
  const phaseHashes = normalizeStrings(PHASES.map((phase) => phaseHash(input.request, phase)));
  const crossPhaseHashes = normalizeStrings(input.result.validation_results.map((result) => result.validation_hash));
  const lineageCore = Object.freeze({
    tenant_id: input.request.tenant_id,
    validated_phases: input.result.validated_phases,
    phase_hashes: phaseHashes,
    cross_phase_hashes: crossPhaseHashes,
    reason_codes: input.result.reason_codes,
    timestamps: normalizeStrings([
      input.request.timestamp,
      input.request.escalation_output.timestamp,
      input.request.containment_output.timestamp,
      input.request.replay_result.replay_timestamp,
      input.request.observability_record.generated_at,
      input.request.operator_visibility_record.generated_at,
      input.request.uncertainty_record.generated_at,
    ]),
  });
  const lineageHash = hashConfidenceValue("risk-certification-lineage", canonicalizeConfidenceToString(lineageCore));

  return Object.freeze({
    lineage_id: hashConfidenceValue("risk-certification-lineage-id", lineageHash),
    ...lineageCore,
    lineage_hash: lineageHash,
  });
}

export function buildCertificationSummary(input: {
  result: RiskCertificationResult;
  lineage: CertificationLineageRecord;
}): CertificationSummary {
  const failureCount = input.result.failed_requirements.length;
  const conditionalCount = input.result.certification_state === "CONDITIONAL_PASS" ? 1 : 0;
  const summaryCore = Object.freeze({
    phase_count: input.result.validated_phases.length,
    failure_count: failureCount,
    conditional_count: conditionalCount,
    authority_bounded: input.result.authority_validation,
    tenant_isolated: input.result.tenant_validation,
    replayable: input.result.replay_validation,
    fail_closed: input.result.reason_codes.includes("UNCERTAINTY_FAIL_CLOSED"),
    lineage_hash: input.lineage.lineage_hash,
  });

  return Object.freeze({
    phase_count: summaryCore.phase_count,
    failure_count: failureCount,
    conditional_count: conditionalCount,
    authority_bounded: summaryCore.authority_bounded,
    tenant_isolated: summaryCore.tenant_isolated,
    replayable: summaryCore.replayable,
    fail_closed: summaryCore.fail_closed,
    summary_hash: hashConfidenceValue("risk-certification-summary", canonicalizeConfidenceToString(summaryCore)),
  });
}

export function buildRiskCertificationRecord(request: RiskCertificationRequest): RiskCertificationRecord {
  const result = buildRiskCertificationResult(request);
  const lineage = recordCertificationLineage({ request, result });
  const summary = buildCertificationSummary({ result, lineage });
  const recordCore = Object.freeze({ result, lineage, summary });

  return Object.freeze({
    result,
    lineage,
    summary,
    certification_hash: hashConfidenceValue("risk-certification-record", canonicalizeConfidenceToString(recordCore)),
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

export const CrossPhaseIntegrityValidator = Object.freeze({
  validate: validateCrossPhaseIntegrity,
});

export const CertificationHashValidator = Object.freeze({
  validate: validateCertificationHashes,
});

export const AuthorityContainmentValidator = Object.freeze({
  validate: validateAuthorityContainment,
});

export const GovernanceBoundaryValidator = Object.freeze({
  validate: validateGovernance,
});

export const CertificationReplayValidator = Object.freeze({
  validate: validateReplay,
});

export const CertificationLineageRecorder = Object.freeze({
  record: recordCertificationLineage,
});

export const CertificationReasonGenerator = Object.freeze({
  generate: generateReasons,
});

export const CertificationCertificationService = Object.freeze({
  certify: buildRiskCertificationRecord,
});

export const RiskCertificationEngine = Object.freeze({
  build: buildRiskCertificationRecord,
});

export const RiskCertificationGate = Object.freeze({
  certify: buildRiskCertificationRecord,
});
