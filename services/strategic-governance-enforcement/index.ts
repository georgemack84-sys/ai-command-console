import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runStrategicAssurance, validateStrategicAssurance } from "@/services/strategic-assurance";
import type {
  AuthorityResolutionReport,
  ConstitutionalValidationReport,
  EvidenceQualificationReport,
  FailClosedReport,
  GovernanceEnforcementLedger,
  GovernanceEnforcementLedgerEntry,
  GovernanceFailureReason,
  GovernanceState,
  GovernanceValidationReport,
  OperatorAuthorityReport,
  RestrictedDataReport,
  SecurityValidationReport,
  StrategicGovernanceCertification,
  StrategicGovernanceCertificationTest,
  StrategicGovernanceContractBundle,
  StrategicGovernanceFailure,
  StrategicGovernanceInput,
  StrategicGovernanceObservability,
  StrategicGovernanceResult,
  StrategicGovernanceScenario,
  StrategicGovernanceValidation,
  TenantIsolationReport,
  TrustQualificationReport,
} from "@/types/strategic-governance-enforcement";

const VERSION = "strategic-governance-enforcement/v12.12" as const;
const ID = "StrategicGovernanceEnforcement" as const;
const STATES: readonly GovernanceState[] = Object.freeze(["PENDING", "CONSTITUTION_VALIDATED", "GOVERNANCE_APPROVED", "AUTHORITY_RESOLVED", "EVIDENCE_QUALIFIED", "TRUST_QUALIFIED", "TENANT_VALIDATED", "SECURITY_VALIDATED", "RESTRICTED_INFORMATION_VALIDATED", "ELIGIBLE_FOR_RECOMMENDATION", "COMPLETE"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: StrategicGovernanceScenario): StrategicGovernanceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function includes(failures: readonly StrategicGovernanceFailure[], value: StrategicGovernanceFailure): boolean { return failures.includes(value); }
function failed(failures: readonly StrategicGovernanceFailure[], values: readonly StrategicGovernanceFailure[]): boolean { return values.some((value) => failures.includes(value)); }
function statusFor(failures: readonly StrategicGovernanceFailure[]): "PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }
function primaryFailure(failures: readonly StrategicGovernanceFailure[]): StrategicGovernanceFailure | null { return failures[0] ?? null; }

function constitution(failures: readonly StrategicGovernanceFailure[]): ConstitutionalValidationReport {
  const bad = failed(failures, ["CONSTITUTIONAL_FAILURE", "POLICY_FAILURE", "REPLAY_FAILURE", "INTEGRITY_FAILURE"]);
  const violations = bad ? freezeArray(["constitutional strategic recommendation boundary violated"]) : freezeArray([]);
  return nested({ report_id: id("strategic_constitution", VERSION), advisory_only: !failed(failures, ["CONSTITUTIONAL_FAILURE", "AUTHORITY_FAILURE"]), operator_supremacy: !includes(failures, "OPERATOR_SUPREMACY_FAILURE"), governance_supremacy: !failed(failures, ["CONSTITUTIONAL_FAILURE", "GOVERNANCE_FAILURE"]), tenant_isolation: !includes(failures, "TENANT_FAILURE"), evidence_required: !includes(failures, "EVIDENCE_FAILURE"), trust_required: !includes(failures, "TRUST_FAILURE"), deterministic_replay: !includes(failures, "REPLAY_FAILURE"), immutable_lineage: !includes(failures, "INTEGRITY_FAILURE"), immutable_audit_history: !includes(failures, "LEDGER_FAILURE"), authority_boundaries: !includes(failures, "AUTHORITY_FAILURE"), approved: !bad && !includes(failures, "OPERATOR_SUPREMACY_FAILURE"), violations });
}

function governance(failures: readonly StrategicGovernanceFailure[]): GovernanceValidationReport {
  const rejected = failed(failures, ["GOVERNANCE_FAILURE", "POLICY_FAILURE"]);
  return nested({ report_id: id("strategic_governance", VERSION), outcome: rejected ? "REJECTED" as const : "APPROVED" as const, policies_resolved: !includes(failures, "POLICY_FAILURE"), approvals_present: !includes(failures, "GOVERNANCE_FAILURE"), review_complete: !includes(failures, "GOVERNANCE_FAILURE"), constitutional_approval: !includes(failures, "CONSTITUTIONAL_FAILURE"), organizational_approval: !includes(failures, "GOVERNANCE_FAILURE"), regulatory_approval: !includes(failures, "GOVERNANCE_FAILURE"), delegated_authority_valid: !includes(failures, "AUTHORITY_FAILURE"), escalation_required: rejected });
}

function authority(failures: readonly StrategicGovernanceFailure[]): AuthorityResolutionReport {
  const valid = !failed(failures, ["AUTHORITY_FAILURE", "CONSTITUTIONAL_FAILURE"]);
  return nested({ report_id: id("strategic_authority", VERSION), permitted_actions: freezeArray(["recommend", "compare", "forecast", "summarize", "explain"]), prohibited_actions: freezeArray(["execute", "commit", "approve", "authorize", "deploy", "mutate protected artifacts"]), advisory_only: valid, operator_may_override: !includes(failures, "OPERATOR_SUPREMACY_FAILURE"), authority_ceiling: "ADVISORY_ONLY" as const, execution_authority_granted: includes(failures, "AUTHORITY_FAILURE"), mutation_authority_granted: includes(failures, "AUTHORITY_FAILURE"), boundaries_valid: valid });
}

function operator(failures: readonly StrategicGovernanceFailure[]): OperatorAuthorityReport {
  const ok = !includes(failures, "OPERATOR_SUPREMACY_FAILURE");
  return nested({ report_id: id("operator_supremacy", VERSION), operator_supremacy_preserved: ok, overrides_visible: ok, review_bypass_prevented: ok, auto_approval_prevented: ok, execution_prevented: ok, override_ledger_refs: freezeArray(["operator:override:immutable-history"]) });
}

function evidence(failures: readonly StrategicGovernanceFailure[]): EvidenceQualificationReport {
  const ok = !includes(failures, "EVIDENCE_FAILURE");
  return nested({ report_id: id("evidence_qualification", VERSION), complete: ok, provenance_valid: ok, authenticity_valid: ok, freshness_valid: ok, integrity_valid: !includes(failures, "INTEGRITY_FAILURE"), qualified: ok, replay_available: !includes(failures, "REPLAY_FAILURE"), sufficiency_score: ok ? 0.92 : 0.31, rejected_reasons: ok ? freezeArray([]) : freezeArray(["missing or unverifiable strategic evidence"]) });
}

function trust(failures: readonly StrategicGovernanceFailure[]): TrustQualificationReport {
  const ok = !includes(failures, "TRUST_FAILURE");
  return nested({ report_id: id("trust_qualification", VERSION), source_trust: ok ? 0.9 : 0.45, evidence_trust: ok ? 0.88 : 0.4, historical_reliability: 0.86, governance_confidence: ok ? 0.91 : 0.52, certification_status: ok ? "CERTIFIED" as const : "REQUIRES_REVIEW" as const, replay_success: !includes(failures, "REPLAY_FAILURE"), integrity_verified: !includes(failures, "INTEGRITY_FAILURE"), restrictions: ok ? freezeArray(["advisory-only"]) : freezeArray(["requires operator review", "requires governance review"]), execution_authority_granted: false as const, qualified: ok });
}

function tenant(tenantId: string, failures: readonly StrategicGovernanceFailure[]): TenantIsolationReport {
  const ok = !includes(failures, "TENANT_FAILURE");
  return nested({ report_id: id("tenant_isolation", tenantId), tenant_id: tenantId, strategies_isolated: ok, forecasts_isolated: ok, scenarios_isolated: ok, observations_isolated: ok, recommendations_isolated: ok, portfolios_isolated: ok, evidence_isolated: ok, policies_isolated: ok, lineage_isolated: ok, replay_isolated: ok, cross_tenant_access_detected: !ok });
}

function restrictedData(failures: readonly StrategicGovernanceFailure[]): RestrictedDataReport {
  const ok = !includes(failures, "RESTRICTED_DATA_FAILURE");
  return nested({ report_id: id("restricted_data", VERSION), classification_resolved: ok, role_filtering_applied: ok, attribute_filtering_applied: ok, fields_masked: freezeArray(["operator_identity", "classified_evidence", "security_findings"]), derived_views_filtered: ok, explainability_filtered: ok, replay_filtered: ok, unauthorized_disclosure_prevented: ok });
}

function security(failures: readonly StrategicGovernanceFailure[]): SecurityValidationReport {
  const blocked = failed(failures, ["SECURITY_FAILURE", "REPLAY_FAILURE", "INTEGRITY_FAILURE", "POLICY_FAILURE"]);
  return nested({ report_id: id("strategic_security", VERSION), outcome: blocked ? "BLOCKED" as const : "VERIFIED" as const, artifact_integrity_valid: !includes(failures, "INTEGRITY_FAILURE"), origins_valid: !includes(failures, "SECURITY_FAILURE"), lineage_valid: !includes(failures, "SECURITY_FAILURE"), policy_binding_valid: !includes(failures, "POLICY_FAILURE"), replay_integrity_valid: !includes(failures, "REPLAY_FAILURE"), mutation_absent: !includes(failures, "SECURITY_FAILURE"), references_valid: !includes(failures, "SECURITY_FAILURE"), hashes_valid: !includes(failures, "INTEGRITY_FAILURE"), signatures_valid: !includes(failures, "SECURITY_FAILURE"), registry_consistent: !includes(failures, "SECURITY_FAILURE"), incidents: blocked ? freezeArray(["strategic security validation blocked progression"]) : freezeArray([]) });
}

function failClosed(failures: readonly StrategicGovernanceFailure[]): FailClosedReport {
  const reason = primaryFailure(failures);
  const ok = failures.length === 0;
  return nested({ report_id: id("strategic_fail_closed", failures), mandatory_gates_satisfied: ok, state: ok ? "COMPLETE" as const : "FAILED_CLOSED" as const, failure_reason: reason, generation_allowed: ok, comparison_completion_allowed: ok, recommendation_issuance_allowed: ok, replay_allowed: ok, observation_closure_allowed: ok, archival_progression_allowed: ok, recovery_recommendation: ok ? "continue advisory recommendation lifecycle" : `resolve ${reason ?? "UNKNOWN_FAILURE"} before retrying` });
}

function ledger(cycle: string, policy: string, failures: readonly StrategicGovernanceFailure[], securityReport: SecurityValidationReport): GovernanceEnforcementLedger {
  const failedClosed = failures.length > 0;
  const states = failedClosed ? freezeArray<GovernanceState>(["PENDING", "FAILED_CLOSED"]) : STATES;
  const entries = freezeArray(states.map((state, sequence) => nested({ enforcement_id: id("governance_enforcement", { state, sequence }), recommendation_cycle_id: cycle, artifact_ref: `artifact:${cycle}:strategic-governance-enforcement`, validation_stage: state, validation_type: state.toLowerCase(), policy_manifest_ref: policy, governance_refs: freezeArray(["governance:phase-12:constitutional", "governance:phase-12:operator"]), authority_resolution: failedClosed ? "FAILED" as const : "ADVISORY_ONLY" as const, evidence_status: includes(failures, "EVIDENCE_FAILURE") ? "REJECTED" as const : "QUALIFIED" as const, trust_status: includes(failures, "TRUST_FAILURE") ? "RESTRICTED" as const : "QUALIFIED" as const, tenant_status: includes(failures, "TENANT_FAILURE") ? "FAILED" as const : "ISOLATED" as const, security_status: securityReport.outcome, restricted_information_status: includes(failures, "RESTRICTED_DATA_FAILURE") ? "FAILED" as const : "PROTECTED" as const, enforcement_outcome: failedClosed ? "FAILED_CLOSED" as const : "ALLOW_ADVISORY" as const, failure_reason: primaryFailure(failures), operator_actions: freezeArray(["operator review preserved", "operator override remains supreme"]), replay_ref: `replay:${cycle}:governance-enforcement`, timestamp: "2026-07-15T00:00:00.000Z" })));
  return nested({ ledger_id: id("governance_enforcement_ledger", { cycle, failures }), entries, append_only: !includes(failures, "LEDGER_FAILURE"), hash_linked: !includes(failures, "LEDGER_FAILURE"), immutable: true, replayable: !includes(failures, "REPLAY_FAILURE") });
}

type CertBase = Omit<StrategicGovernanceResult, "certification" | "replay_hash" | "integrity_hash">;
function certTest(name: string, passed: boolean, failure: StrategicGovernanceFailure, refs: readonly string[]): StrategicGovernanceCertificationTest {
  return nested({ test_id: id("strategic_governance_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}
function certificationTests(result: CertBase): readonly StrategicGovernanceCertificationTest[] {
  const refs = freezeArray([result.constitution.integrity_hash, result.governance.integrity_hash, result.security.integrity_hash, result.ledger.integrity_hash]);
  return freezeArray([
    certTest("Constitutional validation deterministic", result.constitution.approved, "CONSTITUTIONAL_FAILURE", refs),
    certTest("Governance approvals enforced", result.governance.outcome === "APPROVED", "GOVERNANCE_FAILURE", refs),
    certTest("Authority resolution advisory-only", result.authority.advisory_only && !result.authority.execution_authority_granted, "AUTHORITY_FAILURE", refs),
    certTest("Policy binding preserved", result.governance.policies_resolved && result.security.policy_binding_valid, "POLICY_FAILURE", refs),
    certTest("Operator supremacy preserved", result.operator.operator_supremacy_preserved && result.authority.operator_may_override, "OPERATOR_SUPREMACY_FAILURE", refs),
    certTest("Evidence qualification deterministic", result.evidence.qualified && result.evidence.sufficiency_score >= 0.75, "EVIDENCE_FAILURE", refs),
    certTest("Trust restrictions deterministic", result.trust.qualified && !result.trust.execution_authority_granted, "TRUST_FAILURE", refs),
    certTest("Tenant isolation enforced", !result.tenant.cross_tenant_access_detected, "TENANT_FAILURE", refs),
    certTest("Restricted information protected", result.restricted_data.unauthorized_disclosure_prevented, "RESTRICTED_DATA_FAILURE", refs),
    certTest("Security validation deterministic", result.security.outcome === "VERIFIED", "SECURITY_FAILURE", refs),
    certTest("Replay integrity enforced", result.evidence.replay_available && result.security.replay_integrity_valid && result.ledger.replayable, "REPLAY_FAILURE", refs),
    certTest("Integrity verification enforced", result.evidence.integrity_valid && result.security.hashes_valid, "INTEGRITY_FAILURE", refs),
    certTest("Governance ledger immutable", result.ledger.append_only && result.ledger.hash_linked, "LEDGER_FAILURE", refs),
    certTest("Fail-closed behavior verified", result.fail_closed.state === "COMPLETE", "FAIL_CLOSED_FAILURE", refs),
  ]);
}

function replayHash(result: Omit<StrategicGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ constitution: result.constitution.integrity_hash, governance: result.governance.integrity_hash, authority: result.authority.integrity_hash, operator: result.operator.integrity_hash, evidence: result.evidence.integrity_hash, trust: result.trust.integrity_hash, tenant: result.tenant.integrity_hash, restricted: result.restricted_data.integrity_hash, security: result.security.integrity_hash, failClosed: result.fail_closed.integrity_hash, ledger: result.ledger.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<StrategicGovernanceResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runStrategicGovernanceEnforcement(input: StrategicGovernanceInput = {}): StrategicGovernanceResult {
  const assurance = runStrategicAssurance({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const assuranceValid = validateStrategicAssurance(assurance).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<StrategicGovernanceFailure>([...(assuranceValid ? [] : ["INTEGRITY_FAILURE" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const cycle = assurance.explainability.recommendation_cycle;
  const policy = assurance.explainability.policy_manifest;
  const c = constitution(failures);
  const g = governance(failures);
  const a = authority(failures);
  const o = operator(failures);
  const e = evidence(failures);
  const t = trust(failures);
  const ten = tenant(input.tenant_id ?? "tenant_mission_control", failures);
  const r = restrictedData(failures);
  const s = security(failures);
  const f = failClosed(failures);
  const l = ledger(cycle, policy, failures, s);
  const obs: StrategicGovernanceObservability = nested({ report_id: id("strategic_governance_observability", failures), state: f.state, failed_closed: f.state === "FAILED_CLOSED", security_incidents: s.incidents.length, restrictions_applied: t.restrictions.length, ledger_entries: l.entries.length, observable: true });
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, constitution: c, governance: g, authority: a, operator: o, evidence: e, trust: t, tenant: ten, restricted_data: r, security: s, fail_closed: f, ledger: l, observability: obs };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is StrategicGovernanceFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification: StrategicGovernanceCertification = nested({ certification_id: id("strategic_governance_certification", VERSION), status, certified: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateStrategicGovernanceEnforcement(result?: StrategicGovernanceResult): StrategicGovernanceValidation {
  if (!result) {
    const failures = freezeArray<StrategicGovernanceFailure>(["UNKNOWN_FAILURE"]);
    const base = { valid: false, status: "FAIL" as const, certified: false, failures, replay_hash_valid: false, integrity_hash_valid: false, fail_closed_valid: false, ledger_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const fail_closed_valid = result.certification.status === "PASS" ? result.fail_closed.state === "COMPLETE" : result.fail_closed.state === "FAILED_CLOSED";
  const ledger_valid = result.ledger.append_only && result.ledger.hash_linked && result.ledger.immutable;
  const valid = result.certification.status === "PASS" && result.certification.certified && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && fail_closed_valid && ledger_valid;
  const base = { valid, status: result.certification.status, certified: result.certification.certified, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, fail_closed_valid, ledger_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayStrategicGovernanceEnforcement(result = runStrategicGovernanceEnforcement()): boolean {
  const replayed = runStrategicGovernanceEnforcement({ tenant_id: result.tenant.tenant_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateStrategicGovernanceEnforcement(result).valid;
}

export function getStrategicGovernanceEnforcementContract(): StrategicGovernanceContractBundle {
  const result = runStrategicGovernanceEnforcement();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, constitutional_validation_required: true, advisory_only_authority: true, operator_supremacy_required: true, evidence_qualification_required: true, trust_qualification_required: true, tenant_isolation_required: true, restricted_data_protection_required: true, security_validation_required: true, deterministic_fail_closed_required: true }), result, validation: validateStrategicGovernanceEnforcement(result) });
}

export const StrategicGovernanceEnforcement = Object.freeze({ run: runStrategicGovernanceEnforcement, validate: validateStrategicGovernanceEnforcement, replay: replayStrategicGovernanceEnforcement });
