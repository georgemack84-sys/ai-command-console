import { runAmendmentAddendumManagement } from "@/services/amendment-addendum-management";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runFormalDocumentTaxonomy } from "@/services/formal-document-taxonomy";
import { runSpecificationGovernanceFramework } from "@/services/specification-governance-framework";
import type {
  DomainConsistencyReport,
  SpecificationConsistencyOutcome,
  SpecificationIntegrityBundle,
  SpecificationIntegrityFailure,
  SpecificationIntegrityInput,
  SpecificationIntegrityScenario,
  SpecificationIntegrityValidation,
  SpecificationIntegrityValidationResult,
  SpecificationIntegrityStatus,
  SpecificationIntegrityLedgerEntry,
} from "@/types/specification-integrity-consistency-validation";

const VERSION = "specification-integrity-consistency-validation/v13.11" as const;
const IDENTIFIER = "SpecificationIntegrityConsistencyValidation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const STATES: readonly SpecificationIntegrityStatus[] = Object.freeze(["NOT_VALIDATED", "VALIDATING", "VALID", "INVALID", "REQUIRES_RECONCILIATION"]);
const DOMAINS = Object.freeze(["vocabulary", "authority", "lifecycle", "dependency", "replay", "certification", "constitutional", "document_taxonomy", "semantic", "lineage", "amendment", "addendum", "cross_reference", "governance", "audit"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function scenarioFailure(scenario: SpecificationIntegrityScenario): SpecificationIntegrityFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly SpecificationIntegrityFailure[], failure: SpecificationIntegrityFailure): boolean { return failures.includes(failure); }
function outcomeFor(findings: readonly SpecificationIntegrityFailure[]): SpecificationConsistencyOutcome {
  if (findings.some((finding) => ["SEMANTIC_CONTRADICTION", "DOCUMENT_TAXONOMY_CONFLICT", "DEPENDENCY_UNRESOLVED", "CERTIFICATION_CONFLICT"].includes(finding))) return "REQUIRES_RECONCILIATION";
  return findings.length ? "FAIL" : "PASS";
}

function report(domain: DomainConsistencyReport["domain"], checked_items: readonly string[], findings: readonly SpecificationIntegrityFailure[], evidence_refs: readonly string[]): DomainConsistencyReport {
  return nested({ report_id: id("spec_integrity_report", { domain, findings }), domain, checked_items, outcome: outcomeFor(findings), findings, evidence_refs, deterministic: true });
}

function buildContract(failures: readonly SpecificationIntegrityFailure[], evidenceRefs: readonly string[]) {
  const outcome = outcomeFor(failures);
  return nested({
    integrity_id: id("specification_integrity", VERSION),
    specification_ref: "spec:mission-control:specification-governance-framework",
    specification_version: "1.1.0",
    validation_scope: DOMAINS,
    validation_timestamp: TIMESTAMP,
    validator_version: VERSION,
    integrity_status: outcome === "PASS" ? "VALID" as const : outcome === "REQUIRES_RECONCILIATION" ? "REQUIRES_RECONCILIATION" as const : "INVALID" as const,
    detected_inconsistencies: failures,
    evidence_refs: evidenceRefs,
    constitutional_compliance: !has(failures, "AUTHORITY_EXPANSION"),
    replay_compliance: !has(failures, "REPLAY_INCONSISTENT"),
    certification_status: outcome,
  });
}

function buildLedger(integrityId: string, evidenceRefs: readonly string[], failures: readonly SpecificationIntegrityFailure[]): readonly SpecificationIntegrityLedgerEntry[] {
  const events: readonly SpecificationIntegrityLedgerEntry["event_type"][] = freezeArray(["VALIDATION_EXECUTION", "INCONSISTENCY_DETECTED", "RECONCILIATION_DECISION", "VOCABULARY_CHANGE", "REFERENCE_CORRECTION", "SEMANTIC_UPDATE", "CERTIFICATION_IMPACT", "REPLAY_IMPACT"]);
  return freezeArray(events.map((event_type, index) => {
    const entry = nested({ ledger_entry_id: id("spec_integrity_ledger", { event_type, index }), event_type, integrity_id: integrityId, evidence_refs: evidenceRefs, sequence: index + 1, append_only: true, immutable: true, replayable: true });
    if (has(failures, "AUDIT_LEDGER_MUTABLE") && index === events.length - 1) return Object.freeze({ ...entry, immutable: false, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
    return entry;
  }));
}

function resultReplayHash(result: Omit<SpecificationIntegrityValidationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    contract: result.contract.integrity_hash,
    reports: [
      result.vocabulary_validation.integrity_hash,
      result.cross_reference_validation.integrity_hash,
      result.semantic_integrity.integrity_hash,
      result.constitutional_consistency.integrity_hash,
      result.lifecycle_consistency.integrity_hash,
      result.dependency_consistency.integrity_hash,
      result.replay_certification_consistency.integrity_hash,
      result.document_taxonomy_consistency.integrity_hash,
    ],
    registry: result.integrity_registry.integrity_hash,
    ledger: result.integrity_ledger.map((entry) => entry.integrity_hash),
  });
}
function resultIntegrityHash(result: Omit<SpecificationIntegrityValidationResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.contract.integrity_status, replay_hash: result.replay_hash }); }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

export function runSpecificationIntegrityConsistencyValidation(input: SpecificationIntegrityInput = {}): SpecificationIntegrityValidationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<SpecificationIntegrityFailure>(direct ? [direct] : []);
  const specGovernance = runSpecificationGovernanceFramework();
  const taxonomy = runFormalDocumentTaxonomy();
  const evolution = runAmendmentAddendumManagement();
  const evidenceRefs = freezeArray([specGovernance.integrity_hash, taxonomy.integrity_hash, evolution.integrity_hash]);

  const vocabulary_validation = report("VOCABULARY", ["canonical terminology", "approved definitions", "prohibited synonyms", "controlled vocabularies"], failures.filter((f) => ["VOCABULARY_DRIFT", "DUPLICATE_DEFINITION", "UNDEFINED_TERMINOLOGY"].includes(f)), evidenceRefs);
  const cross_reference_validation = report("CROSS_REFERENCE", ["specification refs", "amendment refs", "addendum refs", "dependency refs", "taxonomy refs"], failures.filter((f) => ["BROKEN_REFERENCE", "CIRCULAR_REFERENCE_UNGOVERNED"].includes(f)), evidenceRefs);
  const semantic_integrity = report("SEMANTIC", ["normative statements", "behavioral definitions", "implementation requirements", "replay semantics"], failures.filter((f) => ["SEMANTIC_CONTRADICTION", "AMENDMENT_INCONSISTENT", "ADDENDUM_INVALIDATES_BEHAVIOR"].includes(f)), evidenceRefs);
  const constitutional_consistency = report("CONSTITUTIONAL", ["authority hierarchy", "authority ceilings", "governance precedence", "operator boundaries"], failures.filter((f) => ["AUTHORITY_EXPANSION"].includes(f)), evidenceRefs);
  const lifecycle_consistency = report("LIFECYCLE", ["lifecycle transitions", "supersession chains", "retirement rules", "ownership continuity"], failures.filter((f) => ["LIFECYCLE_AMBIGUITY"].includes(f)), evidenceRefs);
  const dependency_consistency = report("DEPENDENCY", ["spec dependencies", "amendment dependencies", "governance dependencies", "replay dependencies"], failures.filter((f) => ["DEPENDENCY_UNRESOLVED", "CIRCULAR_REFERENCE_UNGOVERNED"].includes(f)), evidenceRefs);
  const replay_certification_consistency = report("REPLAY_CERTIFICATION", ["replay contracts", "replay determinism", "certification rules", "audit integrity"], failures.filter((f) => ["REPLAY_INCONSISTENT", "CERTIFICATION_CONFLICT"].includes(f)), evidenceRefs);
  const document_taxonomy_consistency = report("DOCUMENT_TAXONOMY", ["roadmaps", "specifications", "amendments", "addenda", "relationships", "lineage"], failures.filter((f) => ["DOCUMENT_TAXONOMY_CONFLICT", "LINEAGE_INCOMPLETE"].includes(f)), evidenceRefs);

  const contract = buildContract(failures, evidenceRefs);
  const integrity_registry = nested({
    registry_id: id("spec_integrity_registry", VERSION),
    integrity_records: freezeArray([contract.integrity_id]),
    validation_history: freezeArray([contract.validation_timestamp]),
    semantic_findings: semantic_integrity.findings,
    reconciliation_history: failures.length ? freezeArray(["reconciliation-required:spec-integrity"]) : freezeArray([]),
    validator_versions: freezeArray([VERSION]),
    evidence_references: evidenceRefs,
    replay_references: freezeArray([specGovernance.replay_hash, taxonomy.replay_hash, evolution.replay_hash]),
    certification_references: freezeArray([specGovernance.certification.certification_id, taxonomy.certification.certification_id, evolution.certification.certification_id]),
    immutable: true,
    historical_integrity_replayable: !has(failures, "REPLAY_INCONSISTENT"),
  });
  const integrity_ledger = buildLedger(contract.integrity_id, evidenceRefs, failures);
  const base: Omit<SpecificationIntegrityValidationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, contract, vocabulary_validation, cross_reference_validation, semantic_integrity, constitutional_consistency, lifecycle_consistency, dependency_consistency, replay_certification_consistency, document_taxonomy_consistency, integrity_registry, integrity_ledger };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSpecificationIntegrityConsistencyValidation(result?: SpecificationIntegrityValidationResult): SpecificationIntegrityValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, domains_valid: false, registry_valid: false, ledger_valid: false, failures: freezeArray(["BROKEN_REFERENCE" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.contract);
  const reports = [result.vocabulary_validation, result.cross_reference_validation, result.semantic_integrity, result.constitutional_consistency, result.lifecycle_consistency, result.dependency_consistency, result.replay_certification_consistency, result.document_taxonomy_consistency];
  const domains_valid = reports.every((item) => verifyHashedRecord(item) && item.outcome === "PASS");
  const registry_valid = verifyHashedRecord(result.integrity_registry) && result.integrity_registry.immutable && result.integrity_registry.historical_integrity_replayable;
  const ledger_valid = result.integrity_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable && entry.replayable);
  const valid = result.contract.integrity_status === "VALID" && replay_hash_valid && integrity_hash_valid && domains_valid && registry_valid && ledger_valid;
  return nested({ valid, outcome: result.contract.certification_status, replay_hash_valid, integrity_hash_valid, domains_valid, registry_valid, ledger_valid, failures: result.contract.detected_inconsistencies });
}

export function replaySpecificationIntegrityConsistencyValidation(result = runSpecificationIntegrityConsistencyValidation()): boolean {
  const replayed = runSpecificationIntegrityConsistencyValidation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSpecificationIntegrityConsistencyValidation(result).valid;
}

export function getSpecificationIntegrityConsistencyValidationBundle(): SpecificationIntegrityBundle {
  const result = runSpecificationIntegrityConsistencyValidation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, validation_states: STATES, validation_domains: DOMAINS, reconciliation_required_for_conflicts: true, deterministic_validation_required: true, immutable_evidence_required: true, replay_preservation_required: true, audit_immutability_required: true, mission_control_change_authority: false }), result, validation: validateSpecificationIntegrityConsistencyValidation(result) });
}

export const SpecificationIntegrityConsistencyValidationService = Object.freeze({ run: runSpecificationIntegrityConsistencyValidation, validate: validateSpecificationIntegrityConsistencyValidation, replay: replaySpecificationIntegrityConsistencyValidation });
