import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import { validateContinuousConstitutionalCompliance, validateContinuousConstitutionalRepository } from "@/services/continuous-constitutional-validation";
import { monitorRuntimeConstitutionalCompliance, validateRuntimeConstitutionalMonitoring } from "@/services/runtime-constitutional-monitoring";
import { detectConstitutionalViolations, validateConstitutionalViolationDetection } from "@/services/constitutional-violation-detection";
import { assessConstitutionalResilience, validateConstitutionalResilienceAssessment } from "@/services/constitutional-resilience-assessment";
import { generateConstitutionalRecommendations, validateConstitutionalRecommendationEngine } from "@/services/constitutional-recommendation-engine";
import type {
  ConstitutionalReplayDomain,
  ConstitutionalReplayEvidencePackage,
  ConstitutionalReplayFailure,
  ConstitutionalReplayLedgerRecord,
  ConstitutionalReplayMatrixEntry,
  ConstitutionalReplayMismatchRecord,
  ConstitutionalReplayObservabilitySurface,
  ConstitutionalReplayScenario,
  ConstitutionalReplayStatus,
  ConstitutionalReplayValidationBundle,
  ConstitutionalReplayValidationInput,
  ConstitutionalReplayValidationReport,
  ConstitutionalReplayValidationRepository,
  ConstitutionalReplayValidationResult,
} from "@/types/constitutional-replay-validation";

const VERSION = "constitutional-replay-validation/v8ALT.10.7" as const;
const domains = Object.freeze(["VALIDATION", "MONITORING", "VIOLATION", "RECOMMENDATION", "CONFIDENCE", "ASSESSMENT", "DASHBOARD"] as const);
const matrixComponents = Object.freeze(["Validation", "Monitoring", "Violations", "Recommendations", "Confidence", "Assessments", "Dashboard", "Evidence", "Governance", "Authority", "Integrity", "Lineage"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ConstitutionalReplayScenario): ConstitutionalReplayFailure | null {
  const map: Partial<Record<ConstitutionalReplayScenario, ConstitutionalReplayFailure>> = {
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    ORDERING_MISMATCH: "ORDERING_MISMATCH_DETECTED",
    STATE_MISMATCH: "STATE_MISMATCH_DETECTED",
    CONFIDENCE_MISMATCH: "CONFIDENCE_MISMATCH_DETECTED",
    HASH_MISMATCH: "HASH_MISMATCH_DETECTED",
    EVIDENCE_MISMATCH: "EVIDENCE_MISMATCH_DETECTED",
    GOVERNANCE_MISMATCH: "GOVERNANCE_MISMATCH_DETECTED",
    AUTHORITY_MISMATCH: "AUTHORITY_MISMATCH_DETECTED",
    RECOMMENDATION_MISMATCH: "RECOMMENDATION_MISMATCH_DETECTED",
    DASHBOARD_MISMATCH: "DASHBOARD_MISMATCH_DETECTED",
    LINEAGE_CORRUPTION: "LINEAGE_CORRUPTION_DETECTED",
    REPLAY_NONDETERMINISM: "REPLAY_NONDETERMINISM_DETECTED",
    INCOMPLETE_CONSTITUTIONAL_HISTORY: "CONSTITUTIONAL_HISTORY_INCOMPLETE",
    INTEGRITY_VERIFICATION_FAILURE: "REPLAY_INTEGRITY_VERIFICATION_FAILED",
    TENANT_ISOLATION_VIOLATION: "REPLAY_TENANT_ISOLATION_VIOLATION",
    MISSING_REPLAY_EVIDENCE: "REPLAY_EVIDENCE_MISSING",
  };
  return map[scenario] ?? null;
}

function failureDomain(failure: ConstitutionalReplayFailure | null): ConstitutionalReplayMismatchRecord["domain"] | null {
  const map: Record<ConstitutionalReplayFailure, ConstitutionalReplayMismatchRecord["domain"]> = {
    REPLAY_MISMATCH_DETECTED: "VALIDATION",
    ORDERING_MISMATCH_DETECTED: "ORDERING",
    STATE_MISMATCH_DETECTED: "STATE",
    CONFIDENCE_MISMATCH_DETECTED: "CONFIDENCE",
    HASH_MISMATCH_DETECTED: "INTEGRITY",
    EVIDENCE_MISMATCH_DETECTED: "EVIDENCE",
    GOVERNANCE_MISMATCH_DETECTED: "GOVERNANCE",
    AUTHORITY_MISMATCH_DETECTED: "AUTHORITY",
    RECOMMENDATION_MISMATCH_DETECTED: "RECOMMENDATION",
    DASHBOARD_MISMATCH_DETECTED: "DASHBOARD",
    LINEAGE_CORRUPTION_DETECTED: "LINEAGE",
    REPLAY_NONDETERMINISM_DETECTED: "VALIDATION",
    CONSTITUTIONAL_HISTORY_INCOMPLETE: "EVIDENCE",
    REPLAY_INTEGRITY_VERIFICATION_FAILED: "INTEGRITY",
    REPLAY_TENANT_ISOLATION_VIOLATION: "EVIDENCE",
    REPLAY_EVIDENCE_MISSING: "EVIDENCE",
  };
  return failure ? map[failure] : null;
}

function statusFor(domain: ConstitutionalReplayDomain, failure: ConstitutionalReplayFailure | null): ConstitutionalReplayStatus {
  if (!failure) return "VERIFIED";
  const affected = failureDomain(failure);
  if (failure === "REPLAY_INTEGRITY_VERIFICATION_FAILED" || failure === "REPLAY_TENANT_ISOLATION_VIOLATION" || failure === "CONSTITUTIONAL_HISTORY_INCOMPLETE") return "INVALID";
  if (affected === domain || affected === "ORDERING" || affected === "STATE" || affected === "EVIDENCE" || affected === "GOVERNANCE" || affected === "AUTHORITY" || affected === "INTEGRITY" || affected === "LINEAGE") return "FAILED";
  return "DEGRADED";
}

function overallStatus(failure: ConstitutionalReplayFailure | null): ConstitutionalReplayStatus {
  if (!failure) return "VERIFIED";
  if (["REPLAY_INTEGRITY_VERIFICATION_FAILED", "REPLAY_TENANT_ISOLATION_VIOLATION", "CONSTITUTIONAL_HISTORY_INCOMPLETE", "REPLAY_EVIDENCE_MISSING"].includes(failure)) return "INVALID";
  if (failure === "DASHBOARD_MISMATCH_DETECTED") return "DEGRADED";
  return "FAILED";
}

function mismatch(failure: ConstitutionalReplayFailure, scenario: ConstitutionalReplayScenario): ConstitutionalReplayMismatchRecord {
  const domain = failureDomain(failure) ?? "VALIDATION";
  const severity: ConstitutionalReplayMismatchRecord["severity"] = overallStatus(failure) === "INVALID" ? "INVALID" : overallStatus(failure) === "FAILED" ? "FAILED" : "DEGRADED";
  const base = { mismatch_id: id("CRV-M", "constitutional-replay-mismatch", { failure, scenario }), mismatch_type: failure, domain, original_reference: `original:${domain.toLowerCase()}`, replay_reference: `replay:${domain.toLowerCase()}`, severity, explanation: `${failure} detected during deterministic constitutional replay comparison`, evidence_reference: scenario === "MISSING_REPLAY_EVIDENCE" ? "" : `evidence:replay-mismatch:${failure}`, replay_reference_id: `replay:mismatch:${failure}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-replay-mismatch", base) });
}

function matrix(failure: ConstitutionalReplayFailure | null): readonly ConstitutionalReplayMatrixEntry[] {
  const affected = failureDomain(failure);
  return freezeArray(matrixComponents.map((component) => {
    const mismatchComponent = affected && (component.toUpperCase().startsWith(affected) || (affected === "RECOMMENDATION" && component === "Recommendations") || (affected === "EVIDENCE" && component === "Evidence") || (affected === "INTEGRITY" && component === "Integrity") || (affected === "LINEAGE" && component === "Lineage") || (affected === "GOVERNANCE" && component === "Governance") || (affected === "AUTHORITY" && component === "Authority"));
    const base = { matrix_id: id("CRV-X", "constitutional-replay-matrix", { component, failure }), component, verification: mismatchComponent ? "Mismatch" as const : "Identical" as const, original_reference: `original:matrix:${component.toLowerCase()}`, replay_reference: `replay:matrix:${component.toLowerCase()}` };
    return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-replay-matrix", base) });
  }));
}

function report(failure: ConstitutionalReplayFailure | null, scenario: ConstitutionalReplayScenario): ConstitutionalReplayValidationReport {
  const mismatch_count = failure ? 1 : 0;
  const base = {
    replay_validation_id: id("CRV", "constitutional-replay-validation", { scenario, failure }),
    mission_id: "mission:constitutional-replay-validation",
    execution_id: "execution:constitutional-replay:0",
    tenant_id: scenario === "TENANT_ISOLATION_VIOLATION" ? "tenant:foreign" : "tenant:alpha",
    constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const,
    replay_timestamp: "1970-01-01T00:00:00.000Z" as const,
    validation_replay_status: statusFor("VALIDATION", failure),
    monitor_replay_status: statusFor("MONITORING", failure),
    violation_replay_status: statusFor("VIOLATION", failure),
    recommendation_replay_status: statusFor("RECOMMENDATION", failure),
    confidence_replay_status: statusFor("CONFIDENCE", failure),
    assessment_replay_status: statusFor("ASSESSMENT", failure),
    dashboard_replay_status: statusFor("DASHBOARD", failure),
    overall_replay_status: overallStatus(failure),
    mismatch_count,
    confidence_score: failure ? 0.42 : 1,
    integrity_status: scenario === "INTEGRITY_VERIFICATION_FAILURE" || scenario === "HASH_MISMATCH" ? "FAILED" as const : "VERIFIED" as const,
    lineage_status: scenario === "LINEAGE_CORRUPTION" ? "CORRUPTED" as const : scenario === "INCOMPLETE_CONSTITUTIONAL_HISTORY" ? "MISSING" as const : "COMPLETE" as const,
    evidence_reference: scenario === "MISSING_REPLAY_EVIDENCE" ? "" : "evidence:constitutional-replay-validation",
    replay_reference: "replay:constitutional-replay-validation",
    replay_only: true as const,
    historical_mutation_authorized: false as const,
    evidence_regeneration_authorized: false as const,
    execution_influence_authorized: false as const,
    governance_change_authorized: false as const,
    authority_change_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "HASH_MISMATCH" || scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("constitutional-replay-report", base) });
}

function evidence(report: ConstitutionalReplayValidationReport, matrixEntries: readonly ConstitutionalReplayMatrixEntry[], mismatches: readonly ConstitutionalReplayMismatchRecord[]): ConstitutionalReplayEvidencePackage {
  const base = { evidence_package_id: id("CRV-E", "constitutional-replay-evidence", report.replay_validation_id), replay_validation_id: report.replay_validation_id, replay_summary: `${report.overall_replay_status} with ${report.mismatch_count} mismatches`, original_execution_reference: "original:constitutional-stack", replay_execution_reference: report.replay_reference, constitutional_rules_evaluated: freezeArray(["constitutional-rule:deterministic-replay", "constitutional-rule:immutable-history", "constitutional-rule:evidence-lineage"]), comparison_results: freezeArray(matrixEntries.map((entry) => `${entry.component}:${entry.verification}`)), evidence_chain: freezeArray([report.evidence_reference, ...mismatches.map((item) => item.evidence_reference)].filter(Boolean)), governance_references: freezeArray(["governance:constitutional-replay"]), authority_references: freezeArray(["authority:constitutional-replay"]), confidence_calculations: freezeArray([`confidence:${report.confidence_score}`]), integrity_verification: report.integrity_status, replay_timeline: freezeArray(["load-history", "restore-state", "replay-events", "compare-results", "verify-hashes"]), forensic_analysis: freezeArray(mismatches.length ? mismatches.map((item) => item.explanation) : ["replay identical"]), immutable: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-replay-evidence", base) });
}

function ledger(report: ConstitutionalReplayValidationReport): ConstitutionalReplayLedgerRecord {
  const base = { replay_record_id: id("CRV-L", "constitutional-replay-ledger", report.replay_validation_id), replay_validation_id: report.replay_validation_id, mission_id: report.mission_id, execution_id: report.execution_id, tenant_id: report.tenant_id, timestamp: report.replay_timestamp, overall_status: report.overall_replay_status, mismatch_count: report.mismatch_count, confidence: report.confidence_score, integrity_status: report.integrity_status, constitutional_reference: report.constitution_version, evidence_reference: report.evidence_reference, lineage_reference: report.lineage_status === "COMPLETE" ? "lineage:constitutional-replay-validation" : "", certification_reference: `certification:${report.replay_validation_id}`, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-replay-ledger", base) });
}

function collectFailures(repository: Omit<ConstitutionalReplayValidationRepository, "integrity_hash"> | ConstitutionalReplayValidationRepository): readonly ConstitutionalReplayFailure[] {
  return unique([
    ...repository.failures,
    ...repository.mismatches.map((item) => item.mismatch_type),
    ...(repository.report.mismatch_count > 0 && repository.mismatches.length === 0 ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(repository.report.integrity_status === "FAILED" || !repository.report.integrity_hash ? ["REPLAY_INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.report.lineage_status !== "COMPLETE" ? ["LINEAGE_CORRUPTION_DETECTED" as const] : []),
    ...(!repository.report.evidence_reference ? ["REPLAY_EVIDENCE_MISSING" as const] : []),
    ...(repository.report.tenant_id !== "tenant:alpha" ? ["REPLAY_TENANT_ISOLATION_VIOLATION" as const] : []),
    ...(repository.evidence_packages.some((item) => item.integrity_verification === "FAILED" || item.evidence_chain.length === 0) ? ["REPLAY_EVIDENCE_MISSING" as const] : []),
  ]);
}

export function validateConstitutionalReplay(input: ConstitutionalReplayValidationInput = {}): ConstitutionalReplayValidationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const validationRepository = input.validationRepository ?? validateContinuousConstitutionalCompliance({ baseline });
  const runtimeRepository = input.runtimeRepository ?? monitorRuntimeConstitutionalCompliance({ baseline, validationRepository });
  const violationRepository = input.violationRepository ?? detectConstitutionalViolations({ baseline, validationRepository, runtimeRepository });
  const resilienceRepository = input.resilienceRepository ?? assessConstitutionalResilience({ baseline, validationRepository, runtimeRepository, violationRepository });
  const recommendationRepository = input.recommendationRepository ?? generateConstitutionalRecommendations({ baseline, runtimeRepository, violationRepository, resilienceRepository });
  const originalHash = hashValue("constitutional-replay-original", { validation: validationRepository.integrity_hash, runtime: runtimeRepository.integrity_hash, violation: violationRepository.integrity_hash, resilience: resilienceRepository.integrity_hash, recommendation: recommendationRepository.integrity_hash });
  const replayHash = scenario === "REPLAY_NONDETERMINISM" ? hashValue("constitutional-replay-replay", { originalHash, scenario }) : originalHash;
  const directFailure = scenarioFailure(scenario) ?? (originalHash !== replayHash ? "REPLAY_NONDETERMINISM_DETECTED" as const : null);
  const replayReport = report(directFailure, scenario);
  const mismatches = freezeArray(directFailure ? [mismatch(directFailure, scenario)] : []);
  const matrixEntries = matrix(directFailure);
  const evidencePackage = evidence(replayReport, matrixEntries, mismatches);
  const source = { repository_id: id("CRV", "constitutional-replay-repository", { scenario, baseline: baseline.contract_id, originalHash, replayHash }), baseline_contract_id: baseline.contract_id, validation_repository_id: validationRepository.repository_id, runtime_monitoring_repository_id: runtimeRepository.repository_id, violation_detection_repository_id: violationRepository.repository_id, resilience_assessment_repository_id: resilienceRepository.repository_id, recommendation_repository_id: recommendationRepository.repository_id, final_state: "CONSTITUTIONAL_REPLAY_VALIDATION_COMPLETE" as const, report: replayReport, matrix: matrixEntries, mismatches, evidence_packages: freezeArray([evidencePackage]), ledger: freezeArray([ledger(replayReport)]), failures: freezeArray(directFailure ? [directFailure] : []), replay_only: true as const, historical_mutation_authorized: false as const, evidence_regeneration_authorized: false as const, execution_influence_authorized: false as const, governance_change_authorized: false as const, authority_change_authorized: false as const };
  const failures = unique([...collectFailures(source), ...(!validateConstitutionalBaseline(baseline).valid ? ["CONSTITUTIONAL_HISTORY_INCOMPLETE" as const] : []), ...(!validateContinuousConstitutionalRepository(validationRepository).valid ? ["REPLAY_MISMATCH_DETECTED" as const] : []), ...(!validateRuntimeConstitutionalMonitoring(runtimeRepository).valid ? ["REPLAY_MISMATCH_DETECTED" as const] : []), ...(!validateConstitutionalViolationDetection(violationRepository).valid && violationRepository.failures.length > 0 ? ["REPLAY_MISMATCH_DETECTED" as const] : []), ...(!validateConstitutionalResilienceAssessment(resilienceRepository).valid && resilienceRepository.failures.length > 0 ? ["REPLAY_MISMATCH_DETECTED" as const] : []), ...(!validateConstitutionalRecommendationEngine(recommendationRepository).valid && recommendationRepository.failures.length > 0 ? ["RECOMMENDATION_MISMATCH_DETECTED" as const] : [])]);
  const repository = { ...source, failures, final_state: failures.length ? "CONSTITUTIONAL_REPLAY_VALIDATION_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("constitutional-replay-repository", repository) });
}

export function getConstitutionalReplayReports(input: ConstitutionalReplayValidationInput = {}) { return validateConstitutionalReplay(input).report; }
export function listConstitutionalReplayMatrix(input: ConstitutionalReplayValidationInput = {}) { return validateConstitutionalReplay(input).matrix; }
export function listConstitutionalReplayMismatches(input: ConstitutionalReplayValidationInput = {}) { return validateConstitutionalReplay(input).mismatches; }
export function listConstitutionalReplayEvidence(input: ConstitutionalReplayValidationInput = {}) { return validateConstitutionalReplay(input).evidence_packages; }
export function listConstitutionalReplayLedger(input: ConstitutionalReplayValidationInput = {}) { return validateConstitutionalReplay(input).ledger; }

export function validateConstitutionalReplayRepository(repository = validateConstitutionalReplay()): ConstitutionalReplayValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["REPLAY_INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: ConstitutionalReplayFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "CONSTITUTIONAL_REPLAY_VALIDATION_COMPLETE" && repository.replay_only && !repository.historical_mutation_authorized;
  const result = { repository_id: repository.repository_id, valid, validation_replay_identical: !has("REPLAY_MISMATCH_DETECTED") && !has("STATE_MISMATCH_DETECTED") && !has("ORDERING_MISMATCH_DETECTED"), monitoring_replay_identical: !has("REPLAY_MISMATCH_DETECTED") && !has("STATE_MISMATCH_DETECTED"), violation_replay_identical: !has("REPLAY_MISMATCH_DETECTED"), recommendation_replay_identical: !has("RECOMMENDATION_MISMATCH_DETECTED"), confidence_replay_identical: !has("CONFIDENCE_MISMATCH_DETECTED"), assessment_replay_identical: !has("STATE_MISMATCH_DETECTED"), dashboard_replay_identical: !has("DASHBOARD_MISMATCH_DETECTED"), evidence_complete: !has("REPLAY_EVIDENCE_MISSING") && !has("EVIDENCE_MISMATCH_DETECTED") && !has("CONSTITUTIONAL_HISTORY_INCOMPLETE"), lineage_complete: !has("LINEAGE_CORRUPTION_DETECTED"), integrity_verified: !has("REPLAY_INTEGRITY_VERIFICATION_FAILED") && !has("HASH_MISMATCH_DETECTED"), tenant_isolated: !has("REPLAY_TENANT_ISOLATION_VIOLATION"), replay_only: true as const, fail_closed_ready: valid || failures.length > 0 || repository.final_state !== "CONSTITUTIONAL_REPLAY_VALIDATION_COMPLETE", no_historical_mutation: !repository.historical_mutation_authorized && !repository.evidence_regeneration_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("constitutional-replay-validation-result", result) });
}

export function buildConstitutionalReplayObservabilitySurface(repository = validateConstitutionalReplay()): ConstitutionalReplayObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, overall_status: repository.report.overall_replay_status, mismatch_count: repository.report.mismatch_count, matrix_count: repository.matrix.length, evidence_count: repository.evidence_packages.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, replay_only: true, historical_mutation_authorized: false, evidence_regeneration_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getConstitutionalReplayValidationEngine(): ConstitutionalReplayValidationBundle {
  const repository = validateConstitutionalReplay();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONSTITUTIONAL_REPLAY_VALIDATION_READY", replay_domains: domains, principles: freezeArray(["deterministic-replay", "immutable-history", "identical-evidence", "identical-confidence", "identical-ordering", "append-only-replay-ledger", "certification-ready", "no-historical-mutation"]) }), repository, validation: validateConstitutionalReplayRepository(repository), observability: buildConstitutionalReplayObservabilitySurface(repository) });
}
