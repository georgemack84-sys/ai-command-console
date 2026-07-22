import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { TrustConstitutionalBundle, TrustConstitutionalFailure, TrustConstitutionalInput, TrustConstitutionalOutcome, TrustConstitutionalRecord, TrustConstitutionalResult, TrustConstitutionalScenario, TrustConstitutionalValidation } from "@/types/trust-constitutional-foundation";

const VERSION = "trust-constitutional-foundation/v5.0" as const;
const IDENTIFIER = "TrustConstitutionalFoundation" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly TrustConstitutionalFailure[], failure: TrustConstitutionalFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: TrustConstitutionalScenario): TrustConstitutionalFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly TrustConstitutionalFailure[]): TrustConstitutionalOutcome { if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED"; return failures.length ? "FAIL" : "PASS"; }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function record(constitutionId: string, tenantId: string, id: string, refs: readonly string[], failures: readonly TrustConstitutionalFailure[], missing: TrustConstitutionalFailure): TrustConstitutionalRecord {
  return nested({ record_id: has(failures, missing) ? "" : id, constitution_id: constitutionId, tenant_id: tenantId, version: VERSION, refs: freezeArray(refs), immutable: !has(failures, "TRUST_INVARIANTS_MUTABLE"), deterministic: !has(failures, "DETERMINISM_INVALID") });
}
function resultReplayHash(result: Omit<TrustConstitutionalResult, "replay_hash" | "integrity_hash">): string {
  return hash({ constitution: result.constitution.integrity_hash, doctrine: result.doctrine.integrity_hash, principles: result.principles.integrity_hash, invariants: result.invariants.integrity_hash, governance: result.governance.integrity_hash, authority: result.authority.integrity_hash, terminology: result.terminology.integrity_hash, boundaries: result.boundaries.integrity_hash, reference: result.reference_model.integrity_hash, boundary: result.boundary.integrity_hash, certification: result.certification.integrity_hash });
}
function resultIntegrityHash(result: Omit<TrustConstitutionalResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }

export function runTrustConstitutionalFoundation(input: TrustConstitutionalInput = {}): TrustConstitutionalResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<TrustConstitutionalFailure>(direct ? [direct] : []);
  const failures = freezeArray([...new Set(scenarioFailures)]);
  const constitutionId = input.constitution_id ?? "trust-constitution:civitas";
  const tenantId = input.tenant_id ?? "tenant:constitutional";
  const constitution = nested({ ...record(constitutionId, tenantId, "P5.0-TRUST-CONSTITUTION-001", ["trust-rules", "trust-authority-boundaries", "trust-advisory-boundary"], failures, "TRUST_CONSTITUTION_MISSING"), approved: !has(failures, "TRUST_CONSTITUTION_NOT_APPROVED"), rules: freezeArray(["Every trust decision must be constitutionally explainable.", "Every trust assertion must be evidence-based.", "Every trust decision must be replayable.", "Every trust state transition must be auditable.", "Trust shall never supersede constitutional authority.", "Trust shall never bypass governance.", "Trust shall never authorize execution.", "Trust shall never replace operator authority.", "Trust shall remain advisory unless elevated by constitutional governance."]), advisory_by_default: true, creates_authority: has(failures, "TRUST_AUTHORITY_CREATION_ATTEMPTED"), bypasses_governance: has(failures, "GOVERNANCE_BYPASS_ATTEMPTED"), replaces_operator_authority: has(failures, "OPERATOR_AUTHORITY_REPLACED") });
  const doctrine = nested({ ...record(constitutionId, tenantId, "P5.0-CONSTITUTIONAL-TRUST-DOCTRINE-001", ["definition:trust", "properties:trust"], failures, "TRUST_DOCTRINE_MISSING"), definition: "A deterministic constitutional assessment of confidence derived from governed evidence, bounded by constitutional authority, validated through replayable evaluation, and explainable through immutable evidence lineage.", finalized: !has(failures, "TRUST_DOCTRINE_NOT_FINALIZED"), doctrine_properties: freezeArray(["evidence-derived", "deterministic", "explainable", "replayable", "governed", "auditable", "bounded", "constitutional"]) });
  const principles = nested({ ...record(constitutionId, tenantId, "P5.0-TRUST-PRINCIPLES-001", ["trust-principles"], failures, "TRUST_PRINCIPLES_MISSING"), principles: freezeArray(["Trust derives from evidence.", "Trust never creates authority.", "Trust cannot override governance.", "Trust is deterministic.", "Trust is replayable.", "Trust is explainable.", "Trust is tenant isolated.", "Trust is immutable once recorded.", "Trust is constitutional.", "Trust defaults fail closed."]), adopted: !has(failures, "TRUST_PRINCIPLES_NOT_ADOPTED") });
  const invariants = nested({ ...record(constitutionId, tenantId, "P5.0-TRUST-INVARIANTS-001", ["CTI-001", "CTI-002", "CTI-003", "CTI-004", "CTI-005", "CTI-006", "CTI-007", "CTI-008", "CTI-009", "CTI-010"], failures, "TRUST_INVARIANTS_MISSING"), invariant_refs: freezeArray(["CTI-001:Trust never authorizes execution", "CTI-002:Trust never replaces governance", "CTI-003:Trust never bypasses operator approval", "CTI-004:Trust is evidence-derived", "CTI-005:Trust is deterministic", "CTI-006:Trust is replayable", "CTI-007:Trust is explainable", "CTI-008:Trust is auditable", "CTI-009:Trust is tenant isolated", "CTI-010:Trust is constitutionally governed"]), immutable_invariants: !has(failures, "TRUST_INVARIANTS_MUTABLE") });
  const governance = nested({ ...record(constitutionId, tenantId, "P5.0-TRUST-GOVERNANCE-001", ["trust-policy-governance", "trust-lifecycle-governance", "trust-evidence-governance", "trust-audit"], failures, "TRUST_GOVERNANCE_MISSING"), responsibility_refs: freezeArray(["trust policy", "trust lifecycle", "trust evolution", "trust certification", "trust scoring governance", "trust evidence governance", "trust model governance", "trust audit", "trust appeals", "trust revocation governance"]), responsibilities_defined: !has(failures, "TRUST_GOVERNANCE_RESPONSIBILITIES_UNDEFINED") });
  const authority = nested({ ...record(constitutionId, tenantId, "P5.0-TRUST-AUTHORITY-HIERARCHY-001", ["constitution", "governance", "operator", "trust-framework", "trust-assessment", "consumer"], failures, "TRUST_AUTHORITY_HIERARCHY_MISSING"), hierarchy: has(failures, "TRUST_AUTHORITY_HIERARCHY_INVALID") ? freezeArray(["Trust Framework", "Constitution"]) : freezeArray(["Constitution", "Governance", "Operator", "Trust Framework", "Trust Assessment", "Consumer"]), validated: !has(failures, "TRUST_AUTHORITY_HIERARCHY_INVALID"), elevates_above_governance: has(failures, "TRUST_AUTHORITY_CREATION_ATTEMPTED") });
  const terminology = nested({ ...record(constitutionId, tenantId, "P5.0-TRUST-TERMINOLOGY-001", ["trust-vocabulary", "program-1:vocabulary-registry"], failures, "TRUST_TERMINOLOGY_MISSING"), terminology: freezeArray(["Trust", "Trust Assessment", "Trust Evidence", "Trust Evaluation", "Trust Standing", "Trust Qualification", "Trust Certification", "Trust Recommendation", "Trust Governance", "Trust Policy", "Trust Authority", "Trust Boundary", "Trust Lineage", "Trust Replay", "Trust Integrity", "Trust Assurance"]), standardized: !has(failures, "TRUST_TERMINOLOGY_NOT_STANDARDIZED"), registered_in_program_1: !has(failures, "TRUST_VOCABULARY_NOT_REGISTERED") });
  const boundaries = nested({ ...record(constitutionId, tenantId, "P5.0-TRUST-BOUNDARY-MODEL-001", ["constitutional-authority", "tenant-isolation", "governance-policy", "evidence-availability", "replay-capability", "auditability", "explainability", "deterministic-evaluation"], failures, "TRUST_BOUNDARY_MODEL_MISSING"), boundaries: freezeArray(["constitutional authority", "tenant isolation", "governance policy", "evidence availability", "replay capability", "auditability", "explainability", "deterministic evaluation"]), formally_specified: !has(failures, "TRUST_BOUNDARIES_UNSPECIFIED"), invalidates_on_violation: !has(failures, "FAIL_CLOSED_INVALID"), tenant_isolated: !has(failures, "TENANT_ISOLATION_INVALID") });
  const reference_model = nested({ ...record(constitutionId, tenantId, "P5.0-CONSTITUTIONAL-TRUST-REFERENCE-MODEL-001", ["program-1", "program-2", "program-3", "program-4", "program-5"], failures, "TRUST_REFERENCE_MODEL_MISSING"), consumes: freezeArray(["Program 1 Constitutional Baseline", "Program 1 Capability Atlas", "Program 2 Constitutional Governance", "Program 2 Policy Framework", "Program 2 Identity Model", "Program 3 Constitutional Authority", "Program 3 Governance Gates", "Program 4 Application Constitutional Boundaries"]), downstream_inheritance_ready: !has(failures, "DOWNSTREAM_INHERITANCE_INVALID"), redefines_trust_downstream: false });
  const boundary = nested({ owns_trust_scoring: has(failures, "TRUST_SCORING_OWNERSHIP_ATTEMPTED"), owns_trust_evaluation: has(failures, "TRUST_EVALUATION_OWNERSHIP_ATTEMPTED"), owns_trust_evidence: has(failures, "TRUST_EVIDENCE_OWNERSHIP_ATTEMPTED"), owns_trust_reputation: has(failures, "TRUST_REPUTATION_OWNERSHIP_ATTEMPTED"), owns_trust_certification: has(failures, "TRUST_CERTIFICATION_OWNERSHIP_ATTEMPTED"), owns_trust_qualification: has(failures, "TRUST_QUALIFICATION_OWNERSHIP_ATTEMPTED"), creates_execution_authority: has(failures, "TRUST_AUTHORITY_CREATION_ATTEMPTED") });
  const noOutOfScope = !boundary.owns_trust_scoring && !boundary.owns_trust_evaluation && !boundary.owns_trust_evidence && !boundary.owns_trust_reputation && !boundary.owns_trust_certification && !boundary.owns_trust_qualification && !boundary.creates_execution_authority && !constitution.creates_authority && !constitution.bypasses_governance && !constitution.replaces_operator_authority;
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!constitution.approved ? ["TRUST_CONSTITUTION_NOT_APPROVED" as const] : []),
    ...(!doctrine.finalized ? ["TRUST_DOCTRINE_NOT_FINALIZED" as const] : []),
    ...(!terminology.standardized ? ["TRUST_TERMINOLOGY_NOT_STANDARDIZED" as const] : []),
    ...(!principles.adopted ? ["TRUST_PRINCIPLES_NOT_ADOPTED" as const] : []),
    ...(!invariants.immutable_invariants ? ["TRUST_INVARIANTS_MUTABLE" as const] : []),
    ...(!governance.responsibilities_defined ? ["TRUST_GOVERNANCE_RESPONSIBILITIES_UNDEFINED" as const] : []),
    ...(!authority.validated ? ["TRUST_AUTHORITY_HIERARCHY_INVALID" as const] : []),
    ...(!boundaries.formally_specified ? ["TRUST_BOUNDARIES_UNSPECIFIED" as const] : []),
    ...(!terminology.registered_in_program_1 ? ["TRUST_VOCABULARY_NOT_REGISTERED" as const] : []),
    ...(!reference_model.downstream_inheritance_ready ? ["DOWNSTREAM_INHERITANCE_INVALID" as const] : []),
    ...(!boundaries.tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!constitution.deterministic || !doctrine.deterministic ? ["DETERMINISM_INVALID" as const] : []),
    ...(has(failures, "REPLAYABILITY_INVALID") ? ["REPLAYABILITY_INVALID" as const] : []),
    ...(has(failures, "EXPLAINABILITY_INVALID") ? ["EXPLAINABILITY_INVALID" as const] : []),
    ...(has(failures, "AUDITABILITY_INVALID") ? ["AUDITABILITY_INVALID" as const] : []),
    ...(has(failures, "EVIDENCE_DERIVATION_INVALID") ? ["EVIDENCE_DERIVATION_INVALID" as const] : []),
    ...(!boundaries.invalidates_on_violation ? ["FAIL_CLOSED_INVALID" as const] : []),
    ...(!noOutOfScope ? ["TRUST_SCORING_OWNERSHIP_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({ certification_id: "P5.0-TRUST-CONSTITUTIONAL-FOUNDATION-CERTIFICATION-001", outcome: outcome(derivedFailures), phase_ready: outcome(derivedFailures) === "PASS", constitution_approved: constitution.approved && constitution.record_id.length > 0, doctrine_finalized: doctrine.finalized && doctrine.doctrine_properties.length === 8, terminology_standardized: terminology.standardized && terminology.terminology.length === 16, principles_adopted: principles.adopted && principles.principles.length === 10, invariants_immutable: invariants.immutable_invariants && invariants.invariant_refs.length === 10, governance_defined: governance.responsibilities_defined && governance.responsibility_refs.length === 10, authority_hierarchy_validated: authority.validated && authority.hierarchy[0] === "Constitution", boundaries_specified: boundaries.formally_specified && boundaries.boundaries.length === 8, vocabulary_registered: terminology.registered_in_program_1, downstream_inheritance_ready: reference_model.downstream_inheritance_ready, constitutional_guardrails_enforced: boundaries.tenant_isolated && boundaries.invalidates_on_violation && !constitution.creates_authority && !constitution.bypasses_governance && !constitution.replaces_operator_authority, no_out_of_scope_ownership: noOutOfScope, failures: derivedFailures });
  const base: Omit<TrustConstitutionalResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, constitution, doctrine, principles, invariants, governance, authority, terminology, boundaries, reference_model, boundary, certification };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateTrustConstitutionalFoundation(result?: TrustConstitutionalResult): TrustConstitutionalValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, constitution_valid: false, doctrine_valid: false, principles_valid: false, invariants_valid: false, governance_valid: false, authority_valid: false, terminology_valid: false, boundaries_valid: false, reference_model_valid: false, boundary_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const constitution_valid = verifyHashedRecord(result.constitution) && result.constitution.approved && result.constitution.advisory_by_default && !result.constitution.creates_authority && !result.constitution.bypasses_governance && !result.constitution.replaces_operator_authority;
  const doctrine_valid = verifyHashedRecord(result.doctrine) && result.doctrine.finalized && result.doctrine.doctrine_properties.length === 8;
  const principles_valid = verifyHashedRecord(result.principles) && result.principles.adopted && result.principles.principles.length === 10;
  const invariants_valid = verifyHashedRecord(result.invariants) && result.invariants.immutable_invariants && result.invariants.invariant_refs.length === 10;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.responsibilities_defined && result.governance.responsibility_refs.length === 10;
  const authority_valid = verifyHashedRecord(result.authority) && result.authority.validated && result.authority.hierarchy[0] === "Constitution" && !result.authority.elevates_above_governance;
  const terminology_valid = verifyHashedRecord(result.terminology) && result.terminology.standardized && result.terminology.registered_in_program_1 && result.terminology.terminology.length === 16;
  const boundaries_valid = verifyHashedRecord(result.boundaries) && result.boundaries.formally_specified && result.boundaries.invalidates_on_violation && result.boundaries.tenant_isolated;
  const reference_model_valid = verifyHashedRecord(result.reference_model) && result.reference_model.downstream_inheritance_ready && !result.reference_model.redefines_trust_downstream;
  const boundary_valid = verifyHashedRecord(result.boundary) && !result.boundary.owns_trust_scoring && !result.boundary.owns_trust_evaluation && !result.boundary.owns_trust_evidence && !result.boundary.owns_trust_reputation && !result.boundary.owns_trust_certification && !result.boundary.owns_trust_qualification && !result.boundary.creates_execution_authority;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0 && result.certification.no_out_of_scope_ownership;
  const valid = replay_hash_valid && integrity_hash_valid && constitution_valid && doctrine_valid && principles_valid && invariants_valid && governance_valid && authority_valid && terminology_valid && boundaries_valid && reference_model_valid && boundary_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, constitution_valid, doctrine_valid, principles_valid, invariants_valid, governance_valid, authority_valid, terminology_valid, boundaries_valid, reference_model_valid, boundary_valid, certification_valid, failures: result.certification.failures });
}

export function replayTrustConstitutionalFoundation(result = runTrustConstitutionalFoundation()): boolean {
  const replayed = runTrustConstitutionalFoundation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateTrustConstitutionalFoundation(result).valid;
}

export function getTrustConstitutionalFoundationBundle(): TrustConstitutionalBundle {
  const result = runTrustConstitutionalFoundation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_trust_constitution: true, owns_constitutional_trust_doctrine: true, owns_trust_principles: true, owns_trust_terminology: true, owns_constitutional_invariants: true, owns_trust_governance: true, owns_trust_scoring: false, owns_trust_evaluation: false, owns_trust_evidence: false, owns_trust_reputation: false, owns_trust_certification: false, owns_trust_qualification: false }), result, validation: validateTrustConstitutionalFoundation(result) });
}

export const TrustConstitutionalFoundationService = Object.freeze({ run: runTrustConstitutionalFoundation, validate: validateTrustConstitutionalFoundation, replay: replayTrustConstitutionalFoundation });
