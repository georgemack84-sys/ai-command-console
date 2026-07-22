import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayPhase14CertificationGate, runPhase14CertificationGate, validatePhase14CertificationGate } from "@/services/phase14-certification-gate";
import type {
  ProductionAuthorityRole,
  ProductionEnvironment,
  ProductionEvidenceType,
  ProductionReadinessBundle,
  ProductionReadinessFailure,
  ProductionReadinessInput,
  ProductionReadinessOutcome,
  ProductionReadinessResult,
  ProductionReadinessCertificationTest,
  ProductionReadinessValidation,
  QualificationLifecycleState,
} from "@/types/production-readiness-foundation";

const VERSION = "production-readiness-foundation/v15.1" as const;
const IDENTIFIER = "ProductionReadinessFoundation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_15_production_readiness" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProductionReadinessFailure[], failure: ProductionReadinessFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProductionReadinessInput["scenario"]): ProductionReadinessFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProductionReadinessFailure[]): ProductionReadinessOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_READINESS_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["REGISTERED", "PREPARING", "EVIDENCE_COLLECTION", "QUALIFICATION_REVIEW", "READY_FOR_PROMOTION", "PROMOTION_APPROVED", "DEPLOYMENT_PENDING", "DEPLOYED", "MONITORING", "SUPERSEDED", "ROLLED_BACK", "ARCHIVED"] as const satisfies readonly QualificationLifecycleState[]);
const promotionPath = freezeArray(["SYNTHETIC", "QUALIFICATION", "PRE_PRODUCTION", "PRODUCTION"] as const satisfies readonly ProductionEnvironment[]);
const requiredEvidence = freezeArray(["SYNTHETIC_CERTIFICATION", "REPLAY_EVIDENCE", "INTEGRITY_VERIFICATION", "TENANT_ISOLATION_VALIDATION", "BOUNDARY_VALIDATION", "GOVERNANCE_APPROVAL", "DEPENDENCY_VERIFICATION", "ROLLBACK_VERIFICATION", "OPERATIONAL_READINESS", "RELEASE_APPROVAL"] as const satisfies readonly ProductionEvidenceType[]);
const authorityHierarchy = freezeArray(["GOVERNANCE_AUTHORITY", "OPERATOR_AUTHORITY", "MISSION_CONTROL_ADVISOR", "EMERGENCY_AUTHORITY", "ESCALATION_AUTHORITY"] as const satisfies readonly ProductionAuthorityRole[]);

function certTest(name: string, passed: boolean, failure: ProductionReadinessFailure, evidence_refs: readonly string[]): ProductionReadinessCertificationTest {
  const actual: ProductionReadinessOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_READINESS_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("production_readiness_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProductionReadinessResult, "replay_hash" | "integrity_hash">): string {
  return hash({ phase14: result.phase14_certification_ref, contract: result.contract.integrity_hash, lifecycle: result.lifecycle.integrity_hash, scope: result.scope_registry.integrity_hash, release: result.release_record.integrity_hash, promotion: result.promotion_rules.integrity_hash, authority: result.authority_model.integrity_hash, evidence: result.evidence_registry.integrity_hash, inheritance: result.certification_inheritance.integrity_hash, rollback: result.rollback.integrity_hash, boundary: result.boundary_governance.integrity_hash, readiness: result.readiness_report.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProductionReadinessResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runProductionReadinessFoundation(input: ProductionReadinessInput = {}): ProductionReadinessResult {
  const phase14 = runPhase14CertificationGate({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const phase14Validation = validatePhase14CertificationGate(phase14);
  const phase14Replayable = replayPhase14CertificationGate(phase14);
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProductionReadinessFailure[] = phase14Validation.valid && phase14Replayable ? [] : ["SYNTHETIC_CERTIFICATION_NOT_REQUIRED"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenant = input.tenant_id ?? DEFAULT_TENANT;
  const phase14Ref = phase14.certification_record.integrity_hash;
  const rollbackPlanRef = id("rollback_plan", phase14Ref);
  const releaseId = id("production_release", { tenant, phase14Ref });
  const evidenceRefs = freezeArray([phase14Ref, phase14.replay_hash, phase14.replay_certification.integrity_hash, phase14.governance_certification.tenant_isolation_refs[0] ?? phase14Ref, phase14.governance_certification.advisory_boundary_refs[0] ?? phase14Ref, phase14.governance_certification.integrity_hash, phase14.dependency_certification.integrity_hash, rollbackPlanRef, phase14.operational_readiness.integrity_hash, id("release_approval", releaseId)]);
  const contract = nested({ contract_version: VERSION, production_qualification_required: true, governance_immutable: !has(failures, "PRODUCTION_GOVERNANCE_NON_DETERMINISTIC"), replay_required: true, rollback_required: !has(failures, "ROLLBACK_NOT_MANDATORY"), fail_closed: !has(failures, "FAIL_CLOSED_NOT_ENFORCED"), advisory_only: !has(failures, "ADVISORY_BOUNDARY_BREACH"), deployment_authority_implies_execution_authority: false as const, required_evidence: has(failures, "REQUIRED_EVIDENCE_UNDEFINED") ? requiredEvidence.slice(0, 8) : requiredEvidence, authority_hierarchy: has(failures, "AUTHORITY_HIERARCHY_BREACH") ? authorityHierarchy.slice(1) : authorityHierarchy });
  const lifecycle = nested({ lifecycle_id: id("qualification_lifecycle", VERSION), states: lifecycleStates, deterministic_transitions: !has(failures, "LIFECYCLE_NON_DETERMINISTIC"), skipped_states_allowed: false as const, rollback_preserves_history: !has(failures, "RELEASE_LINEAGE_LOST"), supersession_preserves_prior_releases: true, every_transition_audited: !has(failures, "AUDIT_TRAIL_MUTABLE") });
  const scope_registry = nested({ scope_id: id("production_scope", tenant), production_environments: promotionPath, deployment_regions: freezeArray(["us-east-1", "us-west-2"]), services: freezeArray(["mission-control-api", "mission-control-ui", "decision-audit-ledger"]), tenants: has(failures, "SCOPE_REGISTRY_INCOMPLETE") ? freezeArray([]) : freezeArray([tenant]), feature_scope: freezeArray(["advisory assessment", "certification reporting", "operator review"]), release_scope: freezeArray([releaseId]), supported_configurations: freezeArray(["pre-production-qualified", "production-controlled"]), operational_boundaries: freezeArray(["no execution authority", "operator approval required", "tenant isolated"]), immutable_after_approval: true, requalification_required_for_changes: true });
  const release_record = nested({ release_id: releaseId, release_name: "Mission Control Production Readiness Foundation", release_version: "15.1.0", release_lineage: has(failures, "RELEASE_LINEAGE_LOST") ? freezeArray([]) : freezeArray([phase14.certification_record.certification_id, phase14Ref]), deployment_scope: scope_registry.scope_id, certification_refs: has(failures, "SYNTHETIC_CERTIFICATION_NOT_REQUIRED") ? freezeArray([]) : freezeArray([phase14Ref]), synthetic_validation_refs: freezeArray([phase14.evidence_binder.integrity_hash, phase14.certification_record.certification_id]), evidence_refs: has(failures, "MISSING_EVIDENCE_ALLOWED_PROMOTION") ? evidenceRefs.slice(0, 7) : evidenceRefs, rollback_plan_ref: has(failures, "ROLLBACK_NOT_MANDATORY") ? "" : rollbackPlanRef, approval_refs: has(failures, "GOVERNANCE_APPROVAL_NOT_REQUIRED") ? freezeArray([]) : freezeArray([id("governance_approval", releaseId), id("operator_approval", releaseId)]), deployment_constraints: freezeArray(["fail closed", "advisory only", "rollback required", "scope immutable"]), creation_timestamp: TIMESTAMP });
  const promotion_rules = nested({ promotion_id: id("environment_promotion", releaseId), path: promotionPath, no_skipped_environments: !has(failures, "PROMOTION_RULES_NOT_ENFORCED"), evidence_completion_required: !has(failures, "MISSING_EVIDENCE_ALLOWED_PROMOTION"), successful_certification_required: !has(failures, "SYNTHETIC_CERTIFICATION_NOT_REQUIRED"), governance_approval_required: !has(failures, "GOVERNANCE_APPROVAL_NOT_REQUIRED"), rollback_readiness_required: !has(failures, "ROLLBACK_NOT_MANDATORY"), replayable: !has(failures, "PROMOTION_REPLAY_NON_DETERMINISTIC"), prior_environments_immutable: true });
  const authority_model = nested({ authority_id: id("promotion_authority", releaseId), governance_approves_policy: !has(failures, "GOVERNANCE_APPROVAL_NOT_REQUIRED"), operators_approve_operational_promotion: true, mission_control_recommends_only: !has(failures, "ADVISORY_BOUNDARY_BREACH"), assessment_system_authorizes_deployment: false as const, delegation_bounded: !has(failures, "PROMOTION_AUTHORITY_AMBIGUOUS"), authority_inheritance_deterministic: !has(failures, "AUTHORITY_HIERARCHY_BREACH") });
  const evidence_registry = nested({ evidence_registry_id: id("production_evidence", releaseId), required_evidence: contract.required_evidence, evidence_refs: release_record.evidence_refs, missing_evidence_blocks_promotion: !has(failures, "MISSING_EVIDENCE_ALLOWED_PROMOTION"), immutable: !has(failures, "AUDIT_TRAIL_MUTABLE"), replayable: !has(failures, "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE"), lineage_preserved: !has(failures, "RELEASE_LINEAGE_LOST") });
  const certification_inheritance = nested({ inheritance_id: id("certification_inheritance", phase14Ref), synthetic_certification_ref: has(failures, "SYNTHETIC_CERTIFICATION_NOT_REQUIRED") ? "" : phase14Ref, dependency_inheritance_refs: phase14.certification_record.dependency_manifest_refs, evidence_inheritance_refs: phase14.certification_record.evidence_bundle_refs, supersession_inheritance_refs: phase14.certification_record.predecessor_certification_refs, qualification_inheritance_refs: freezeArray([release_record.integrity_hash]), only_certified_artifacts_inherit: !has(failures, "INVALID_INHERITANCE_NOT_BLOCKED"), preserves_lineage: !has(failures, "RELEASE_LINEAGE_LOST"), never_overrides_certification: true, invalid_inheritance_blocked: !has(failures, "INVALID_INHERITANCE_NOT_BLOCKED"), deterministic: !has(failures, "CERTIFICATION_INHERITANCE_NON_DETERMINISTIC") });
  const rollback = nested({ rollback_plan_id: rollbackPlanRef, rollback_triggers: freezeArray(["failed deployment health", "boundary violation", "integrity divergence", "operator rollback approval"]), rollback_evidence_refs: has(failures, "ROLLBACK_NOT_MANDATORY") ? freezeArray([]) : freezeArray([phase14.replay_hash, phase14.integrity_hash]), rollback_owner: "OPERATOR_AUTHORITY", rollback_validated_before_promotion: !has(failures, "ROLLBACK_NOT_MANDATORY"), replayable: !has(failures, "ROLLBACK_REPLAY_NOT_REPRODUCIBLE"), immutable: true, evidence_preserved: true });
  const boundary_governance = nested({ boundary_id: id("production_boundary", releaseId), execution_authority_protected: !has(failures, "ADVISORY_BOUNDARY_BREACH"), advisory_only_separation: !has(failures, "ADVISORY_BOUNDARY_BREACH"), operator_authority_preserved: true, tenant_isolation_preserved: true, audit_ownership_preserved: true, governance_ownership_preserved: !has(failures, "PRODUCTION_GOVERNANCE_NON_DETERMINISTIC"), production_effect_boundaries_enforced: !has(failures, "PRODUCTION_EFFECT_BOUNDARY_NOT_ENFORCED"), boundary_violations_block_deployment: !has(failures, "PRODUCTION_EFFECT_BOUNDARY_NOT_ENFORCED"), boundary_replay_required: true });
  const readiness_report = nested({ report_id: id("production_readiness_report", releaseId), lifecycle_valid: lifecycle.deterministic_transitions, promotion_rules_valid: promotion_rules.no_skipped_environments && promotion_rules.evidence_completion_required, authority_hierarchy_valid: authority_model.delegation_bounded && authority_model.authority_inheritance_deterministic, rollback_ready: rollback.rollback_validated_before_promotion && rollback.replayable, evidence_complete: evidence_registry.evidence_refs.length === requiredEvidence.length && evidence_registry.missing_evidence_blocks_promotion, boundary_enforced: boundary_governance.production_effect_boundaries_enforced && boundary_governance.advisory_only_separation, certification_inheritance_valid: certification_inheritance.deterministic && certification_inheritance.invalid_inheritance_blocked, scope_registry_valid: scope_registry.tenants.length > 0 && scope_registry.immutable_after_approval, release_identities_valid: release_record.release_lineage.length > 0 && Boolean(release_record.rollback_plan_ref), replay_reproducible: !has(failures, "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE") && phase14Replayable });
  const tests = freezeArray([
    certTest("Production Readiness Contract approved", contract.production_qualification_required && contract.governance_immutable, "PRODUCTION_CONTRACT_NOT_APPROVED", [contract.integrity_hash]),
    certTest("Deployment lifecycle deterministic", lifecycle.deterministic_transitions && lifecycle.skipped_states_allowed === false, "LIFECYCLE_NON_DETERMINISTIC", [lifecycle.integrity_hash]),
    certTest("Production Scope Registry complete", readiness_report.scope_registry_valid, "SCOPE_REGISTRY_INCOMPLETE", [scope_registry.integrity_hash]),
    certTest("Release identities immutable", readiness_report.release_identities_valid && Boolean(release_record.release_id), "RELEASE_IDENTITIES_MUTABLE", [release_record.integrity_hash]),
    certTest("Environment promotion rules enforced", promotion_rules.no_skipped_environments, "PROMOTION_RULES_NOT_ENFORCED", [promotion_rules.integrity_hash]),
    certTest("Promotion authority explicit", authority_model.delegation_bounded, "PROMOTION_AUTHORITY_AMBIGUOUS", [authority_model.integrity_hash]),
    certTest("Governance approval required", promotion_rules.governance_approval_required && release_record.approval_refs.length > 0, "GOVERNANCE_APPROVAL_NOT_REQUIRED", release_record.approval_refs),
    certTest("Mission Control advisory-only boundary preserved", contract.advisory_only && authority_model.mission_control_recommends_only, "ADVISORY_BOUNDARY_BREACH", [boundary_governance.integrity_hash]),
    certTest("Production-effect boundaries enforced", boundary_governance.production_effect_boundaries_enforced && boundary_governance.boundary_violations_block_deployment, "PRODUCTION_EFFECT_BOUNDARY_NOT_ENFORCED", [boundary_governance.integrity_hash]),
    certTest("Required evidence defined", contract.required_evidence.length === 10, "REQUIRED_EVIDENCE_UNDEFINED", [contract.integrity_hash]),
    certTest("Missing evidence blocks promotion", evidence_registry.missing_evidence_blocks_promotion && evidence_registry.evidence_refs.length === 10, "MISSING_EVIDENCE_ALLOWED_PROMOTION", [evidence_registry.integrity_hash]),
    certTest("Certification inheritance deterministic", certification_inheritance.deterministic, "CERTIFICATION_INHERITANCE_NON_DETERMINISTIC", [certification_inheritance.integrity_hash]),
    certTest("Invalid inheritance blocked", certification_inheritance.invalid_inheritance_blocked && certification_inheritance.only_certified_artifacts_inherit, "INVALID_INHERITANCE_NOT_BLOCKED", [certification_inheritance.integrity_hash]),
    certTest("Rollback mandatory before promotion", promotion_rules.rollback_readiness_required && Boolean(release_record.rollback_plan_ref), "ROLLBACK_NOT_MANDATORY", [rollback.integrity_hash]),
    certTest("Rollback replay reproducible", rollback.replayable, "ROLLBACK_REPLAY_NOT_REPRODUCIBLE", [rollback.integrity_hash]),
    certTest("Release lineage preserved", certification_inheritance.preserves_lineage && release_record.release_lineage.length > 0, "RELEASE_LINEAGE_LOST", [release_record.integrity_hash]),
    certTest("Promotion replay deterministic", promotion_rules.replayable, "PROMOTION_REPLAY_NON_DETERMINISTIC", [promotion_rules.integrity_hash]),
    certTest("Audit trail immutable", lifecycle.every_transition_audited && evidence_registry.immutable, "AUDIT_TRAIL_MUTABLE", [lifecycle.integrity_hash, evidence_registry.integrity_hash]),
    certTest("Fail-closed behavior enforced", contract.fail_closed, "FAIL_CLOSED_NOT_ENFORCED", [contract.integrity_hash]),
    certTest("Synthetic certification required before promotion", promotion_rules.successful_certification_required && certification_inheritance.synthetic_certification_ref.length > 0, "SYNTHETIC_CERTIFICATION_NOT_REQUIRED", [phase14Ref]),
    certTest("Qualification replay reproducible", readiness_report.replay_reproducible, "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE", [phase14.replay_hash]),
    certTest("Constitutional authority hierarchy preserved", contract.authority_hierarchy[0] === "GOVERNANCE_AUTHORITY" && authority_model.authority_inheritance_deterministic, "AUTHORITY_HIERARCHY_BREACH", [authority_model.integrity_hash]),
    certTest("Production governance deterministic", boundary_governance.governance_ownership_preserved && contract.governance_immutable, "PRODUCTION_GOVERNANCE_NON_DETERMINISTIC", [boundary_governance.integrity_hash]),
    certTest("Phase 15.1 foundation ready for subsequent production qualification phases", readiness_report.lifecycle_valid && readiness_report.evidence_complete && readiness_report.boundary_enforced && readiness_report.replay_reproducible, "FOUNDATION_NOT_READY", [readiness_report.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProductionReadinessFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ProductionReadinessResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, phase14_certification_ref: phase14Ref, contract, lifecycle, scope_registry, release_record, promotion_rules, authority_model, evidence_registry, certification_inheritance, rollback, boundary_governance, readiness_report, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionReadinessFoundation(result = runProductionReadinessFoundation()): ProductionReadinessValidation {
  const contract_valid = verify(result.contract) && result.contract.required_evidence.length === 10 && result.contract.production_qualification_required && result.contract.fail_closed && result.contract.advisory_only && result.contract.deployment_authority_implies_execution_authority === false;
  const lifecycle_valid = verify(result.lifecycle) && result.lifecycle.states.length === 12 && result.lifecycle.deterministic_transitions && result.lifecycle.skipped_states_allowed === false && result.lifecycle.every_transition_audited;
  const scope_valid = verify(result.scope_registry) && result.scope_registry.production_environments.length === 4 && result.scope_registry.tenants.length > 0 && result.scope_registry.immutable_after_approval;
  const release_valid = verify(result.release_record) && result.release_record.release_lineage.length > 0 && result.release_record.certification_refs.length > 0 && Boolean(result.release_record.rollback_plan_ref);
  const promotion_valid = verify(result.promotion_rules) && result.promotion_rules.path.length === 4 && result.promotion_rules.no_skipped_environments && result.promotion_rules.evidence_completion_required && result.promotion_rules.successful_certification_required && result.promotion_rules.governance_approval_required && result.promotion_rules.rollback_readiness_required && result.promotion_rules.replayable;
  const authority_valid = verify(result.authority_model) && result.authority_model.governance_approves_policy && result.authority_model.operators_approve_operational_promotion && result.authority_model.mission_control_recommends_only && result.authority_model.assessment_system_authorizes_deployment === false && result.authority_model.delegation_bounded;
  const evidence_valid = verify(result.evidence_registry) && result.evidence_registry.required_evidence.length === 10 && result.evidence_registry.evidence_refs.length === 10 && result.evidence_registry.missing_evidence_blocks_promotion && result.evidence_registry.immutable && result.evidence_registry.replayable && result.evidence_registry.lineage_preserved;
  const inheritance_valid = verify(result.certification_inheritance) && result.certification_inheritance.synthetic_certification_ref.length > 0 && result.certification_inheritance.only_certified_artifacts_inherit && result.certification_inheritance.preserves_lineage && result.certification_inheritance.never_overrides_certification && result.certification_inheritance.invalid_inheritance_blocked && result.certification_inheritance.deterministic;
  const rollback_valid = verify(result.rollback) && result.rollback.rollback_validated_before_promotion && result.rollback.rollback_evidence_refs.length > 0 && result.rollback.replayable && result.rollback.immutable && result.rollback.evidence_preserved;
  const boundary_valid = verify(result.boundary_governance) && result.boundary_governance.execution_authority_protected && result.boundary_governance.advisory_only_separation && result.boundary_governance.production_effect_boundaries_enforced && result.boundary_governance.boundary_violations_block_deployment && result.boundary_governance.boundary_replay_required;
  const readiness_valid = verify(result.readiness_report) && Object.entries(result.readiness_report).filter(([key]) => key !== "report_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 24 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && contract_valid && lifecycle_valid && scope_valid && release_valid && promotion_valid && authority_valid && evidence_valid && inheritance_valid && rollback_valid && boundary_valid && readiness_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, lifecycle_valid, scope_valid, release_valid, promotion_valid, authority_valid, evidence_valid, inheritance_valid, rollback_valid, boundary_valid, readiness_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayProductionReadinessFoundation(result = runProductionReadinessFoundation()): boolean {
  const replayed = runProductionReadinessFoundation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionReadinessFoundation(result).valid;
}

export function getProductionReadinessFoundationBundle(): ProductionReadinessBundle {
  const result = runProductionReadinessFoundation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "phase14-certification-gate/v14.12" as const, lifecycle: lifecycleStates, promotion_path: promotionPath, required_evidence: requiredEvidence, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateProductionReadinessFoundation(result) });
}

export const ProductionReadinessFoundationService = Object.freeze({ run: runProductionReadinessFoundation, validate: validateProductionReadinessFoundation, replay: replayProductionReadinessFoundation });
