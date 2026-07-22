import { runApplicationRegistryCatalog, validateApplicationRegistryCatalog } from "@/services/application-registry-catalog";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationCapabilityCompositionBundle,
  ApplicationCapabilityCompositionFailure,
  ApplicationCapabilityCompositionInput,
  ApplicationCapabilityCompositionOutcome,
  ApplicationCapabilityCompositionResult,
  ApplicationCapabilityCompositionScenario,
  ApplicationCapabilityCompositionValidation,
} from "@/types/application-capability-composition";

const VERSION = "application-capability-composition/v4.3" as const;
const IDENTIFIER = "ApplicationCapabilityComposition" as const;
const CAPABILITIES = Object.freeze(["program1:capability:decision-intake", "program1:capability:operator-workflow", "program1:capability:evidence-ledger", "program1:capability:governance-visibility"]);
let baselineRegistry: ReturnType<typeof runApplicationRegistryCatalog> | undefined;

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
function has(failures: readonly ApplicationCapabilityCompositionFailure[], failure: ApplicationCapabilityCompositionFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationCapabilityCompositionScenario): ApplicationCapabilityCompositionFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationCapabilityCompositionFailure[]): ApplicationCapabilityCompositionOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineRegistry() { baselineRegistry ??= runApplicationRegistryCatalog(); return baselineRegistry; }

function resultReplayHash(result: Omit<ApplicationCapabilityCompositionResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    mapping: result.capability_map.integrity_hash,
    composition: result.composition_graph.integrity_hash,
    dependencies: result.dependency_map.integrity_hash,
    contracts: result.contract_registry.integrity_hash,
    architecture: result.architecture.integrity_hash,
    validation: result.validation_report.integrity_hash,
    lineage: result.lineage.integrity_hash,
    governance: result.governance_evidence.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationCapabilityCompositionResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationCapabilityComposition(input: ApplicationCapabilityCompositionInput = {}): ApplicationCapabilityCompositionResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationCapabilityCompositionFailure>(direct ? [direct] : []);
  const registry = getBaselineRegistry();
  const applicationId = registry.registry.records[0]?.application_id ?? "civitas.app.unknown";
  const dependencyFailures = freezeArray<ApplicationCapabilityCompositionFailure>([
    ...(!validateApplicationRegistryCatalog(registry).valid || has(scenarioFailures, "P4_2_REGISTRY_INVALID") ? ["P4_2_REGISTRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_CAPABILITY_ATLAS_INVALID") ? ["PROGRAM_1_CAPABILITY_ATLAS_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_COMPOSITION_CONTRACTS_INVALID") ? ["CAF_COMPOSITION_CONTRACTS_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const foundation = nested({
    foundation_id: "P4.3-COMPOSITION-FOUNDATION-001",
    composition_rules: freezeArray(["approved-program-1-capabilities-only", "deterministic-mapping", "no-runtime-execution", "caf-contract-compatible"]),
    capability_refs: has(failures, "PROGRAM_1_CAPABILITY_ATLAS_INVALID") ? freezeArray([]) : CAPABILITIES,
    capability_ownership_refs: freezeArray([registry.registry.records[0]?.constitutional_owner_ref ?? ""]),
    composition_boundaries: freezeArray(["mapping", "composition", "dependency-validation", "contracts", "architecture", "lineage"]),
    creates_new_capabilities: has(failures, "NEW_CAPABILITY_DEFINED"),
    modifies_program_1_capabilities: has(failures, "PROGRAM_1_CAPABILITY_MODIFIED"),
    duplicates_caf_composition_logic: has(failures, "CAF_COMPOSITION_LOGIC_DUPLICATED"),
    deterministic: true,
  });
  const mappingComplete = !has(failures, "CAPABILITY_MAPPING_INCOMPLETE");
  const capability_map = nested({
    map_id: "P4.3-CAPABILITY-MAP-001",
    application_id: applicationId,
    program_1_capability_atlas_ref: "Program 1 - Capability Atlas",
    mapped_capability_refs: mappingComplete ? foundation.capability_refs : freezeArray(foundation.capability_refs.slice(0, 2)),
    capability_categories: freezeArray(["decision", "workflow", "evidence", "governance"]),
    deterministic: !has(failures, "CAPABILITY_MAPPING_NON_DETERMINISTIC"),
    complete: mappingComplete,
    approved_capabilities_only: !has(failures, "UNAPPROVED_CAPABILITY_USED"),
  });
  const composition_graph = nested({
    graph_id: "P4.3-COMPOSITION-GRAPH-001",
    application_id: applicationId,
    nodes: capability_map.mapped_capability_refs,
    edges: freezeArray(["decision-intake->operator-workflow", "operator-workflow->evidence-ledger", "evidence-ledger->governance-visibility"]),
    reusable_compositions: freezeArray(["operator-decision-loop", "governed-evidence-loop"]),
    hierarchy: freezeArray(["application", "domain", "capability", "service-boundary"]),
    inheritance_refs: freezeArray(["caf-capability-composition/v3.2", "application-constitutional-foundation/v4.1"]),
    valid: !has(failures, "COMPOSITION_INVALID"),
    reusable_verified: !has(failures, "REUSABLE_COMPOSITION_UNVERIFIED"),
    inheritance_verified: !has(failures, "COMPOSITION_INHERITANCE_INVALID"),
  });
  const dependency_map = nested({
    map_id: "P4.3-DEPENDENCY-MAP-001",
    dependency_refs: freezeArray(["application-registry-catalog/v4.2", "caf-capability-composition/v3.2", "Program 1 - Capability Atlas"]),
    dependency_registry_refs: freezeArray([registry.registry.registry_id, "caf-composition-contract-registry"]),
    missing_dependencies: has(failures, "UNRESOLVED_DEPENDENCY") ? freezeArray(["program1:capability:missing"]) : freezeArray([]),
    circular_dependencies: has(failures, "CIRCULAR_DEPENDENCY_DETECTED") ? freezeArray(["operator-workflow->decision-intake->operator-workflow"]) : freezeArray([]),
    compatibility_verified: !has(failures, "DEPENDENCY_COMPATIBILITY_FAILED"),
    complete: !has(failures, "DEPENDENCY_MAP_INCOMPLETE"),
  });
  const contract_registry = nested({
    registry_id: "P4.3-COMPOSITION-CONTRACT-REGISTRY-001",
    composition_contract_refs: has(failures, "COMPOSITION_CONTRACT_MISSING") ? freezeArray([]) : freezeArray(["contract:p4.3:composition"]),
    capability_contract_refs: freezeArray(["contract:p4.3:capability"]),
    dependency_contract_refs: freezeArray(["contract:p4.3:dependency"]),
    inheritance_contract_refs: freezeArray(["contract:p4.3:inheritance"]),
    version_compatibility: !has(failures, "CAF_COMPOSITION_CONTRACTS_INVALID"),
    complete: !has(failures, "COMPOSITION_CONTRACT_MISSING"),
    deterministic: !has(failures, "COMPOSITION_CONTRACT_NON_DETERMINISTIC"),
    versioned: !has(failures, "COMPOSITION_CONTRACT_UNVERSIONED"),
  });
  const architecture = nested({
    architecture_id: "P4.3-CAPABILITY-ARCHITECTURE-001",
    capability_hierarchy: freezeArray(["command-console", "operations", "decision", "workflow", "evidence", "governance"]),
    decomposition_refs: freezeArray(["decomposition:p4.3:operations"]),
    service_boundaries: freezeArray(["decision-service-boundary", "workflow-service-boundary", "evidence-service-boundary", "governance-service-boundary"]),
    composition_topology: freezeArray(["layered", "governed", "replay-compatible"]),
    capability_domains: freezeArray(["operations", "governance", "evidence"]),
    architectural_boundaries_validated: !has(failures, "ARCHITECTURAL_BOUNDARY_INVALID"),
    topology_verified: !has(failures, "TOPOLOGY_INVALID"),
    complete: !has(failures, "CAPABILITY_ARCHITECTURE_INCOMPLETE"),
  });
  const validationPass = capability_map.complete && capability_map.deterministic && capability_map.approved_capabilities_only && composition_graph.valid && dependency_map.complete && dependency_map.missing_dependencies.length === 0 && dependency_map.circular_dependencies.length === 0 && dependency_map.compatibility_verified && contract_registry.complete && contract_registry.deterministic && contract_registry.versioned && architecture.complete && architecture.architectural_boundaries_validated && architecture.topology_verified;
  const validation_report = nested({
    report_id: "P4.3-COMPOSITION-VALIDATION-REPORT-001",
    composition_complete: composition_graph.valid,
    dependency_complete: dependency_map.complete && dependency_map.missing_dependencies.length === 0,
    architecture_valid: architecture.complete && architecture.architectural_boundaries_validated,
    capability_valid: capability_map.complete && capability_map.approved_capabilities_only,
    contract_valid: contract_registry.complete && contract_registry.deterministic && contract_registry.versioned,
    result: validationPass ? "PASS" as const : "FAIL" as const,
  });
  const lineage = nested({
    lineage_id: "P4.3-CAPABILITY-LINEAGE-001",
    program_1_capability_refs: has(failures, "CAPABILITY_LINEAGE_INCOMPLETE") ? freezeArray([]) : capability_map.mapped_capability_refs,
    composition_lineage_refs: freezeArray([composition_graph.graph_id]),
    dependency_lineage_refs: freezeArray([dependency_map.map_id]),
    contract_lineage_refs: freezeArray([contract_registry.registry_id]),
    version_lineage_refs: freezeArray(["Program 1 Capability Atlas@1", "P4.3 Composition@1"]),
    immutable: !has(failures, "LINEAGE_NOT_IMMUTABLE"),
    complete: !has(failures, "CAPABILITY_LINEAGE_INCOMPLETE"),
    traceable: !has(failures, "CAPABILITY_LINEAGE_INCOMPLETE"),
  });
  const governance_evidence = nested({
    evidence_id: "P4.3-GOVERNANCE-EVIDENCE-001",
    governance_validation_refs: freezeArray(["governance:p4.3:composition"]),
    ownership_validation_refs: freezeArray([registry.governance.governance_id]),
    policy_validation_refs: freezeArray(["policy:p4.3:composition"]),
    architectural_compliance_refs: freezeArray([architecture.architecture_id]),
    amendment_compliance_refs: freezeArray(["amendment:p4.3:none"]),
    governance_enforced: !has(failures, "GOVERNANCE_NOT_ENFORCED"),
    ownership_verified: !has(failures, "OWNERSHIP_NOT_VERIFIED"),
    constitutional_compliance: !has(failures, "CONSTITUTIONAL_COMPLIANCE_FAILED"),
    complete: !has(failures, "CERTIFICATION_EVIDENCE_INCOMPLETE"),
  });
  const noForbiddenAuthority = !foundation.creates_new_capabilities && !foundation.modifies_program_1_capabilities && !has(failures, "CAPABILITY_EXECUTION_ATTEMPTED") && !has(failures, "RUNTIME_ORCHESTRATION_ATTEMPTED") && !has(failures, "DEPLOYMENT_ATTEMPTED") && !has(failures, "APPLICATION_METADATA_OWNERSHIP_DUPLICATED") && !foundation.duplicates_caf_composition_logic;
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!noForbiddenAuthority ? ["NEW_CAPABILITY_DEFINED" as const] : []),
    ...(!capability_map.complete ? ["CAPABILITY_MAPPING_INCOMPLETE" as const] : []),
    ...(!capability_map.deterministic ? ["CAPABILITY_MAPPING_NON_DETERMINISTIC" as const] : []),
    ...(!capability_map.approved_capabilities_only ? ["UNAPPROVED_CAPABILITY_USED" as const] : []),
    ...(!composition_graph.valid ? ["COMPOSITION_INVALID" as const] : []),
    ...(!composition_graph.reusable_verified ? ["REUSABLE_COMPOSITION_UNVERIFIED" as const] : []),
    ...(!composition_graph.inheritance_verified ? ["COMPOSITION_INHERITANCE_INVALID" as const] : []),
    ...(!dependency_map.complete ? ["DEPENDENCY_MAP_INCOMPLETE" as const] : []),
    ...(dependency_map.missing_dependencies.length ? ["UNRESOLVED_DEPENDENCY" as const] : []),
    ...(dependency_map.circular_dependencies.length ? ["CIRCULAR_DEPENDENCY_DETECTED" as const] : []),
    ...(!dependency_map.compatibility_verified ? ["DEPENDENCY_COMPATIBILITY_FAILED" as const] : []),
    ...(!contract_registry.complete ? ["COMPOSITION_CONTRACT_MISSING" as const] : []),
    ...(!contract_registry.deterministic ? ["COMPOSITION_CONTRACT_NON_DETERMINISTIC" as const] : []),
    ...(!contract_registry.versioned ? ["COMPOSITION_CONTRACT_UNVERSIONED" as const] : []),
    ...(!architecture.complete ? ["CAPABILITY_ARCHITECTURE_INCOMPLETE" as const] : []),
    ...(!architecture.architectural_boundaries_validated ? ["ARCHITECTURAL_BOUNDARY_INVALID" as const] : []),
    ...(!architecture.topology_verified ? ["TOPOLOGY_INVALID" as const] : []),
    ...(!governance_evidence.governance_enforced ? ["GOVERNANCE_NOT_ENFORCED" as const] : []),
    ...(!governance_evidence.ownership_verified ? ["OWNERSHIP_NOT_VERIFIED" as const] : []),
    ...(!governance_evidence.constitutional_compliance ? ["CONSTITUTIONAL_COMPLIANCE_FAILED" as const] : []),
    ...(!lineage.complete ? ["CAPABILITY_LINEAGE_INCOMPLETE" as const] : []),
    ...(!lineage.immutable ? ["LINEAGE_NOT_IMMUTABLE" as const] : []),
    ...(!governance_evidence.complete ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.3-CAPABILITY-COMPOSITION-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    capability_mapping_complete: capability_map.complete && capability_map.deterministic && capability_map.approved_capabilities_only,
    composition_valid: composition_graph.valid && composition_graph.reusable_verified && composition_graph.inheritance_verified,
    dependencies_validated: dependency_map.complete && dependency_map.missing_dependencies.length === 0 && dependency_map.circular_dependencies.length === 0 && dependency_map.compatibility_verified,
    contracts_validated: contract_registry.complete && contract_registry.deterministic && contract_registry.versioned,
    architecture_complete: architecture.complete && architecture.architectural_boundaries_validated && architecture.topology_verified,
    governance_enforced: governance_evidence.governance_enforced && governance_evidence.ownership_verified && governance_evidence.constitutional_compliance,
    lineage_complete: lineage.complete && lineage.immutable && lineage.traceable,
    evidence_complete: governance_evidence.complete,
    no_forbidden_authority: noForbiddenAuthority,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationCapabilityCompositionResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    application_registry_ref: "application-registry-catalog/v4.2",
    program_1_capability_atlas_ref: "Program 1 - Capability Atlas",
    caf_composition_contracts_ref: "caf-capability-composition/v3.2",
    foundation,
    capability_map,
    composition_graph,
    dependency_map,
    contract_registry,
    architecture,
    validation_report,
    lineage,
    governance_evidence,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationCapabilityComposition(result?: ApplicationCapabilityCompositionResult): ApplicationCapabilityCompositionValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, mapping_valid: false, composition_valid: false, dependency_valid: false, contracts_valid: false, architecture_valid: false, validation_report_valid: false, lineage_valid: false, governance_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && !result.foundation.creates_new_capabilities && !result.foundation.modifies_program_1_capabilities && !result.foundation.duplicates_caf_composition_logic;
  const mapping_valid = verifyHashedRecord(result.capability_map) && result.capability_map.complete && result.capability_map.deterministic && result.capability_map.approved_capabilities_only;
  const composition_valid = verifyHashedRecord(result.composition_graph) && result.composition_graph.valid && result.composition_graph.reusable_verified && result.composition_graph.inheritance_verified;
  const dependency_valid = verifyHashedRecord(result.dependency_map) && result.dependency_map.complete && result.dependency_map.missing_dependencies.length === 0 && result.dependency_map.circular_dependencies.length === 0 && result.dependency_map.compatibility_verified;
  const contracts_valid = verifyHashedRecord(result.contract_registry) && result.contract_registry.complete && result.contract_registry.deterministic && result.contract_registry.versioned;
  const architecture_valid = verifyHashedRecord(result.architecture) && result.architecture.complete && result.architecture.architectural_boundaries_validated && result.architecture.topology_verified;
  const validation_report_valid = verifyHashedRecord(result.validation_report) && result.validation_report.result === "PASS";
  const lineage_valid = verifyHashedRecord(result.lineage) && result.lineage.complete && result.lineage.immutable && result.lineage.traceable;
  const governance_valid = verifyHashedRecord(result.governance_evidence) && result.governance_evidence.complete && result.governance_evidence.governance_enforced && result.governance_evidence.ownership_verified && result.governance_evidence.constitutional_compliance;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.no_forbidden_authority && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && mapping_valid && composition_valid && dependency_valid && contracts_valid && architecture_valid && validation_report_valid && lineage_valid && governance_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, mapping_valid, composition_valid, dependency_valid, contracts_valid, architecture_valid, validation_report_valid, lineage_valid, governance_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationCapabilityComposition(result = runApplicationCapabilityComposition()): boolean {
  const replayed = runApplicationCapabilityComposition();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationCapabilityComposition(result).valid;
}

export function getApplicationCapabilityCompositionBundle(): ApplicationCapabilityCompositionBundle {
  const result = runApplicationCapabilityComposition();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_capability_mapping: true,
      owns_capability_composition: true,
      owns_dependency_validation: true,
      owns_application_capability_architecture: true,
      creates_new_capabilities: false,
      modifies_program_1_capabilities: false,
      executes_capabilities: false,
      owns_runtime_orchestration: false,
      performs_deployment: false,
      owns_application_metadata: false,
      duplicates_caf_composition_logic: false,
    }),
    result,
    validation: validateApplicationCapabilityComposition(result),
  });
}

export const ApplicationCapabilityCompositionService = Object.freeze({
  run: runApplicationCapabilityComposition,
  validate: validateApplicationCapabilityComposition,
  replay: replayApplicationCapabilityComposition,
});
