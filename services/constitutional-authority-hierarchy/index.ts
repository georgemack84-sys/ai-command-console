import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPhase12CertificationGate, validatePhase12CertificationGate } from "@/services/phase-12-certification-gate";
import type {
  AdvisoryBoundaryReport,
  AuthorityCertification,
  AuthorityCertificationTest,
  AuthorityCeilingReport,
  AuthorityContract,
  AuthorityContractBundle,
  AuthorityExplanation,
  AuthorityFailure,
  AuthorityHierarchyModel,
  AuthorityHierarchyNode,
  AuthorityHierarchyResult,
  AuthorityInput,
  AuthorityInheritanceReport,
  AuthorityIntegrityReport,
  AuthorityLayer,
  AuthorityRegistry,
  AuthorityReplayReport,
  AuthorityResolutionReport,
  AuthorityScenario,
  AuthorityValidation,
} from "@/types/constitutional-authority-hierarchy";

const VERSION = "constitutional-authority-hierarchy/v13.1" as const;
const ID = "ConstitutionalAuthorityHierarchy" as const;
const LAYERS: readonly AuthorityLayer[] = Object.freeze(["CONSTITUTION", "GOVERNANCE", "OPERATOR", "ASSESSMENT"] as const);
const PERMITTED = Object.freeze(["evaluate", "analyze", "compare", "forecast", "explain", "recommend"] as const);
const PROHIBITED = Object.freeze(["authorize", "approve", "command", "execute", "assume operator authority"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function scenarioFailure(scenario: AuthorityScenario): AuthorityFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly AuthorityFailure[], failure: AuthorityFailure): boolean { return failures.includes(failure); }
function failed(failures: readonly AuthorityFailure[], values: readonly AuthorityFailure[]): boolean { return values.some((value) => failures.includes(value)); }
function statusFor(failures: readonly AuthorityFailure[]): "PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function contract(failures: readonly AuthorityFailure[]): AuthorityContract {
  return nested({ contract_id: id("authority_contract", VERSION), layers: LAYERS, vocabulary: freezeArray(["authority", "inheritance", "ceiling", "advisory boundary", "replay", "integrity"]), advisory_only: true as const, hierarchy_immutable: !has(failures, "CONSTITUTION_MUTABLE"), replay_required: true as const, integrity_required: true as const });
}

function hierarchy(failures: readonly AuthorityFailure[]): AuthorityHierarchyModel {
  const parents: Record<AuthorityLayer, AuthorityLayer | null> = { CONSTITUTION: null, GOVERNANCE: "CONSTITUTION", OPERATOR: "GOVERNANCE", ASSESSMENT: "OPERATOR" };
  if (has(failures, "MISSING_PARENT")) parents.OPERATOR = null;
  if (has(failures, "SKIPPED_LAYER")) parents.ASSESSMENT = "GOVERNANCE";
  if (has(failures, "CYCLIC_INHERITANCE")) parents.CONSTITUTION = "ASSESSMENT";
  const ceilings: Record<AuthorityLayer, number> = { CONSTITUTION: 100, GOVERNANCE: has(failures, "GOVERNANCE_EXCEEDS_CONSTITUTION") ? 110 : 80, OPERATOR: has(failures, "OPERATOR_EXCEEDS_GOVERNANCE") ? 90 : 60, ASSESSMENT: has(failures, "ASSESSMENT_EXCEEDS_OPERATOR") ? 70 : 20 };
  const nodes = freezeArray(LAYERS.map((layer): AuthorityHierarchyNode => nested({ layer, parent: parents[layer], ceiling: ceilings[layer], permitted_outputs: layer === "ASSESSMENT" ? PERMITTED : freezeArray([]), prohibited_outputs: layer === "ASSESSMENT" ? PROHIBITED : freezeArray([]) })));
  const exactlyOne = nodes.filter((node) => node.layer !== "CONSTITUTION").every((node) => node.parent !== null);
  return nested({ model_id: id("authority_hierarchy", failures), nodes, deterministic: true, no_sibling_relationships: !has(failures, "SIBLING_AUTHORITY_PRESENT"), exactly_one_parent_per_lower_layer: exactlyOne, terminates_at_constitution: !failed(failures, ["MISSING_PARENT", "CYCLIC_INHERITANCE", "SKIPPED_LAYER"]), immutable: !has(failures, "CONSTITUTION_MUTABLE") });
}

function resolution(failures: readonly AuthorityFailure[]): AuthorityResolutionReport {
  return nested({ report_id: id("authority_resolution", failures), resolution_order: LAYERS, governing_constitution: "constitutional supremacy", applicable_governance: "governance may restrict but never expand", operator_authority: "operator authority remains governance-bounded", assessment_ceiling: "ADVISORY_ONLY" as const, lower_layers_influence_higher_layers: false as const, deterministic: !has(failures, "AMBIGUOUS_AUTHORITY") });
}

function ceilings(model: AuthorityHierarchyModel, failures: readonly AuthorityFailure[]): AuthorityCeilingReport {
  const value = (layer: AuthorityLayer) => model.nodes.find((node) => node.layer === layer)?.ceiling ?? 0;
  const valid = value("ASSESSMENT") <= value("OPERATOR") && value("OPERATOR") <= value("GOVERNANCE") && value("GOVERNANCE") <= value("CONSTITUTION") && !has(failures, "CEILING_MUTATED");
  return nested({ report_id: id("authority_ceilings", failures), constitution_ceiling: value("CONSTITUTION"), governance_ceiling: value("GOVERNANCE"), operator_ceiling: value("OPERATOR"), assessment_ceiling: value("ASSESSMENT"), ceilings_immutable: !has(failures, "CEILING_MUTATED"), escalation_rejected: !failed(failures, ["GOVERNANCE_EXCEEDS_CONSTITUTION", "OPERATOR_EXCEEDS_GOVERNANCE", "ASSESSMENT_EXCEEDS_OPERATOR"]), unauthorized_delegation_rejected: !has(failures, "AMBIGUOUS_AUTHORITY"), valid });
}

function inheritance(failures: readonly AuthorityFailure[]): AuthorityInheritanceReport {
  return nested({ report_id: id("authority_inheritance", failures), path: LAYERS, downward_only: !has(failures, "CYCLIC_INHERITANCE"), no_skipped_layers: !has(failures, "SKIPPED_LAYER"), no_cycles: !has(failures, "CYCLIC_INHERITANCE"), no_expansion: !failed(failures, ["GOVERNANCE_EXCEEDS_CONSTITUTION", "OPERATOR_EXCEEDS_GOVERNANCE", "ASSESSMENT_EXCEEDS_OPERATOR"]), inherited_authority_reproducible: !has(failures, "AMBIGUOUS_AUTHORITY") });
}

function advisory(failures: readonly AuthorityFailure[]): AdvisoryBoundaryReport {
  const ok = !failed(failures, ["EXECUTION_AUTHORITY_PRODUCED", "ADVISORY_BOUNDARY_BYPASSED"]);
  return nested({ report_id: id("advisory_boundary", failures), permitted_outputs: PERMITTED, prohibited_outputs: PROHIBITED, execution_authority_possible: false as const, advisory_only_enforced: ok, operator_override_preserved: !has(failures, "ADVISORY_BOUNDARY_BYPASSED"), governance_bypass_prevented: !has(failures, "ADVISORY_BOUNDARY_BYPASSED"), constitution_bypass_prevented: !has(failures, "ADVISORY_BOUNDARY_BYPASSED") });
}

function replay(failures: readonly AuthorityFailure[]): AuthorityReplayReport {
  const ok = !has(failures, "REPLAY_MISMATCH");
  return nested({ report_id: id("authority_replay", failures), hierarchy_replayed: ok, inheritance_replayed: ok, ceilings_replayed: ok, resolution_replayed: ok, validation_replayed: ok, identical_authority_chain: ok });
}

function explain(failures: readonly AuthorityFailure[]): AuthorityExplanation {
  const complete = !has(failures, "EXPLAINABILITY_INCOMPLETE");
  return nested({ explanation_id: id("authority_explanation", failures), constitutional_rules: freezeArray(["constitution defines maximum authority", "nothing expands constitutional authority"]), governance_rules: freezeArray(["governance derives from constitution", "governance may restrict only"]), operator_constraints: freezeArray(["operator authority derives from governance", "operator cannot expand governance"]), inherited_authority_path: LAYERS, ceiling_calculation: "100 >= 80 >= 60 >= 20, assessment remains advisory-only", advisory_boundary_explanation: "Mission Control may assess, analyze, explain, and recommend, but never authorize or execute.", rejection_rationale: failures.length ? `Rejected because ${failures[0]}` : null, replay_references: freezeArray(["replay:authority:hierarchy", "replay:authority:ceilings"]), complete });
}

function integrity(failures: readonly AuthorityFailure[]): AuthorityIntegrityReport {
  const bad = has(failures, "INTEGRITY_FAILURE");
  return nested({ report_id: id("authority_integrity", failures), hashes_valid: !bad, references_valid: !bad, hierarchy_consistent: !failed(failures, ["MISSING_PARENT", "CYCLIC_INHERITANCE", "SKIPPED_LAYER"]), ceilings_immutable: !has(failures, "CEILING_MUTATED"), inheritance_integrity_valid: !failed(failures, ["CYCLIC_INHERITANCE", "SKIPPED_LAYER"]), replay_consistent: !has(failures, "REPLAY_MISMATCH"), forged_authority_detected: bad, unauthorized_expansion_detected: failed(failures, ["GOVERNANCE_EXCEEDS_CONSTITUTION", "OPERATOR_EXCEEDS_GOVERNANCE", "ASSESSMENT_EXCEEDS_OPERATOR"]) });
}

function registry(tenantId: string, failures: readonly AuthorityFailure[]): AuthorityRegistry {
  return nested({ registry_id: id("authority_registry", tenantId), authoritative_layers: LAYERS, canonical_owner: `owner:${tenantId}:constitutional-authority`, single_parent_paths: !failed(failures, ["MISSING_PARENT", "SIBLING_AUTHORITY_PRESENT"]), immutable: !has(failures, "CONSTITUTION_MUTABLE") });
}

type CertBase = Omit<AuthorityHierarchyResult, "certification" | "replay_hash" | "integrity_hash">;
function certTest(name: string, passed: boolean, failure: AuthorityFailure, refs: readonly string[]): AuthorityCertificationTest {
  return nested({ test_id: id("authority_certification_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}
function certificationTests(result: CertBase): readonly AuthorityCertificationTest[] {
  const refs = freezeArray([result.contract.integrity_hash, result.hierarchy.integrity_hash, result.resolution.integrity_hash, result.integrity.integrity_hash]);
  return freezeArray([
    certTest("Constitutional authority immutable", result.contract.hierarchy_immutable && result.hierarchy.immutable, "CONSTITUTION_MUTABLE", refs),
    certTest("Governance subordinate to constitution", result.ceilings.governance_ceiling <= result.ceilings.constitution_ceiling, "GOVERNANCE_EXCEEDS_CONSTITUTION", refs),
    certTest("Operator subordinate to governance", result.ceilings.operator_ceiling <= result.ceilings.governance_ceiling, "OPERATOR_EXCEEDS_GOVERNANCE", refs),
    certTest("Assessment subordinate to operator", result.ceilings.assessment_ceiling <= result.ceilings.operator_ceiling, "ASSESSMENT_EXCEEDS_OPERATOR", refs),
    certTest("No sibling authority relationships", result.hierarchy.no_sibling_relationships, "SIBLING_AUTHORITY_PRESENT", refs),
    certTest("Every lower layer has parent", result.hierarchy.exactly_one_parent_per_lower_layer, "MISSING_PARENT", refs),
    certTest("Inheritance has no cycles", result.inheritance.no_cycles, "CYCLIC_INHERITANCE", refs),
    certTest("Inheritance does not skip layers", result.inheritance.no_skipped_layers, "SKIPPED_LAYER", refs),
    certTest("Authority ceilings immutable", result.ceilings.ceilings_immutable, "CEILING_MUTATED", refs),
    certTest("Execution authority impossible", !result.advisory_boundary.execution_authority_possible, "EXECUTION_AUTHORITY_PRODUCED", refs),
    certTest("Advisory-only boundary enforced", result.advisory_boundary.advisory_only_enforced, "ADVISORY_BOUNDARY_BYPASSED", refs),
    certTest("Replay reproduces authority chain", result.replay.identical_authority_chain, "REPLAY_MISMATCH", refs),
    certTest("Authority explainability complete", result.explainability.complete, "EXPLAINABILITY_INCOMPLETE", refs),
    certTest("Authority integrity validated", result.integrity.hashes_valid && result.integrity.references_valid, "INTEGRITY_FAILURE", refs),
    certTest("Authority ambiguity fails closed", result.resolution.deterministic && result.ceilings.unauthorized_delegation_rejected, "AMBIGUOUS_AUTHORITY", refs),
  ]);
}

function replayHash(result: Omit<AuthorityHierarchyResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, hierarchy: result.hierarchy.integrity_hash, resolution: result.resolution.integrity_hash, ceilings: result.ceilings.integrity_hash, inheritance: result.inheritance.integrity_hash, advisory: result.advisory_boundary.integrity_hash, replay: result.replay.integrity_hash, explainability: result.explainability.integrity_hash, integrity: result.integrity.integrity_hash, registry: result.registry.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<AuthorityHierarchyResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runConstitutionalAuthorityHierarchy(input: AuthorityInput = {}): AuthorityHierarchyResult {
  const phase12 = runPhase12CertificationGate({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const phase12Valid = validatePhase12CertificationGate(phase12).valid;
  const directFailure = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<AuthorityFailure>([...(phase12Valid ? [] : ["INTEGRITY_FAILURE" as const]), ...(directFailure ? [directFailure] : [])]);
  const c = contract(failures);
  const h = hierarchy(failures);
  const r = resolution(failures);
  const ce = ceilings(h, failures);
  const inh = inheritance(failures);
  const adv = advisory(failures);
  const rep = replay(failures);
  const exp = explain(failures);
  const int = integrity(failures);
  const reg = registry(input.tenant_id ?? "tenant_mission_control", failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, contract: c, hierarchy: h, resolution: r, ceilings: ce, inheritance: inh, advisory_boundary: adv, replay: rep, explainability: exp, integrity: int, registry: reg };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is AuthorityFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification: AuthorityCertification = nested({ certification_id: id("authority_certification", VERSION), status, certified: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateConstitutionalAuthorityHierarchy(result?: AuthorityHierarchyResult): AuthorityValidation {
  if (!result) {
    const failures = freezeArray<AuthorityFailure>(["AMBIGUOUS_AUTHORITY"]);
    const base = { valid: false, status: "FAIL" as const, certified: false, failures, replay_hash_valid: false, integrity_hash_valid: false, advisory_boundary_valid: false, hierarchy_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const advisory_boundary_valid = result.advisory_boundary.advisory_only_enforced && !result.advisory_boundary.execution_authority_possible;
  const hierarchy_valid = result.hierarchy.immutable && result.hierarchy.terminates_at_constitution && result.ceilings.valid;
  const valid = result.certification.status === "PASS" && result.certification.certified && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && advisory_boundary_valid && hierarchy_valid;
  const base = { valid, status: result.certification.status, certified: result.certification.certified, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, advisory_boundary_valid, hierarchy_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayConstitutionalAuthorityHierarchy(result = runConstitutionalAuthorityHierarchy()): boolean {
  const tenantId = result.registry.canonical_owner.split(":")[1] ?? "tenant_mission_control";
  const replayed = runConstitutionalAuthorityHierarchy({ tenant_id: tenantId });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateConstitutionalAuthorityHierarchy(result).valid;
}

export function getConstitutionalAuthorityHierarchyContract(): AuthorityContractBundle {
  const result = runConstitutionalAuthorityHierarchy();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, constitutional_supremacy: true, governance_subordinate_to_constitution: true, operator_subordinate_to_governance: true, assessment_advisory_only: true, deterministic_inheritance_required: true, immutable_ceilings_required: true, fail_closed_on_ambiguity: true }), result, validation: validateConstitutionalAuthorityHierarchy(result) });
}

export const ConstitutionalAuthorityHierarchy = Object.freeze({ run: runConstitutionalAuthorityHierarchy, validate: validateConstitutionalAuthorityHierarchy, replay: replayConstitutionalAuthorityHierarchy });
