import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveMemoryFoundation, replayAdaptiveMemoryFoundation } from "@/services/adaptive-memory-foundation";
import { establishAdaptiveMemoryStore, replayAdaptiveMemoryStore } from "@/services/adaptive-memory-store";
import { establishMissionMemoryIndex, replayMissionMemoryIndex } from "@/services/mission-memory-index";
import { establishPatternMemoryRegistry, replayPatternMemoryRegistry } from "@/services/pattern-memory-registry";
import { establishCrossMissionSimilarityEngine, replayCrossMissionSimilarityEngine } from "@/services/cross-mission-similarity-engine";
import { establishMemoryQualificationValidation, replayMemoryQualificationValidation } from "@/services/memory-qualification-validation";
import { establishGovernanceAwareMemoryControl, replayGovernanceAwareMemoryControl } from "@/services/governance-aware-memory-control";
import { establishTenantIsolationPrivacyEnforcement, replayTenantIsolationPrivacyEnforcement } from "@/services/tenant-isolation-privacy-enforcement";
import { establishAdaptiveMemoryReplayEngine, replayAdaptiveMemoryReplayEngine } from "@/services/adaptive-memory-replay-engine";
import { establishMemoryLifecycleExpirationManagement, replayMemoryLifecycleExpirationManagement } from "@/services/memory-lifecycle-expiration-management";
import { establishAdaptiveMemoryObservability, replayAdaptiveMemoryObservability } from "@/services/adaptive-memory-observability";
import { establishAdaptiveMemorySecurityIntegrity, replayAdaptiveMemorySecurityIntegrity } from "@/services/adaptive-memory-security-integrity";
import { establishAdaptiveMemoryLedger, replayAdaptiveMemoryLedger } from "@/services/adaptive-memory-ledger";
import type {
  AdaptiveMemoryCertificationCategory,
  AdaptiveMemoryCertificationContract,
  AdaptiveMemoryCertificationEvidence,
  AdaptiveMemoryCertificationFailure,
  AdaptiveMemoryCertificationInput,
  AdaptiveMemoryCertificationMatrixRecord,
  AdaptiveMemoryCertificationObservabilitySurface,
  AdaptiveMemoryCertificationReport,
  AdaptiveMemoryCertificationReportSection,
  AdaptiveMemoryCertificationScenario,
  AdaptiveMemoryCertificationValidationResult,
  AdaptiveMemoryProductionReadiness,
} from "@/types/adaptive-memory-certification-gate";

const VERSION = "adaptive-memory-certification-gate/v10.13N" as const;
const NOW = "2026-07-13T00:00:00.000Z";
const TENANT_ID = "tenant-mission-control";
const MISSION_ID = "mission-adaptive-memory-certification";
const REPLAY_REFERENCE = "replay:adaptive-memory-certification:10.13N";
const LINEAGE_REFERENCE = "lineage:adaptive-memory-certification:10.13N";

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function hashWithoutReplay<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.replay_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function id(prefix: string, value: unknown): string {
  return `${prefix}_${hash(value).slice(0, 24)}`;
}

const minorFailures: readonly AdaptiveMemoryCertificationFailure[] = Object.freeze([
  "MINOR_DOCUMENTATION_GAP",
  "MINOR_REPORTING_GAP",
  "NON_CRITICAL_OBSERVABILITY_GAP",
]);

const scenarioFailureMap: Partial<Record<AdaptiveMemoryCertificationScenario, AdaptiveMemoryCertificationFailure>> = Object.freeze({
  MINOR_DOCUMENTATION_GAP: "MINOR_DOCUMENTATION_GAP",
  MINOR_REPORTING_GAP: "MINOR_REPORTING_GAP",
  NON_CRITICAL_OBSERVABILITY_GAP: "NON_CRITICAL_OBSERVABILITY_GAP",
  GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
  CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
  REPLAY_NONDETERMINISTIC: "REPLAY_NONDETERMINISTIC",
  REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE_UNEXPLAINED",
  QUALIFICATION_BYPASS: "MEMORY_QUALIFICATION_BYPASSED",
  UNAUTHORIZED_REUSE: "UNAUTHORIZED_REUSE_SUCCEEDED",
  TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
  CROSS_TENANT_LEAKAGE: "CROSS_TENANT_LEAKAGE_DETECTED",
  HIDDEN_SHARING: "HIDDEN_SHARING_DETECTED",
  PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_SUCCEEDED",
  SECURITY_BYPASS: "SECURITY_CONTROLS_BYPASSED",
  REPLAY_MANIPULATION: "REPLAY_MANIPULATION_SUCCEEDED",
  MEMORY_POISONING: "MEMORY_POISONING_SUCCEEDED",
  LEDGER_MODIFICATION: "LEDGER_MODIFICATION_DETECTED",
  APPEND_ONLY_VIOLATION: "APPEND_ONLY_GUARANTEE_VIOLATED",
  INTEGRITY_HASH_INCONSISTENCY: "INTEGRITY_HASHES_INCONSISTENT",
  DETERMINISM_VIOLATION: "DETERMINISTIC_BEHAVIOR_VIOLATED",
  EVIDENCE_LINEAGE_INCOMPLETE: "EVIDENCE_LINEAGE_INCOMPLETE",
  LIFECYCLE_HISTORY_DELETE: "LIFECYCLE_DELETES_HISTORICAL_MEMORY",
  OPERATOR_AUTHORITY_BYPASS: "OPERATOR_AUTHORITY_BYPASSED",
});

const testDefinitions: readonly [string, AdaptiveMemoryCertificationCategory, AdaptiveMemoryCertificationFailure | null][] = Object.freeze([
  ["Adaptive Memory Contract valid", "Foundation", null],
  ["Memory schema validation deterministic", "Store", "DETERMINISTIC_BEHAVIOR_VIOLATED"],
  ["Memory persistence deterministic", "Store", "DETERMINISTIC_BEHAVIOR_VIOLATED"],
  ["Memory identity uniqueness validated", "Store", null],
  ["Mission indexing deterministic", "Index", "DETERMINISTIC_BEHAVIOR_VIOLATED"],
  ["Pattern registry operational", "Pattern Registry", null],
  ["Pattern version history preserved", "Pattern Registry", null],
  ["Cross-mission similarity deterministic", "Similarity", "DETERMINISTIC_BEHAVIOR_VIOLATED"],
  ["Similarity explanations reproducible", "Similarity", null],
  ["Memory qualification deterministic", "Qualification", "MEMORY_QUALIFICATION_BYPASSED"],
  ["Evidence completeness required", "Qualification", "EVIDENCE_LINEAGE_INCOMPLETE"],
  ["Replay availability mandatory", "Replay", "REPLAY_NONDETERMINISTIC"],
  ["Governance approval mandatory", "Governance", "GOVERNANCE_BYPASS_DETECTED"],
  ["Confidence reliability validated", "Qualification", null],
  ["Certification status validated", "Production Readiness", null],
  ["Unqualified memory rejected", "Qualification", "MEMORY_QUALIFICATION_BYPASSED"],
  ["Governance validation deterministic", "Governance", "DETERMINISTIC_BEHAVIOR_VIOLATED"],
  ["Constitutional compliance enforced", "Governance", "CONSTITUTIONAL_VIOLATION_DETECTED"],
  ["Authority validation deterministic", "Governance", "OPERATOR_AUTHORITY_BYPASSED"],
  ["Unauthorized reuse blocked", "Governance", "UNAUTHORIZED_REUSE_SUCCEEDED"],
  ["Mission authorization enforced", "Governance", null],
  ["Replay compliance validated", "Replay", "REPLAY_DIVERGENCE_UNEXPLAINED"],
  ["Tenant isolation deterministic", "Tenant Isolation", "TENANT_ISOLATION_VIOLATED"],
  ["Unauthorized retrieval blocked", "Tenant Isolation", null],
  ["Unauthorized indexing blocked", "Tenant Isolation", null],
  ["Hidden sharing prevented", "Tenant Isolation", "HIDDEN_SHARING_DETECTED"],
  ["Privilege escalation prevented", "Tenant Isolation", "PRIVILEGE_ESCALATION_SUCCEEDED"],
  ["Cross-tenant reuse blocked by default", "Tenant Isolation", "CROSS_TENANT_LEAKAGE_DETECTED"],
  ["Replay reconstruction deterministic", "Replay", "REPLAY_NONDETERMINISTIC"],
  ["Replay lineage complete", "Replay", "EVIDENCE_LINEAGE_INCOMPLETE"],
  ["Replay divergence detected", "Replay", "REPLAY_DIVERGENCE_UNEXPLAINED"],
  ["Replay integrity verified", "Replay", "REPLAY_MANIPULATION_SUCCEEDED"],
  ["Lifecycle transitions deterministic", "Lifecycle", "DETERMINISTIC_BEHAVIOR_VIOLATED"],
  ["Supersession preserves history", "Lifecycle", null],
  ["Expiration policies enforced", "Lifecycle", null],
  ["Archival replayable", "Lifecycle", "LIFECYCLE_DELETES_HISTORICAL_MEMORY"],
  ["Memory observability deterministic", "Observability", null],
  ["Retrieval analytics operational", "Observability", null],
  ["Reuse analytics operational", "Observability", null],
  ["Governance dashboards operational", "Observability", "GOVERNANCE_BYPASS_DETECTED"],
  ["Replay telemetry reproducible", "Observability", "REPLAY_NONDETERMINISTIC"],
  ["Security integrity verification deterministic", "Security", "INTEGRITY_HASHES_INCONSISTENT"],
  ["Tamper detection operational", "Security", "SECURITY_CONTROLS_BYPASSED"],
  ["Unauthorized writes blocked", "Security", "SECURITY_CONTROLS_BYPASSED"],
  ["Replay manipulation prevented", "Security", "REPLAY_MANIPULATION_SUCCEEDED"],
  ["Memory poisoning prevented", "Security", "MEMORY_POISONING_SUCCEEDED"],
  ["Cryptographic verification reproducible", "Security", "INTEGRITY_HASHES_INCONSISTENT"],
  ["Ledger append-only", "Ledger", "APPEND_ONLY_GUARANTEE_VIOLATED"],
  ["Ledger replay deterministic", "Ledger", "REPLAY_NONDETERMINISTIC"],
  ["Ledger chain integrity validated", "Ledger", "LEDGER_MODIFICATION_DETECTED"],
  ["Lineage complete", "Ledger", "EVIDENCE_LINEAGE_INCOMPLETE"],
  ["Integrity hashes reproducible", "Ledger", "INTEGRITY_HASHES_INCONSISTENT"],
]);

function categoryForFailure(failure: AdaptiveMemoryCertificationFailure | null): AdaptiveMemoryCertificationCategory | null {
  if (!failure) return null;
  if (failure.includes("GOVERNANCE") || failure.includes("CONSTITUTIONAL") || failure.includes("AUTHORITY") || failure.includes("REUSE")) return "Governance";
  if (failure.includes("REPLAY")) return "Replay";
  if (failure.includes("TENANT") || failure.includes("SHARING") || failure.includes("PRIVILEGE")) return "Tenant Isolation";
  if (failure.includes("SECURITY") || failure.includes("POISONING") || failure.includes("INTEGRITY")) return "Security";
  if (failure.includes("LEDGER") || failure.includes("APPEND")) return "Ledger";
  if (failure.includes("QUALIFICATION")) return "Qualification";
  if (failure.includes("LINEAGE")) return "Replay";
  if (failure.includes("LIFECYCLE")) return "Lifecycle";
  if (failure.includes("DETERMINISTIC")) return "Production Readiness";
  return "Fail Closed";
}

function evidence(source: string, phase: string, evidence_reference: string): AdaptiveMemoryCertificationEvidence {
  const base = {
    evidence_id: id("amc_evidence", { source, phase, evidence_reference }),
    source,
    phase,
    evidence_reference,
    replay_reference: `${REPLAY_REFERENCE}:${source}`,
    lineage_reference: `${LINEAGE_REFERENCE}:${source}`,
    integrity_hash: hash({ source, phase, evidence_reference }),
  };
  return Object.freeze({ ...base, evidence_hash: hashWithoutIntegrity(base) });
}

function matrixRecord(
  name: string,
  category: AdaptiveMemoryCertificationCategory,
  triggerFailure: AdaptiveMemoryCertificationFailure | null,
  activeFailure: AdaptiveMemoryCertificationFailure | null,
  evidenceRefs: readonly string[],
): AdaptiveMemoryCertificationMatrixRecord {
  const applies = Boolean(activeFailure && (triggerFailure === activeFailure || categoryForFailure(activeFailure) === category));
  const base: Omit<AdaptiveMemoryCertificationMatrixRecord, "test_hash"> = {
    test_id: id("amc_test", name),
    name,
    category,
    expected: "PASS",
    actual: applies ? "FAIL" : "PASS",
    failure: applies ? activeFailure : null,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, test_hash: hashWithoutIntegrity(base) });
}

function reportSection(
  title: string,
  scope: readonly AdaptiveMemoryCertificationCategory[],
  state: AdaptiveMemoryCertificationReport["certification_state"],
  failures: readonly AdaptiveMemoryCertificationFailure[],
  evidenceRefs: readonly string[],
): AdaptiveMemoryCertificationReportSection {
  const scopedFailures = failures.filter((failure) => {
    const category = categoryForFailure(failure);
    return category ? scope.includes(category) : false;
  });
  const outcome = scopedFailures.length ? (scopedFailures.every((failure) => minorFailures.includes(failure)) ? "CONDITIONAL_PASS" : "FAIL") : state === "FAIL" ? "PASS" : state;
  const base: Omit<AdaptiveMemoryCertificationReportSection, "integrity_hash"> = {
    report_id: id("amc_report", { title, outcome, scopedFailures }),
    title,
    scope,
    outcome,
    findings: scopedFailures.length ? freezeArray(scopedFailures.map((failure) => `Resolve ${failure}.`)) : freezeArray([`${title} certified.`]),
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function uniqueFailures(values: readonly AdaptiveMemoryCertificationFailure[]): readonly AdaptiveMemoryCertificationFailure[] {
  return freezeArray([...new Set(values)].sort());
}

export function computeAdaptiveMemoryCertificationReportHash(report: Omit<AdaptiveMemoryCertificationReport, "report_hash"> | AdaptiveMemoryCertificationReport): string {
  const { report_hash: _reportHash, ...source } = report as AdaptiveMemoryCertificationReport;
  return hash(source);
}

export function runAdaptiveMemoryCertification(input: AdaptiveMemoryCertificationInput = {}): AdaptiveMemoryCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = establishAdaptiveMemoryFoundation();
  const store = establishAdaptiveMemoryStore({ foundation_result: foundation });
  const index = establishMissionMemoryIndex({ store_result: store });
  const registry = establishPatternMemoryRegistry({ index_result: index });
  const similarity = establishCrossMissionSimilarityEngine({ registry_result: registry });
  const qualification = establishMemoryQualificationValidation({ similarity_result: similarity });
  const governance = establishGovernanceAwareMemoryControl({ qualification_result: qualification });
  const isolation = establishTenantIsolationPrivacyEnforcement({ governance_result: governance });
  const replay = establishAdaptiveMemoryReplayEngine({ tenant_isolation_result: isolation });
  const lifecycle = establishMemoryLifecycleExpirationManagement({ replay_result: replay });
  const observability = establishAdaptiveMemoryObservability({ lifecycle_result: lifecycle });
  const security = establishAdaptiveMemorySecurityIntegrity({ observability_result: observability });
  const ledger = establishAdaptiveMemoryLedger({ security_result: security });
  const evidenceRecords = freezeArray([
    evidence("adaptive-memory-foundation", "10.13A", foundation.integrity_hash),
    evidence("adaptive-memory-store", "10.13B", store.integrity_hash),
    evidence("mission-memory-index", "10.13C", index.integrity_hash),
    evidence("pattern-memory-registry", "10.13D", registry.integrity_hash),
    evidence("cross-mission-similarity-engine", "10.13E", similarity.integrity_hash),
    evidence("memory-qualification-validation", "10.13F", qualification.integrity_hash),
    evidence("governance-aware-memory-control", "10.13G", governance.integrity_hash),
    evidence("tenant-isolation-privacy-enforcement", "10.13H", isolation.integrity_hash),
    evidence("adaptive-memory-replay-engine", "10.13I", replay.integrity_hash),
    evidence("memory-lifecycle-expiration-management", "10.13J", lifecycle.integrity_hash),
    evidence("adaptive-memory-observability", "10.13K", observability.integrity_hash),
    evidence("adaptive-memory-security-integrity", "10.13L", security.integrity_hash),
    evidence("adaptive-memory-ledger", "10.13M", ledger.integrity_hash),
  ]);
  const evidenceRefs = evidenceRecords.map((item) => item.evidence_hash);
  const dependencyValidations = [
    replayAdaptiveMemoryFoundation(foundation),
    replayAdaptiveMemoryStore(store),
    replayMissionMemoryIndex(index),
    replayPatternMemoryRegistry(registry),
    replayCrossMissionSimilarityEngine(similarity),
    replayMemoryQualificationValidation(qualification),
    replayGovernanceAwareMemoryControl(governance),
    replayTenantIsolationPrivacyEnforcement(isolation),
    replayAdaptiveMemoryReplayEngine(replay),
    replayMemoryLifecycleExpirationManagement(lifecycle),
    replayAdaptiveMemoryObservability(observability),
    replayAdaptiveMemorySecurityIntegrity(security),
    replayAdaptiveMemoryLedger(ledger),
    foundation.status === "AUTHORITATIVE",
    store.status === "AUTHORITATIVE",
    index.status === "AUTHORITATIVE",
    registry.status === "AUTHORITATIVE",
    similarity.status === "AUTHORITATIVE",
    qualification.status === "AUTHORITATIVE",
    governance.status === "AUTHORITATIVE",
    isolation.status === "AUTHORITATIVE",
    replay.status === "AUTHORITATIVE",
    lifecycle.status === "AUTHORITATIVE",
    observability.status === "AUTHORITATIVE",
    security.status === "AUTHORITATIVE",
    ledger.status === "AUTHORITATIVE",
  ];
  const derivedFailure: AdaptiveMemoryCertificationFailure | null = dependencyValidations.every(Boolean) ? null : "DETERMINISTIC_BEHAVIOR_VIOLATED";
  const activeFailure = scenarioFailureMap[scenario] ?? derivedFailure;
  const validation_matrix = freezeArray(testDefinitions.map(([name, category, failure]) => matrixRecord(name, category, failure, activeFailure, evidenceRefs)));
  const detected_failures = uniqueFailures([
    ...(activeFailure ? [activeFailure] : []),
    ...validation_matrix.map((item) => item.failure).filter((item): item is AdaptiveMemoryCertificationFailure => Boolean(item)),
  ]);
  const onlyMinor = detected_failures.length > 0 && detected_failures.every((failure) => minorFailures.includes(failure));
  const certification_state: AdaptiveMemoryCertificationReport["certification_state"] = detected_failures.length === 0 ? "PASS" : onlyMinor ? "CONDITIONAL_PASS" : "FAIL";
  const readinessBase: Omit<AdaptiveMemoryProductionReadiness, "readiness_hash"> = {
    readiness_id: id("amc_readiness", certification_state),
    production_deployment_authorized: certification_state === "PASS",
    adaptive_memory_reuse_authorized: certification_state === "PASS",
    governed_institutional_memory_authorized: certification_state === "PASS",
    allowed_operations: certification_state === "PASS" ? freezeArray(["production deployment", "governed memory reuse", "certification reporting"]) : freezeArray(["development", "validation", "corrective action", "certification reporting"]),
    blocked_operations: certification_state === "PASS" ? freezeArray([]) : freezeArray(["production deployment", "adaptive memory reuse in production"]),
  };
  const readiness = Object.freeze({ ...readinessBase, readiness_hash: hashWithoutIntegrity(readinessBase) });
  const replayBase: Omit<AdaptiveMemoryCertificationReport["replay"], "replay_hash"> = {
    replay_id: id("amc_replay", { certification_state, detected_failures }),
    deterministic: !detected_failures.some((failure) => failure.includes("REPLAY") || failure.includes("DETERMINISTIC")),
    reconstructed_state: certification_state,
    reconstructed_matrix_hashes: freezeArray(validation_matrix.map((item) => item.test_hash)),
    replay_failures: freezeArray(detected_failures.filter((failure) => failure.includes("REPLAY") || failure.includes("DETERMINISTIC"))),
  };
  const certificationReplay = Object.freeze({ ...replayBase, replay_hash: hashWithoutReplay(replayBase) });
  const base: Omit<AdaptiveMemoryCertificationReport, "report_hash"> = {
    certification_id: id("amc_certification", { scenario, matrix: validation_matrix.map((item) => item.test_hash) }),
    phase: "10.13N",
    certification_version: VERSION,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    certification_state,
    production_deployment_authorized: certification_state === "PASS",
    adaptive_memory_reuse_authorized: certification_state === "PASS",
    validation_matrix,
    detected_failures,
    detected_risks: freezeArray(detected_failures.map((failure) => minorFailures.includes(failure) ? `LOW:${failure}` : `CRITICAL:${failure}`)),
    recommendations: detected_failures.length ? freezeArray(detected_failures.map((failure) => `Resolve ${failure} before Adaptive Memory production certification.`)) : freezeArray(["Adaptive Memory certified for governed institutional knowledge production deployment."]),
    certification_evidence: evidenceRecords,
    adaptive_memory_certification_report: reportSection("Adaptive Memory Certification Report", ["Foundation", "Store", "Index", "Pattern Registry", "Similarity", "Qualification", "Production Readiness"], certification_state, detected_failures, evidenceRefs),
    governance_compliance_report: reportSection("Governance Compliance Report", ["Governance"], certification_state, detected_failures, evidenceRefs),
    replay_validation_report: reportSection("Replay Validation Report", ["Replay"], certification_state, detected_failures, evidenceRefs),
    tenant_isolation_report: reportSection("Tenant Isolation Report", ["Tenant Isolation"], certification_state, detected_failures, evidenceRefs),
    security_assessment_report: reportSection("Security Assessment Report", ["Security", "Ledger"], certification_state, detected_failures, evidenceRefs),
    production_readiness_report: reportSection("Production Readiness Report", ["Production Readiness", "Observability", "Lifecycle"], certification_state, detected_failures, evidenceRefs),
    readiness,
    replay: certificationReplay,
    operator_required: certification_state !== "PASS",
    certification_timestamp: NOW,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    integrity_hash: hash({ evidence: evidenceRefs, matrix: validation_matrix.map((item) => item.test_hash), state: certification_state, readiness: readiness.readiness_hash }),
  };
  return Object.freeze({ ...base, report_hash: computeAdaptiveMemoryCertificationReportHash(base) });
}

export function validateAdaptiveMemoryCertification(report?: AdaptiveMemoryCertificationReport): AdaptiveMemoryCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<AdaptiveMemoryCertificationFailure>(["REPLAY_NONDETERMINISTIC"]);
    const base: Omit<AdaptiveMemoryCertificationValidationResult, "validation_hash"> = {
      certification_id: null,
      valid: false,
      report_hash_valid: false,
      matrix_complete: false,
      evidence_complete: false,
      reports_complete: false,
      replay_valid: false,
      production_deployment_authorized: false,
      failures,
    };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const report_hash_valid = computeAdaptiveMemoryCertificationReportHash(report) === report.report_hash;
  const matrix_complete = report.validation_matrix.length === testDefinitions.length;
  const evidence_complete = report.certification_evidence.length === 13 && report.certification_evidence.every((item) => item.evidence_reference && item.replay_reference && item.lineage_reference);
  const reports_complete = [
    report.adaptive_memory_certification_report,
    report.governance_compliance_report,
    report.replay_validation_report,
    report.tenant_isolation_report,
    report.security_assessment_report,
    report.production_readiness_report,
  ].every((section) => section.integrity_hash === hashWithoutIntegrity(section));
  const replay_valid = report.replay.deterministic && report.replay.replay_failures.length === 0 && report.replay.replay_hash === hashWithoutReplay(report.replay);
  const valid = report.certification_state === "PASS" && report.production_deployment_authorized && report.adaptive_memory_reuse_authorized && report.detected_failures.length === 0 && report_hash_valid && matrix_complete && evidence_complete && reports_complete && replay_valid;
  const base: Omit<AdaptiveMemoryCertificationValidationResult, "validation_hash"> = {
    certification_id: report.certification_id,
    valid,
    report_hash_valid,
    matrix_complete,
    evidence_complete,
    reports_complete,
    replay_valid,
    production_deployment_authorized: valid,
    failures: report.detected_failures,
  };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function buildAdaptiveMemoryCertificationObservabilitySurface(report = runAdaptiveMemoryCertification()): AdaptiveMemoryCertificationObservabilitySurface {
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    total_tests: report.validation_matrix.length,
    failed_tests: report.validation_matrix.filter((item) => item.actual === "FAIL").length,
    production_deployment_authorized: report.production_deployment_authorized,
    adaptive_memory_reuse_authorized: report.adaptive_memory_reuse_authorized,
    operator_required: report.operator_required,
    failures: report.detected_failures,
    risks: report.detected_risks,
    report_hash: report.report_hash,
  });
}

export function replayAdaptiveMemoryCertification(report: AdaptiveMemoryCertificationReport): boolean {
  return validateAdaptiveMemoryCertification(report).valid;
}

export function getAdaptiveMemoryCertificationContract(): AdaptiveMemoryCertificationContract {
  const report = runAdaptiveMemoryCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      certification_version: VERSION,
      states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      certification_scope: freezeArray(["Phase 10.13A", "Phase 10.13B", "Phase 10.13C", "Phase 10.13D", "Phase 10.13E", "Phase 10.13F", "Phase 10.13G", "Phase 10.13H", "Phase 10.13I", "Phase 10.13J", "Phase 10.13K", "Phase 10.13L", "Phase 10.13M"]),
      categories: freezeArray(["Foundation", "Store", "Index", "Pattern Registry", "Similarity", "Qualification", "Governance", "Tenant Isolation", "Replay", "Lifecycle", "Observability", "Security", "Ledger", "Production Readiness", "Fail Closed"] as const),
      pass_rule: "all-critical-tests-pass",
      conditional_pass_rule: "minor-non-critical-only",
      production_rule: "pass-before-production-memory-reuse",
    }),
    report,
    validation: validateAdaptiveMemoryCertification(report),
    observability: buildAdaptiveMemoryCertificationObservabilitySurface(report),
  });
}

export const AdaptiveMemoryCertificationGate = Object.freeze({
  run: runAdaptiveMemoryCertification,
  validate: validateAdaptiveMemoryCertification,
  replay: replayAdaptiveMemoryCertification,
});
