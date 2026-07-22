import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AmendmentAddendumBundle,
  AmendmentAddendumFailure,
  AmendmentAddendumInput,
  AmendmentAddendumManagementResult,
  AmendmentAddendumScenario,
  AmendmentAddendumValidation,
  SpecificationCompatibilityOutcome,
  SpecificationChangeType,
  SpecificationEvolutionLedgerEntry,
} from "@/types/amendment-addendum-management";

const VERSION = "amendment-addendum-management/v13.10" as const;
const IDENTIFIER = "AmendmentAddendumManagement" as const;
const DATE = "2026-07-15" as const;
const STAGES = Object.freeze(["Intake", "Validation", "Impact Analysis", "Compatibility Evaluation", "Governance Review", "Approval", "Registration", "Publication"] as const);
const CHANGE_TYPES: readonly SpecificationChangeType[] = Object.freeze(["AMENDMENT", "ADDENDUM", "RECONCILIATION_AMENDMENT"]);
const COMPATIBILITY_OUTCOMES: readonly SpecificationCompatibilityOutcome[] = Object.freeze(["COMPATIBLE", "CONDITIONALLY_COMPATIBLE", "INCOMPATIBLE"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function scenarioFailure(scenario: AmendmentAddendumScenario): AmendmentAddendumFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly AmendmentAddendumFailure[], failure: AmendmentAddendumFailure): boolean { return failures.includes(failure); }
function compatibility(failures: readonly AmendmentAddendumFailure[]): SpecificationCompatibilityOutcome {
  if (has(failures, "COMPATIBILITY_INCOMPATIBLE") || has(failures, "ADDENDUM_INVALIDATES_PRIOR_BEHAVIOR")) return "INCOMPATIBLE";
  if (has(failures, "CONFLICT_UNRESOLVED")) return "CONDITIONALLY_COMPATIBLE";
  return "COMPATIBLE";
}

function buildContract(failures: readonly AmendmentAddendumFailure[]) {
  const change_id = has(failures, "CHANGE_ID_NOT_UNIQUE") ? "change:duplicate" : id("spec_change", VERSION);
  return nested({
    change_id,
    change_type: "RECONCILIATION_AMENDMENT" as const,
    specification_ref: "spec:mission-control:specification-governance-framework",
    target_version: "1.1.0",
    originating_version: "1.0.0",
    change_title: "Clarify specification evolution governance",
    change_summary: has(failures, "CHANGE_SCOPE_MISSING") ? "" : "Reconciles amendment, addendum, and replay-preservation semantics for governed specifications.",
    change_rationale: has(failures, "CHANGE_SCOPE_MISSING") ? "" : "Prevent ambiguous specification evolution while preserving historical replay.",
    affected_sections: has(failures, "CHANGE_SCOPE_MISSING") ? freezeArray([]) : freezeArray(["13.10.1", "13.10.6", "13.10.9"]),
    affected_semantics: has(failures, "CHANGE_SCOPE_MISSING") ? freezeArray([]) : freezeArray(["amendment modifies semantics", "addendum extends semantics", "reconciliation resolves conflicts"]),
    compatibility_classification: compatibility(failures),
    replay_impact: has(failures, "REPLAY_PRESERVATION_FAILED") ? "Replay preservation failed for historical version resolution." : "Historical assessments replay against original governing specifications.",
    lineage_refs: has(failures, "LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:spec:v1.0.0", "lineage:change:13.10"]),
    governance_approval_ref: has(failures, "GOVERNANCE_APPROVAL_MISSING") ? "" : "approval:spec-evolution-board:13.10",
    effective_date: DATE,
    supersession_refs: has(failures, "HISTORICAL_SPECIFICATION_MUTATED") ? freezeArray([]) : freezeArray(["supersession:spec:v1.0.0-to-v1.1.0"]),
  });
}

function buildAmendments(contract: ReturnType<typeof buildContract>, failures: readonly AmendmentAddendumFailure[]) {
  return freezeArray([nested({
    amendment_id: id("amendment", contract.change_id),
    affected_specification_ref: contract.specification_ref,
    modified_semantic_elements: freezeArray(["compatibility validation", "replay preservation", "conflict resolution"]),
    approval_status: has(failures, "GOVERNANCE_APPROVAL_MISSING") ? "REJECTED" as const : "APPROVED" as const,
    version_relationships: freezeArray([`${contract.originating_version}->${contract.target_version}`]),
    supersession_history: contract.supersession_refs,
    replay_compatible: !has(failures, "REPLAY_PRESERVATION_FAILED"),
    governance_owner: "owner:specification-evolution",
    immutable_after_approval: !has(failures, "AMENDMENT_REGISTRY_MUTABLE"),
  })]);
}

function buildAddenda(contract: ReturnType<typeof buildContract>, failures: readonly AmendmentAddendumFailure[]) {
  return freezeArray([nested({
    addendum_id: id("addendum", contract.change_id),
    originating_specification_ref: contract.specification_ref,
    introduced_capabilities: freezeArray(["extended taxonomy registry", "supplementary compatibility evidence"]),
    dependency_relationships: freezeArray(["depends-on:formal-document-taxonomy", "depends-on:specification-governance"]),
    compatibility_guarantees: has(failures, "ADDENDUM_INVALIDATES_PRIOR_BEHAVIOR") ? freezeArray([]) : freezeArray(["backward-compatible", "no silent redefinition", "historical replay preserved"]),
    governance_approval_ref: contract.governance_approval_ref,
    lineage_refs: contract.lineage_refs,
    existing_behavior_invalidated: has(failures, "ADDENDUM_INVALIDATES_PRIOR_BEHAVIOR"),
    replay_reproducible_across_versions: !has(failures, "REPLAY_PRESERVATION_FAILED"),
  })]);
}

function buildController(failures: readonly AmendmentAddendumFailure[]) {
  return nested({
    controller_id: id("spec_change_controller", VERSION),
    processing_stages: STAGES,
    completed_stages: has(failures, "PROCESSING_STAGE_SKIPPED") ? freezeArray(STAGES.slice(0, -2)) : STAGES,
    workflow_deterministic: !has(failures, "PROCESSING_STAGE_SKIPPED"),
    processing_governed: !has(failures, "GOVERNANCE_APPROVAL_MISSING"),
    approvals_reproducible: !has(failures, "GOVERNANCE_APPROVAL_MISSING") && !has(failures, "PROCESSING_STAGE_SKIPPED"),
  });
}

function buildConflict(failures: readonly AmendmentAddendumFailure[]) {
  return nested({
    conflict_resolution_id: id("conflict_resolution", VERSION),
    conflict_types: freezeArray(["SEMANTIC_CONFLICT" as const, "TERMINOLOGY_CONFLICT" as const, "REPLAY_CONFLICT" as const]),
    resolution_decision_ref: has(failures, "CONFLICT_UNRESOLVED") ? "" : "resolution:spec-evolution:13.10",
    rationale: has(failures, "CONFLICT_UNRESOLVED") ? "" : "Clarifies change-type authority without deleting historical specification behavior.",
    historical_specifications_preserved: !has(failures, "HISTORICAL_SPECIFICATION_MUTATED"),
    fully_explainable: !has(failures, "CONFLICT_UNRESOLVED"),
    lineage_preserved: !has(failures, "LINEAGE_INCOMPLETE"),
    conflicts_resolved: !has(failures, "CONFLICT_UNRESOLVED"),
  });
}

function buildCompatibility(failures: readonly AmendmentAddendumFailure[]) {
  const result = compatibility(failures);
  const maybe = (failure: AmendmentAddendumFailure) => has(failures, failure) ? "INCOMPATIBLE" as const : result;
  return nested({
    compatibility_validation_id: id("compatibility_validation", VERSION),
    structural_compatibility: result,
    semantic_compatibility: maybe("ADDENDUM_INVALIDATES_PRIOR_BEHAVIOR"),
    lifecycle_compatibility: result,
    dependency_compatibility: result,
    authority_compatibility: has(failures, "GOVERNANCE_APPROVAL_MISSING") ? "INCOMPATIBLE" as const : result,
    governance_compatibility: has(failures, "GOVERNANCE_APPROVAL_MISSING") ? "INCOMPATIBLE" as const : result,
    replay_compatibility: has(failures, "REPLAY_PRESERVATION_FAILED") ? "INCOMPATIBLE" as const : result,
    certification_compatibility: has(failures, "CERTIFICATION_REPRODUCTION_FAILED") ? "INCOMPATIBLE" as const : result,
    outcome: has(failures, "GOVERNANCE_APPROVAL_MISSING") || has(failures, "REPLAY_PRESERVATION_FAILED") || has(failures, "CERTIFICATION_REPRODUCTION_FAILED") ? "INCOMPATIBLE" as const : result,
    evidence_refs: freezeArray(["evidence:compatibility:structure", "evidence:compatibility:replay", "evidence:compatibility:certification"]),
  });
}

function buildLineage(contract: ReturnType<typeof buildContract>, failures: readonly AmendmentAddendumFailure[]) {
  return nested({
    lineage_graph_id: id("change_lineage", contract.change_id),
    originating_specification: contract.specification_ref,
    amendment_refs: freezeArray([`amendment:${contract.change_id}`]),
    addendum_refs: freezeArray([`addendum:${contract.change_id}`]),
    reconciliation_amendment_refs: freezeArray([`reconciliation:${contract.change_id}`]),
    supersession_relationships: contract.supersession_refs,
    version_ancestry: has(failures, "LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([contract.originating_version, contract.target_version]),
    governance_approvals: contract.governance_approval_ref ? freezeArray([contract.governance_approval_ref]) : freezeArray([]),
    certification_history: has(failures, "CERTIFICATION_REPRODUCTION_FAILED") ? freezeArray([]) : freezeArray(["certification:spec:v1.0.0", "certification:change:v1.1.0"]),
    immutable: !has(failures, "LINEAGE_INCOMPLETE"),
    ancestry_complete: !has(failures, "LINEAGE_INCOMPLETE"),
    historical_relationships_preserved: !has(failures, "HISTORICAL_SPECIFICATION_MUTATED"),
  });
}

function buildReplay(failures: readonly AmendmentAddendumFailure[]) {
  return nested({
    replay_service_id: id("amendment_replay", VERSION),
    historical_specification_available: !has(failures, "HISTORICAL_SPECIFICATION_MUTATED"),
    version_resolution_deterministic: !has(failures, "REPLAY_PRESERVATION_FAILED"),
    amendment_ordering_reproduced: !has(failures, "REPLAY_PRESERVATION_FAILED"),
    addendum_applicability_reproduced: !has(failures, "ADDENDUM_INVALIDATES_PRIOR_BEHAVIOR"),
    replay_reconstruction_deterministic: !has(failures, "REPLAY_PRESERVATION_FAILED"),
    certification_reproducible: !has(failures, "CERTIFICATION_REPRODUCTION_FAILED"),
    future_amendments_ignored_for_historical_replay: !has(failures, "REPLAY_PRESERVATION_FAILED"),
  });
}

function buildLedger(contract: ReturnType<typeof buildContract>, failures: readonly AmendmentAddendumFailure[]): readonly SpecificationEvolutionLedgerEntry[] {
  const events: readonly SpecificationEvolutionLedgerEntry["event_type"][] = freezeArray(["CHANGE_REGISTRATION", "GOVERNANCE_APPROVAL", "COMPATIBILITY_EVALUATION", "CONFLICT_RESOLUTION", "REPLAY_VALIDATION", "SUPERSESSION_EVENT", "LINEAGE_UPDATE", "PUBLICATION"]);
  return freezeArray(events.map((event_type, index) => {
    const entry = nested({
      ledger_entry_id: id("spec_evolution_ledger", { event_type, index }),
      event_type,
      change_id: contract.change_id,
      evidence_refs: freezeArray([contract.integrity_hash, ...contract.lineage_refs, ...contract.supersession_refs]),
      sequence: index + 1,
      append_only: true,
      immutable: true,
      cryptographically_verifiable: true,
      tenant_isolated: true,
      replayable: true,
    });
    if (has(failures, "EVOLUTION_LEDGER_MUTABLE") && index === events.length - 1) return Object.freeze({ ...entry, immutable: false, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
    return entry;
  }));
}

function resultReplayHash(result: Omit<AmendmentAddendumManagementResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.change_contract.integrity_hash, amendments: result.amendment_registry.map((item) => item.integrity_hash), addenda: result.addendum_registry.map((item) => item.integrity_hash), controller: result.change_controller.integrity_hash, conflict: result.conflict_resolution.integrity_hash, compatibility: result.compatibility_validation.integrity_hash, lineage: result.lineage_graph.integrity_hash, replay: result.replay_service.integrity_hash, ledger: result.evolution_ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function resultIntegrityHash(result: Omit<AmendmentAddendumManagementResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

export function runAmendmentAddendumManagement(input: AmendmentAddendumInput = {}): AmendmentAddendumManagementResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<AmendmentAddendumFailure>(direct ? [direct] : []);
  const change_contract = buildContract(failures);
  const amendment_registry = buildAmendments(change_contract, failures);
  const addendum_registry = buildAddenda(change_contract, failures);
  const change_controller = buildController(failures);
  const conflict_resolution = buildConflict(failures);
  const compatibility_validation = buildCompatibility(failures);
  const lineage_graph = buildLineage(change_contract, failures);
  const replay_service = buildReplay(failures);
  const evolution_ledger = buildLedger(change_contract, failures);
  const ledgerValid = evolution_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable);
  const finalFailures = freezeArray([...new Set([...failures, ...(ledgerValid ? [] : ["EVOLUTION_LEDGER_MUTABLE" as const])])]);
  const passed = finalFailures.length === 0
    && change_contract.change_summary.length > 0
    && amendment_registry.every((item) => item.immutable_after_approval && item.replay_compatible)
    && addendum_registry.every((item) => !item.existing_behavior_invalidated && item.replay_reproducible_across_versions)
    && change_controller.completed_stages.length === STAGES.length
    && conflict_resolution.conflicts_resolved
    && compatibility_validation.outcome !== "INCOMPATIBLE"
    && lineage_graph.ancestry_complete
    && replay_service.replay_reconstruction_deterministic
    && ledgerValid;
  const certification = nested({ certification_id: id("amendment_addendum_certification", VERSION), outcome: passed ? "PASS" as const : "FAIL" as const, certified: passed, failures: finalFailures });
  const base: Omit<AmendmentAddendumManagementResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, change_contract, amendment_registry, addendum_registry, change_controller, conflict_resolution, compatibility_validation, lineage_graph, replay_service, evolution_ledger, certification };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAmendmentAddendumManagement(result?: AmendmentAddendumManagementResult): AmendmentAddendumValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, registries_valid: false, compatibility_valid: false, lineage_valid: false, replay_valid: false, ledger_valid: false, failures: freezeArray(["CHANGE_SCOPE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const registries_valid = result.amendment_registry.every((item) => verifyHashedRecord(item) && item.immutable_after_approval) && result.addendum_registry.every((item) => verifyHashedRecord(item) && !item.existing_behavior_invalidated);
  const compatibility_valid = verifyHashedRecord(result.compatibility_validation) && result.compatibility_validation.outcome !== "INCOMPATIBLE";
  const lineage_valid = verifyHashedRecord(result.lineage_graph) && result.lineage_graph.ancestry_complete && result.lineage_graph.historical_relationships_preserved;
  const replay_valid = verifyHashedRecord(result.replay_service) && result.replay_service.replay_reconstruction_deterministic && result.replay_service.certification_reproducible;
  const ledger_valid = result.evolution_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable && entry.cryptographically_verifiable);
  const valid = result.certification.outcome === "PASS" && result.certification.certified && replay_hash_valid && integrity_hash_valid && registries_valid && compatibility_valid && lineage_valid && replay_valid && ledger_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, registries_valid, compatibility_valid, lineage_valid, replay_valid, ledger_valid, failures: result.certification.failures });
}

export function replayAmendmentAddendumManagement(result = runAmendmentAddendumManagement()): boolean {
  const replayed = runAmendmentAddendumManagement();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAmendmentAddendumManagement(result).valid;
}

export function getAmendmentAddendumManagementBundle(): AmendmentAddendumBundle {
  const result = runAmendmentAddendumManagement();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, change_types: CHANGE_TYPES, compatibility_outcomes: COMPATIBILITY_OUTCOMES, addenda_extend_semantics: true, amendments_modify_semantics: true, reconciliation_resolves_conflicts: true, governance_required: true, lineage_preservation_required: true, replay_preservation_required: true, historical_validity_required: true }), result, validation: validateAmendmentAddendumManagement(result) });
}

export const AmendmentAddendumManagementService = Object.freeze({ run: runAmendmentAddendumManagement, validate: validateAmendmentAddendumManagement, replay: replayAmendmentAddendumManagement });
