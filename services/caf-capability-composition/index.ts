import { runAgentIdentityLifecycle, validateAgentIdentityLifecycle } from "@/services/caf-agent-identity-lifecycle";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  BehaviorTemplate,
  CapabilityCompositionBundle,
  CapabilityCompositionFailure,
  CapabilityCompositionInput,
  CapabilityCompositionResult,
  CapabilityCompositionScenario,
  CapabilityCompositionValidation,
  CapabilityReference,
  CompositionCertificationOutcome,
  CompositionEvidenceEntry,
  SkillRecord,
} from "@/types/caf-capability-composition";

const VERSION = "caf-capability-composition/v3.2" as const;
const IDENTIFIER = "CafCapabilityComposition" as const;

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
function scenarioFailure(scenario: CapabilityCompositionScenario): CapabilityCompositionFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly CapabilityCompositionFailure[], failure: CapabilityCompositionFailure): boolean { return failures.includes(failure); }
function certOutcome(failures: readonly CapabilityCompositionFailure[]): CompositionCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildCapabilities(failures: readonly CapabilityCompositionFailure[]): readonly CapabilityReference[] {
  const uncertified = has(failures, "UNCERTIFIED_CAPABILITY");
  const capabilityNames = ["agent.identity.resolve", "agent.lifecycle.evaluate", "composition.dependency.validate", "composition.behavior.template"] as const;
  return freezeArray(capabilityNames.map((name, index) => nested({
    capability_id: `P1-CAP-${String(index + 1).padStart(3, "0")}`,
    atlas_ref: `capability-atlas:${name}`,
    capability_name: name,
    version: has(failures, "INCOMPATIBLE_CAPABILITY_VERSION") && index === 1 ? "0.1.0" : "1.0.0",
    certified: !(uncertified && index === 0),
    canonical: true,
    owner_program: "Program 1" as const,
    contract_ref: has(failures, "COMPOSITION_CONTRACT_MISSING") && index === 2 ? "" : `contract:p1:${name}`,
    lineage_refs: has(failures, "LINEAGE_INCOMPLETE") && index === 3 ? freezeArray([]) : freezeArray([`lineage:p1:${name}`]),
  })));
}

function buildSkills(compositionRef: string, failures: readonly CapabilityCompositionFailure[]): readonly SkillRecord[] {
  const categories = ["ATOMIC", "COMPOSITE", "DOMAIN", "ORCHESTRATION", "UTILITY", "INFRASTRUCTURE"] as const;
  return freezeArray(categories.map((category, index) => nested({
    skill_id: `P3.2-SKILL-${String(index + 1).padStart(3, "0")}`,
    skill_name: `${category.toLowerCase()} capability skill`,
    category,
    composition_ref: compositionRef,
    capability_refs: freezeArray([`P1-CAP-${String((index % 4) + 1).padStart(3, "0")}`]),
    lifecycle_state: has(failures, "COMPOSITION_CONTRACT_MISSING") && index === 1 ? "VALIDATED" as const : "CERTIFIED" as const,
    reusable: true,
    contract_ref: has(failures, "COMPOSITION_CONTRACT_MISSING") && index === 1 ? "" : `contract:p3.2:skill:${category.toLowerCase()}`,
    metadata_refs: freezeArray([`metadata:p3.2:skill:${category.toLowerCase()}`]),
    validation_refs: freezeArray([`validation:p3.2:skill:${category.toLowerCase()}`]),
  })));
}

function buildBehaviors(capabilities: readonly CapabilityReference[], failures: readonly CapabilityCompositionFailure[]): readonly BehaviorTemplate[] {
  const duplicate = has(failures, "DUPLICATE_BEHAVIOR");
  return freezeArray(["identity guarded activation", "governed lifecycle suspension", "certified dependency assembly"].map((name, index) => nested({
    behavior_id: duplicate && index === 2 ? "P3.2-BEHAVIOR-001" : `P3.2-BEHAVIOR-${String(index + 1).padStart(3, "0")}`,
    behavior_name: name,
    canonical_capability_refs: freezeArray(capabilities.slice(0, index + 2).map((capability) => capability.capability_id)),
    inherited_from: index === 0 ? null : "P3.2-BEHAVIOR-001",
    duplicate_behavior_detected: duplicate && index === 2,
    reuse_required: true,
  })));
}

function buildEvidence(failures: readonly CapabilityCompositionFailure[]): readonly CompositionEvidenceEntry[] {
  const missing = has(failures, "VALIDATION_EVIDENCE_MISSING");
  const events: readonly CompositionEvidenceEntry["event_type"][] = freezeArray(["COMPOSITION_CREATED", "DEPENDENCY_VALIDATED", "SKILL_REGISTERED", "CONTRACT_VERIFIED", "LINEAGE_CAPTURED", "REPLAY_VALIDATED", "CERTIFICATION_REFERENCED"]);
  return freezeArray(events.filter((event) => !(missing && event === "CONTRACT_VERIFIED")).map((event_type, index) => nested({
    evidence_id: `P3.2-EVIDENCE-${String(index + 1).padStart(3, "0")}`,
    event_type,
    evidence_refs: missing && event_type === "LINEAGE_CAPTURED" ? freezeArray([]) : freezeArray([`evidence:p3.2:${event_type.toLowerCase()}`]),
    sequence: index + 1,
    immutable: true,
    replayable: true,
  })));
}

function resultReplayHash(result: Omit<CapabilityCompositionResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    composition: result.composition.integrity_hash,
    dependency_graph: result.dependency_graph.integrity_hash,
    skill_registry: result.skill_registry.map((skill) => skill.integrity_hash),
    behavior_library: result.behavior_library.map((behavior) => behavior.integrity_hash),
    contract_library: result.contract_library.map((contract) => contract.integrity_hash),
    composition_registry: result.composition_registry.integrity_hash,
    composition_evidence: result.composition_evidence.map((entry) => entry.integrity_hash),
    replay_validation: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<CapabilityCompositionResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runCapabilityComposition(input: CapabilityCompositionInput = {}): CapabilityCompositionResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<CapabilityCompositionFailure>(direct ? [direct] : []);
  const p31 = runAgentIdentityLifecycle();
  const p31Valid = validateAgentIdentityLifecycle(p31).valid && !has(scenarioFailures, "P3_1_AGENT_LIFECYCLE_INVALID");
  const failures = freezeArray<CapabilityCompositionFailure>(p31Valid ? scenarioFailures : [...scenarioFailures, "P3_1_AGENT_LIFECYCLE_INVALID"]);
  const capabilities = buildCapabilities(failures);
  const composition = nested({
    composition_id: "P3.2-COMPOSITION-001",
    agent_ref: p31.identity.agent_id,
    composition_type: "HIERARCHICAL" as const,
    capability_refs: capabilities,
    behavior_template_refs: freezeArray(["P3.2-BEHAVIOR-001", "P3.2-BEHAVIOR-002", "P3.2-BEHAVIOR-003"]),
    composition_metadata_refs: freezeArray(["metadata:p3.2:composition-foundation"]),
    direct_behavior_implementation_allowed: false as const,
    deterministic_ordering: !has(failures, "NON_DETERMINISTIC_ORDERING"),
    capability_reuse_enforced: !has(failures, "DIRECT_BEHAVIOR_IMPLEMENTATION"),
    behavior_duplication_prohibited: !has(failures, "DUPLICATE_BEHAVIOR"),
  });
  const dependency_graph = nested({
    graph_id: "P3.2-DEPENDENCY-GRAPH-001",
    nodes: freezeArray(capabilities.map((capability) => capability.capability_id)),
    edges: freezeArray(["P1-CAP-001->P1-CAP-002", "P1-CAP-002->P1-CAP-003", "P1-CAP-003->P1-CAP-004"]),
    missing_capabilities: has(failures, "DEPENDENCY_MISSING") ? freezeArray(["P1-CAP-MISSING"]) : freezeArray([]),
    duplicate_capabilities: freezeArray([]),
    circular_references: has(failures, "CIRCULAR_DEPENDENCY") ? freezeArray(["P1-CAP-004->P1-CAP-001"]) : freezeArray([]),
    incompatible_versions: has(failures, "INCOMPATIBLE_CAPABILITY_VERSION") ? freezeArray(["P1-CAP-002@0.1.0"]) : freezeArray([]),
    unresolved_contracts: has(failures, "COMPOSITION_CONTRACT_MISSING") ? freezeArray(["contract:p1:composition.dependency.validate"]) : freezeArray([]),
    deterministic_order: has(failures, "NON_DETERMINISTIC_ORDERING") ? freezeArray(["P1-CAP-003", "P1-CAP-001"]) : freezeArray(capabilities.map((capability) => capability.capability_id)),
    valid: !["DEPENDENCY_MISSING", "CIRCULAR_DEPENDENCY", "INCOMPATIBLE_CAPABILITY_VERSION", "COMPOSITION_CONTRACT_MISSING", "NON_DETERMINISTIC_ORDERING"].some((failure) => failures.includes(failure as CapabilityCompositionFailure)),
  });
  const skill_registry = buildSkills(composition.composition_id, failures);
  const behavior_library = buildBehaviors(capabilities, failures);
  const contract_library = freezeArray([nested({
    contract_id: "P3.2-CONTRACT-LIBRARY-001",
    compatibility_rules_ref: has(failures, "COMPOSITION_CONTRACT_MISSING") ? "" : "compatibility:p3.2:capability-versions",
    interface_contract_refs: freezeArray(["interface:p3.2:skill"]),
    behavioral_contract_refs: has(failures, "DIRECT_BEHAVIOR_IMPLEMENTATION") ? freezeArray([]) : freezeArray(["behavior:p3.2:capability-first"]),
    dependency_contract_refs: dependency_graph.unresolved_contracts.length ? freezeArray([]) : freezeArray(["dependency:p3.2:acyclic"]),
    all_assemblies_governed: !has(failures, "COMPOSITION_CONTRACT_MISSING"),
    constitutional_compliance_required: true,
  })]);
  const composition_registry = nested({
    registry_id: "P3.2-COMPOSITION-REGISTRY-001",
    compositions: freezeArray([composition.composition_id]),
    skills: freezeArray(skill_registry.map((skill) => skill.skill_id)),
    metadata_index_refs: freezeArray(["metadata-index:p3.2:skills", "metadata-index:p3.2:behaviors"]),
    discovery_enabled: true,
    version_management_enabled: true,
    immutable: !has(failures, "REGISTRY_MUTABLE"),
    replayable: !has(failures, "REGISTRY_MUTABLE"),
  });
  const composition_evidence = buildEvidence(failures);
  const lineageComplete = capabilities.every((capability) => capability.lineage_refs.length > 0) && !has(failures, "LINEAGE_INCOMPLETE");
  const replay_validation = nested({
    replay_validation_id: "P3.2-REPLAY-VALIDATION-001",
    composition_reproduced: composition.deterministic_ordering,
    dependency_graph_reproduced: dependency_graph.valid,
    skills_reproduced: skill_registry.every((skill) => skill.lifecycle_state === "CERTIFIED"),
    contracts_reproduced: contract_library.every((contract) => contract.all_assemblies_governed),
    lineage_reproduced: lineageComplete,
    registry_reproduced: composition_registry.replayable,
    deterministic: !has(failures, "REPLAY_DIVERGENCE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!p31Valid ? ["P3_1_AGENT_LIFECYCLE_INVALID" as const] : []),
    ...(capabilities.some((capability) => !capability.certified || !capability.canonical) ? ["UNCERTIFIED_CAPABILITY" as const] : []),
    ...(!composition.capability_reuse_enforced ? ["DIRECT_BEHAVIOR_IMPLEMENTATION" as const] : []),
    ...(dependency_graph.missing_capabilities.length ? ["DEPENDENCY_MISSING" as const] : []),
    ...(dependency_graph.circular_references.length ? ["CIRCULAR_DEPENDENCY" as const] : []),
    ...(dependency_graph.incompatible_versions.length ? ["INCOMPATIBLE_CAPABILITY_VERSION" as const] : []),
    ...(!composition.behavior_duplication_prohibited || behavior_library.some((behavior) => behavior.duplicate_behavior_detected) ? ["DUPLICATE_BEHAVIOR" as const] : []),
    ...(dependency_graph.unresolved_contracts.length || !contract_library.every((contract) => contract.all_assemblies_governed) ? ["COMPOSITION_CONTRACT_MISSING" as const] : []),
    ...(!composition.deterministic_ordering ? ["NON_DETERMINISTIC_ORDERING" as const] : []),
    ...(!lineageComplete ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(!composition_registry.immutable || !composition_registry.replayable ? ["REGISTRY_MUTABLE" as const] : []),
    ...(composition_evidence.length !== 7 || composition_evidence.some((entry) => entry.evidence_refs.length === 0) ? ["VALIDATION_EVIDENCE_MISSING" as const] : []),
    ...(has(failures, "GOVERNANCE_COMPLIANCE_GAP") ? ["GOVERNANCE_COMPLIANCE_GAP" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.2-CERTIFICATION-GATE-001",
    outcome: certOutcome(derivedFailures),
    certified: certOutcome(derivedFailures) === "PASS",
    capability_composition_valid: capabilities.every((capability) => capability.certified && capability.canonical),
    dependency_composition_valid: dependency_graph.valid,
    reusable_skills_operational: skill_registry.every((skill) => skill.reusable && skill.lifecycle_state === "CERTIFIED"),
    deterministic_ordering: composition.deterministic_ordering,
    contract_compliance: contract_library.every((contract) => contract.all_assemblies_governed && contract.constitutional_compliance_required),
    replay_determinism: replay_validation.deterministic,
    lineage_complete: lineageComplete,
    registry_integrity: composition_registry.immutable && composition_registry.replayable,
    compatibility_validated: dependency_graph.incompatible_versions.length === 0,
    governance_compliance: p31Valid && !has(failures, "GOVERNANCE_COMPLIANCE_GAP"),
    no_direct_behavior_implementation: !composition.direct_behavior_implementation_allowed && composition.capability_reuse_enforced,
    no_behavior_duplication: composition.behavior_duplication_prohibited,
    failures: derivedFailures,
  });
  const base: Omit<CapabilityCompositionResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    agent_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1",
    program_1_capability_atlas_ref: "Program 1 - Capability Atlas",
    composition,
    dependency_graph,
    skill_registry,
    behavior_library,
    contract_library,
    composition_registry,
    composition_evidence,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCapabilityComposition(result?: CapabilityCompositionResult): CapabilityCompositionValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, composition_valid: false, dependency_valid: false, skill_valid: false, contract_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const composition_valid = verifyHashedRecord(result.composition) && !result.composition.direct_behavior_implementation_allowed && result.composition.capability_refs.every((capability) => verifyHashedRecord(capability) && capability.certified && capability.canonical);
  const dependency_valid = verifyHashedRecord(result.dependency_graph) && result.dependency_graph.valid;
  const skill_valid = result.skill_registry.every((skill) => verifyHashedRecord(skill) && skill.reusable && skill.lifecycle_state === "CERTIFIED" && Boolean(skill.contract_ref));
  const contract_valid = result.contract_library.every((contract) => verifyHashedRecord(contract) && contract.all_assemblies_governed);
  const evidence_valid = result.composition_evidence.length === 7 && result.composition_evidence.every((entry) => verifyHashedRecord(entry) && entry.immutable && entry.replayable && entry.evidence_refs.length > 0);
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && composition_valid && dependency_valid && skill_valid && contract_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, composition_valid, dependency_valid, skill_valid, contract_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayCapabilityComposition(result = runCapabilityComposition()): boolean {
  const replayed = runCapabilityComposition();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCapabilityComposition(result).valid;
}

export function getCapabilityCompositionBundle(): CapabilityCompositionBundle {
  const result = runCapabilityComposition();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      consumes_program_1_capability_atlas: true,
      consumes_agent_identity_lifecycle: true,
      owns_composition_not_capability_definitions: true,
      direct_behavior_implementation_prohibited: true,
      deterministic_composition_required: true,
      immutable_lineage_required: true,
      certified_capability_reuse_required: true,
    }),
    result,
    validation: validateCapabilityComposition(result),
  });
}

export const CapabilityCompositionService = Object.freeze({
  run: runCapabilityComposition,
  validate: validateCapabilityComposition,
  replay: replayCapabilityComposition,
});
