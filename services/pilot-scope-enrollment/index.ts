import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPilotGovernanceFoundation } from "@/services/pilot-governance-foundation";
import type {
  EnrollmentOutcome,
  PilotEnrollmentLifecycleState,
  PilotScopeEnrollmentBundle,
  PilotScopeEnrollmentCertificationTest,
  PilotScopeEnrollmentFailure,
  PilotScopeEnrollmentInput,
  PilotScopeEnrollmentOutcome,
  PilotScopeEnrollmentResult,
  PilotScopeEnrollmentValidation,
  TenantQualificationOutcome,
} from "@/types/pilot-scope-enrollment";

const VERSION = "pilot-scope-enrollment/v16.2" as const;
const IDENTIFIER = "PilotScopeEnrollment" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_pilot_scope";
const DEFAULT_OPERATOR = "operator_phase_16_pilot_scope";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly PilotScopeEnrollmentFailure[], failure: PilotScopeEnrollmentFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: PilotScopeEnrollmentInput["scenario"]): PilotScopeEnrollmentFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly PilotScopeEnrollmentFailure[]): PilotScopeEnrollmentOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_ENROLLMENT_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["SCOPE_DEFINED", "QUALIFICATION_PENDING", "TENANT_QUALIFIED", "OPERATOR_APPROVED", "CAPABILITIES_APPROVED", "ENVIRONMENT_APPROVED", "DATASET_APPROVED", "ENROLLMENT_APPROVED", "ACTIVE", "SUSPENDED", "REVOKED", "COMPLETED"] as const satisfies readonly PilotEnrollmentLifecycleState[]);
const qualificationOutcomes = freezeArray(["QUALIFIED", "CONDITIONALLY_QUALIFIED", "REQUIRES_REVIEW", "NOT_QUALIFIED"] as const satisfies readonly TenantQualificationOutcome[]);
const enrollmentOutcomes = freezeArray(["APPROVED", "CONDITIONALLY_APPROVED", "REJECTED", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_RECERTIFICATION", "SUSPENDED", "REVOKED"] as const satisfies readonly EnrollmentOutcome[]);

function certTest(name: string, passed: boolean, failure: PilotScopeEnrollmentFailure, evidence_refs: readonly string[]): PilotScopeEnrollmentCertificationTest {
  const actual: PilotScopeEnrollmentOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_ENROLLMENT_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("pilot_scope_enrollment_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<PilotScopeEnrollmentResult, "replay_hash" | "integrity_hash">): string {
  return hash({ governance: result.pilot_governance_ref, lifecycle: result.lifecycle, scope: result.scope.integrity_hash, version: result.scope_version.integrity_hash, tenant: result.tenant_qualification.integrity_hash, operator: result.operator_qualification.integrity_hash, capabilities: result.capabilities.map((entry) => entry.integrity_hash), datasets: result.datasets.map((entry) => entry.integrity_hash), environments: result.environments.map((entry) => entry.integrity_hash), workflow: result.workflow.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), lineage: result.lineage.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<PilotScopeEnrollmentResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runPilotScopeEnrollment(input: PilotScopeEnrollmentInput = {}): PilotScopeEnrollmentResult {
  const governance = runPilotGovernanceFoundation({ pilot_id: input.pilot_id, tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR });
  const direct = directFailure(input.scenario);
  const upstreamFailures: PilotScopeEnrollmentFailure[] = governance.outcome === "PASS" ? [] : ["PHASE_16_1_GOVERNANCE_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const pilotId = input.pilot_id ?? governance.ownership.pilot_id;
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const operatorId = input.operator_id ?? DEFAULT_OPERATOR;
  const scopeVersionValue = input.scope_version ?? "16.2.0";
  const governanceRefs = has(failures, "SCOPE_NOT_GOVERNED") ? freezeArray([]) : freezeArray([governance.decision.integrity_hash, governance.authority.integrity_hash]);
  const certificationRefs = freezeArray([governance.integrity_hash, governance.production_certification_ref]);
  const evidenceRefs = has(failures, "QUALIFICATION_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([governance.integrity_hash, governance.scope.integrity_hash, governance.criteria.integrity_hash]);
  const scope = nested({ scope_id: id("pilot_scope_registry", { pilotId, scopeVersionValue }), pilot_id: pilotId, scope_version: scopeVersionValue, participating_tenants: has(failures, "UNQUALIFIED_TENANT_ENROLLED") ? freezeArray([tenantId, "tenant_unqualified_shadow"]) : freezeArray([tenantId]), approved_operators: freezeArray([operatorId]), approved_capabilities: freezeArray(["recommendation_services", "dashboards", "reporting", "advisory_workflows", "monitoring", "simulation", "replay"]), datasets: freezeArray([id("pilot_dataset", tenantId)]), environments: freezeArray([governance.ownership.production_environment]), governance_refs: governanceRefs, certification_refs: certificationRefs, effective_period: Object.freeze({ starts_at: TIMESTAMP, ends_at: null }), governed: !has(failures, "SCOPE_NOT_GOVERNED"), immutable: !has(failures, "SCOPE_NOT_VERSIONED"), current: true });
  const tenantQualificationOutcome: TenantQualificationOutcome = has(failures, "TENANT_QUALIFICATION_INCOMPLETE") || has(failures, "UNQUALIFIED_TENANT_ENROLLED") ? "NOT_QUALIFIED" : "QUALIFIED";
  const tenant_qualification = nested({ qualification_id: id("tenant_qualification", { tenantId, scopeVersionValue }), tenant_id: tenantId, identity_validated: !has(failures, "TENANT_QUALIFICATION_INCOMPLETE"), certification_status: has(failures, "TENANT_QUALIFICATION_INCOMPLETE") ? "MISSING" as const : "CURRENT" as const, governance_compliance: !has(failures, "TENANT_QUALIFICATION_INCOMPLETE") && !has(failures, "UNQUALIFIED_TENANT_ENROLLED"), isolation_readiness: !has(failures, "TENANT_QUALIFICATION_INCOMPLETE"), evidence_completeness: evidenceRefs.length > 0, operational_readiness: !has(failures, "TENANT_QUALIFICATION_INCOMPLETE"), advisory_boundary_compliance: !has(failures, "TENANT_QUALIFICATION_INCOMPLETE"), outcome: tenantQualificationOutcome, evidence_refs: evidenceRefs, evidence_immutable: !has(failures, "QUALIFICATION_EVIDENCE_MUTABLE") });
  const operator_qualification = nested({ operator_id: operatorId, approval_authority: governance.authority.governance_approval_authority, certification_ref: governance.integrity_hash, operational_role: "pilot_operator", permissions: freezeArray(["observe", "recommend", "explain", "request_governance_review"]), governance_approvals: has(failures, "OPERATOR_QUALIFICATION_INCOMPLETE") ? freezeArray([]) : governanceRefs, audit_required: true, approved: !has(failures, "OPERATOR_QUALIFICATION_INCOMPLETE") });
  const capabilities = freezeArray(scope.approved_capabilities.map((capability) => nested({ capability_id: capability, activation_status: has(failures, "CAPABILITY_ENROLLMENT_NOT_GOVERNED") ? "DISABLED" as const : "ENABLED" as const, governance_approval_ref: governanceRefs[0] ?? "", certification_dependency_ref: governance.integrity_hash, rollout_restrictions: freezeArray(["bounded tenants", "bounded traffic", "operator review"]), governed: !has(failures, "CAPABILITY_ENROLLMENT_NOT_GOVERNED") })));
  const datasets = freezeArray(scope.datasets.map((dataset_id) => nested({ dataset_id, version: "dataset-pilot-1", lineage_refs: has(failures, "DATASET_APPROVAL_NOT_GOVERNED") ? freezeArray([]) : evidenceRefs, approval_status: has(failures, "DATASET_APPROVAL_NOT_GOVERNED") ? "REQUIRES_REVIEW" as const : "APPROVED" as const, governance_classification: "PILOT_PRODUCTION" as const, tenant_owner: tenantId, evidence_refs: evidenceRefs, governed: !has(failures, "DATASET_APPROVAL_NOT_GOVERNED") })));
  const environments = freezeArray(scope.environments.map((environment_id) => nested({ environment_id, certification_refs: certificationRefs, deployment_status: has(failures, "ENVIRONMENT_QUALIFICATION_NOT_VERIFIED") ? "BLOCKED" as const : "APPROVED" as const, configuration_version: "production-pilot-config-16.2", qualification_history: has(failures, "ENVIRONMENT_QUALIFICATION_NOT_VERIFIED") ? freezeArray([]) : freezeArray([governance.production_certification_ref, governance.integrity_hash]), qualification_verified: !has(failures, "ENVIRONMENT_QUALIFICATION_NOT_VERIFIED") })));
  const scope_version = nested({ scope_id: scope.scope_id, version: scopeVersionValue, predecessor: null, successor: null, governance_approval_ref: governanceRefs[0] ?? "", effective_timestamp: TIMESTAMP, change_summary: "Initial governed pilot enrollment scope", immutable: !has(failures, "SCOPE_NOT_VERSIONED"), expansion_governed: !has(failures, "SCOPE_EXPANSION_WITHOUT_GOVERNANCE"), reduction_history_preserved: true });
  const workflowEvidence = freezeArray([scope.integrity_hash, scope_version.integrity_hash, tenant_qualification.integrity_hash, operator_qualification.integrity_hash, ...capabilities.map((entry) => entry.integrity_hash), ...datasets.map((entry) => entry.integrity_hash), ...environments.map((entry) => entry.integrity_hash)]);
  const workflowReplayHash = hash({ scope: scope.integrity_hash, tenant: tenant_qualification.integrity_hash, operator: operator_qualification.integrity_hash, capabilities: capabilities.map((entry) => entry.integrity_hash), datasets: datasets.map((entry) => entry.integrity_hash), environments: environments.map((entry) => entry.integrity_hash), approvals: governanceRefs });
  const workflow = nested({ workflow_id: id("pilot_enrollment_workflow", scope.scope_id), stages: lifecycleStates, current_state: has(failures, "UNQUALIFIED_TENANT_ENROLLED") ? "QUALIFICATION_PENDING" as const : "ACTIVE" as const, outcome: failures.length ? "REJECTED" as const : "APPROVED" as const, deterministic: !has(failures, "ENROLLMENT_NOT_REPRODUCIBLE"), qualification_bypass_blocked: !has(failures, "UNAUTHORIZED_ENROLLMENT_POSSIBLE") && !has(failures, "UNQUALIFIED_TENANT_ENROLLED"), unauthorized_expansion_blocked: !has(failures, "SCOPE_EXPANSION_WITHOUT_GOVERNANCE") && !has(failures, "UNAUTHORIZED_ENROLLMENT_POSSIBLE"), evidence_refs: workflowEvidence, approval_refs: governanceRefs, replay_hash: has(failures, "ENROLLMENT_NOT_REPRODUCIBLE") ? "" : workflowReplayHash });
  const ledgerTypes = ["ENROLLMENT_REQUEST", "TENANT_QUALIFICATION", "OPERATOR_APPROVAL", "CAPABILITY_APPROVAL", "ENVIRONMENT_APPROVAL", "DATASET_APPROVAL", "GOVERNANCE_DECISION", "SCOPE_VERSION", "ENROLLMENT_ACTIVE", "REVOCATION_REPLAY"] as const;
  const ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("pilot_enrollment_ledger", { scope: scope.scope_id, event_type }), sequence: index + 1, event_type, scope_version: scopeVersionValue, evidence_refs: has(failures, "ENROLLMENT_LINEAGE_MUTABLE") ? freezeArray([]) : workflowEvidence, governance_refs: has(failures, "GOVERNANCE_APPROVALS_NOT_REPLAYABLE") ? freezeArray([]) : governanceRefs, replay_refs: has(failures, "GOVERNANCE_APPROVALS_NOT_REPLAYABLE") || (event_type === "REVOCATION_REPLAY" && has(failures, "REVOKED_ENROLLMENT_NOT_REPLAYABLE")) ? freezeArray([]) : freezeArray([workflow.replay_hash, governance.replay_hash]), append_only: !has(failures, "ENROLLMENT_LINEAGE_MUTABLE"), immutable: !has(failures, "ENROLLMENT_LINEAGE_MUTABLE") })));
  const lineage = nested({ lineage_id: id("pilot_scope_lineage", scope.scope_id), scope_versions: freezeArray([scope_version.integrity_hash]), enrollment_events: has(failures, "ENROLLMENT_LINEAGE_MUTABLE") ? freezeArray([]) : freezeArray(ledger.map((entry) => entry.integrity_hash)), governance_approvals: governanceRefs, certification_refs: certificationRefs, tenant_participation: freezeArray([tenant_qualification.integrity_hash]), operator_participation: freezeArray([operator_qualification.integrity_hash]), capability_evolution: freezeArray(capabilities.map((entry) => entry.integrity_hash)), complete: !has(failures, "ENROLLMENT_LINEAGE_MUTABLE"), immutable: !has(failures, "ENROLLMENT_LINEAGE_MUTABLE"), replayable: !has(failures, "GOVERNANCE_APPROVALS_NOT_REPLAYABLE") });
  const tests = freezeArray([
    certTest("Scope governed", scope.governed && scope.governance_refs.length > 0, "SCOPE_NOT_GOVERNED", [scope.integrity_hash]),
    certTest("Scope versioned", scope.immutable && scope_version.immutable, "SCOPE_NOT_VERSIONED", [scope_version.integrity_hash]),
    certTest("Enrollment reproducible", workflow.deterministic && Boolean(workflow.replay_hash), "ENROLLMENT_NOT_REPRODUCIBLE", [workflow.integrity_hash]),
    certTest("Tenant qualification complete", tenant_qualification.outcome === "QUALIFIED" && tenant_qualification.evidence_refs.length > 0, "TENANT_QUALIFICATION_INCOMPLETE", [tenant_qualification.integrity_hash]),
    certTest("Operator qualification complete", operator_qualification.approved && operator_qualification.governance_approvals.length > 0, "OPERATOR_QUALIFICATION_INCOMPLETE", [operator_qualification.integrity_hash]),
    certTest("Capability enrollment governed", capabilities.every((entry) => entry.governed && entry.activation_status === "ENABLED"), "CAPABILITY_ENROLLMENT_NOT_GOVERNED", capabilities.map((entry) => entry.integrity_hash)),
    certTest("Environment qualification verified", environments.every((entry) => entry.qualification_verified && entry.qualification_history.length > 0), "ENVIRONMENT_QUALIFICATION_NOT_VERIFIED", environments.map((entry) => entry.integrity_hash)),
    certTest("Dataset approval governed", datasets.every((entry) => entry.governed && entry.approval_status === "APPROVED" && entry.lineage_refs.length > 0), "DATASET_APPROVAL_NOT_GOVERNED", datasets.map((entry) => entry.integrity_hash)),
    certTest("Enrollment lineage immutable", lineage.immutable && ledger.every((entry) => entry.immutable && entry.append_only && entry.evidence_refs.length > 0), "ENROLLMENT_LINEAGE_MUTABLE", [lineage.integrity_hash]),
    certTest("Governance approvals replayable", lineage.replayable && ledger.every((entry) => entry.governance_refs.length > 0 && entry.replay_refs.length > 0), "GOVERNANCE_APPROVALS_NOT_REPLAYABLE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Unauthorized enrollment impossible", workflow.qualification_bypass_blocked && workflow.unauthorized_expansion_blocked, "UNAUTHORIZED_ENROLLMENT_POSSIBLE", [workflow.integrity_hash]),
    certTest("Only qualified tenants participate", scope.participating_tenants.length === 1 && tenant_qualification.outcome === "QUALIFIED", "UNQUALIFIED_TENANT_ENROLLED", [tenant_qualification.integrity_hash]),
    certTest("Scope expansion requires governance approval", scope_version.expansion_governed && workflow.unauthorized_expansion_blocked, "SCOPE_EXPANSION_WITHOUT_GOVERNANCE", [scope_version.integrity_hash]),
    certTest("Qualification evidence immutable", tenant_qualification.evidence_immutable && tenant_qualification.evidence_refs.length > 0, "QUALIFICATION_EVIDENCE_MUTABLE", [tenant_qualification.integrity_hash]),
    certTest("Revoked enrollment remains replayable", ledger.some((entry) => entry.event_type === "REVOCATION_REPLAY" && entry.replay_refs.length > 0), "REVOKED_ENROLLMENT_NOT_REPLAYABLE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Phase 16.1 governance foundation valid", governance.outcome === "PASS", "PHASE_16_1_GOVERNANCE_NOT_VALID", [governance.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is PilotScopeEnrollmentFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<PilotScopeEnrollmentResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, pilot_governance_ref: governance.integrity_hash, lifecycle: lifecycleStates, scope, scope_version, tenant_qualification, operator_qualification, capabilities, datasets, environments, workflow, ledger, lineage, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePilotScopeEnrollment(result = runPilotScopeEnrollment()): PilotScopeEnrollmentValidation {
  const scope_valid = verify(result.scope) && result.scope.governed && result.scope.immutable && result.scope.governance_refs.length > 0 && result.scope.participating_tenants.length === 1;
  const version_valid = verify(result.scope_version) && result.scope_version.immutable && result.scope_version.expansion_governed && result.scope_version.reduction_history_preserved && Boolean(result.scope_version.governance_approval_ref);
  const tenant_valid = verify(result.tenant_qualification) && result.tenant_qualification.outcome === "QUALIFIED" && result.tenant_qualification.identity_validated && result.tenant_qualification.certification_status === "CURRENT" && result.tenant_qualification.governance_compliance && result.tenant_qualification.isolation_readiness && result.tenant_qualification.evidence_completeness && result.tenant_qualification.operational_readiness && result.tenant_qualification.advisory_boundary_compliance && result.tenant_qualification.evidence_immutable;
  const operator_valid = verify(result.operator_qualification) && result.operator_qualification.approved && result.operator_qualification.audit_required && result.operator_qualification.governance_approvals.length > 0;
  const capability_valid = result.capabilities.length === 7 && result.capabilities.every((entry) => verify(entry) && entry.governed && entry.activation_status === "ENABLED" && Boolean(entry.governance_approval_ref) && Boolean(entry.certification_dependency_ref));
  const dataset_valid = result.datasets.length > 0 && result.datasets.every((entry) => verify(entry) && entry.governed && entry.approval_status === "APPROVED" && entry.lineage_refs.length > 0 && entry.evidence_refs.length > 0);
  const environment_valid = result.environments.length > 0 && result.environments.every((entry) => verify(entry) && entry.qualification_verified && entry.deployment_status === "APPROVED" && entry.certification_refs.length > 0 && entry.qualification_history.length > 0);
  const workflow_valid = verify(result.workflow) && result.workflow.stages.length === 12 && result.workflow.current_state === "ACTIVE" && result.workflow.outcome === "APPROVED" && result.workflow.deterministic && result.workflow.qualification_bypass_blocked && result.workflow.unauthorized_expansion_blocked && result.workflow.evidence_refs.length > 0 && result.workflow.approval_refs.length > 0 && Boolean(result.workflow.replay_hash);
  const ledger_valid = result.ledger.length === 10 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.evidence_refs.length > 0 && entry.governance_refs.length > 0 && entry.replay_refs.length > 0 && entry.append_only && entry.immutable);
  const lineage_valid = verify(result.lineage) && result.lineage.complete && result.lineage.immutable && result.lineage.replayable && result.lineage.scope_versions.length > 0 && result.lineage.enrollment_events.length === result.ledger.length && result.lineage.governance_approvals.length > 0 && result.lineage.certification_refs.length > 0;
  const certification_valid = result.certification_tests.length === 16 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && scope_valid && version_valid && tenant_valid && operator_valid && capability_valid && dataset_valid && environment_valid && workflow_valid && ledger_valid && lineage_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, scope_valid, version_valid, tenant_valid, operator_valid, capability_valid, dataset_valid, environment_valid, workflow_valid, ledger_valid, lineage_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayPilotScopeEnrollment(result = runPilotScopeEnrollment()): boolean {
  const replayed = runPilotScopeEnrollment();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePilotScopeEnrollment(result).valid;
}

export function getPilotScopeEnrollmentBundle(): PilotScopeEnrollmentBundle {
  const result = runPilotScopeEnrollment();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "pilot-governance-foundation/v16.1" as const, lifecycle: lifecycleStates, qualification_outcomes: qualificationOutcomes, enrollment_outcomes: enrollmentOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validatePilotScopeEnrollment(result) });
}

export const PilotScopeEnrollmentService = Object.freeze({ run: runPilotScopeEnrollment, validate: validatePilotScopeEnrollment, replay: replayPilotScopeEnrollment });
