import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CanonicalDocumentDefinition,
  DocumentRelationshipRecord,
  FormalDocumentTaxonomyBundle,
  FormalDocumentTaxonomyFailure,
  FormalDocumentTaxonomyInput,
  FormalDocumentTaxonomyResult,
  FormalDocumentTaxonomyScenario,
  FormalDocumentTaxonomyValidation,
  FormalDocumentType,
} from "@/types/formal-document-taxonomy";

const VERSION = "formal-document-taxonomy/v13.9" as const;
const IDENTIFIER = "FormalDocumentTaxonomy" as const;
const TYPES: readonly FormalDocumentType[] = Object.freeze(["ROADMAP", "SPECIFICATION", "AMENDMENT", "ADDENDUM", "RECONCILIATION_AMENDMENT"]);
const LIFECYCLE = Object.freeze(["DRAFT", "REVIEW", "APPROVED", "ACTIVE", "SUPERSEDED", "ARCHIVED", "RETIRED"] as const);
const RELATIONSHIPS = Object.freeze(["PARENT", "CHILD", "DEPENDS_ON", "SUPERSEDES", "SUPERSEDED_BY", "AMENDS", "AMENDED_BY", "EXTENDED_BY", "CLARIFIED_BY", "REFERENCED_BY", "DERIVED_FROM", "RECONCILES", "ORIGINATES_FROM"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function scenarioFailure(scenario: FormalDocumentTaxonomyScenario): FormalDocumentTaxonomyFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly FormalDocumentTaxonomyFailure[], failure: FormalDocumentTaxonomyFailure): boolean { return failures.includes(failure); }

function buildContract(failures: readonly FormalDocumentTaxonomyFailure[]) {
  return nested({
    document_id: has(failures, "IDENTITY_MUTATED") ? "doc:mutated:taxonomy" : "doc:mission-control:specification-governance-framework",
    document_type: has(failures, "UNKNOWN_DOCUMENT_TYPE") ? "ROADMAP" as const : "SPECIFICATION" as const,
    document_title: "Mission Control Specification Governance Framework",
    version: "1.0.0",
    lifecycle_state: has(failures, "LIFECYCLE_TRANSITION_INVALID") ? "DRAFT" as const : "ACTIVE" as const,
    canonical_owner: has(failures, "OWNER_NOT_UNIQUE") ? "" : "owner:mission-control-governance",
    governing_authority: has(failures, "GOVERNANCE_APPROVAL_MISSING") ? "" : "authority:constitutional-governance-board",
    parent_document_refs: freezeArray(["doc:mission-control:phase-13"]),
    child_document_refs: freezeArray(["doc:mission-control:formal-document-taxonomy"]),
    superseded_by: "doc:mission-control:specification-governance-framework:v1.1.0",
    supersedes: freezeArray(["doc:mission-control:specification-governance-framework:v0.9.0"]),
    amendment_refs: freezeArray(["amendment:spec-governance:13.8-a"]),
    addendum_refs: freezeArray(["addendum:spec-governance:interpretation"]),
    reconciliation_refs: has(failures, "DEPENDENCY_CONFLICTING") ? freezeArray([]) : freezeArray(["reconciliation:spec-vs-roadmap-authority"]),
    dependency_refs: has(failures, "DEPENDENCY_MISSING") ? freezeArray([]) : freezeArray(["doc:mission-control:replay-divergence", "doc:mission-control:audit-lineage"]),
    origin_ref: "phase-13.9-formal-document-taxonomy",
    approval_refs: has(failures, "GOVERNANCE_APPROVAL_MISSING") ? freezeArray([]) : freezeArray(["approval:taxonomy:13.9"]),
  });
}

function buildDefinitions(): readonly CanonicalDocumentDefinition[] {
  const values: Omit<CanonicalDocumentDefinition, "integrity_hash">[] = [
    { document_type: "ROADMAP", normative: false, purpose: "Planning artifact for capability decomposition, sequencing, milestones, deliverables, and implementation planning.", defines: freezeArray(["capability decomposition", "implementation phases", "sequencing", "milestones", "deliverables"]), prohibited_semantics: freezeArray(["implementation behavior", "constitutional behavior"]), immutable_after_approval: true },
    { document_type: "SPECIFICATION", normative: true, purpose: "Normative artifact for behavior, implementation requirements, interfaces, constraints, invariants, and required semantics.", defines: freezeArray(["normative behavior", "implementation requirements", "interfaces", "constraints", "invariants"]), prohibited_semantics: freezeArray(["non-governed planning only"]), immutable_after_approval: true },
    { document_type: "AMENDMENT", normative: true, purpose: "Governed correction, modification, replacement, or refinement of existing specifications.", defines: freezeArray(["corrections", "modifications", "replacements", "refinements"]), prohibited_semantics: freezeArray(["history deletion"]), immutable_after_approval: true },
    { document_type: "ADDENDUM", normative: true, purpose: "Supplementary semantics, optional extensions, additional capability, or clarifications that do not invalidate prior specifications.", defines: freezeArray(["additional semantics", "supplementary capability", "optional extensions", "clarifications"]), prohibited_semantics: freezeArray(["invalidating previously valid specifications"]), immutable_after_approval: true },
    { document_type: "RECONCILIATION_AMENDMENT", normative: true, purpose: "Conflict resolution, ambiguity removal, specification alignment, and constitutional consistency restoration.", defines: freezeArray(["conflict resolution", "ambiguity removal", "specification alignment", "constitutional consistency restoration"]), prohibited_semantics: freezeArray(["constitutional authority expansion"]), immutable_after_approval: true },
  ];
  return freezeArray(values.map((value) => nested(value)));
}

function buildClassification(failures: readonly FormalDocumentTaxonomyFailure[]) {
  const candidates = has(failures, "MULTIPLE_DOCUMENT_TYPES") ? freezeArray<FormalDocumentType>(["ROADMAP", "SPECIFICATION"]) : freezeArray<FormalDocumentType>(["SPECIFICATION"]);
  return nested({
    classification_report_id: id("document_classification", VERSION),
    primary_classification: "SPECIFICATION" as const,
    candidate_classifications: candidates,
    classification_unique: candidates.length === 1 && !has(failures, "UNKNOWN_DOCUMENT_TYPE"),
    vocabulary_standardized: !has(failures, "UNKNOWN_DOCUMENT_TYPE"),
    purpose_explicit: true,
    immutable_after_approval: !has(failures, "VOCABULARY_MUTATION_UNAPPROVED"),
  });
}

function rel(source: string, target: string, relationship_type: DocumentRelationshipRecord["relationship_type"], legal: boolean): DocumentRelationshipRecord {
  return nested({ relationship_id: id("document_relationship", { source, target, relationship_type }), source_document_id: source, target_document_id: target, relationship_type, directional: true as const, immutable_once_approved: true, legal });
}

function buildRelationships(documentId: string, failures: readonly FormalDocumentTaxonomyFailure[]) {
  const legal = !has(failures, "RELATIONSHIP_ILLEGAL");
  const relationships = freezeArray([
    rel(documentId, "doc:mission-control:phase-13", "PARENT", legal),
    rel(documentId, "doc:mission-control:replay-divergence", "DEPENDS_ON", legal),
    rel(documentId, "doc:mission-control:specification-governance-framework:v0.9.0", "SUPERSEDES", legal),
    rel("amendment:spec-governance:13.8-a", documentId, "AMENDS", legal),
    rel("reconciliation:spec-vs-roadmap-authority", documentId, "RECONCILES", legal),
  ]);
  const cycles = has(failures, "RELATIONSHIP_CYCLE");
  return nested({ relationship_validation_id: id("document_relationship_validation", documentId), relationships, dependency_graph_deterministic: true, cycles_prevented: !cycles, lineage_complete: !has(failures, "LINEAGE_INCOMPLETE"), outcome: !legal ? "INVALID" as const : cycles ? "CONFLICTING" as const : has(failures, "LINEAGE_INCOMPLETE") ? "INCOMPLETE" as const : "VALID" as const });
}

function outcomeFromFlags(invalid: boolean, incomplete: boolean, conflicting: boolean) {
  return invalid ? "INVALID" as const : conflicting ? "CONFLICTING" as const : incomplete ? "INCOMPLETE" as const : "VALID" as const;
}

function buildDependencies(failures: readonly FormalDocumentTaxonomyFailure[]) {
  const missing = has(failures, "DEPENDENCY_MISSING");
  const conflicting = has(failures, "DEPENDENCY_CONFLICTING");
  const invalid = has(failures, "RELATIONSHIP_ILLEGAL");
  const outcome = outcomeFromFlags(invalid, missing, conflicting);
  return nested({
    dependency_validation_id: id("document_dependency_validation", VERSION),
    dependency_existence: missing ? "INCOMPLETE" as const : "VALID" as const,
    version_compatibility: conflicting ? "CONFLICTING" as const : "VALID" as const,
    authority_consistency: conflicting ? "CONFLICTING" as const : "VALID" as const,
    lifecycle_compatibility: has(failures, "LIFECYCLE_TRANSITION_INVALID") ? "INVALID" as const : "VALID" as const,
    constitutional_compatibility: conflicting ? "CONFLICTING" as const : "VALID" as const,
    ownership_compatibility: has(failures, "OWNER_NOT_UNIQUE") ? "INVALID" as const : "VALID" as const,
    relationship_legality: invalid ? "INVALID" as const : "VALID" as const,
    outcome,
  });
}

function buildLifecycle(failures: readonly FormalDocumentTaxonomyFailure[]) {
  return nested({ lifecycle_registry_id: id("document_lifecycle", VERSION), lifecycle_states: LIFECYCLE, legal_transitions: freezeArray(["DRAFT->REVIEW", "REVIEW->APPROVED", "APPROVED->ACTIVE", "ACTIVE->SUPERSEDED", "SUPERSEDED->ARCHIVED", "ARCHIVED->RETIRED"]), current_state: "APPROVED" as const, target_state: has(failures, "LIFECYCLE_TRANSITION_INVALID") ? "RETIRED" as const : "ACTIVE" as const, transition_approved: !has(failures, "GOVERNANCE_APPROVAL_MISSING") && !has(failures, "LIFECYCLE_TRANSITION_INVALID"), historical_validity_preserved: true, replayable_after_archive: true, immutable_audit_preserved: true, deterministic: !has(failures, "REPLAY_NONDETERMINISTIC") });
}

function buildGovernance(failures: readonly FormalDocumentTaxonomyFailure[]) {
  const approved = !has(failures, "GOVERNANCE_APPROVAL_MISSING") && !has(failures, "VOCABULARY_MUTATION_UNAPPROVED");
  return nested({ governance_engine_id: id("taxonomy_governance", VERSION), taxonomy_approved: approved, vocabulary_governed: approved, classification_enforced: !has(failures, "MULTIPLE_DOCUMENT_TYPES"), version_governed: approved, relationship_governed: !has(failures, "RELATIONSHIP_ILLEGAL"), lifecycle_governed: !has(failures, "LIFECYCLE_TRANSITION_INVALID"), registry_managed: true, changes_traceable: approved });
}

function buildLineage(contract: ReturnType<typeof buildContract>, failures: readonly FormalDocumentTaxonomyFailure[]) {
  const complete = !has(failures, "LINEAGE_INCOMPLETE");
  return nested({ lineage_registry_id: id("document_lineage", contract.document_id), creation_refs: freezeArray([contract.origin_ref]), classification_refs: freezeArray(["classification:specification"]), approval_refs: contract.approval_refs, amendment_refs: contract.amendment_refs, addendum_refs: contract.addendum_refs, reconciliation_refs: contract.reconciliation_refs, supersession_refs: freezeArray([...contract.supersedes, contract.superseded_by ?? ""].filter(Boolean)), retirement_refs: freezeArray(["retirement:pending"]), dependency_evolution_refs: contract.dependency_refs, relationship_evolution_refs: freezeArray(["relationship:parent", "relationship:depends-on", "relationship:supersedes"]), governance_decision_refs: contract.approval_refs, complete, immutable_audit: complete });
}

function buildReplay(failures: readonly FormalDocumentTaxonomyFailure[]) {
  const ok = !has(failures, "REPLAY_NONDETERMINISTIC");
  return nested({ replay_validation_id: id("document_replay", VERSION), document_replayable: ok, transitions_replayable: ok, historical_versions_reproducible: ok, explainability_complete: !has(failures, "LINEAGE_INCOMPLETE"), deterministic: ok });
}

function buildIntegrity(args: { classificationValid: boolean; relationshipsValid: boolean; dependenciesValid: boolean; lifecycleValid: boolean; authorityValid: boolean; lineageValid: boolean; failures: readonly FormalDocumentTaxonomyFailure[] }) {
  const invalid = has(args.failures, "INTEGRITY_VIOLATION");
  const conflict = has(args.failures, "DEPENDENCY_CONFLICTING");
  const outcome = invalid || !args.classificationValid || !args.relationshipsValid || !args.lifecycleValid || !args.authorityValid ? "INVALID" as const : conflict ? "CONFLICTING" as const : !args.dependenciesValid || !args.lineageValid ? "INCOMPLETE" as const : "VALID" as const;
  return nested({ integrity_validation_id: id("document_integrity", VERSION), taxonomy_integrity: invalid ? "INVALID" as const : "VALID" as const, classification_consistency: args.classificationValid ? "VALID" as const : "INVALID" as const, relationship_integrity: args.relationshipsValid ? "VALID" as const : "INVALID" as const, dependency_integrity: args.dependenciesValid ? "VALID" as const : conflict ? "CONFLICTING" as const : "INCOMPLETE" as const, lifecycle_integrity: args.lifecycleValid ? "VALID" as const : "INVALID" as const, authority_integrity: args.authorityValid ? "VALID" as const : "INVALID" as const, version_integrity: invalid ? "INVALID" as const : "VALID" as const, lineage_integrity: args.lineageValid ? "VALID" as const : "INCOMPLETE" as const, reconciliation_required: conflict, outcome });
}

function resultReplayHash(result: Omit<FormalDocumentTaxonomyResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, definitions: result.definitions.map((item) => item.integrity_hash), classification: result.classification.integrity_hash, relationships: result.relationships.integrity_hash, dependencies: result.dependencies.integrity_hash, lifecycle: result.lifecycle.integrity_hash, graph: result.dependency_graph.integrity_hash, governance: result.governance.integrity_hash, integrity: result.integrity.integrity_hash, lineage: result.lineage.integrity_hash, replay: result.replay.integrity_hash, certification: result.certification.integrity_hash });
}
function resultIntegrityHash(result: Omit<FormalDocumentTaxonomyResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

export function runFormalDocumentTaxonomy(input: FormalDocumentTaxonomyInput = {}): FormalDocumentTaxonomyResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<FormalDocumentTaxonomyFailure>(direct ? [direct] : []);
  const contract = buildContract(failures);
  const definitions = buildDefinitions();
  const classification = buildClassification(failures);
  const relationships = buildRelationships(contract.document_id, failures);
  const dependencies = buildDependencies(failures);
  const lifecycle = buildLifecycle(failures);
  const dependency_graph = nested({ dependency_graph_id: id("document_dependency_graph", contract.document_id), nodes: freezeArray([contract.document_id, ...contract.dependency_refs]), edges: relationships.relationships, acyclic: relationships.cycles_prevented, deterministic: relationships.dependency_graph_deterministic });
  const governance = buildGovernance(failures);
  const lineage = buildLineage(contract, failures);
  const replay = buildReplay(failures);
  const integrity = buildIntegrity({ classificationValid: classification.classification_unique && classification.vocabulary_standardized, relationshipsValid: relationships.outcome === "VALID", dependenciesValid: dependencies.outcome === "VALID", lifecycleValid: lifecycle.transition_approved, authorityValid: Boolean(contract.governing_authority), lineageValid: lineage.complete, failures });
  const passed = failures.length === 0 && integrity.outcome === "VALID" && replay.deterministic && governance.taxonomy_approved;
  const certification = nested({ certification_id: id("formal_document_taxonomy_certification", VERSION), outcome: passed ? "PASS" as const : "FAIL" as const, certified: passed, failures });
  const base: Omit<FormalDocumentTaxonomyResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, contract, definitions, classification, relationships, dependencies, lifecycle, dependency_graph, governance, integrity, lineage, replay, certification };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateFormalDocumentTaxonomy(result?: FormalDocumentTaxonomyResult): FormalDocumentTaxonomyValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, classification_valid: false, relationships_valid: false, dependencies_valid: false, lifecycle_valid: false, replay_valid: false, failures: freezeArray(["INTEGRITY_VIOLATION" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const classification_valid = verifyHashedRecord(result.classification) && result.classification.classification_unique;
  const relationships_valid = verifyHashedRecord(result.relationships) && result.relationships.outcome === "VALID";
  const dependencies_valid = verifyHashedRecord(result.dependencies) && result.dependencies.outcome === "VALID";
  const lifecycle_valid = verifyHashedRecord(result.lifecycle) && result.lifecycle.transition_approved;
  const replay_valid = verifyHashedRecord(result.replay) && result.replay.deterministic;
  const valid = result.certification.outcome === "PASS" && result.certification.certified && replay_hash_valid && integrity_hash_valid && classification_valid && relationships_valid && dependencies_valid && lifecycle_valid && replay_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, classification_valid, relationships_valid, dependencies_valid, lifecycle_valid, replay_valid, failures: result.certification.failures });
}

export function replayFormalDocumentTaxonomy(result = runFormalDocumentTaxonomy()): boolean {
  const replayed = runFormalDocumentTaxonomy();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateFormalDocumentTaxonomy(result).valid;
}

export function getFormalDocumentTaxonomyBundle(): FormalDocumentTaxonomyBundle {
  const result = runFormalDocumentTaxonomy();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, document_types: TYPES, lifecycle_states: LIFECYCLE, relationship_types: RELATIONSHIPS, canonical_classification_required: true, deterministic_vocabulary_required: true, immutable_identity_required: true, explicit_relationships_required: true, historical_preservation_required: true, governance_authority_required: true, replayability_required: true }), result, validation: validateFormalDocumentTaxonomy(result) });
}

export const FormalDocumentTaxonomyService = Object.freeze({ run: runFormalDocumentTaxonomy, validate: validateFormalDocumentTaxonomy, replay: replayFormalDocumentTaxonomy });
