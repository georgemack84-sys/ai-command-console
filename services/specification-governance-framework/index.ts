import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  SpecificationArtifact,
  SpecificationCertificationOutcome,
  SpecificationGovernanceBundle,
  SpecificationGovernanceFailure,
  SpecificationGovernanceFrameworkResult,
  SpecificationGovernanceInput,
  SpecificationGovernanceLedgerEntry,
  SpecificationGovernanceScenario,
  SpecificationGovernanceValidation,
  SpecificationIntegrityOutcome,
  SpecificationIntegrityValidation,
  SpecificationLifecycleState,
} from "@/types/specification-governance-framework";

const VERSION = "specification-governance-framework/v13.8" as const;
const IDENTIFIER = "SpecificationGovernanceFramework" as const;
const NOW = "2026-07-15T00:00:00.000Z" as const;
const STATES: readonly SpecificationLifecycleState[] = Object.freeze(["DRAFT", "REVIEW", "APPROVED", "ACTIVE", "SUPERSEDED", "RETIRED", "ARCHIVED"]);
const TRANSITIONS = Object.freeze(["DRAFT->REVIEW", "REVIEW->APPROVED", "APPROVED->ACTIVE", "ACTIVE->SUPERSEDED", "SUPERSEDED->RETIRED", "RETIRED->ARCHIVED"] as const);

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
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function scenarioFailure(scenario: SpecificationGovernanceScenario): SpecificationGovernanceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly SpecificationGovernanceFailure[], failure: SpecificationGovernanceFailure): boolean { return failures.includes(failure); }
function integrityOutcome(failures: readonly SpecificationGovernanceFailure[], relevant: readonly SpecificationGovernanceFailure[]): SpecificationIntegrityOutcome {
  if (relevant.some((failure) => failures.includes(failure))) return "INVALID";
  return "VERIFIED";
}
function certOutcome(failures: readonly SpecificationGovernanceFailure[]): SpecificationCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}

function buildArtifact(failures: readonly SpecificationGovernanceFailure[]): SpecificationArtifact {
  const specification_id = "spec:mission-control:assurance-governance";
  const approved = !has(failures, "UNAPPROVED_CHANGE");
  return nested({
    specification_id,
    specification_name: "Mission Control Assurance Governance Specification",
    specification_type: "CONSTITUTIONAL_ASSURANCE_SPECIFICATION",
    owner_id: has(failures, "OWNERSHIP_NOT_UNIQUE") ? "" : "owner:mission-control-governance",
    current_version: "1.0.0",
    lifecycle_state: has(failures, "INVALID_LIFECYCLE_TRANSITION") ? "ACTIVE" as const : "SUPERSEDED" as const,
    status: failures.length ? "BLOCKED" as const : "GOVERNED" as const,
    parent_specification_refs: freezeArray(["spec:mission-control:assurance-root"]),
    dependent_specification_refs: has(failures, "DEPENDENCY_COMPATIBILITY_INVALID") ? freezeArray(["spec:unknown:incompatible"]) : freezeArray(["spec:mission-control:replay-divergence", "spec:mission-control:audit-lineage"]),
    superseded_by: "spec:mission-control:assurance-governance:v1.1.0",
    supersedes: has(failures, "SUPERSESSION_HISTORY_MISSING") ? freezeArray([]) : freezeArray(["spec:mission-control:assurance-governance:v0.9.0"]),
    approval_refs: approved ? freezeArray(["approval:spec-governance:13.8"]) : freezeArray([]),
    change_history_refs: freezeArray(["change:spec-governance:proposal", "change:spec-governance:impact-assessment"]),
    governance_refs: approved ? freezeArray(["governance:specification-board", "constitution:phase-13.8"]) : freezeArray([]),
    lineage_refs: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:spec-governance:root", "lineage:spec-governance:v1"]),
    created_timestamp: NOW,
    approved_timestamp: approved ? NOW : null,
    effective_timestamp: approved ? NOW : null,
    retired_timestamp: null,
    origin_ref: "phase-13.8-specification-governance-framework",
  });
}

function buildRegistry(artifact: SpecificationArtifact, failures: readonly SpecificationGovernanceFailure[]) {
  const duplicate = has(failures, "DUPLICATE_SPECIFICATION_ID");
  const specs = duplicate ? freezeArray([artifact, Object.freeze({ ...artifact })]) : freezeArray([artifact]);
  return nested({
    registry_id: id("specification_registry", VERSION),
    specifications: specs,
    identity_assignment_deterministic: true,
    identities_unique: !duplicate,
    immutable_registration: true,
    complete_inventory: !duplicate,
    replay_lookup_supported: true,
  });
}

function buildLifecycle(failures: readonly SpecificationGovernanceFailure[]) {
  return nested({
    lifecycle_contract_id: id("specification_lifecycle", VERSION),
    lifecycle_states: STATES,
    legal_transitions: TRANSITIONS,
    current_state: "ACTIVE" as const,
    target_state: "SUPERSEDED" as const,
    transition_legal: !has(failures, "INVALID_LIFECYCLE_TRANSITION"),
    governance_approval_valid: !has(failures, "UNAPPROVED_CHANGE"),
    dependency_compatibility_valid: !has(failures, "DEPENDENCY_COMPATIBILITY_INVALID"),
    ownership_authorized: !has(failures, "OWNERSHIP_NOT_UNIQUE") && !has(failures, "OWNERSHIP_TRANSFER_UNAPPROVED"),
    integrity_preserved: !has(failures, "INTEGRITY_HASH_MISMATCH"),
    deterministic: true,
  });
}

function buildVersion(artifact: SpecificationArtifact, failures: readonly SpecificationGovernanceFailure[]) {
  return nested({
    version_record_id: id("specification_version", artifact.specification_id),
    specification_id: artifact.specification_id,
    version: artifact.current_version,
    permanent_identifier: `${artifact.specification_id}@${artifact.current_version}`,
    immutable_after_approval: !has(failures, "MUTABLE_APPROVED_VERSION"),
    lineage_refs: artifact.lineage_refs,
    compatibility_valid: !has(failures, "DEPENDENCY_COMPATIBILITY_INVALID"),
    dependency_impact_refs: freezeArray(["impact:dependency:replay-divergence", "impact:dependency:audit-lineage"]),
    rollback_refs: freezeArray(["rollback:spec-governance:v0.9.0"]),
    replay_restoration_supported: !has(failures, "REPLAY_RECONSTRUCTION_FAILED"),
  });
}

function buildOwnership(artifact: SpecificationArtifact, failures: readonly SpecificationGovernanceFailure[]) {
  return nested({
    ownership_record_id: id("specification_ownership", artifact.specification_id),
    specification_id: artifact.specification_id,
    canonical_owner_id: artifact.owner_id,
    governance_authority_id: "governance-authority:specification-board",
    approval_chain_ref: "approval-chain:specification-governance",
    accountability_record_ref: "accountability:specification-owner",
    owner_count: has(failures, "OWNERSHIP_NOT_UNIQUE") ? 2 : 1,
    transfer_governance_approved: !has(failures, "OWNERSHIP_TRANSFER_UNAPPROVED"),
    historical_owners: freezeArray(["owner:mission-control-architecture", "owner:mission-control-governance"]),
  });
}

function buildApproval(artifact: SpecificationArtifact, failures: readonly SpecificationGovernanceFailure[]) {
  const approved = !has(failures, "UNAPPROVED_CHANGE");
  return nested({
    approval_workflow_id: id("specification_approval", artifact.specification_id),
    proposed_change_ref: "change:spec-governance:proposal",
    rationale_ref: "rationale:spec-governance:13.8",
    impact_assessment_ref: "impact:spec-governance:dependencies",
    affected_specification_refs: freezeArray([artifact.specification_id, ...artifact.dependent_specification_refs]),
    dependency_analysis_ref: "dependency-analysis:spec-governance",
    replay_impact_ref: "replay-impact:spec-governance",
    governance_approval_ref: approved ? "governance-approval:specification-board" : "",
    approval_authority_ref: approved ? "authority:specification-board" : "",
    approval_decision: approved ? "APPROVED" as const : "REJECTED" as const,
    version_registration_ref: approved ? `version:${artifact.current_version}` : "",
    registry_update_ref: approved ? "registry-update:spec-governance" : "",
    lifecycle_update_ref: approved ? "lifecycle-update:active-to-superseded" : "",
    replayable: true,
  });
}

function buildSupersession(artifact: SpecificationArtifact, failures: readonly SpecificationGovernanceFailure[]) {
  const complete = !has(failures, "SUPERSESSION_HISTORY_MISSING");
  return nested({
    supersession_id: id("specification_supersession", artifact.specification_id),
    superseded_specification_id: artifact.specification_id,
    replacement_specification_id: artifact.superseded_by ?? "",
    previous_version_immutable: !has(failures, "MUTABLE_APPROVED_VERSION"),
    historical_replay_preserved: complete,
    historical_validity_preserved: complete,
    dependency_migration_refs: complete ? freezeArray(["migration:dependent-specifications:v1.1.0"]) : freezeArray([]),
    lineage_continuation_refs: complete ? freezeArray(["lineage:spec-governance:v1-to-v1.1"]) : freezeArray([]),
    replay_compatibility_valid: !has(failures, "REPLAY_RECONSTRUCTION_FAILED"),
    immutable_relationship: complete,
  });
}

function buildIntegrity(failures: readonly SpecificationGovernanceFailure[]): SpecificationIntegrityValidation {
  const constitutional_assurance_event = failures.some((failure) => ["INTEGRITY_HASH_MISMATCH", "UNAPPROVED_CHANGE", "MUTABLE_APPROVED_VERSION", "OWNERSHIP_NOT_UNIQUE"].includes(failure));
  return nested({
    validation_id: id("specification_integrity", VERSION),
    integrity_hash_verification: integrityOutcome(failures, ["INTEGRITY_HASH_MISMATCH"]),
    ownership_validation: integrityOutcome(failures, ["OWNERSHIP_NOT_UNIQUE", "OWNERSHIP_TRANSFER_UNAPPROVED"]),
    lifecycle_consistency: integrityOutcome(failures, ["INVALID_LIFECYCLE_TRANSITION"]),
    version_integrity: integrityOutcome(failures, ["MUTABLE_APPROVED_VERSION", "VERSION_LINEAGE_INCOMPLETE"]),
    dependency_consistency: integrityOutcome(failures, ["DEPENDENCY_COMPATIBILITY_INVALID"]),
    replay_reconstruction: integrityOutcome(failures, ["REPLAY_RECONSTRUCTION_FAILED"]),
    governance_evidence_validation: integrityOutcome(failures, ["UNAPPROVED_CHANGE"]),
    constitutional_assurance_event,
    failures,
  });
}

function buildLedger(artifact: SpecificationArtifact, failures: readonly SpecificationGovernanceFailure[]): readonly SpecificationGovernanceLedgerEntry[] {
  const events: readonly SpecificationGovernanceLedgerEntry["event_type"][] = freezeArray(["REGISTRATION", "APPROVAL", "AMENDMENT", "OWNERSHIP_CHANGE", "LIFECYCLE_TRANSITION", "SUPERSESSION", "RETIREMENT", "ARCHIVAL", "REPLAY_VALIDATION", "CERTIFICATION_REFERENCE"]);
  return freezeArray(events.map((event_type, index) => {
    const entry = nested({
      ledger_entry_id: id("specification_governance_ledger", { event_type, index }),
      event_type,
      specification_id: artifact.specification_id,
      event_ref: `${event_type.toLowerCase()}:spec-governance:13.8`,
      evidence_refs: freezeArray([artifact.integrity_hash, ...artifact.approval_refs, ...artifact.governance_refs]),
      sequence: index + 1,
      append_only: true,
      immutable: true,
      replayable: true,
    });
    if (has(failures, "GOVERNANCE_LEDGER_MUTABLE") && index === events.length - 1) return Object.freeze({ ...entry, immutable: false, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
    return entry;
  }));
}

function buildReplay(failures: readonly SpecificationGovernanceFailure[]) {
  return nested({
    replay_validation_id: id("specification_replay", VERSION),
    lifecycle_reproduced: !has(failures, "INVALID_LIFECYCLE_TRANSITION"),
    ownership_reproduced: !has(failures, "OWNERSHIP_NOT_UNIQUE"),
    version_lineage_reproduced: !has(failures, "VERSION_LINEAGE_INCOMPLETE"),
    supersession_reproduced: !has(failures, "SUPERSESSION_HISTORY_MISSING"),
    ledger_reproduced: !has(failures, "GOVERNANCE_LEDGER_MUTABLE"),
    certification_reproduced: !has(failures, "REPLAY_RECONSTRUCTION_FAILED"),
    deterministic: !has(failures, "REPLAY_RECONSTRUCTION_FAILED"),
  });
}

function buildCertification(args: {
  failures: readonly SpecificationGovernanceFailure[];
  registryValid: boolean;
  lifecycleValid: boolean;
  ownershipUnique: boolean;
  versionImmutable: boolean;
  approvalEnforced: boolean;
  supersessionTraceable: boolean;
  ledgerValid: boolean;
  replayValid: boolean;
  integrityVerified: boolean;
  lineagePreserved: boolean;
}) {
  const outcomeValue = certOutcome(args.failures);
  return nested({
    certification_id: id("specification_governance_certification", VERSION),
    outcome: outcomeValue,
    certified: outcomeValue === "PASS",
    lifecycle_deterministic: args.lifecycleValid,
    ownership_unique: args.ownershipUnique,
    governance_approval_enforced: args.approvalEnforced,
    immutable_versioning: args.versionImmutable,
    supersession_traceable: args.supersessionTraceable,
    replay_reproducible: args.replayValid,
    audit_complete: args.ledgerValid,
    integrity_verified: args.integrityVerified,
    lineage_preserved: args.lineagePreserved,
    failures: args.failures,
  });
}

function resultReplayHash(result: Omit<SpecificationGovernanceFrameworkResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    artifact: result.artifact.integrity_hash,
    registry: result.registry.integrity_hash,
    lifecycle: result.lifecycle_contract.integrity_hash,
    version: result.version_governance.integrity_hash,
    ownership: result.ownership.integrity_hash,
    approval: result.approval_workflow.integrity_hash,
    supersession: result.supersession.integrity_hash,
    integrity: result.integrity_validation.integrity_hash,
    ledger: result.governance_ledger.map((entry) => entry.integrity_hash),
    replay: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}

function resultIntegrityHash(result: Omit<SpecificationGovernanceFrameworkResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

export function runSpecificationGovernanceFramework(input: SpecificationGovernanceInput = {}): SpecificationGovernanceFrameworkResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<SpecificationGovernanceFailure>(direct ? [direct] : []);
  const artifact = buildArtifact(failures);
  const registry = buildRegistry(artifact, failures);
  const lifecycle_contract = buildLifecycle(failures);
  const version_governance = buildVersion(artifact, failures);
  const ownership = buildOwnership(artifact, failures);
  const approval_workflow = buildApproval(artifact, failures);
  const supersession = buildSupersession(artifact, failures);
  const integrity_validation = buildIntegrity(failures);
  const governance_ledger = buildLedger(artifact, failures);
  const replay_validation = buildReplay(failures);
  const ledgerValid = governance_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable);
  const finalFailures = freezeArray([...new Set([...failures, ...(ledgerValid ? [] : ["GOVERNANCE_LEDGER_MUTABLE" as const])])]);
  const certification = buildCertification({
    failures: finalFailures,
    registryValid: registry.identities_unique && registry.complete_inventory,
    lifecycleValid: lifecycle_contract.transition_legal && lifecycle_contract.deterministic,
    ownershipUnique: ownership.owner_count === 1,
    versionImmutable: version_governance.immutable_after_approval,
    approvalEnforced: approval_workflow.approval_decision === "APPROVED",
    supersessionTraceable: supersession.historical_validity_preserved && supersession.immutable_relationship,
    ledgerValid,
    replayValid: replay_validation.deterministic,
    integrityVerified: Object.values(integrity_validation).filter((value): value is SpecificationIntegrityOutcome => typeof value === "string" && ["VERIFIED", "MODIFIED", "MISSING", "INVALID", "UNVERIFIABLE"].includes(value)).every((value) => value === "VERIFIED"),
    lineagePreserved: artifact.lineage_refs.length > 0 && version_governance.lineage_refs.length > 0,
  });
  const base: Omit<SpecificationGovernanceFrameworkResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    artifact,
    registry,
    lifecycle_contract,
    version_governance,
    ownership,
    approval_workflow,
    supersession,
    integrity_validation,
    governance_ledger,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSpecificationGovernanceFramework(result?: SpecificationGovernanceFrameworkResult): SpecificationGovernanceValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, registry_valid: false, ledger_valid: false, replay_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const registry_valid = verifyHashedRecord(result.registry) && result.registry.identities_unique && result.registry.immutable_registration;
  const ledger_valid = result.governance_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable);
  const replay_valid = verifyHashedRecord(result.replay_validation) && result.replay_validation.deterministic;
  const valid = result.certification.outcome === "PASS" && result.certification.certified && replay_hash_valid && integrity_hash_valid && registry_valid && ledger_valid && replay_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, registry_valid, ledger_valid, replay_valid, failures: result.certification.failures });
}

export function replaySpecificationGovernanceFramework(result = runSpecificationGovernanceFramework()): boolean {
  const replayed = runSpecificationGovernanceFramework();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSpecificationGovernanceFramework(result).valid;
}

export function getSpecificationGovernanceFrameworkBundle(): SpecificationGovernanceBundle {
  const result = runSpecificationGovernanceFramework();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      lifecycle_states: STATES,
      immutable_specifications_required: true,
      unique_ownership_required: true,
      governance_approval_required: true,
      historical_preservation_required: true,
      deterministic_lifecycle_required: true,
      immutable_audit_required: true,
      complete_lineage_required: true,
    }),
    result,
    validation: validateSpecificationGovernanceFramework(result),
  });
}

export const SpecificationGovernanceFrameworkService = Object.freeze({
  run: runSpecificationGovernanceFramework,
  validate: validateSpecificationGovernanceFramework,
  replay: replaySpecificationGovernanceFramework,
});
