import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runSecurityGovernanceValidation } from "@/services/security-governance-validation-engine";
import type {
  ReplayIntegrityCertificationInput,
  ReplayIntegrityCertificationObservabilitySurface,
  ReplayIntegrityCertificationReport,
  ReplayIntegrityCertificationValidationResult,
  ReplayIntegrityDomain,
  ReplayIntegrityDomainResult,
  ReplayIntegrityEvidence,
  ReplayIntegrityFailure,
  ReplayIntegrityRisk,
  ReplayIntegrityScenario,
} from "@/types/replay-integrity-certification-engine";
import type { AutonomyCertificationComponent } from "@/types/autonomy-certification-contract";

const NOW = "2026-07-01T10:00:00.000Z";
const ENGINE_VERSION = "replay-integrity-certification-engine/v8K.4" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:replay-integrity-certification:8k4:primary";
const LINEAGE_REFERENCE = "lineage:replay-integrity-certification:8k4:primary";

const scope: readonly AutonomyCertificationComponent[] = ["PLANNING_ENGINE", "EXECUTION_ORCHESTRATION", "DELEGATION_INTELLIGENCE", "EXECUTION_ASSURANCE", "RUNTIME_SUPERVISION", "BOUNDARY_ENFORCEMENT", "REPLAY_FRAMEWORK", "INTEGRITY_FRAMEWORK", "QUERY_SEARCH", "VISIBILITY_FRAMEWORK", "CONTROLLED_AUTONOMY"];
const domains: readonly ReplayIntegrityDomain[] = ["REPLAY", "TIMELINE", "PLANNING", "EXECUTION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "INTEGRITY", "HASH_CHAIN", "LINEAGE", "EVIDENCE", "VISIBILITY", "TENANT"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const failureByScenario: Partial<Record<ReplayIntegrityScenario, ReplayIntegrityFailure>> = Object.freeze({
  REPLAY_RECONSTRUCTION_FAILS: "REPLAY_RECONSTRUCTION_FAILED",
  REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
  PLANNING_REPLAY_DIVERGES: "PLANNING_REPLAY_DIVERGENCE_DETECTED",
  EXECUTION_REPLAY_DIVERGES: "EXECUTION_REPLAY_DIVERGENCE_DETECTED",
  DELEGATION_REPLAY_DIVERGES: "DELEGATION_REPLAY_DIVERGENCE_DETECTED",
  SUPERVISION_REPLAY_DIVERGES: "SUPERVISION_REPLAY_DIVERGENCE_DETECTED",
  GOVERNANCE_REPLAY_DIVERGES: "GOVERNANCE_REPLAY_DIVERGENCE_DETECTED",
  INTEGRITY_VERIFICATION_FAILS: "INTEGRITY_VERIFICATION_FAILED",
  HASH_MISMATCH: "HASH_MISMATCH_DETECTED",
  HASH_CHAIN_BROKEN: "HASH_CHAIN_BROKEN",
  LINEAGE_BREAK: "LINEAGE_BREAK_DETECTED",
  REPLAY_REFERENCES_MISSING: "REPLAY_REFERENCE_MISSING",
  IMMUTABLE_IDENTIFIER_MISMATCH: "IMMUTABLE_IDENTIFIER_MISMATCH",
  EVIDENCE_CORRUPTION: "EVIDENCE_CORRUPTION_DETECTED",
  HIDDEN_EXECUTION_HISTORY: "HIDDEN_EXECUTION_HISTORY_DETECTED",
  HISTORICAL_TRUTH_MODIFIED: "HISTORICAL_TRUTH_MODIFIED",
  REPLAY_VISUALIZATION_INCONSISTENT: "REPLAY_VISUALIZATION_INCONSISTENT",
  TENANT_ISOLATION_VIOLATED: "TENANT_ISOLATION_VIOLATED",
  CROSS_TENANT_REPLAY: "CROSS_TENANT_REPLAY_DETECTED",
  FAIL_OPEN_REPLAY_BEHAVIOR: "FAIL_OPEN_REPLAY_BEHAVIOR_DETECTED",
});

function domainFor(failure: ReplayIntegrityFailure | null): ReplayIntegrityDomain | null {
  if (!failure) return null;
  if (["REPLAY_RECONSTRUCTION_FAILED", "REPLAY_MISMATCH_DETECTED", "REPLAY_REFERENCE_MISSING", "FAIL_OPEN_REPLAY_BEHAVIOR_DETECTED"].includes(failure)) return "REPLAY";
  if (failure === "PLANNING_REPLAY_DIVERGENCE_DETECTED") return "PLANNING";
  if (["EXECUTION_REPLAY_DIVERGENCE_DETECTED", "HIDDEN_EXECUTION_HISTORY_DETECTED"].includes(failure)) return "EXECUTION";
  if (failure === "DELEGATION_REPLAY_DIVERGENCE_DETECTED") return "DELEGATION";
  if (failure === "SUPERVISION_REPLAY_DIVERGENCE_DETECTED") return "SUPERVISION";
  if (failure === "GOVERNANCE_REPLAY_DIVERGENCE_DETECTED") return "GOVERNANCE";
  if (["INTEGRITY_VERIFICATION_FAILED", "HASH_MISMATCH_DETECTED", "IMMUTABLE_IDENTIFIER_MISMATCH", "HISTORICAL_TRUTH_MODIFIED"].includes(failure)) return "INTEGRITY";
  if (failure === "HASH_CHAIN_BROKEN") return "HASH_CHAIN";
  if (failure === "LINEAGE_BREAK_DETECTED") return "LINEAGE";
  if (failure === "EVIDENCE_CORRUPTION_DETECTED") return "EVIDENCE";
  if (failure === "REPLAY_VISUALIZATION_INCONSISTENT") return "VISIBILITY";
  if (["TENANT_ISOLATION_VIOLATED", "CROSS_TENANT_REPLAY_DETECTED"].includes(failure)) return "TENANT";
  return "REPLAY";
}

function riskFor(failure: ReplayIntegrityFailure | null): ReplayIntegrityRisk {
  if (!failure) return "NONE";
  if (["HISTORICAL_TRUTH_MODIFIED", "CROSS_TENANT_REPLAY_DETECTED", "FAIL_OPEN_REPLAY_BEHAVIOR_DETECTED", "INTEGRITY_VERIFICATION_FAILED"].includes(failure)) return "CRITICAL";
  if (["HASH_CHAIN_BROKEN", "EVIDENCE_CORRUPTION_DETECTED", "HIDDEN_EXECUTION_HISTORY_DETECTED"].includes(failure)) return "HIGH";
  return "MEDIUM";
}

function evidence(domain: ReplayIntegrityDomain, scenario: ReplayIntegrityScenario): ReplayIntegrityEvidence {
  const missingReplay = scenario === "REPLAY_REFERENCES_MISSING" && domain === "REPLAY";
  const immutableMismatch = scenario === "IMMUTABLE_IDENTIFIER_MISMATCH" && domain === "INTEGRITY";
  const crossTenant = scenario === "CROSS_TENANT_REPLAY" && domain === "TENANT";
  const corruptEvidence = scenario === "EVIDENCE_CORRUPTION" && domain === "EVIDENCE";
  const source = {
    evidence_id: id("RICE", "replay-integrity-evidence-id", domain),
    domain,
    tenant_id: crossTenant ? "tenant:other" : TENANT_ID,
    replay_reference: missingReplay ? "" : `${REPLAY_REFERENCE}:${domain.toLowerCase()}`,
    lineage_reference: `${LINEAGE_REFERENCE}:${domain.toLowerCase()}`,
    integrity_hash: corruptEvidence ? "" : hashValue("replay-integrity-evidence-integrity", domain),
    immutable_identifier: immutableMismatch ? "mutable:identifier:mismatch" : `immutable:replay-integrity:${domain.toLowerCase()}:8k4`,
    hash_chain_reference: `hash-chain:replay-integrity:${domain.toLowerCase()}:8k4`,
    evidence_reference: corruptEvidence ? "" : `evidence:replay-integrity:${domain.toLowerCase()}:8k4`,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("replay-integrity-evidence", source) });
}

function result(domain: ReplayIntegrityDomain, scenario: ReplayIntegrityScenario, evidenceRefs: readonly string[]): ReplayIntegrityDomainResult {
  const failure = failureByScenario[scenario] ?? null;
  const hit = domainFor(failure) === domain || (domain === "TIMELINE" && failure === "EXECUTION_REPLAY_DIVERGENCE_DETECTED");
  const source = {
    result_id: id("RICR", "replay-integrity-result-id", domain),
    domain,
    status: hit ? "FAIL" as const : "PASS" as const,
    score: hit ? 0 : 1,
    detected_failure: hit ? failure : null,
    risk: riskFor(hit ? failure : null),
    explanation: hit ? `${domain} certification detected ${failure}.` : `${domain} replay and integrity certification passed.`,
    evidence_refs: freezeArray(evidenceRefs),
  };
  return Object.freeze({ ...source, result_hash: hashValue("replay-integrity-domain-result", source) });
}

export function computeReplayIntegrityCertificationReportHash(report: Omit<ReplayIntegrityCertificationReport, "report_hash"> | ReplayIntegrityCertificationReport): string {
  const { report_hash: _hash, ...source } = report as ReplayIntegrityCertificationReport;
  return hashValue("replay-integrity-certification-report", source);
}

export function runReplayIntegrityCertification(input: ReplayIntegrityCertificationInput = {}): ReplayIntegrityCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const component = input.component ?? "CONTROLLED_AUTONOMY";
  const security = runSecurityGovernanceValidation({ component });
  const evidenceRecords = freezeArray(domains.map((domain) => evidence(domain, scenario)));
  const evidenceRefs = evidenceRecords.map((item) => item.evidence_hash);
  const results = Object.fromEntries(domains.map((domain) => [domain, result(domain, scenario, evidenceRefs)])) as Record<ReplayIntegrityDomain, ReplayIntegrityDomainResult>;
  const failures = uniq(Object.values(results).map((item) => item.detected_failure).filter((item): item is ReplayIntegrityFailure => Boolean(item)));
  const evidenceFailures = uniq([
    ...failures,
    ...(evidenceRecords.some((item) => !item.replay_reference) ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(evidenceRecords.some((item) => item.tenant_id !== TENANT_ID) ? ["CROSS_TENANT_REPLAY_DETECTED" as const] : []),
    ...(evidenceRecords.some((item) => !item.integrity_hash || !item.evidence_reference) ? ["EVIDENCE_CORRUPTION_DETECTED" as const] : []),
  ]);
  const replayScore = Number((["REPLAY", "TIMELINE", "PLANNING", "EXECUTION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "VISIBILITY"].filter((domain) => results[domain as ReplayIntegrityDomain].status === "PASS").length / 8).toFixed(4));
  const integrityScore = Number((["INTEGRITY", "HASH_CHAIN", "LINEAGE", "EVIDENCE", "TENANT"].filter((domain) => results[domain as ReplayIntegrityDomain].status === "PASS").length / 5).toFixed(4));
  const overall = Number((Object.values(results).filter((item) => item.status === "PASS").length / domains.length).toFixed(4));
  const integrity_hash = hashValue("replay-integrity-certification-integrity", { evidence: evidenceRecords.map((item) => item.evidence_hash), results: Object.values(results).map((item) => item.result_hash), security: security.report_hash });
  const base = {
    certification_id: id("RIC", "replay-integrity-certification-id", { scenario, component }),
    engine_version: ENGINE_VERSION,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    component,
    certification_scope: freezeArray(scope),
    replay_validation: results.REPLAY,
    timeline_validation: results.TIMELINE,
    planning_validation: results.PLANNING,
    execution_validation: results.EXECUTION,
    delegation_validation: results.DELEGATION,
    supervision_validation: results.SUPERVISION,
    governance_validation: results.GOVERNANCE,
    integrity_validation: results.INTEGRITY,
    hash_validation: results.HASH_CHAIN,
    lineage_validation: results.LINEAGE,
    evidence_validation: results.EVIDENCE,
    visibility_validation: results.VISIBILITY,
    tenant_validation: results.TENANT,
    replay_score: replayScore,
    integrity_score: integrityScore,
    overall_score: overall,
    detected_failures: evidenceFailures,
    detected_risks: freezeArray(evidenceFailures.map((failure) => `${riskFor(failure)}:${failure}`)),
    recommendations: evidenceFailures.length === 0 ? freezeArray(["Replay and integrity certification passed."]) : freezeArray(evidenceFailures.map((failure) => `Resolve ${failure} before final autonomy certification.`)),
    operator_required: evidenceFailures.length > 0,
    certification_state: "COMPLETE" as const,
    lineage_reference: LINEAGE_REFERENCE,
    replay_reference: REPLAY_REFERENCE,
    integrity_hash,
    evidence: evidenceRecords,
    security_governance_validation: security,
    certification_timestamp: NOW,
    metadata: Object.freeze({ replay_determinism: "true", historical_truth: "immutable", hash_chain_validation: "enabled", fail_closed: "true" }),
  };
  return Object.freeze({ ...base, report_hash: computeReplayIntegrityCertificationReportHash(base as Omit<ReplayIntegrityCertificationReport, "report_hash">) });
}

export function validateReplayIntegrityCertificationReport(report?: ReplayIntegrityCertificationReport): ReplayIntegrityCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<ReplayIntegrityFailure>(["REPLAY_RECONSTRUCTION_FAILED"]);
    const source = { certification_id: null, valid: false, report_hash_valid: false, evidence_complete: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("replay-integrity-certification-validation", source) });
  }
  const report_hash_valid = computeReplayIntegrityCertificationReportHash(report) === report.report_hash;
  const evidence_complete = report.evidence.every((item) => item.evidence_hash && item.replay_reference && item.lineage_reference && item.integrity_hash && item.tenant_id === report.tenant_id);
  const valid = report.detected_failures.length === 0 && report.overall_score === 1 && report_hash_valid && evidence_complete;
  const source = { certification_id: report.certification_id, valid, report_hash_valid, evidence_complete, failures: report.detected_failures };
  return Object.freeze({ ...source, validation_hash: hashValue("replay-integrity-certification-validation", source) });
}

export function buildReplayIntegrityCertificationObservabilitySurface(report = runReplayIntegrityCertification()): ReplayIntegrityCertificationObservabilitySurface {
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    replay_score: report.replay_score,
    integrity_score: report.integrity_score,
    overall_score: report.overall_score,
    failures: report.detected_failures,
    risks: report.detected_risks,
    operator_required: report.operator_required,
    evidence_records: report.evidence.length,
    report_hash: report.report_hash,
  });
}

export function getReplayIntegrityCertificationContract() {
  const report = runReplayIntegrityCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["replay-determinism", "historical-truth", "integrity-preservation", "complete-lineage", "explainable-replay", "immutable-evidence", "tenant-isolation", "fail-closed-verification"]),
      engine_version: ENGINE_VERSION,
      lifecycle_states: freezeArray(["REGISTERED", "REPLAY_PREPARATION", "REPLAY_RECONSTRUCTION", "TIMELINE_VALIDATION", "DECISION_VALIDATION", "INTEGRITY_VALIDATION", "HASH_CHAIN_VALIDATION", "LINEAGE_VALIDATION", "EVIDENCE_VALIDATION", "VISIBILITY_VALIDATION", "TENANT_VALIDATION", "ASSESSMENT", "COMPLETE"] as const),
      certification_scope: freezeArray(scope),
      certification_domains: freezeArray(domains),
    }),
    report,
    validation: validateReplayIntegrityCertificationReport(report),
    observability: buildReplayIntegrityCertificationObservabilitySurface(report),
  });
}
