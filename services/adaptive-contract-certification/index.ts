import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveContractCertificationApiSurface,
  AdaptiveContractCertificationContract,
  AdaptiveContractCertificationFailure,
  AdaptiveContractCertificationInput,
  AdaptiveContractCertificationObservability,
  AdaptiveContractCertificationRecord,
  AdaptiveContractCertificationResult,
  AdaptiveContractCertificationScenario,
  AdaptiveContractCertificationTest,
  AdaptiveContractCertificationValidationResult,
  AdaptiveCertificationWidget,
  AdaptiveReplayValidation,
  AdvisoryBoundaryValidation,
  AuthorityBoundaryValidation,
  BoundaryComplianceReport,
  ConstitutionalBindingValidation,
  ContractCertificationReport,
  GovernanceBindingValidation,
  LearningBoundaryValidation,
  PermittedAuthority,
  PermittedLearningDomain,
  ProhibitedAuthority,
  ProhibitedLearningDomain,
} from "@/types/adaptive-contract-certification";

const VERSION = "adaptive-contract-certification/v10.15.1" as const;
const ID = "AdaptiveContractCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly AdaptiveCertificationWidget[] = Object.freeze(["Contract Certification", "Learning Boundary", "Governance Binding", "Constitutional Binding", "Authority Boundary", "Advisory Boundary", "Replay Validation", "Contract Report", "Boundary Report"]);
const PERMITTED_LEARNING: readonly PermittedLearningDomain[] = Object.freeze(["HISTORICAL_MISSION_OUTCOMES", "RECOMMENDATION_EFFECTIVENESS", "STRATEGY_PERFORMANCE", "CONFIDENCE_CALIBRATION", "RISK_CALIBRATION", "OPERATOR_FEEDBACK", "GOVERNANCE_OUTCOMES", "SIMULATION_OUTCOMES", "REPLAY_ANALYSIS", "CERTIFIED_ADAPTIVE_MEMORY", "APPROVED_TELEMETRY", "TRUTH_LEDGER_RECORDS"]);
const PROHIBITED_LEARNING: readonly ProhibitedLearningDomain[] = Object.freeze(["HIDDEN_RUNTIME_STATE", "UNAUTHORIZED_OPERATOR_BEHAVIOR", "CROSS_TENANT_INFORMATION", "UNCERTIFIED_MEMORY", "CONFIDENTIAL_GOVERNANCE_INVESTIGATIONS", "PROTECTED_CONSTITUTIONAL_DATA", "PRODUCTION_MUTATION_ATTEMPTS", "UNCERTIFIED_EXTERNAL_MODELS", "UNVERIFIABLE_SYNTHETIC_EVIDENCE", "MANIPULATED_TELEMETRY", "POISONED_EVIDENCE", "BYPASSED_SIMULATIONS", "UNCERTIFIED_REPLAY_ARTIFACTS"]);
const PERMITTED_AUTHORITY: readonly PermittedAuthority[] = Object.freeze(["OBSERVATION", "ANALYSIS", "RECOMMENDATION", "SIMULATION", "FORECASTING", "EXPLAINABILITY", "CONFIDENCE_ESTIMATION", "RISK_ESTIMATION"]);
const PROHIBITED_AUTHORITY: readonly ProhibitedAuthority[] = Object.freeze(["EXECUTION", "DEPLOYMENT", "PRODUCTION_MUTATION", "GOVERNANCE_MODIFICATION", "CONSTITUTIONAL_MODIFICATION", "AUTONOMOUS_APPROVAL", "POLICY_CREATION", "OPERATOR_REPLACEMENT", "TENANT_ADMINISTRATION", "CERTIFICATION_APPROVAL", "TRUTH_LEDGER_MUTATION"]);
const SCOPE = Object.freeze(["Outcome Observation", "Outcome Normalization", "Recommendation Effectiveness", "Pattern Intelligence", "Strategy Evolution", "Confidence Adaptation", "Risk Adaptation", "Governance-Aware Adaptation", "Operator Feedback Integration", "Adaptation Proposal Engine", "Adaptive Simulation", "Replay Validation", "Drift Defense", "Adaptive Memory", "Adaptive Dashboard"]);

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
function id(prefix: string, value: unknown): string {
  return `${prefix}_${hash(value).slice(0, 24)}`;
}

function failureForScenario(scenario: AdaptiveContractCertificationScenario): AdaptiveContractCertificationFailure | undefined {
  const map: Partial<Record<AdaptiveContractCertificationScenario, AdaptiveContractCertificationFailure>> = {
    CONTRACT_MISSING: "ADAPTIVE_CONTRACT_MISSING",
    SCHEMA_INVALID: "CONTRACT_SCHEMA_INVALID",
    VERSION_UNCERTIFIED: "CONTRACT_VERSION_UNCERTIFIED",
    SCOPE_MISSING: "ADAPTIVE_SCOPE_UNDEFINED",
    LEARNING_BOUNDARY_UNDEFINED: "LEARNING_BOUNDARY_UNDEFINED",
    PROHIBITED_DOMAINS_OMITTED: "PROHIBITED_DOMAINS_OMITTED",
    HIDDEN_LEARNING_PERMITTED: "HIDDEN_LEARNING_PERMITTED",
    UNAUTHORIZED_MEMORY: "UNAUTHORIZED_MEMORY_REJECTED",
    CROSS_TENANT_LEARNING: "CROSS_TENANT_LEARNING_DETECTED",
    ADVISORY_ONLY_ABSENT: "ADVISORY_ONLY_GUARANTEE_ABSENT",
    AUTONOMOUS_EXECUTION: "AUTONOMOUS_EXECUTION_PERMITTED",
    GOVERNANCE_BINDING_MISSING: "GOVERNANCE_BINDING_MISSING",
    CONSTITUTIONAL_BINDING_MISSING: "CONSTITUTIONAL_BINDING_MISSING",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION_DETECTED",
    TRUTH_LEDGER_MUTATION: "TRUTH_LEDGER_MUTATION_ALLOWED",
    OPERATOR_APPROVAL_BYPASS: "OPERATOR_APPROVAL_BYPASS",
    REPLAY_INCOMPLETE: "REPLAY_REQUIREMENTS_INCOMPLETE",
    NONDETERMINISTIC_EVALUATION: "NONDETERMINISTIC_CONTRACT_EVALUATION",
    SIMULATION_PREREQUISITE_MISSING: "SIMULATION_PREREQUISITE_MISSING",
    ROLLBACK_MISSING: "ROLLBACK_REQUIREMENTS_MISSING",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    AUDIT_LINEAGE_INCOMPLETE: "AUDIT_LINEAGE_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario];
}

function pass(failures: readonly AdaptiveContractCertificationFailure[], failure: AdaptiveContractCertificationFailure): "PASS" | "FAIL" {
  return failures.includes(failure) ? "FAIL" : "PASS";
}

function apiSurface(): AdaptiveContractCertificationApiSurface {
  const base: Omit<AdaptiveContractCertificationApiSurface, "integrity_hash"> = { api_id: "adaptive_contract_certification_api", retrieve_dashboard: "POST /adaptive-contract-certification/dashboard", retrieve_contract: "GET /adaptive-contract-certification/contract", retrieve_sections: freezeArray(["certification", "learning", "governance", "constitutional", "authority", "advisory", "replay", "report", "boundary"]), validate_certification: "POST /adaptive-contract-certification/validate", inspect_certification: "POST /adaptive-contract-certification/inspect", mutation_supported: false, execution_supported: false, approval_supported: false, production_mutation_supported: false, self_certification_supported: false, truth_ledger_mutation_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function record(input: AdaptiveContractCertificationInput, failures: readonly AdaptiveContractCertificationFailure[]): AdaptiveContractCertificationRecord {
  const failed = failures.length > 0;
  const base: Omit<AdaptiveContractCertificationRecord, "integrity_hash"> = { certification_id: id("adaptive_contract_certification", VERSION), contract_id: failures.includes("ADAPTIVE_CONTRACT_MISSING") ? "" : "adaptive_intelligence_contract_phase_10", contract_version: failures.includes("CONTRACT_VERSION_UNCERTIFIED") ? "uncertified" : "10.15.1", tenant_id: failures.includes("TENANT_ISOLATION_FAILURE") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, adaptive_scope: failures.includes("ADAPTIVE_SCOPE_UNDEFINED") ? freezeArray([]) : SCOPE, learning_boundary_status: failures.some((f) => ["LEARNING_BOUNDARY_UNDEFINED", "HIDDEN_LEARNING_PERMITTED", "UNAUTHORIZED_MEMORY_REJECTED", "CROSS_TENANT_LEARNING_DETECTED"].includes(f)) ? "FAIL" : "PASS", prohibited_domain_status: failures.includes("PROHIBITED_DOMAINS_OMITTED") ? "FAIL" : "PASS", advisory_boundary_status: failures.some((f) => ["ADVISORY_ONLY_GUARANTEE_ABSENT", "AUTONOMOUS_EXECUTION_PERMITTED"].includes(f)) ? "FAIL" : "PASS", governance_binding_status: pass(failures, "GOVERNANCE_BINDING_MISSING"), constitutional_binding_status: pass(failures, "CONSTITUTIONAL_BINDING_MISSING"), authority_validation_status: failures.some((f) => ["AUTHORITY_EXPANSION_DETECTED", "TRUTH_LEDGER_MUTATION_ALLOWED", "OPERATOR_APPROVAL_BYPASS"].includes(f)) ? "FAIL" : "PASS", replay_validation_status: failures.includes("REPLAY_REQUIREMENTS_INCOMPLETE") ? "FAIL" : "PASS", determinism_status: failures.includes("NONDETERMINISTIC_CONTRACT_EVALUATION") ? "FAIL" : "PASS", certification_status: failed ? "REJECTED" : "CERTIFIED", findings: failures, evidence_refs: failures.includes("AUDIT_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["evidence:adaptive-contract:1", "truth-ledger:adaptive-contract:1"]), governance_refs: failures.includes("GOVERNANCE_BINDING_MISSING") ? freezeArray([]) : freezeArray(["governance:adaptive-contract:1"]), constitutional_refs: failures.includes("CONSTITUTIONAL_BINDING_MISSING") ? freezeArray([]) : freezeArray(["constitutional:adaptive-contract:1"]), replay_refs: failures.includes("REPLAY_REQUIREMENTS_INCOMPLETE") ? freezeArray([]) : freezeArray(["replay:adaptive-contract:1"]), certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}

function learning(failures: readonly AdaptiveContractCertificationFailure[]): LearningBoundaryValidation {
  const base: Omit<LearningBoundaryValidation, "integrity_hash"> = { validation_id: "learning_boundary_validation", permitted_domains: PERMITTED_LEARNING, prohibited_domains: failures.includes("PROHIBITED_DOMAINS_OMITTED") ? freezeArray([]) : PROHIBITED_LEARNING, permitted_domains_validated: !failures.includes("LEARNING_BOUNDARY_UNDEFINED"), prohibited_domains_enforced: !failures.includes("PROHIBITED_DOMAINS_OMITTED"), evidence_backed: true, replayable: !failures.includes("REPLAY_REQUIREMENTS_INCOMPLETE"), hidden_learning_blocked: !failures.includes("HIDDEN_LEARNING_PERMITTED"), unauthorized_memory_rejected: !failures.includes("UNAUTHORIZED_MEMORY_REJECTED"), cross_tenant_learning_blocked: !failures.includes("CROSS_TENANT_LEARNING_DETECTED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function governance(failures: readonly AdaptiveContractCertificationFailure[]): GovernanceBindingValidation {
  const ok = !failures.includes("GOVERNANCE_BINDING_MISSING");
  const base: Omit<GovernanceBindingValidation, "integrity_hash"> = { validation_id: "governance_binding_validation", required_bindings: freezeArray(["Governance Engine", "Policy Registry", "Governance Validator", "Policy Enforcement Layer", "Approval Workflow", "Governance Replay Engine", "Governance Audit Ledger", "Governance Certification Registry"]), invocation_mandatory: ok, decisions_immutable: ok, lineage_complete: ok, replay_reproducible: ok, overrides_prohibited: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function constitutional(failures: readonly AdaptiveContractCertificationFailure[]): ConstitutionalBindingValidation {
  const ok = !failures.includes("CONSTITUTIONAL_BINDING_MISSING");
  const base: Omit<ConstitutionalBindingValidation, "integrity_hash"> = { validation_id: "constitutional_binding_validation", required_bindings: freezeArray(["Constitutional Doctrine", "Authority Framework", "Constraint Framework", "Human Authority Doctrine", "Trust & Evidence Doctrine", "Constitutional Security Framework", "Constitutional Certification Framework"]), review_mandatory: ok, authority_limits_enforced: ok && !failures.includes("AUTHORITY_EXPANSION_DETECTED"), violations_rejected: ok, lineage_preserved: ok, replay_deterministic: ok && !failures.includes("NONDETERMINISTIC_CONTRACT_EVALUATION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function authority(failures: readonly AdaptiveContractCertificationFailure[]): AuthorityBoundaryValidation {
  const base: Omit<AuthorityBoundaryValidation, "integrity_hash"> = { validation_id: "authority_boundary_validation", permitted_authority: PERMITTED_AUTHORITY, prohibited_authority: PROHIBITED_AUTHORITY, execution_prohibited: !failures.includes("AUTONOMOUS_EXECUTION_PERMITTED"), deployment_prohibited: true, production_mutation_prohibited: !failures.includes("AUTONOMOUS_EXECUTION_PERMITTED"), truth_ledger_mutation_prohibited: !failures.includes("TRUTH_LEDGER_MUTATION_ALLOWED"), authority_expansion_impossible: !failures.includes("AUTHORITY_EXPANSION_DETECTED"), operator_approval_required: !failures.includes("OPERATOR_APPROVAL_BYPASS") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function advisory(failures: readonly AdaptiveContractCertificationFailure[]): AdvisoryBoundaryValidation {
  const base: Omit<AdvisoryBoundaryValidation, "integrity_hash"> = { validation_id: "advisory_boundary_validation", observe_allowed: true, analyze_allowed: true, recommend_allowed: true, simulate_allowed: true, explain_allowed: true, execute_allowed: failures.includes("AUTONOMOUS_EXECUTION_PERMITTED") ? (true as false) : false, approve_allowed: failures.includes("OPERATOR_APPROVAL_BYPASS") ? (true as false) : false, certify_self_allowed: false, deploy_allowed: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function replay(failures: readonly AdaptiveContractCertificationFailure[]): AdaptiveReplayValidation {
  const base: Omit<AdaptiveReplayValidation, "integrity_hash"> = { validation_id: "adaptive_contract_replay_validation", replay_requirements_defined: !failures.includes("REPLAY_REQUIREMENTS_INCOMPLETE"), replay_refs: failures.includes("REPLAY_REQUIREMENTS_INCOMPLETE") ? freezeArray([]) : freezeArray(["replay:adaptive-contract:1"]), deterministic_replay: !failures.includes("NONDETERMINISTIC_CONTRACT_EVALUATION"), contract_replay_reproducible: !failures.includes("NONDETERMINISTIC_CONTRACT_EVALUATION"), output_hash_reproducible: !failures.includes("NONDETERMINISTIC_CONTRACT_EVALUATION"), simulation_prerequisite_enforced: !failures.includes("SIMULATION_PREREQUISITE_MISSING"), rollback_requirements_defined: !failures.includes("ROLLBACK_REQUIREMENTS_MISSING") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certificationReport(record: AdaptiveContractCertificationRecord): ContractCertificationReport {
  const base: Omit<ContractCertificationReport, "integrity_hash"> = { report_id: "adaptive_contract_certification_report", contract_version: record.contract_version, certification_outcome: record.certification_status, determinism_assessment: record.determinism_status, authority_boundary_assessment: record.authority_validation_status, governance_binding_assessment: record.governance_binding_status, constitutional_binding_assessment: record.constitutional_binding_status, replay_validation_result: record.replay_validation_status, learning_boundary_analysis: record.learning_boundary_status, advisory_only_compliance: record.advisory_boundary_status, remediation_actions: record.findings.map((f) => `remediate:${f}`), production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function boundaryReport(record: AdaptiveContractCertificationRecord): BoundaryComplianceReport {
  const base: Omit<BoundaryComplianceReport, "integrity_hash"> = { report_id: "adaptive_boundary_compliance_report", permitted_learning_domains: PERMITTED_LEARNING, prohibited_learning_domains: PROHIBITED_LEARNING, authority_boundaries: freezeArray([...PERMITTED_AUTHORITY, ...PROHIBITED_AUTHORITY]), governance_boundaries: record.governance_refs, constitutional_constraints: record.constitutional_refs, tenant_isolation_validated: record.tenant_id === TENANT_ID, operator_authority_preserved: !record.findings.includes("OPERATOR_APPROVAL_BYPASS"), advisory_only_verified: record.advisory_boundary_status === "PASS", replay_boundary_validated: record.replay_validation_status === "PASS", certification_evidence_refs: record.evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: AdaptiveContractCertificationFailure, refs: readonly string[]): AdaptiveContractCertificationTest {
  const base: Omit<AdaptiveContractCertificationTest, "integrity_hash"> = { test_id: id("adaptive_contract_cert_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<AdaptiveContractCertificationResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly AdaptiveContractCertificationTest[] {
  const r = result.record;
  const refs = freezeArray([r.integrity_hash]);
  return freezeArray([
    test("Adaptive Intelligence Contract valid", Boolean(r.contract_id), "ADAPTIVE_CONTRACT_MISSING", refs),
    test("Contract schema deterministic", result.deterministic, "CONTRACT_SCHEMA_INVALID", refs),
    test("Contract version certified", r.contract_version === "10.15.1", "CONTRACT_VERSION_UNCERTIFIED", refs),
    test("Contract integrity verified", hashWithoutIntegrity(r) === r.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    test("Adaptive scope defined", r.adaptive_scope.length >= SCOPE.length, "ADAPTIVE_SCOPE_UNDEFINED", refs),
    test("Learning boundaries complete", result.learning_boundary.permitted_domains_validated, "LEARNING_BOUNDARY_UNDEFINED", refs),
    test("Permitted learning domains validated", result.learning_boundary.permitted_domains.length === PERMITTED_LEARNING.length, "LEARNING_BOUNDARY_UNDEFINED", refs),
    test("Prohibited learning domains enforced", result.learning_boundary.prohibited_domains_enforced, "PROHIBITED_DOMAINS_OMITTED", refs),
    test("Hidden learning blocked", result.learning_boundary.hidden_learning_blocked, "HIDDEN_LEARNING_PERMITTED", refs),
    test("Unauthorized memory rejected", result.learning_boundary.unauthorized_memory_rejected, "UNAUTHORIZED_MEMORY_REJECTED", refs),
    test("Cross-tenant learning blocked", result.learning_boundary.cross_tenant_learning_blocked, "CROSS_TENANT_LEARNING_DETECTED", refs),
    test("Advisory-only boundary enforced", result.advisory_boundary.execute_allowed === false && result.advisory_boundary.approve_allowed === false, "ADVISORY_ONLY_GUARANTEE_ABSENT", refs),
    test("Autonomous execution prohibited", result.authority_boundary.execution_prohibited, "AUTONOMOUS_EXECUTION_PERMITTED", refs),
    test("Governance binding mandatory", result.governance_binding.invocation_mandatory, "GOVERNANCE_BINDING_MISSING", refs),
    test("Constitutional binding mandatory", result.constitutional_binding.review_mandatory, "CONSTITUTIONAL_BINDING_MISSING", refs),
    test("Authority limits enforced", result.authority_boundary.authority_expansion_impossible, "AUTHORITY_EXPANSION_DETECTED", refs),
    test("Truth Ledger mutation prohibited", result.authority_boundary.truth_ledger_mutation_prohibited, "TRUTH_LEDGER_MUTATION_ALLOWED", refs),
    test("Operator approval required", result.authority_boundary.operator_approval_required, "OPERATOR_APPROVAL_BYPASS", refs),
    test("Replay requirements defined", result.replay_validation.replay_requirements_defined, "REPLAY_REQUIREMENTS_INCOMPLETE", refs),
    test("Replay deterministic", result.replay_validation.deterministic_replay, "NONDETERMINISTIC_CONTRACT_EVALUATION", refs),
    test("Deterministic contract evaluation", result.deterministic, "NONDETERMINISTIC_CONTRACT_EVALUATION", refs),
    test("Contract replay reproducible", result.replay_validation.contract_replay_reproducible, "REPLAY_REQUIREMENTS_INCOMPLETE", refs),
    test("Simulation prerequisite enforced", result.replay_validation.simulation_prerequisite_enforced, "SIMULATION_PREREQUISITE_MISSING", refs),
    test("Rollback requirements defined", result.replay_validation.rollback_requirements_defined, "ROLLBACK_REQUIREMENTS_MISSING", refs),
    test("Tenant isolation preserved", result.tenant_isolated, "TENANT_ISOLATION_FAILURE", refs),
    test("Audit lineage complete", r.evidence_refs.length > 0 && result.boundary_report.certification_evidence_refs.length > 0, "AUDIT_LINEAGE_INCOMPLETE", refs),
    test("Integrity hash reproducible", hashWithoutIntegrity(r) === r.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}

function replayHash(result: Omit<AdaptiveContractCertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ record: result.record.integrity_hash, learning: result.learning_boundary.integrity_hash, governance: result.governance_binding.integrity_hash, constitutional: result.constitutional_binding.integrity_hash, authority: result.authority_boundary.integrity_hash, replay: result.replay_validation.integrity_hash, failures: result.failures });
}
function integrityHash(result: Omit<AdaptiveContractCertificationResult, "integrity_hash">): string {
  return hash({ version: result.adaptive_contract_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash });
}

export function certifyAdaptiveContract(input: AdaptiveContractCertificationInput = {}): AdaptiveContractCertificationResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as AdaptiveContractCertificationFailure] : []);
  const rec = record(input, initialFailures);
  const baseWithoutTests: BuildBase = { adaptive_contract_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, learning_boundary: learning(initialFailures), governance_binding: governance(initialFailures), constitutional_binding: constitutional(initialFailures), authority_boundary: authority(initialFailures), advisory_boundary: advisory(initialFailures), replay_validation: replay(initialFailures), certification_report: certificationReport(rec), boundary_report: boundaryReport(rec), widgets: WIDGETS, deterministic: !initialFailures.includes("NONDETERMINISTIC_CONTRACT_EVALUATION"), replayable: !initialFailures.includes("REPLAY_REQUIREMENTS_INCOMPLETE"), tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_FAILURE") && rec.tenant_id === TENANT_ID, advisory_only: true, production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is AdaptiveContractCertificationFailure => Boolean(f))])]);
  const base: Omit<AdaptiveContractCertificationResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateAdaptiveContractCertification(result?: AdaptiveContractCertificationResult): AdaptiveContractCertificationValidationResult {
  if (!result) {
    const failures = freezeArray<AdaptiveContractCertificationFailure>(["ADAPTIVE_CONTRACT_MISSING"]);
    const base: Omit<AdaptiveContractCertificationValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && result.production_ready;
  const base: Omit<AdaptiveContractCertificationValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}

export function replayAdaptiveContractCertification(result: AdaptiveContractCertificationResult): boolean {
  return validateAdaptiveContractCertification(result).valid;
}
export function buildAdaptiveContractCertificationObservability(result = certifyAdaptiveContract()): AdaptiveContractCertificationObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, deterministic: result.deterministic, replayable: result.replayable, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getAdaptiveContractCertificationContract(): AdaptiveContractCertificationContract {
  const result = certifyAdaptiveContract();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, permitted_learning_domains: PERMITTED_LEARNING, prohibited_learning_domains: PROHIBITED_LEARNING, permitted_authority: PERMITTED_AUTHORITY, prohibited_authority: PROHIBITED_AUTHORITY, required_scope: SCOPE, advisory_only: true, certification_required: true }), result, validation: validateAdaptiveContractCertification(result), observability: buildAdaptiveContractCertificationObservability(result) });
}
export const AdaptiveContractCertification = Object.freeze({ certify: certifyAdaptiveContract, validate: validateAdaptiveContractCertification, replay: replayAdaptiveContractCertification });
