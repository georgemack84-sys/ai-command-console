import { runPlatformAssurance, validatePlatformAssurance } from "@/services/caf-platform-assurance";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CertificationGateOutcome,
  CertificationLifecycleState,
  PlatformCertificationBundle,
  PlatformCertificationFailure,
  PlatformCertificationInput,
  PlatformCertificationResult,
  PlatformCertificationScenario,
  PlatformCertificationValidation,
} from "@/types/caf-platform-certification";

const VERSION = "caf-platform-certification/v3.15" as const;
const IDENTIFIER = "CafPlatformCertification" as const;
const LIFECYCLE: readonly CertificationLifecycleState[] = Object.freeze(["DRAFT", "PENDING", "CERTIFIED", "CONDITIONALLY_CERTIFIED", "SUSPENDED", "REVOKED", "EXPIRED", "SUPERSEDED", "RETIRED"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: PlatformCertificationScenario): PlatformCertificationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly PlatformCertificationFailure[], failure: PlatformCertificationFailure): boolean { return failures.includes(failure); }
function gateOutcome(failures: readonly PlatformCertificationFailure[]): CertificationGateOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<PlatformCertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    eligibility: result.eligibility.integrity_hash,
    evidence: result.evidence_package.integrity_hash,
    decision: result.decision.integrity_hash,
    certificate: result.certificate.integrity_hash,
    ledger: result.ledger.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    governance: result.governance.integrity_hash,
    observability: result.observability.integrity_hash,
    audit: result.audit_lineage.integrity_hash,
    access: result.consumer_access.integrity_hash,
    gate: result.certification_gate.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<PlatformCertificationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, gate_outcome: result.certification_gate.gate_outcome, replay_hash: result.replay_hash });
}

export function runPlatformCertification(input: PlatformCertificationInput = {}): PlatformCertificationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<PlatformCertificationFailure>(direct ? [direct] : []);
  const p314 = runPlatformAssurance();
  const p314Valid = validatePlatformAssurance(p314).valid && !has(scenarioFailures, "P3_14_ASSURANCE_INVALID");
  const failures = freezeArray([...new Set([
    ...scenarioFailures,
    ...(!p314Valid ? ["P3_14_ASSURANCE_INVALID" as const] : []),
  ])]);
  const eligibility = nested({
    eligibility_id: "P3.15-CERTIFICATION-ELIGIBILITY-001",
    readiness_report_ref: p314.assurance_report.report_id,
    prerequisites_satisfied: p314Valid && !has(failures, "ELIGIBILITY_NOT_VERIFIED"),
    assurance_evidence_present: p314.qualification_evidence.complete,
    dependency_validation_ref: p314.dependency_report.report_id,
    eligible: p314Valid && !has(failures, "ELIGIBILITY_NOT_VERIFIED"),
  });
  const evidence_package = nested({
    evidence_package_id: "P3.15-CERTIFICATION-EVIDENCE-001",
    qualification_evidence_ref: p314.qualification_evidence.qualification_evidence_id,
    assurance_report_refs: freezeArray([p314.assurance_report.report_id]),
    governance_evidence_refs: p314.assurance_package.governance_evidence_refs,
    operational_evidence_refs: p314.assurance_package.operational_evidence_refs,
    safety_evidence_refs: freezeArray([p314.governance_report.report_id]),
    replay_evidence_refs: p314.assurance_package.replay_evidence_refs,
    lineage_refs: has(failures, "AUDIT_LINEAGE_INCOMPLETE") ? freezeArray([]) : p314.evidence_correlation.correlated_evidence_refs,
    complete: !has(failures, "CERTIFICATION_EVIDENCE_MISSING") && p314.qualification_evidence.complete,
    immutable: !has(failures, "CERTIFICATION_EVIDENCE_MUTABLE"),
  });
  const governance = nested({
    governance_id: "P3.15-CERTIFICATION-GOVERNANCE-001",
    approval_refs: has(failures, "GOVERNANCE_APPROVAL_ABSENT") ? freezeArray([]) : freezeArray(["approval:p3.15:certification-authority", "approval:cci-certification-service"]),
    authority_ref: "authority:p3.15:certification",
    exception_governance_ref: "exception-governance:p3.15",
    review_ref: "review:p3.15:certification-board",
    approvals_complete: !has(failures, "GOVERNANCE_APPROVAL_ABSENT"),
    deterministic: !has(failures, "CERTIFICATION_DECISION_NOT_GOVERNED"),
  });
  const blocking = freezeArray([
    ...(!p314Valid ? ["platform assurance invalid"] : []),
    ...(!eligibility.eligible ? ["eligibility not verified"] : []),
    ...(!evidence_package.complete ? ["certification evidence missing"] : []),
    ...(!governance.approvals_complete ? ["governance approval absent"] : []),
    ...(has(failures, "CONSTITUTIONAL_VIOLATION") ? ["constitutional violation"] : []),
    ...(has(failures, "UNRESOLVED_ASSURANCE_FAILURE") ? ["unresolved assurance failure"] : []),
    ...(has(failures, "DEPENDENCY_VERIFICATION_FAILURE") ? ["dependency verification failure"] : []),
    ...(has(failures, "EVIDENCE_INTEGRITY_FAILURE") ? ["evidence integrity failure"] : []),
    ...(has(failures, "UNRESOLVED_SAFETY_VIOLATION") ? ["unresolved safety violation"] : []),
    ...(has(failures, "UNRESOLVED_AUTHORITY_VIOLATION") ? ["unresolved authority violation"] : []),
    ...(has(failures, "UNRESOLVED_POLICY_VIOLATION") ? ["unresolved policy violation"] : []),
  ]);
  const decision = nested({
    decision_id: has(failures, "CERTIFICATION_DECISION_NOT_TRACEABLE") ? "" : "P3.15-CERTIFICATION-DECISION-001",
    assurance_decision_ref: p314.assurance_decision.decision_id,
    certification_authority: "Program 3 CAF Certification Authority",
    outcome: blocking.length ? "NOT_CERTIFIED" as const : "CERTIFIED" as const,
    governed: governance.approvals_complete && governance.deterministic,
    traceable: !has(failures, "CERTIFICATION_DECISION_NOT_TRACEABLE"),
    blocking_findings: blocking,
    generated_timestamp: "2026-07-17T01:05:00.000Z",
  });
  const certificate = nested({
    certificate_id: has(failures, "PLATFORM_CERTIFICATE_NOT_ISSUED") || decision.outcome === "NOT_CERTIFIED" ? "" : "P3.15-CAF-PLATFORM-CERTIFICATE-001",
    certificate_version: "v3.15.0",
    platform_ref: "Civitas Agent Framework" as const,
    outcome: decision.outcome,
    issued_at: decision.outcome === "CERTIFIED" ? "2026-07-17T01:06:00.000Z" : "",
    valid_until: decision.outcome === "CERTIFIED" ? "2027-07-17T01:06:00.000Z" : "",
    evidence_package_ref: evidence_package.evidence_package_id,
    decision_ref: decision.decision_id,
    integrity_verified: !has(failures, "CERTIFICATE_INTEGRITY_INVALID") && decision.outcome === "CERTIFIED",
    lineage_ref: evidence_package.lineage_refs[0] ?? "",
  });
  const lifecycle = nested({
    lifecycle_id: "P3.15-CERTIFICATION-LIFECYCLE-001",
    states: has(failures, "LIFECYCLE_NON_DETERMINISTIC") ? freezeArray([...LIFECYCLE].reverse()) : LIFECYCLE,
    current_state: certificate.certificate_id ? "CERTIFIED" as const : "DRAFT" as const,
    transitions_governed: !has(failures, "LIFECYCLE_NON_DETERMINISTIC"),
    deterministic: !has(failures, "LIFECYCLE_NON_DETERMINISTIC"),
    lineage_preserved: evidence_package.lineage_refs.length > 0,
  });
  const audit_lineage = nested({
    audit_id: "P3.15-CERTIFICATION-AUDIT-001",
    audit_report_ref: "audit-report:p3.15:certification",
    lineage_graph_ref: "lineage-graph:p3.15:certification",
    certificate_traceable: certificate.certificate_id.length > 0 && decision.traceable,
    evidence_traceable: evidence_package.lineage_refs.length > 0,
    immutable_audit_chain: !has(failures, "AUDIT_LINEAGE_INCOMPLETE"),
  });
  const ledger = nested({
    ledger_id: "P3.15-CERTIFICATION-LEDGER-001",
    certificate_refs: certificate.certificate_id ? freezeArray([certificate.certificate_id]) : freezeArray([]),
    decision_refs: decision.decision_id ? freezeArray([decision.decision_id]) : freezeArray([]),
    lifecycle_refs: freezeArray([lifecycle.lifecycle_id]),
    audit_refs: freezeArray([audit_lineage.audit_id]),
    immutable: !has(failures, "CERTIFICATION_LEDGER_FAILURE"),
    complete_history_preserved: !has(failures, "CERTIFICATION_LEDGER_FAILURE"),
  });
  const observability = nested({
    observability_id: "P3.15-CERTIFICATION-OBSERVABILITY-001",
    metrics: freezeArray(["certification_status", "certificate_validity", "renewal_window", "audit_health"]),
    dashboard_ref: "dashboard:p3.15:certification",
    alert_refs: freezeArray(["alert:p3.15:expiration", "alert:p3.15:suspension"]),
    operational: true,
  });
  const consumer_access = nested({
    api_id: "P3.15-CERTIFICATION-API-001",
    certificate_retrieval_available: !has(failures, "CERTIFICATION_API_UNAVAILABLE"),
    verification_service_available: !has(failures, "CERTIFICATION_API_UNAVAILABLE"),
    status_publication_available: !has(failures, "CERTIFICATION_API_UNAVAILABLE"),
    deterministic_verification: !has(failures, "CERTIFICATION_API_UNAVAILABLE"),
  });
  const gateFailures = freezeArray([...new Set([
    ...failures,
    ...(has(failures, "ASSURANCE_AGGREGATION_DUPLICATED") ? ["ASSURANCE_AGGREGATION_DUPLICATED" as const] : []),
    ...(has(failures, "REPLAY_EXECUTION_ATTEMPTED") ? ["REPLAY_EXECUTION_ATTEMPTED" as const] : []),
    ...(has(failures, "REPLAY_VERIFICATION_DUPLICATED") ? ["REPLAY_VERIFICATION_DUPLICATED" as const] : []),
    ...(!eligibility.eligible ? ["ELIGIBILITY_NOT_VERIFIED" as const] : []),
    ...(!evidence_package.complete ? ["CERTIFICATION_EVIDENCE_MISSING" as const] : []),
    ...(!evidence_package.immutable ? ["CERTIFICATION_EVIDENCE_MUTABLE" as const] : []),
    ...(!decision.governed ? ["CERTIFICATION_DECISION_NOT_GOVERNED" as const] : []),
    ...(!governance.approvals_complete ? ["GOVERNANCE_APPROVAL_ABSENT" as const] : []),
    ...(certificate.certificate_id.length === 0 ? ["PLATFORM_CERTIFICATE_NOT_ISSUED" as const] : []),
    ...(!certificate.integrity_verified ? ["CERTIFICATE_INTEGRITY_INVALID" as const] : []),
    ...(!ledger.immutable || !ledger.complete_history_preserved ? ["CERTIFICATION_LEDGER_FAILURE" as const] : []),
    ...(!lifecycle.deterministic ? ["LIFECYCLE_NON_DETERMINISTIC" as const] : []),
    ...(!audit_lineage.immutable_audit_chain || !audit_lineage.certificate_traceable || !audit_lineage.evidence_traceable ? ["AUDIT_LINEAGE_INCOMPLETE" as const] : []),
    ...(!consumer_access.deterministic_verification ? ["CERTIFICATION_API_UNAVAILABLE" as const] : []),
    ...(!decision.traceable ? ["CERTIFICATION_DECISION_NOT_TRACEABLE" as const] : []),
    ...(has(failures, "OUTCOME_FAMILY_RECONCILIATION_PENDING") ? ["OUTCOME_FAMILY_RECONCILIATION_PENDING" as const] : []),
  ])]);
  const certification_gate = nested({
    gate_id: "P3.15-PLATFORM-CERTIFICATION-GATE-001",
    constitutional_compliance: !has(gateFailures, "CONSTITUTIONAL_VIOLATION"),
    architectural_completeness: p314.assurance_package.complete,
    authority_enforcement: !has(gateFailures, "UNRESOLVED_AUTHORITY_VIOLATION"),
    policy_enforcement: !has(gateFailures, "UNRESOLVED_POLICY_VIOLATION"),
    safety_enforcement: !has(gateFailures, "UNRESOLVED_SAFETY_VIOLATION"),
    replay_evidence_complete_via_p3_14: p314.replay_findings.replay_evidence_consumed && !has(gateFailures, "REPLAY_VERIFICATION_DUPLICATED"),
    evidence_integrity: evidence_package.immutable && !has(gateFailures, "EVIDENCE_INTEGRITY_FAILURE"),
    dependency_integrity: p314.dependency_report.result === "PASS" && !has(gateFailures, "DEPENDENCY_VERIFICATION_FAILURE"),
    operational_readiness: true,
    interoperability: true,
    lineage_complete: audit_lineage.certificate_traceable && audit_lineage.evidence_traceable,
    outcome_family_reconciled: !has(gateFailures, "OUTCOME_FAMILY_RECONCILIATION_PENDING"),
    gate_outcome: gateOutcome(gateFailures),
    failures: gateFailures,
  });
  const base: Omit<PlatformCertificationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    platform_assurance_ref: "caf-platform-assurance/v3.14",
    cci_certification_services_ref: "Program 2 - CCI Certification Services",
    cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure",
    cci_audit_ref: "Program 2 - CCI Audit Infrastructure",
    cci_registry_ref: "Program 2 - CCI Registry Services",
    eligibility,
    evidence_package,
    decision,
    certificate,
    ledger,
    lifecycle,
    governance,
    observability,
    audit_lineage,
    consumer_access,
    certification_gate,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePlatformCertification(result?: PlatformCertificationResult): PlatformCertificationValidation {
  if (!result) return nested({ valid: false, gate_outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, eligibility_valid: false, evidence_valid: false, decision_valid: false, certificate_valid: false, ledger_valid: false, lifecycle_valid: false, governance_valid: false, audit_valid: false, api_valid: false, gate_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const eligibility_valid = verifyHashedRecord(result.eligibility) && result.eligibility.eligible;
  const evidence_valid = verifyHashedRecord(result.evidence_package) && result.evidence_package.complete && result.evidence_package.immutable;
  const decision_valid = verifyHashedRecord(result.decision) && result.decision.outcome === "CERTIFIED" && result.decision.governed && result.decision.traceable;
  const certificate_valid = verifyHashedRecord(result.certificate) && result.certificate.certificate_id.length > 0 && result.certificate.integrity_verified;
  const ledger_valid = verifyHashedRecord(result.ledger) && result.ledger.immutable && result.ledger.complete_history_preserved && result.ledger.certificate_refs.length > 0;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle) && result.lifecycle.current_state === "CERTIFIED" && result.lifecycle.deterministic && result.lifecycle.lineage_preserved;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.approvals_complete && result.governance.deterministic;
  const audit_valid = verifyHashedRecord(result.audit_lineage) && result.audit_lineage.certificate_traceable && result.audit_lineage.evidence_traceable && result.audit_lineage.immutable_audit_chain;
  const api_valid = verifyHashedRecord(result.consumer_access) && result.consumer_access.certificate_retrieval_available && result.consumer_access.verification_service_available && result.consumer_access.status_publication_available && result.consumer_access.deterministic_verification;
  const gate_valid = verifyHashedRecord(result.certification_gate) && result.certification_gate.gate_outcome === "PASS" && result.certification_gate.outcome_family_reconciled;
  const valid = replay_hash_valid && integrity_hash_valid && eligibility_valid && evidence_valid && decision_valid && certificate_valid && ledger_valid && lifecycle_valid && governance_valid && audit_valid && api_valid && gate_valid;
  return nested({ valid, gate_outcome: result.certification_gate.gate_outcome, replay_hash_valid, integrity_hash_valid, eligibility_valid, evidence_valid, decision_valid, certificate_valid, ledger_valid, lifecycle_valid, governance_valid, audit_valid, api_valid, gate_valid, failures: result.certification_gate.failures });
}

export function replayPlatformCertification(result = runPlatformCertification()): boolean {
  const replayed = runPlatformCertification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePlatformCertification(result).valid;
}

export function getPlatformCertificationBundle(): PlatformCertificationBundle {
  const result = runPlatformCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_certification_execution: true,
      owns_certification_governance: true,
      owns_certification_lifecycle: true,
      owns_certification_evidence: true,
      consumes_platform_assurance: true,
      executes_replay: false,
      duplicates_platform_assurance: false,
      verifies_replay_independently: false,
      certifies_platform: true,
    }),
    result,
    validation: validatePlatformCertification(result),
  });
}

export const PlatformCertificationService = Object.freeze({
  run: runPlatformCertification,
  validate: validatePlatformCertification,
  replay: replayPlatformCertification,
});
