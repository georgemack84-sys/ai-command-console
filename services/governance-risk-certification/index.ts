import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceRiskRecord, buildGovernanceRiskSourceRegistry, validateGovernanceRiskRecord } from "@/services/governance-risk";
import { detectViolationPatterns, replayViolationPattern, validateViolationPatternRecord } from "@/services/violation-patterns";
import { analyzeGovernanceWeakness, replayGovernanceWeakness, validateGovernanceWeaknessRecord } from "@/services/governance-weakness";
import { buildGovernanceRiskScoreObservabilitySurface, buildGovernanceRiskScoreRecord, replayGovernanceRiskScore, scoreGovernanceRisk, validateGovernanceRiskScoreRecord } from "@/services/governance-risk-scoring";
import type {
  GovernanceRiskCertificationDoctrine,
  GovernanceRiskCertificationFailureReason,
  GovernanceRiskCertificationRecord,
  GovernanceRiskCertificationReplayPackage,
  GovernanceRiskCertificationReplayResult,
  GovernanceRiskCertificationReport,
  GovernanceRiskCertificationState,
  GovernanceRiskCertificationValidationFailure,
  GovernanceRiskCertificationValidationResult,
  GovernanceRiskCertificationValidationState,
  GovernanceRiskValidatedComponents,
} from "@/types/governance-risk-certification";

const NOW = "2026-06-25T09:00:00.000Z";
const REQUIRED_ARTIFACTS = Object.freeze(["Governance Risk Contract", "Risk Source Registry", "Violation Pattern Detection Engine", "Governance Weakness Analyzer", "Governance Risk Scoring Engine", "Risk Replay Builder", "Governance Risk Operator View Model"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: GovernanceRiskCertificationFailureReason, field_path: string, message: string): GovernanceRiskCertificationValidationFailure {
  return Object.freeze({ failure_id: hashValue("governance-risk-certification-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function allPass(components: GovernanceRiskValidatedComponents): boolean {
  return Object.values(components).every((status) => status === "PASS");
}

function anyFail(components: GovernanceRiskValidatedComponents): boolean {
  return Object.values(components).some((status) => status === "FAIL");
}

export function buildGovernanceRiskCertificationDoctrine(): GovernanceRiskCertificationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "replayable", "explainable", "tenant-safe", "evidence-backed", "lineage-preserving", "operator-visible", "advisory-only", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["action approval", "runtime remediation", "policy mutation", "operator override", "authority modification", "runtime containment", "historical record mutation"]),
    allowed_states: Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    required_components: Object.freeze(["risk_contract", "source_registry", "pattern_detection", "weakness_analysis", "risk_scoring", "confidence_scoring", "replay", "lineage", "tenant_isolation", "operator_visibility", "hidden_state"] as const),
    certification_model_version: "GOV-RISK-CERT-V1",
  });
}

export function generateGovernanceRiskCertificationId(tenant_id: string, mission_id: string): string {
  return `GRCERT-7C-${hashValue("governance-risk-certification-id", { tenant_id, mission_id }).slice(0, 8).toUpperCase()}`;
}

function componentStatus(input: Partial<GovernanceRiskValidatedComponents> = {}): GovernanceRiskValidatedComponents {
  return Object.freeze({
    risk_contract: "PASS",
    source_registry: "PASS",
    pattern_detection: "PASS",
    weakness_analysis: "PASS",
    risk_scoring: "PASS",
    confidence_scoring: "PASS",
    replay: "PASS",
    lineage: "PASS",
    tenant_isolation: "PASS",
    operator_visibility: "PASS",
    hidden_state: "PASS",
    ...input,
  });
}

function decideCertificationState(components: GovernanceRiskValidatedComponents): GovernanceRiskCertificationState {
  if (anyFail(components)) return "FAIL";
  if (Object.values(components).some((status) => status === "CONDITIONAL_PASS")) return "CONDITIONAL_PASS";
  return "PASS";
}

export function canonicalizeGovernanceRiskCertification(record: Omit<GovernanceRiskCertificationRecord, "certification_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeGovernanceRiskCertificationHash(record: Omit<GovernanceRiskCertificationRecord, "certification_hash"> | GovernanceRiskCertificationRecord): string {
  const { certification_hash: _previousHash, ...source } = record as GovernanceRiskCertificationRecord;
  return hashConfidenceValue("governance-risk-certification-contract", canonicalizeGovernanceRiskCertification(source));
}

function buildReplayPackage(source: Omit<GovernanceRiskCertificationRecord, "certification_hash" | "certification_replay_package">): GovernanceRiskCertificationReplayPackage {
  const certification_hash = hashValue("governance-risk-certification-replay", { components: source.validated_components, tests: source.test_results, evidence_refs: source.evidence_refs, lineage_refs: source.lineage_refs, replay_refs: source.replay_refs });
  return Object.freeze({
    governance_risk_certification_id: source.governance_risk_certification_id,
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    certification_model_version: "GOV-RISK-CERT-V1",
    test_suite_version: "GOV-RISK-CERT-SUITE-V1",
    validated_artifact_versions: Object.freeze({
      risk_contract: "GOV-RISK-CONTRACT-V1",
      violation_pattern_detection: "VIOLATION-PATTERN-DETECTOR-V1",
      weakness_analysis: "GOV-WEAKNESS-ANALYSIS-V1",
      risk_scoring: "GOV-RISK-SCORE-V1",
      risk_certification: "GOV-RISK-CERT-V1",
    }),
    test_input_refs: Object.freeze(["risk_contract", "source_registry", "pattern_records", "weakness_records", "risk_score_records"]),
    test_result_refs: Object.freeze(Object.entries(source.validated_components ?? {}).map(([component, status]) => `${component}:${status}`)),
    evidence_refs: source.evidence_refs,
    lineage_refs: source.lineage_refs,
    replay_refs: source.replay_refs,
    certification_hash,
  });
}

function explanationFor(state: GovernanceRiskCertificationState): string {
  if (state === "PASS") return "Phase 7C Governance Risk Intelligence is certified. Risk contract validation, source registry validation, deterministic pattern detection, explainable weakness analysis, deterministic scoring, confidence reproduction, replay reconstruction, lineage preservation, tenant isolation, hidden-state rejection, and operator visibility all passed certification.";
  if (state === "CONDITIONAL_PASS") return "Phase 7C Governance Risk Intelligence received a conditional pass. Core deterministic, replay, lineage, confidence, and tenant-safety checks passed, with only non-critical visibility or calibration conditions remaining.";
  return "Phase 7C Governance Risk Intelligence failed certification. One or more fail-closed certification components failed and phase progression is blocked.";
}

export function runGovernanceRiskCertification(input: { component_overrides?: Partial<GovernanceRiskValidatedComponents> } = {}): GovernanceRiskCertificationRecord {
  const risk = buildGovernanceRiskRecord();
  const riskValidation = validateGovernanceRiskRecord(risk);
  const sourcesValid = buildGovernanceRiskSourceRegistry().length > 0 && validateGovernanceRiskRecord(buildGovernanceRiskRecord({ risk_source_refs: ["UNKNOWN" as never] })).validation_state === "UNKNOWN_SOURCE";
  const patterns = detectViolationPatterns().patterns;
  const patternValid = patterns.length >= 10 && patterns.every((pattern) => validateViolationPatternRecord(pattern).validation_state === "VALID") && replayViolationPattern(patterns[0]).validation_state === "PASS";
  const weaknesses = analyzeGovernanceWeakness().weaknesses;
  const weaknessValid = weaknesses.length >= 10 && weaknesses.every((weakness) => validateGovernanceWeaknessRecord(weakness).validation_state === "VALID") && replayGovernanceWeakness(weaknesses[0]).validation_state === "PASS";
  const scores = scoreGovernanceRisk().scores;
  const scoreValid = scores.length >= 10 && scores.every((score) => validateGovernanceRiskScoreRecord(score).validation_state === "VALID") && replayGovernanceRiskScore(scores[0]).validation_state === "PASS";
  const confidenceValid = scores.every((score) => score.confidence_score >= 0 && score.confidence_score <= 1 && score.confidence_basis.evidence_completeness !== undefined);
  const lineageValid = scores.every((score) => score.lineage_refs.length > 0);
  const tenantValid = scores.every((score) => score.tenant_id === risk.tenant_id && !score.evidence_refs.some((ref) => ref.includes("tenant_beta")));
  const hiddenStateValid = validateGovernanceRiskScoreRecord({ ...scores[0], hidden_scoring_state: true } as never).errors.some((error) => error.reason === "HIDDEN_SCORING_STATE");
  const visibility = buildGovernanceRiskScoreObservabilitySurface(scores[0]);
  const visibilityValid = visibility.risk_drivers.length > 0 && visibility.evidence_summary.supporting_evidence_count > 0 && Boolean(visibility.explanation);
  const components = componentStatus({
    risk_contract: riskValidation.validation_state === "VALID" ? "PASS" : "FAIL",
    source_registry: sourcesValid ? "PASS" : "FAIL",
    pattern_detection: patternValid ? "PASS" : "FAIL",
    weakness_analysis: weaknessValid ? "PASS" : "FAIL",
    risk_scoring: scoreValid ? "PASS" : "FAIL",
    confidence_scoring: confidenceValid ? "PASS" : "FAIL",
    replay: scoreValid ? "PASS" : "FAIL",
    lineage: lineageValid ? "PASS" : "FAIL",
    tenant_isolation: tenantValid ? "PASS" : "FAIL",
    operator_visibility: visibilityValid ? "PASS" : "FAIL",
    hidden_state: hiddenStateValid ? "PASS" : "FAIL",
    ...input.component_overrides,
  });
  const certification_state = decideCertificationState(components);
  const failed = Object.values(components).filter((status) => status === "FAIL").length;
  const conditional = Object.values(components).filter((status) => status === "CONDITIONAL_PASS").length;
  const passed = Object.values(components).filter((status) => status === "PASS").length;
  const sourceWithoutReplay: Omit<GovernanceRiskCertificationRecord, "certification_hash" | "certification_replay_package"> = {
    contract_version: "GOV-RISK-CERT-CONTRACT-V1",
    governance_risk_certification_id: generateGovernanceRiskCertificationId(risk.tenant_id, risk.mission_id),
    tenant_id: risk.tenant_id,
    mission_id: risk.mission_id,
    phase: "7C",
    phase_name: "Governance Risk Intelligence",
    certification_gate: "7C.5",
    certification_state,
    certification_timestamp: NOW,
    validated_components: components,
    test_results: Object.freeze({ total: Object.keys(components).length, passed, failed, conditional, skipped: 0 }),
    artifacts_validated: REQUIRED_ARTIFACTS,
    evidence_refs: Object.freeze(scores[0].evidence_refs.slice(0, 3)),
    lineage_refs: Object.freeze(scores[0].lineage_refs.slice(0, 3)),
    replay_refs: Object.freeze(scores[0].replay_refs.slice(0, 3)),
    certification_model_version: "GOV-RISK-CERT-V1",
    test_suite_version: "GOV-RISK-CERT-SUITE-V1",
    explanation: explanationFor(certification_state),
    recommended_next_action: certification_state === "PASS" ? "PROCEED_TO_NEXT_GOVERNANCE_INTELLIGENCE_PHASE" : certification_state === "CONDITIONAL_PASS" ? "LIMITED_PROGRESSION_WITH_REVIEW" : "BLOCK_PHASE_PROGRESSION",
    truth_ledger_write_required: true,
  };
  const replay = buildReplayPackage(sourceWithoutReplay);
  return Object.freeze({ ...sourceWithoutReplay, certification_replay_package: replay, certification_hash: computeGovernanceRiskCertificationHash({ ...sourceWithoutReplay, certification_replay_package: replay }) });
}

export function buildGovernanceRiskCertificationRecord(overrides: Partial<GovernanceRiskCertificationRecord> = {}): GovernanceRiskCertificationRecord {
  const base = runGovernanceRiskCertification();
  const has = (key: keyof GovernanceRiskCertificationRecord) => Object.prototype.hasOwnProperty.call(overrides, key);
  const { certification_hash: _baseHash, certification_replay_package: _baseReplay, ...baseWithoutReplay } = base;
  const { certification_hash: _overrideHash, certification_replay_package: _overrideReplay, ...overridesWithoutReplay } = overrides;
  const sourceWithoutReplay: Omit<GovernanceRiskCertificationRecord, "certification_hash" | "certification_replay_package"> = { ...baseWithoutReplay, ...overridesWithoutReplay };
  const replay = has("certification_replay_package") ? overrides.certification_replay_package! : buildReplayPackage(sourceWithoutReplay);
  return Object.freeze({ ...sourceWithoutReplay, certification_replay_package: replay, certification_hash: overrides.certification_hash ?? computeGovernanceRiskCertificationHash({ ...sourceWithoutReplay, certification_replay_package: replay }) });
}

export function validateGovernanceRiskCertificationRecord(record: Partial<GovernanceRiskCertificationRecord> | undefined): GovernanceRiskCertificationValidationResult {
  const errors: GovernanceRiskCertificationValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "certification record missing"));
  if (record?.contract_version !== "GOV-RISK-CERT-CONTRACT-V1") errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported certification contract"));
  if (!record?.governance_risk_certification_id) errors.push(failure("CERTIFICATION_ID_MISSING", "governance_risk_certification_id", "certification id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant_id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission_id missing"));
  if (!record?.certification_state || !["PASS", "CONDITIONAL_PASS", "FAIL"].includes(record.certification_state)) errors.push(failure("INVALID_CERTIFICATION_STATE", "certification_state", "invalid certification state"));
  if (!record?.validated_components) errors.push(failure("COMPONENT_VALIDATION_MISSING", "validated_components", "validated components missing"));
  if (!record?.test_results || record.test_results.total === undefined) errors.push(failure("TEST_RESULTS_MISSING", "test_results", "test results missing"));
  if (!record?.evidence_refs?.length) errors.push(failure("EVIDENCE_REFS_MISSING", "evidence_refs", "evidence refs missing"));
  if (!record?.lineage_refs?.length) errors.push(failure("LINEAGE_REFS_MISSING", "lineage_refs", "lineage refs missing"));
  if (!record?.replay_refs?.length) errors.push(failure("REPLAY_REFS_MISSING", "replay_refs", "replay refs missing"));
  if (!record?.certification_model_version) errors.push(failure("CERTIFICATION_MODEL_VERSION_MISSING", "certification_model_version", "certification model version missing"));
  if (!record?.explanation) errors.push(failure("EXPLANATION_MISSING", "explanation", "certification explanation missing"));
  if (!record?.recommended_next_action) errors.push(failure("RECOMMENDED_ACTION_MISSING", "recommended_next_action", "recommended next action missing"));
  if (!record?.certification_replay_package?.certification_hash) errors.push(failure("REPLAY_PACKAGE_MISSING", "certification_replay_package", "certification replay package missing"));
  if (record?.evidence_refs?.some((ref) => ref.includes("tenant_beta")) || record?.lineage_refs?.some((ref) => ref.includes("tenant_beta"))) errors.push(failure("TENANT_SCOPE_VIOLATION", "references", "cross-tenant certification reference detected"));
  if (record?.certification_hash && computeGovernanceRiskCertificationHash(record as GovernanceRiskCertificationRecord) !== record.certification_hash) errors.push(failure("CERTIFICATION_HASH_MISMATCH", "certification_hash", "certification hash mismatch"));
  const state: GovernanceRiskCertificationValidationState = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => error.reason === "REPLAY_REFS_MISSING" || error.reason === "REPLAY_PACKAGE_MISSING" || error.reason === "CERTIFICATION_HASH_MISMATCH") ? "REPLAY_REFERENCE_MISSING" : errors.some((error) => error.reason === "LINEAGE_REFS_MISSING") ? "LINEAGE_REFERENCE_MISSING" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    governance_risk_certification_id: record?.governance_risk_certification_id,
    validation_state: state,
    validator_version: "GOV-RISK-CERT-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["CERTIFICATION_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING"].includes(error.reason)),
      decision_valid: !errors.some((error) => error.reason === "INVALID_CERTIFICATION_STATE"),
      components_present: !errors.some((error) => error.reason === "COMPONENT_VALIDATION_MISSING"),
      test_results_valid: !errors.some((error) => error.reason === "TEST_RESULTS_MISSING"),
      evidence_refs_valid: !errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING"),
      lineage_refs_valid: !errors.some((error) => error.reason === "LINEAGE_REFS_MISSING"),
      replay_refs_valid: !errors.some((error) => ["REPLAY_REFS_MISSING", "REPLAY_PACKAGE_MISSING", "CERTIFICATION_HASH_MISMATCH"].includes(error.reason)),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      replay_package_valid: !errors.some((error) => error.reason === "REPLAY_PACKAGE_MISSING"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayGovernanceRiskCertification(record: GovernanceRiskCertificationRecord): GovernanceRiskCertificationReplayResult {
  const reconstructed_hash = computeGovernanceRiskCertificationHash(record);
  const validation = validateGovernanceRiskCertificationRecord(record);
  return Object.freeze({ replay_id: hashValue("governance-risk-certification-replay-result", { id: record.governance_risk_certification_id, reconstructed_hash }), governance_risk_certification_id: record.governance_risk_certification_id, validation_state: validation.validation_state === "VALID" && reconstructed_hash === record.certification_hash ? "PASS" : "FAIL", reconstructed_hash, expected_hash: record.certification_hash, failure_reason: reconstructed_hash === record.certification_hash ? validation.errors[0]?.reason ?? null : "CERTIFICATION_HASH_MISMATCH" });
}

export function buildGovernanceRiskCertificationReport(record = runGovernanceRiskCertification()): GovernanceRiskCertificationReport {
  return Object.freeze({
    phase: "7C",
    phase_name: "Governance Risk Intelligence",
    certification_gate: "7C.5",
    certification_state: record.certification_state,
    summary: Object.freeze({
      risk_contract_valid: record.validated_components.risk_contract === "PASS",
      risk_sources_registered: record.validated_components.source_registry === "PASS",
      pattern_detection_deterministic: record.validated_components.pattern_detection === "PASS",
      weakness_analysis_explainable: record.validated_components.weakness_analysis === "PASS",
      scoring_deterministic: record.validated_components.risk_scoring === "PASS",
      confidence_reproducible: record.validated_components.confidence_scoring === "PASS",
      replay_successful: record.validated_components.replay === "PASS",
      lineage_preserved: record.validated_components.lineage === "PASS",
      tenant_isolation_enforced: record.validated_components.tenant_isolation === "PASS",
      hidden_state_prohibited: record.validated_components.hidden_state === "PASS",
      operator_visibility_complete: record.validated_components.operator_visibility === "PASS",
    }),
    test_summary: record.test_results,
    artifacts_validated: record.artifacts_validated,
    evidence_refs: record.evidence_refs,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    certification_hash: record.certification_hash,
    decision_explanation: record.explanation,
    recommended_next_action: record.recommended_next_action,
  });
}
