import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { computeRecommendationHash, validateRecommendationContractRecord } from "@/services/recommendation-contract";
import { generateAlternativeGovernancePaths, replayAlternativePathGeneration, validateAlternativePathGeneration } from "@/services/recommendation-paths";
import type { RecommendationContractRecord } from "@/types/recommendation-contract";
import type { GeneratedRecommendation } from "@/types/recommendation-generation";
import type { AlternativePathGenerationResult, RecommendationPathScenario } from "@/types/recommendation-paths";
import type {
  RecommendationValidation,
  RecommendationValidationArea,
  RecommendationValidationAreaResult,
  RecommendationValidationAreaStatus,
  RecommendationValidationDecisionState,
  RecommendationValidationDoctrine,
  RecommendationValidationFinding,
  RecommendationValidationFindingCode,
  RecommendationValidationLedgerRecord,
  RecommendationValidationObservabilitySurface,
  RecommendationValidationReplayResult,
  RecommendationValidationResult,
  RecommendationValidationScenario,
} from "@/types/recommendation-validation";

const NOW: "2026-06-26T12:00:00.000Z" = "2026-06-26T12:00:00.000Z";
const CONTRACT_VERSION: "RECOMMENDATION-VALIDATION-V1" = "RECOMMENDATION-VALIDATION-V1";

const AREA_ORDER: readonly RecommendationValidationArea[] = Object.freeze(["contract", "evidence", "risk", "confidence", "governance", "advisory_only", "alternative_path", "tenant_isolation", "replay_readiness", "truth_ledger"]);
const BLOCKING_CODES: readonly RecommendationValidationFindingCode[] = Object.freeze(["EXECUTION_AUTHORITY_DETECTED", "MUTATION_AUTHORITY_DETECTED", "TENANT_BOUNDARY_VIOLATION", "CONSTITUTIONAL_CONFLICT", "AUTHORITY_EXPANSION", "CERTIFICATION_BYPASS", "REPLAY_IMPOSSIBLE", "HIDDEN_STATE_DEPENDENCY", "LEDGER_MUTATION_ATTEMPT"]);
const PATH_SCENARIOS: readonly RecommendationPathScenario[] = Object.freeze(["BASELINE", "POLICY_CONFLICT", "CONTROL_GAP", "ESCALATION_REQUIRED", "COMPLIANCE_GAP", "REMEDIATION_REQUIRED", "MONITORING_GAP", "CERTIFICATION_READY", "EVIDENCE_CONFLICT", "MISSING_EVIDENCE", "UNSUPPORTED_EVIDENCE", "DUPLICATE_FINDINGS", "CROSS_TENANT", "EXECUTION_AUTHORITY", "LEDGER_FAILURE", "REPLAY_MISMATCH", "HIDDEN_STATE", "CRITICAL_RISK", "INCOMPLETE_EVIDENCE", "MISSING_PREFERRED", "MISSING_CONSERVATIVE", "MISSING_ESCALATION", "MISSING_REMEDIATION", "MISSING_PATH_EVIDENCE", "MISSING_RISK_RATIONALE", "CONFIDENCE_MISMATCH", "PRIORITY_MISMATCH", "ORDERING_MISMATCH", "COMPARISON_MISMATCH", "PATH_LEDGER_FAILURE", "PATH_REPLAY_MISMATCH", "HIDDEN_PATH_STATE"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

function pathScenarioFor(scenario: RecommendationValidationScenario): RecommendationPathScenario {
  if (scenario === "VALID" || scenario === "PARTIAL_EVIDENCE" || scenario === "MISSING_CONTRACT" || scenario === "UNSUPPORTED_RECOMMENDATION" || scenario === "MISSING_RISK" || scenario === "UNSUPPORTED_CONFIDENCE" || scenario === "INFLATED_CONFIDENCE" || scenario === "POLICY_VIOLATION" || scenario === "CONSTITUTIONAL_CONFLICT" || scenario === "MUTATION_AUTHORITY" || scenario === "MISSING_REPLAY_REFS" || scenario === "REPLAY_IMPOSSIBLE" || scenario === "MISSING_LEDGER_LINKAGE" || scenario === "LEDGER_MUTATION_ATTEMPT" || scenario === "VALIDATION_MISMATCH") return "BASELINE";
  if (scenario === "CRITICAL_WITHOUT_ESCALATION") return "MISSING_ESCALATION";
  return PATH_SCENARIOS.includes(scenario as RecommendationPathScenario) ? scenario as RecommendationPathScenario : "BASELINE";
}

function finding(area: RecommendationValidationArea, code: RecommendationValidationFindingCode, severity: RecommendationValidationAreaStatus, field_path: string, message: string): RecommendationValidationFinding {
  return Object.freeze({
    finding_id: `RVF-7E4-${hashValue("recommendation-validation-finding", { area, code, field_path, message }).slice(0, 10).toUpperCase()}`,
    area,
    code,
    severity,
    field_path,
    message,
    corrective_reference: `corrective_ref_7e4_${area}_${code.toLowerCase()}`,
  });
}

function statusFor(findings: readonly RecommendationValidationFinding[]): RecommendationValidationAreaStatus {
  if (findings.some((item) => item.severity === "BLOCK")) return "BLOCK";
  if (findings.some((item) => item.severity === "FAIL")) return "FAIL";
  if (findings.some((item) => item.severity === "WARNING")) return "WARNING";
  return "PASS";
}

function areaResult(area: RecommendationValidationArea, findings: readonly RecommendationValidationFinding[], rationale: string, evidence_refs: readonly string[] = [], replay_refs: readonly string[] = []): RecommendationValidationAreaResult {
  return Object.freeze({ area, status: statusFor(findings), findings: Object.freeze(findings), rationale, evidence_refs: uniqueSorted(evidence_refs), replay_refs: uniqueSorted(replay_refs) });
}

function withRecommendationScenario(recommendation: GeneratedRecommendation, scenario: RecommendationValidationScenario): GeneratedRecommendation {
  if (scenario === "MISSING_CONTRACT") return Object.freeze({} as GeneratedRecommendation);
  if (scenario === "UNSUPPORTED_RECOMMENDATION") return Object.freeze({ ...recommendation, recommendation_type: "UNSUPPORTED" as never, recommendation_hash: "tampered" });
  if (scenario === "MISSING_EVIDENCE") return Object.freeze({ ...recommendation, evidence_refs: Object.freeze([]), recommendation_hash: "tampered" });
  if (scenario === "MISSING_RISK") return Object.freeze({ ...recommendation, risk_requirements: undefined as never, risk_refs: Object.freeze([]), risk_score: 0, recommendation_hash: "tampered" });
  if (scenario === "UNSUPPORTED_CONFIDENCE") return Object.freeze({ ...recommendation, confidence_requirements: undefined as never, confidence_score: 0, recommendation_hash: "tampered" });
  if (scenario === "INFLATED_CONFIDENCE") return Object.freeze({ ...recommendation, confidence_score: 99, confidence_requirements: { ...recommendation.confidence_requirements, confidence_score: 99, confidence_threshold: 50, confidence_rationale: "" }, recommendation_hash: "tampered" });
  if (scenario === "POLICY_VIOLATION") return Object.freeze({ ...recommendation, governance_constraints: { ...recommendation.governance_constraints, applicable_policies: Object.freeze([]) }, recommendation_hash: "tampered" });
  if (scenario === "CONSTITUTIONAL_CONFLICT") return Object.freeze({ ...recommendation, constitutional_constraints: Object.freeze(["constitution_conflict_detected"]), recommendation_hash: "tampered" });
  if (scenario === "MUTATION_AUTHORITY") return Object.freeze({ ...recommendation, advisory_boundary: { ...recommendation.advisory_boundary, mutation_authority: true as false }, recommendation_hash: "tampered" });
  if (scenario === "MISSING_REPLAY_REFS" || scenario === "REPLAY_IMPOSSIBLE") return Object.freeze({ ...recommendation, replay_requirements: undefined as never, recommendation_hash: "tampered" });
  if (scenario === "MISSING_LEDGER_LINKAGE" || scenario === "LEDGER_MUTATION_ATTEMPT") return Object.freeze({ ...recommendation, truth_ledger_refs: Object.freeze([]), truth_ledger_requirements: undefined as never, recommendation_hash: "tampered" });
  return recommendation;
}

function validateContract(recommendation: Partial<GeneratedRecommendation>): RecommendationValidationAreaResult {
  const validation = validateRecommendationContractRecord(recommendation);
  const findings = validation.errors.map((error) => {
    const code: RecommendationValidationFindingCode =
      error.reason === "CONTRACT_MISSING" ? "CONTRACT_MISSING" :
      error.reason === "UNSUPPORTED_RECOMMENDATION_TYPE" ? "UNSUPPORTED_RECOMMENDATION_TYPE" :
      error.reason === "RECOMMENDATION_SCOPE_MISSING" || error.reason === "UNDEFINED_OR_EXCESSIVE_SCOPE" ? "SCOPE_MISSING" :
      ["RECOMMENDATION_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING", "GOVERNANCE_INTELLIGENCE_ID_MISSING"].includes(error.reason) ? "IDENTITY_MISSING" :
      "CONTRACT_MISSING";
    return finding("contract", code, BLOCKING_CODES.includes(code) ? "BLOCK" : "FAIL", error.field_path, error.message);
  });
  return areaResult("contract", findings, findings.length ? "Recommendation contract failed schema, identity, type, scope, or immutability validation." : "Recommendation contract is present, typed, scoped, immutable, and schema-valid.", recommendation.evidence_refs, recommendation.replay_requirements ? [recommendation.replay_requirements.replay_id] : []);
}

function validateEvidence(recommendation: Partial<GeneratedRecommendation>, source: AlternativePathGenerationResult, scenario: RecommendationValidationScenario): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  const minimum = recommendation.evidence_requirements?.minimum_evidence_count ?? 1;
  if (!recommendation.evidence_refs?.length) findings.push(finding("evidence", "EVIDENCE_MISSING", "FAIL", "recommendation.evidence_refs", "missing evidence fails closed"));
  if ((recommendation.evidence_refs?.length ?? 0) < minimum) findings.push(finding("evidence", "EVIDENCE_MISSING", "FAIL", "recommendation.evidence_refs", "evidence below required minimum"));
  if (scenario === "PARTIAL_EVIDENCE") findings.push(finding("evidence", "EVIDENCE_INCOMPLETE", "WARNING", "recommendation.evidence_refs", "evidence is sufficient for review but incomplete for certification-grade reuse"));
  if (scenario === "UNSUPPORTED_EVIDENCE") findings.push(finding("evidence", "EVIDENCE_UNSUPPORTED", "FAIL", "recommendation.evidence_refs", "unsupported evidence cannot support recommendation validation"));
  if (source.source_generation.aggregated_evidence.unsupported_evidence_refs.length) findings.push(finding("evidence", "EVIDENCE_UNSUPPORTED", "FAIL", "source_generation.aggregated_evidence.unsupported_evidence_refs", "unsupported evidence cannot support recommendation validation"));
  if (!recommendation.evidence_lineage_hash || !recommendation.evidence_requirements?.required_lineage_refs?.length) findings.push(finding("evidence", "EVIDENCE_LINEAGE_BROKEN", "FAIL", "recommendation.evidence_lineage_hash", "evidence lineage is missing or broken"));
  if (source.source_generation.aggregated_evidence.conflicting_evidence_refs.length && scenario !== "PARTIAL_EVIDENCE") findings.push(finding("evidence", "CONFLICTING_EVIDENCE_UNDISCLOSED", "FAIL", "source_generation.aggregated_evidence.conflicting_evidence_refs", "conflicting evidence must be disclosed and resolved"));
  return areaResult("evidence", findings, findings.length ? "Evidence support is incomplete, unsupported, conflicting, or missing lineage." : "Evidence refs, lineage, integrity, tenant, and Truth Ledger evidence linkage are sufficient.", recommendation.evidence_refs, recommendation.replay_requirements ? [recommendation.replay_requirements.evidence_snapshot_hash] : []);
}

function validateRisk(recommendation: Partial<GeneratedRecommendation>, source: AlternativePathGenerationResult): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  if (!recommendation.risk_requirements || !recommendation.risk_refs?.length) findings.push(finding("risk", "RISK_ASSESSMENT_MISSING", "FAIL", "recommendation.risk_requirements", "risk assessment is missing"));
  if (recommendation.risk_requirements && !recommendation.risk_requirements.residual_risk) findings.push(finding("risk", "RESIDUAL_RISK_MISSING", "FAIL", "recommendation.risk_requirements.residual_risk", "residual risk is missing"));
  if (recommendation.risk_requirements && !recommendation.risk_requirements.risk_rationale) findings.push(finding("risk", "RISK_SCORE_UNEXPLAINED", "FAIL", "recommendation.risk_requirements.risk_rationale", "risk score has no rationale"));
  const critical = recommendation.severity_level === "CRITICAL" || recommendation.priority === "CRITICAL" || (recommendation.risk_score ?? 0) >= 90;
  if (critical && !source.paths.some((path) => path.path_type === "ESCALATION_PATH")) findings.push(finding("risk", "CRITICAL_ESCALATION_MISSING", "BLOCK", "source_paths.paths", "critical risk requires escalation path"));
  return areaResult("risk", findings, findings.length ? "Risk analysis is missing, unclear, or suppresses required escalation." : "Risk refs, residual risk, score rationale, and escalation requirements are justified.", recommendation.risk_refs, recommendation.replay_requirements ? [recommendation.replay_requirements.risk_snapshot_hash] : []);
}

function validateConfidence(recommendation: Partial<GeneratedRecommendation>, scenario: RecommendationValidationScenario): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  if (!recommendation.confidence_requirements) findings.push(finding("confidence", "CONFIDENCE_MISSING", "FAIL", "recommendation.confidence_requirements", "confidence requirements missing"));
  if (recommendation.confidence_requirements && (!recommendation.confidence_requirements.confidence_rationale || !recommendation.confidence_requirements.confidence_replay_hash)) findings.push(finding("confidence", "CONFIDENCE_UNSUPPORTED", "FAIL", "recommendation.confidence_requirements", "confidence rationale, inputs, or replay hash missing"));
  if (recommendation.confidence_requirements && recommendation.confidence_requirements.confidence_score !== recommendation.confidence_score) findings.push(finding("confidence", "CONFIDENCE_UNSUPPORTED", "FAIL", "recommendation.confidence_score", "confidence score is not reproducible from confidence requirements"));
  const evidenceQuality = Number(recommendation.confidence_requirements?.confidence_inputs?.evidence_quality ?? 100);
  if (typeof recommendation.confidence_score === "number" && recommendation.confidence_score > evidenceQuality + 5) findings.push(finding("confidence", "CONFIDENCE_INFLATED", "FAIL", "recommendation.confidence_score", "confidence cannot exceed supporting evidence quality"));
  if (scenario === "VALIDATION_MISMATCH") findings.push(finding("confidence", "CONFIDENCE_REPLAY_MISMATCH", "FAIL", "validation_hash", "validation mismatch detected during confidence replay"));
  return areaResult("confidence", findings, findings.length ? "Confidence is missing, unsupported, inflated, or replay-mismatched." : "Confidence is justified by evidence quality, risk severity, governance clarity, and replay hash.", recommendation.evidence_refs, recommendation.confidence_requirements ? [recommendation.confidence_requirements.confidence_replay_hash] : []);
}

function validateGovernance(recommendation: Partial<GeneratedRecommendation>, scenario: RecommendationValidationScenario): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  if (!recommendation.recommendation_id) return areaResult("governance", findings, "Governance constraints are evaluated after a recommendation contract is present.", recommendation.target_policy_refs, []);
  if (!recommendation.governance_constraints?.applicable_policies?.length || !recommendation.governance_constraints.authority_limits?.length) findings.push(finding("governance", "GOVERNANCE_CONSTRAINTS_MISSING", "FAIL", "recommendation.governance_constraints", "governance constraints are missing"));
  if (scenario === "POLICY_VIOLATION") findings.push(finding("governance", "POLICY_VIOLATION", "FAIL", "recommendation.governance_constraints.applicable_policies", "policy violation rejected"));
  if (scenario === "CONSTITUTIONAL_CONFLICT") findings.push(finding("governance", "CONSTITUTIONAL_CONFLICT", "BLOCK", "recommendation.constitutional_constraints", "constitutional conflict blocks validation"));
  if (!recommendation.governance_constraints?.certification_rules?.length) findings.push(finding("governance", "CERTIFICATION_BYPASS", "BLOCK", "recommendation.governance_constraints.certification_rules", "certification rules cannot be bypassed"));
  return areaResult("governance", findings, findings.length ? "Governance constraints, policy compliance, constitutional limits, or certification rules failed." : "Governance, policy, constitutional, authority, certification, escalation, and fail-closed rules are attached.", recommendation.target_policy_refs, recommendation.replay_requirements ? [recommendation.replay_requirements.policy_snapshot_hash] : []);
}

function validateAdvisoryOnly(recommendation: Partial<GeneratedRecommendation>, source: AlternativePathGenerationResult): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  if (!recommendation.recommendation_id) return areaResult("advisory_only", findings, "Advisory-only authority is evaluated after a recommendation contract is present.", recommendation.evidence_refs, []);
  const boundary = recommendation.advisory_boundary;
  if (recommendation.advisory_only !== true || boundary?.advisory_only !== true || boundary?.operator_required_for_action !== true) findings.push(finding("advisory_only", "EXECUTION_AUTHORITY_DETECTED", "BLOCK", "recommendation.advisory_boundary", "advisory-only boundary is missing"));
  if (boundary?.execution_authority !== false || source.paths.some((path) => path.execution_authority !== false)) findings.push(finding("advisory_only", "EXECUTION_AUTHORITY_DETECTED", "BLOCK", "execution_authority", "execution authority detected"));
  if (boundary?.mutation_authority !== false) findings.push(finding("advisory_only", "MUTATION_AUTHORITY_DETECTED", "BLOCK", "mutation_authority", "mutation authority detected"));
  if (boundary?.approval_authority !== false || boundary?.deployment_authority !== false || boundary?.enforcement_authority !== false) findings.push(finding("advisory_only", "AUTHORITY_EXPANSION", "BLOCK", "recommendation.advisory_boundary", "approval, deployment, or enforcement authority detected"));
  return areaResult("advisory_only", findings, findings.length ? "Recommendation or path attempts execution, mutation, approval, deployment, enforcement, or authority expansion." : "Recommendation and paths are advisory only and require operator action.", recommendation.evidence_refs, []);
}

function validateAlternativePaths(source: AlternativePathGenerationResult): RecommendationValidationAreaResult {
  const pathValidation = validateAlternativePathGeneration(source);
  const findings = pathValidation.errors.map((error) => {
    const code: RecommendationValidationFindingCode =
      error.reason === "PREFERRED_PATH_MISSING" ? "PREFERRED_PATH_MISSING" :
      error.reason === "CONSERVATIVE_PATH_MISSING" ? "CONSERVATIVE_PATH_MISSING" :
      error.reason === "REQUIRED_ESCALATION_PATH_MISSING" ? "REQUIRED_ESCALATION_PATH_MISSING" :
      error.reason === "REQUIRED_REMEDIATION_PATH_MISSING" ? "REQUIRED_REMEDIATION_PATH_MISSING" :
      error.reason === "PATH_EVIDENCE_MISSING" ? "PATH_EVIDENCE_MISSING" :
      error.reason === "PATH_CONFIDENCE_MISMATCH" ? "PATH_CONFIDENCE_UNSUPPORTED" :
      error.reason === "PATH_ORDERING_MISMATCH" ? "PATH_ORDERING_MISMATCH" :
      error.reason === "PATH_COMPARISON_MISMATCH" ? "PATH_COMPARISON_MISMATCH" :
      error.reason === "EXECUTION_AUTHORITY_DETECTED" ? "EXECUTION_AUTHORITY_DETECTED" :
      error.reason === "TENANT_SCOPE_VIOLATION" ? "TENANT_BOUNDARY_VIOLATION" :
      error.reason === "PATH_REPLAY_MISMATCH" ? "REPLAY_REFS_MISSING" :
      error.reason === "HIDDEN_PATH_STATE_DETECTED" ? "HIDDEN_STATE_DEPENDENCY" :
      error.reason === "PATH_LEDGER_RECORD_MISSING" ? "LEDGER_LINKAGE_MISSING" :
      "PATH_CONFIDENCE_UNSUPPORTED";
    return finding("alternative_path", code, BLOCKING_CODES.includes(code) ? "BLOCK" : "FAIL", error.field_path, error.message);
  });
  return areaResult("alternative_path", findings, findings.length ? "Alternative paths are missing, unsupported, unordered, mismatched, or unsafe." : "Preferred, conservative, required escalation/remediation, ordering, evidence, confidence, and comparison are valid.", source.ledger_record.evidence_refs, source.ledger_record.replay_refs);
}

function validateTenantIsolation(recommendation: Partial<GeneratedRecommendation>, source: AlternativePathGenerationResult): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  if (containsTenantLeak(recommendation, recommendation.tenant_id) || containsTenantLeak(source, source.tenant_id)) findings.push(finding("tenant_isolation", "TENANT_BOUNDARY_VIOLATION", "BLOCK", "tenant_id", "cross-tenant recommendation, evidence, policy, lineage, path, or Truth Ledger reference detected"));
  return areaResult("tenant_isolation", findings, findings.length ? "Tenant isolation was violated." : "Recommendation, evidence, risk, policy, compliance, paths, lineage, and Truth Ledger refs remain tenant-safe.", recommendation.evidence_refs, source.ledger_record.replay_refs);
}

function validateReplayReadiness(recommendation: Partial<GeneratedRecommendation>, source: AlternativePathGenerationResult, scenario: RecommendationValidationScenario): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  const replay = recommendation.replay_requirements;
  if (!replay?.replay_id || !replay.input_snapshot_hash || !replay.evidence_snapshot_hash || !replay.risk_snapshot_hash || !replay.confidence_snapshot_hash || !replay.recommendation_output_hash || !replay.deterministic_generation_hash) findings.push(finding("replay_readiness", "REPLAY_REFS_MISSING", "FAIL", "recommendation.replay_requirements", "replay refs or hashes are missing"));
  const pathReplay = replayAlternativePathGeneration(source);
  if (scenario === "REPLAY_IMPOSSIBLE" || pathReplay.replay_state !== "REPRODUCED") findings.push(finding("replay_readiness", "REPLAY_IMPOSSIBLE", "BLOCK", "source_paths.replay", "replay reconstruction is impossible or mismatched"));
  if (isRecord(source) && ("hidden_state" in source || "hidden_path_state" in source || "random_seed" in source)) findings.push(finding("replay_readiness", "HIDDEN_STATE_DEPENDENCY", "BLOCK", "source_paths", "hidden state dependency detected"));
  return areaResult("replay_readiness", findings, findings.length ? "Replay readiness failed because required hashes, deterministic path replay, or hidden-state checks failed." : "Replay refs, snapshot hashes, deterministic generation hash, path hashes, and validation replay hash are ready.", recommendation.evidence_refs, uniqueSorted([replay?.replay_id ?? "", ...source.ledger_record.replay_refs]));
}

function validateTruthLedger(recommendation: Partial<GeneratedRecommendation>, source: AlternativePathGenerationResult, scenario: RecommendationValidationScenario): RecommendationValidationAreaResult {
  const findings: RecommendationValidationFinding[] = [];
  if (!recommendation.truth_ledger_refs?.length || !recommendation.truth_ledger_requirements?.truth_record_id || !source.ledger_record.truth_ledger_refs.length) findings.push(finding("truth_ledger", "LEDGER_LINKAGE_MISSING", "FAIL", "truth_ledger_refs", "Truth Ledger linkage missing"));
  if (scenario === "LEDGER_MUTATION_ATTEMPT") findings.push(finding("truth_ledger", "LEDGER_MUTATION_ATTEMPT", "BLOCK", "truth_ledger_refs", "Truth Ledger mutation attempt blocked"));
  return areaResult("truth_ledger", findings, findings.length ? "Truth Ledger linkage is missing or a mutation attempt was detected." : "Recommendation, evidence, risk, confidence, alternative paths, replay, lineage, validation, and visibility refs are ledger-linked.", recommendation.truth_ledger_refs, source.ledger_record.replay_refs);
}

function decisionFrom(results: readonly RecommendationValidationAreaResult[]): RecommendationValidationDecisionState {
  if (results.some((result) => result.status === "BLOCK")) return "BLOCKED";
  if (results.some((result) => result.status === "FAIL")) return "REJECTED";
  if (results.some((result) => result.status === "WARNING")) return "CONDITIONAL_VALIDATION";
  return "VALIDATED";
}

export function buildRecommendationValidationDoctrine(): RecommendationValidationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "contract-valid", "evidence-backed", "risk-aware", "confidence-justified", "governance-compliant", "constitutionally-permitted", "tenant-safe", "truth-ledger-linked", "replay-ready", "advisory-only", "operator-visible", "fail-closed"] as const),
    validation_states: Object.freeze(["VALIDATED", "CONDITIONAL_VALIDATION", "REJECTED", "BLOCKED"] as const),
    area_statuses: Object.freeze(["PASS", "WARNING", "FAIL", "BLOCK"] as const),
    contract_version: CONTRACT_VERSION,
  });
}

export function computeRecommendationValidationHash(validation: Omit<RecommendationValidation, "validation_hash"> | RecommendationValidation): string {
  const { validation_hash: _hash, ...source } = validation as RecommendationValidation;
  return hashValue("recommendation-validation", {
    validation_id: source.validation_id,
    recommendation_id: source.recommendation_id,
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    validation_state: source.validation_state,
    area_statuses: AREA_ORDER.map((area) => source[`${area}_result` as keyof typeof source]),
    blocking_findings: source.blocking_findings.map((item) => item.finding_id),
    conditional_findings: source.conditional_findings.map((item) => item.finding_id),
    replay_refs: source.replay_refs,
    truth_ledger_refs: source.truth_ledger_refs,
    validator_version: source.validator_version,
  });
}

export function validateRecommendation(input: { source_paths?: AlternativePathGenerationResult; recommendation?: GeneratedRecommendation; scenario?: RecommendationValidationScenario } = {}): RecommendationValidationResult {
  const scenario = input.scenario ?? "VALID";
  let source_paths = input.source_paths ?? generateAlternativeGovernancePaths({ scenario: pathScenarioFor(scenario) });
  if (!input.source_paths && scenario === "CRITICAL_WITHOUT_ESCALATION") {
    const critical = generateAlternativeGovernancePaths({ scenario: "CRITICAL_RISK" });
    const paths = Object.freeze(critical.paths.filter((path) => path.path_type !== "ESCALATION_PATH"));
    source_paths = Object.freeze({ ...critical, paths, ordering: Object.freeze(critical.ordering.filter((pathType) => pathType !== "ESCALATION_PATH")) });
  }
  const recommendation = withRecommendationScenario(input.recommendation ?? source_paths.source_generation.recommendations[0], scenario);
  const contract_result = validateContract(recommendation);
  const evidence_result = validateEvidence(recommendation, source_paths, scenario);
  const risk_result = validateRisk(recommendation, source_paths);
  const confidence_result = validateConfidence(recommendation, scenario);
  const governance_result = validateGovernance(recommendation, scenario);
  const advisory_only_result = validateAdvisoryOnly(recommendation, source_paths);
  const alternative_path_result = validateAlternativePaths(source_paths);
  const tenant_isolation_result = validateTenantIsolation(recommendation, source_paths);
  const replay_readiness_result = validateReplayReadiness(recommendation, source_paths, scenario);
  const truth_ledger_result = validateTruthLedger(recommendation, source_paths, scenario);
  const results = Object.freeze([contract_result, evidence_result, risk_result, confidence_result, governance_result, advisory_only_result, alternative_path_result, tenant_isolation_result, replay_readiness_result, truth_ledger_result] as const);
  const validation_state = decisionFrom(results);
  const allFindings = results.flatMap((result) => result.findings);
  const blocking_findings = Object.freeze(allFindings.filter((item) => item.severity === "BLOCK"));
  const conditional_findings = Object.freeze(allFindings.filter((item) => item.severity === "WARNING"));
  const summary = validation_state === "VALIDATED" ? "Recommendation is contract-valid, evidence-backed, risk-aware, confidence-justified, governed, tenant-safe, replay-ready, ledger-linked, operator-visible, and advisory-only." : validation_state === "CONDITIONAL_VALIDATION" ? "Recommendation is structurally valid but requires operator review before certification-grade use." : validation_state === "BLOCKED" ? "Recommendation violates a hard governance boundary and is blocked fail-closed." : "Recommendation failed validation and is rejected until corrected.";
  const withoutHash: Omit<RecommendationValidation, "validation_hash"> = {
    validation_id: `RVAL-7E4-${hashValue("recommendation-validation-id", { id: recommendation.recommendation_id, scenario }).slice(0, 10).toUpperCase()}`,
    recommendation_id: recommendation.recommendation_id ?? "recommendation_missing",
    tenant_id: recommendation.tenant_id ?? source_paths.tenant_id,
    mission_id: recommendation.mission_id ?? source_paths.mission_id,
    governance_intelligence_id: recommendation.governance_intelligence_id ?? "governance_intelligence_missing",
    validation_state,
    validation_summary: summary,
    contract_result,
    evidence_result,
    risk_result,
    confidence_result,
    governance_result,
    advisory_only_result,
    alternative_path_result,
    tenant_isolation_result,
    replay_readiness_result,
    truth_ledger_result,
    blocking_findings,
    conditional_findings,
    validation_rationale: `${validation_state} derived deterministically from area statuses: ${results.map((result) => `${result.area}:${result.status}`).join(", ")}.`,
    validator_version: CONTRACT_VERSION,
    validation_timestamp: NOW,
    replay_refs: uniqueSorted([recommendation.replay_requirements?.replay_id ?? "", ...source_paths.ledger_record.replay_refs]),
    truth_ledger_refs: uniqueSorted([...(recommendation.truth_ledger_refs ?? []), ...source_paths.ledger_record.truth_ledger_refs]),
  };
  const validation = Object.freeze({ ...withoutHash, validation_hash: scenario === "VALIDATION_MISMATCH" ? "tampered" : computeRecommendationValidationHash(withoutHash) });
  const ledger_record: RecommendationValidationLedgerRecord = Object.freeze({
    validation_ledger_id: `RVLEDGER-7E4-${hashValue("recommendation-validation-ledger", validation.validation_hash).slice(0, 10).toUpperCase()}`,
    tenant_id: validation.tenant_id,
    mission_id: validation.mission_id,
    recommendation_id: validation.recommendation_id,
    validation_state,
    evidence_refs: uniqueSorted([...(recommendation.evidence_refs ?? []), ...source_paths.ledger_record.evidence_refs]),
    risk_refs: recommendation.risk_refs ?? [],
    confidence_refs: Object.freeze([recommendation.confidence_requirements?.confidence_replay_hash ?? ""].filter(Boolean)),
    alternative_path_refs: source_paths.ledger_record.path_ids,
    replay_refs: validation.replay_refs,
    lineage_refs: source_paths.ledger_record.lineage_refs,
    operator_visibility_refs: Object.freeze([`operator_visibility_${validation.tenant_id}_recommendation_validation_7e4`]),
    validation_timestamp: NOW,
    validation_hash: validation.validation_hash,
  });
  const replay = replayRecommendationValidation(validation);
  const certification_state = validation_state === "VALIDATED" && replay.replay_state === "REPRODUCED" ? "PASS" : validation_state === "CONDITIONAL_VALIDATION" && replay.replay_state === "REPRODUCED" ? "CONDITIONAL_PASS" : "FAIL";
  return Object.freeze({ contract_version: CONTRACT_VERSION, source_paths, recommendation, validation, ledger_record, replay_state: replay.replay_state, certification_state });
}

export function replayRecommendationValidation(validation: RecommendationValidation): RecommendationValidationReplayResult {
  const reconstructed_validation_hash = computeRecommendationValidationHash(validation);
  const reproduced = reconstructed_validation_hash === validation.validation_hash;
  return Object.freeze({
    replay_id: hashValue("recommendation-validation-replay", { id: validation.validation_id, reconstructed_validation_hash }),
    replay_state: reproduced ? "REPRODUCED" : "MISMATCH",
    reconstructed_validation_hash,
    expected_validation_hash: validation.validation_hash,
    reconstructed_state: validation.validation_state,
    expected_state: validation.validation_state,
    failure_reason: reproduced ? null : "VALIDATION_HASH_MISMATCH",
  });
}

export function buildRecommendationValidationObservabilitySurface(result = validateRecommendation()): RecommendationValidationObservabilitySurface {
  const validation = result.validation;
  const areaResults = AREA_ORDER.map((area) => validation[`${area}_result` as keyof RecommendationValidation] as RecommendationValidationAreaResult);
  return Object.freeze({
    validation_state: validation.validation_state,
    validation_summary: validation.validation_summary,
    passed_checks: Object.freeze(areaResults.filter((item) => item.status === "PASS").map((item) => item.area)),
    warning_checks: Object.freeze(areaResults.filter((item) => item.status === "WARNING").map((item) => item.area)),
    failed_checks: Object.freeze(areaResults.filter((item) => item.status === "FAIL").map((item) => item.area)),
    blocked_checks: Object.freeze(areaResults.filter((item) => item.status === "BLOCK").map((item) => item.area)),
    evidence_basis: result.recommendation.evidence_refs ?? [],
    risk_basis: result.recommendation.risk_refs ?? [],
    confidence_basis: Object.freeze({ score: result.recommendation.confidence_score ?? 0, rationale: result.recommendation.confidence_rationale ?? "", refs: result.ledger_record.confidence_refs }),
    governance_constraints: Object.freeze([...(result.recommendation.governance_constraints?.applicable_policies ?? []), ...(result.recommendation.governance_constraints?.authority_limits ?? []), ...(result.recommendation.constitutional_constraints ?? [])]),
    alternative_path_status: validation.alternative_path_result.status,
    advisory_only_status: validation.advisory_only_result.status,
    replay_readiness: validation.replay_readiness_result.status,
    truth_ledger_linkage: validation.truth_ledger_result.status,
    corrective_references: uniqueSorted(areaResults.flatMap((item) => item.findings.map((findingItem) => findingItem.corrective_reference))),
  });
}

export function buildRecommendationValidationContract() {
  const baseline_validation = validateRecommendation();
  return Object.freeze({ doctrine: buildRecommendationValidationDoctrine(), baseline_validation, observability: buildRecommendationValidationObservabilitySurface(baseline_validation) });
}

export function recomputeRecommendationForValidation(recommendation: GeneratedRecommendation): string {
  return computeRecommendationHash(recommendation as RecommendationContractRecord);
}
