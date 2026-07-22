import { runProgramQualification, validateProgramQualification } from "@/services/caf-program-qualification";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationFoundationBundle,
  ApplicationFoundationFailure,
  ApplicationFoundationInput,
  ApplicationFoundationOutcome,
  ApplicationFoundationResult,
  ApplicationFoundationScenario,
  ApplicationFoundationValidation,
  ApplicationTaxonomyCategory,
} from "@/types/application-constitutional-foundation";

const VERSION = "application-constitutional-foundation/v4.1" as const;
const IDENTIFIER = "ApplicationConstitutionalFoundation" as const;
let baselineProgramQualification: ReturnType<typeof runProgramQualification> | undefined;
const CATEGORIES: readonly ApplicationTaxonomyCategory[] = Object.freeze([
  "OPERATIONAL_APPLICATION",
  "INTELLIGENCE_APPLICATION",
  "ANALYSIS_APPLICATION",
  "COLLABORATION_APPLICATION",
  "ADMINISTRATIVE_APPLICATION",
  "CONSUMER_APPLICATION",
  "PLATFORM_APPLICATION",
  "EXTERNAL_INTEGRATION_APPLICATION",
]);

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
function has(failures: readonly ApplicationFoundationFailure[], failure: ApplicationFoundationFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationFoundationScenario): ApplicationFoundationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationFoundationFailure[]): ApplicationFoundationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineProgramQualification() { baselineProgramQualification ??= runProgramQualification(); return baselineProgramQualification; }

function resultReplayHash(result: Omit<ApplicationFoundationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    doctrine: result.doctrine.integrity_hash,
    inheritance: result.inheritance.integrity_hash,
    boundary_model: result.boundary_model.integrity_hash,
    ownership_registry: result.ownership_registry.integrity_hash,
    taxonomy: result.taxonomy.integrity_hash,
    constraints: result.constraints.integrity_hash,
    namespace_governance: result.namespace_governance.integrity_hash,
    evidence: result.evidence.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationFoundationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationConstitutionalFoundation(input: ApplicationFoundationInput = {}): ApplicationFoundationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationFoundationFailure>(direct ? [direct] : []);
  const p3 = getBaselineProgramQualification();
  const dependencyFailures = freezeArray<ApplicationFoundationFailure>([
    ...(has(scenarioFailures, "PROGRAM_1_CONSTITUTION_INVALID") ? ["PROGRAM_1_CONSTITUTION_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_GOVERNANCE_INVALID") ? ["PROGRAM_2_GOVERNANCE_INVALID" as const] : []),
    ...(!validateProgramQualification(p3).valid || has(scenarioFailures, "PROGRAM_3_BOUNDARY_INVALID") ? ["PROGRAM_3_BOUNDARY_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const doctrine = nested({
    doctrine_id: "P4.1-APPLICATION-DOCTRINE-001",
    purpose: "Establish constitutional identity, authority limits, and architectural obligations for Civitas ecosystem applications.",
    constitutional_obligations: freezeArray(["inherit-program-1-baseline", "inherit-program-2-governance", "inherit-program-3-runtime-boundaries", "fail-closed", "preserve-immutable-evidence"]),
    architectural_identity: "Program 4 application constitutional foundation",
    ecosystem_responsibilities: freezeArray(["define-application-purpose", "declare-boundaries", "assign-ownership", "classify-taxonomy", "govern-namespace"]),
    authority_limits: freezeArray(["may-extend-inherited-authority", "may-not-override-programs-1-3", "may-not-define-independent-constitutional-behavior"]),
    governance_expectations: freezeArray(["governance-first-execution", "deterministic-ownership", "boundary-validation", "namespace-lifecycle-control"]),
    implements_application_functionality: has(failures, "APPLICATION_FUNCTIONALITY_IMPLEMENTED"),
  });
  const inheritance = nested({
    inheritance_id: "P4.1-INHERITANCE-001",
    hierarchy: freezeArray(["Program 1 Constitution", "Program 2 Platform Constitution", "Program 3 Agent Constitution", "Program 4 Application Constitution"]),
    inherited_responsibilities: freezeArray(["constitutional-baseline", "constitutional-governance-model", "constitutional-runtime-boundaries"]),
    inherited_governance: freezeArray(["authority-separation", "policy-enforcement", "safety-enforcement", "evidence-governance"]),
    inherited_constraints: freezeArray(["deterministic-behavior", "fail-closed-operation", "tenant-isolation", "replay-compatibility"]),
    extension_allowed: true,
    override_allowed: has(failures, "CONSTITUTIONAL_BEHAVIOR_DEFINED_INDEPENDENTLY"),
    weakening_allowed: has(failures, "CONSTITUTIONAL_INHERITANCE_WEAKENED"),
    validated: !has(failures, "CONSTITUTIONAL_INHERITANCE_WEAKENED") && !has(failures, "CONSTITUTIONAL_BEHAVIOR_DEFINED_INDEPENDENTLY"),
  });
  const boundaryComplete = !has(failures, "BOUNDARY_MODEL_INCOMPLETE") && !has(failures, "CAPABILITY_OUTSIDE_BOUNDARY");
  const boundary_model = nested({
    boundary_model_id: "P4.1-BOUNDARY-MODEL-001",
    functional_scope: boundaryComplete ? freezeArray(["application-doctrine", "application-boundaries", "ownership", "taxonomy", "namespace-governance", "constitutional-validation"]) : freezeArray([]),
    capability_boundaries: freezeArray(["declared-capabilities-only", "no-capability-outside-boundary"]),
    authority_limits: doctrine.authority_limits,
    runtime_boundaries: freezeArray(["application-runtime-owned-by-later-phases", "program-3-runtime-boundaries-inherited"]),
    registry_boundaries: freezeArray(["application-registry", "classification-registry", "namespace-registry"]),
    governance_boundaries: freezeArray(["application-governance-artifacts", "taxonomy-governance", "namespace-governance"]),
    policy_boundaries: freezeArray(["application-policy-declarations", "inherited-policy-minimums"]),
    evidence_boundaries: freezeArray(["constitutional-evidence", "architectural-evidence", "ownership-evidence", "validation-evidence"]),
    interoperability_boundaries: freezeArray(["program-2-platform-contracts", "program-3-agent-contracts", "application-interface-contracts"]),
    dependency_boundaries: freezeArray(["program-1", "program-2", "program-3", "declared-application-dependencies"]),
    deterministic: true,
    non_overlapping: !has(failures, "BOUNDARY_OVERLAP_DETECTED"),
    complete: boundaryComplete,
  });
  const ownershipComplete = !has(failures, "OWNERSHIP_INCOMPLETE");
  const ownership_registry = nested({
    registry_id: "P4.1-OWNERSHIP-REGISTRY-001",
    capability_owners: ownershipComplete ? freezeArray(["application-capability-owner"]) : freezeArray([]),
    service_owners: ownershipComplete ? freezeArray(["application-service-owner"]) : freezeArray([]),
    registry_owners: ownershipComplete ? freezeArray(["application-registry-owner"]) : freezeArray([]),
    governance_artifact_owners: ownershipComplete ? freezeArray(["application-governance-owner"]) : freezeArray([]),
    evidence_owners: ownershipComplete ? freezeArray(["application-evidence-owner"]) : freezeArray([]),
    policy_owners: ownershipComplete ? freezeArray(["application-policy-owner"]) : freezeArray([]),
    interface_owners: ownershipComplete ? freezeArray(["application-interface-owner"]) : freezeArray([]),
    api_owners: ownershipComplete ? freezeArray(["application-api-owner"]) : freezeArray([]),
    lifecycle_owners: ownershipComplete ? freezeArray(["application-lifecycle-owner"]) : freezeArray([]),
    operational_owners: ownershipComplete ? freezeArray(["application-operational-owner"]) : freezeArray([]),
    deterministic: true,
    shared_ownership_governed: !has(failures, "SHARED_OWNERSHIP_UNGOVERNED"),
    complete: ownershipComplete,
  });
  const taxonomy = nested({
    taxonomy_id: "P4.1-APPLICATION-TAXONOMY-001",
    categories: has(failures, "TAXONOMY_INCOMPLETE") ? freezeArray(CATEGORIES.slice(0, 3)) : CATEGORIES,
    namespace_prefixes: freezeArray(["ops", "intel", "analysis", "collab", "admin", "consumer", "platform", "external"]),
    classification_registry_ref: "P4.1-CLASSIFICATION-REGISTRY",
    extensible_through_governance: !has(failures, "TAXONOMY_UNGOVERNED_EXTENSION"),
    approved: !has(failures, "TAXONOMY_INCOMPLETE") && !has(failures, "TAXONOMY_UNGOVERNED_EXTENSION"),
  });
  const constraints = nested({
    framework_id: "P4.1-ARCHITECTURAL-CONSTRAINTS-001",
    mandatory_constraints: freezeArray(["constitutional-compliance", "deterministic-behavior", "fail-closed-operation", "immutable-evidence", "governance-first-execution", "tenant-isolation", "authority-separation", "dependency-visibility", "interoperability-contracts", "replay-compatibility"]),
    prohibited_behaviors: freezeArray(["independent-constitutional-behavior", "boundary-overlap", "ungoverned-shared-ownership", "namespace-collision", "weakened-inherited-requirements"]),
    dependency_constraints: freezeArray(["program-1-baseline-required", "program-2-governance-required", "program-3-boundary-required"]),
    interoperability_constraints: freezeArray(["registered-contracts-only", "declared-dependencies-only", "replay-compatible-evidence"]),
    validation_rules: freezeArray(["inheritance-integrity", "boundary-completeness", "ownership-completeness", "taxonomy-consistency", "architectural-compliance"]),
    enforced: !has(failures, "ARCHITECTURAL_CONSTRAINTS_MISSING") && !has(failures, "CONSTRAINT_VIOLATION_ALLOWED"),
  });
  const namespace_governance = nested({
    namespace_id: "P4.1-NAMESPACE-GOVERNANCE-001",
    application_identifier_pattern: "civitas.app.<category>.<application>",
    allocated_namespaces: has(failures, "NAMESPACE_COLLISION") ? freezeArray(["civitas.app.ops.duplicate", "civitas.app.ops.duplicate"]) : freezeArray(["civitas.app.ops", "civitas.app.intel", "civitas.app.analysis", "civitas.app.collab", "civitas.app.admin", "civitas.app.consumer", "civitas.app.platform", "civitas.app.external"]),
    naming_conventions: freezeArray(["lowercase", "category-prefixed", "globally-unique", "lifecycle-governed"]),
    collision_prevention: !has(failures, "NAMESPACE_COLLISION"),
    lifecycle_governed: !has(failures, "NAMESPACE_LIFECYCLE_MISSING"),
    operational: !has(failures, "NAMESPACE_COLLISION") && !has(failures, "NAMESPACE_LIFECYCLE_MISSING"),
  });
  const evidence = nested({
    evidence_id: "P4.1-CONSTITUTIONAL-EVIDENCE-001",
    constitutional_evidence_refs: has(failures, "CONSTITUTIONAL_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([doctrine.doctrine_id, inheritance.inheritance_id]),
    architectural_evidence_refs: freezeArray([boundary_model.boundary_model_id, constraints.framework_id]),
    ownership_evidence_refs: freezeArray([ownership_registry.registry_id]),
    taxonomy_evidence_refs: freezeArray([taxonomy.taxonomy_id, namespace_governance.namespace_id]),
    validation_report_refs: has(failures, "VALIDATION_REPORT_MISSING") ? freezeArray([]) : freezeArray(["P4.1-CONSTITUTIONAL-VALIDATION-REPORT", "P4.1-BOUNDARY-VALIDATION-REPORT", "P4.1-OWNERSHIP-VALIDATION-REPORT", "P4.1-TAXONOMY-VALIDATION-REPORT"]),
    lineage_refs: freezeArray(["Program 1 - Constitutional Baseline", "Program 2 - Constitutional Governance", p3.integrity_hash]),
    immutable: !has(failures, "CONSTITUTIONAL_EVIDENCE_MUTABLE"),
    complete: !has(failures, "CONSTITUTIONAL_EVIDENCE_MISSING") && !has(failures, "VALIDATION_REPORT_MISSING"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(doctrine.implements_application_functionality ? ["APPLICATION_FUNCTIONALITY_IMPLEMENTED" as const] : []),
    ...(!inheritance.validated || inheritance.override_allowed || inheritance.weakening_allowed ? ["CONSTITUTIONAL_INHERITANCE_WEAKENED" as const] : []),
    ...(!boundary_model.complete ? ["BOUNDARY_MODEL_INCOMPLETE" as const] : []),
    ...(!boundary_model.non_overlapping ? ["BOUNDARY_OVERLAP_DETECTED" as const] : []),
    ...(!ownership_registry.complete ? ["OWNERSHIP_INCOMPLETE" as const] : []),
    ...(!ownership_registry.shared_ownership_governed ? ["SHARED_OWNERSHIP_UNGOVERNED" as const] : []),
    ...(taxonomy.categories.length !== CATEGORIES.length ? ["TAXONOMY_INCOMPLETE" as const] : []),
    ...(!taxonomy.extensible_through_governance ? ["TAXONOMY_UNGOVERNED_EXTENSION" as const] : []),
    ...(!constraints.enforced ? ["ARCHITECTURAL_CONSTRAINTS_MISSING" as const] : []),
    ...(!namespace_governance.collision_prevention ? ["NAMESPACE_COLLISION" as const] : []),
    ...(!namespace_governance.lifecycle_governed ? ["NAMESPACE_LIFECYCLE_MISSING" as const] : []),
    ...(!evidence.complete ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(!evidence.immutable ? ["CONSTITUTIONAL_EVIDENCE_MUTABLE" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.1-PHASE-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS" && !has(derivedFailures, "PHASE_CERTIFICATION_FAILED"),
    doctrine_established: doctrine.doctrine_id.length > 0 && !doctrine.implements_application_functionality,
    inheritance_validated: inheritance.validated,
    boundaries_complete: boundary_model.complete && boundary_model.non_overlapping,
    ownership_deterministic: ownership_registry.complete && ownership_registry.deterministic && ownership_registry.shared_ownership_governed,
    taxonomy_approved: taxonomy.approved,
    constraints_enforced: constraints.enforced,
    namespace_governance_operational: namespace_governance.operational,
    evidence_complete: evidence.complete && evidence.immutable,
    failures: has(derivedFailures, "PHASE_CERTIFICATION_FAILED") ? freezeArray([...derivedFailures, "PHASE_CERTIFICATION_FAILED" as const]) : derivedFailures,
  });
  const base: Omit<ApplicationFoundationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    program_1_constitution_ref: "Program 1 - Constitutional Baseline",
    program_2_governance_ref: "Program 2 - Constitutional Governance",
    program_3_boundary_ref: "caf-program-qualification/v3.18",
    doctrine,
    inheritance,
    boundary_model,
    ownership_registry,
    taxonomy,
    constraints,
    namespace_governance,
    evidence,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationConstitutionalFoundation(result?: ApplicationFoundationResult): ApplicationFoundationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, doctrine_valid: false, inheritance_valid: false, boundary_valid: false, ownership_valid: false, taxonomy_valid: false, constraints_valid: false, namespace_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const doctrine_valid = verifyHashedRecord(result.doctrine) && !result.doctrine.implements_application_functionality;
  const inheritance_valid = verifyHashedRecord(result.inheritance) && result.inheritance.validated && result.inheritance.extension_allowed && !result.inheritance.override_allowed && !result.inheritance.weakening_allowed;
  const boundary_valid = verifyHashedRecord(result.boundary_model) && result.boundary_model.complete && result.boundary_model.non_overlapping && result.boundary_model.deterministic;
  const ownership_valid = verifyHashedRecord(result.ownership_registry) && result.ownership_registry.complete && result.ownership_registry.deterministic && result.ownership_registry.shared_ownership_governed;
  const taxonomy_valid = verifyHashedRecord(result.taxonomy) && result.taxonomy.approved && result.taxonomy.categories.length === CATEGORIES.length && result.taxonomy.extensible_through_governance;
  const constraints_valid = verifyHashedRecord(result.constraints) && result.constraints.enforced;
  const namespace_valid = verifyHashedRecord(result.namespace_governance) && result.namespace_governance.operational && result.namespace_governance.collision_prevention;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.complete && result.evidence.immutable && result.evidence.lineage_refs.length === 3;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && doctrine_valid && inheritance_valid && boundary_valid && ownership_valid && taxonomy_valid && constraints_valid && namespace_valid && evidence_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, doctrine_valid, inheritance_valid, boundary_valid, ownership_valid, taxonomy_valid, constraints_valid, namespace_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationConstitutionalFoundation(result = runApplicationConstitutionalFoundation()): boolean {
  const replayed = runApplicationConstitutionalFoundation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationConstitutionalFoundation(result).valid;
}

export function getApplicationConstitutionalFoundationBundle(): ApplicationFoundationBundle {
  const result = runApplicationConstitutionalFoundation();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_doctrine: true,
      owns_application_boundaries: true,
      owns_application_ownership_model: true,
      owns_constitutional_inheritance: true,
      owns_application_taxonomy: true,
      owns_namespace_governance: true,
      owns_architectural_constraints: true,
      implements_application_functionality: false,
      overrides_program_1_2_3_authority: false,
    }),
    result,
    validation: validateApplicationConstitutionalFoundation(result),
  });
}

export const ApplicationConstitutionalFoundationService = Object.freeze({
  run: runApplicationConstitutionalFoundation,
  validate: validateApplicationConstitutionalFoundation,
  replay: replayApplicationConstitutionalFoundation,
});
