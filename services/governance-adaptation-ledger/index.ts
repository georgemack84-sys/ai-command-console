import { detectAdaptivePolicyConflicts } from "@/services/adaptive-policy-conflict-detector";
import { validateAuthorityBoundary } from "@/services/authority-boundary-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type {
  GovernanceAdaptationLedgerApiSurface,
  GovernanceAdaptationLedgerEntry,
  GovernanceAdaptationLedgerEventType,
  GovernanceAdaptationLedgerFailure,
  GovernanceAdaptationLedgerFoundation,
  GovernanceAdaptationLedgerInput,
  GovernanceAdaptationLedgerIntegrityReport,
  GovernanceAdaptationLedgerResult,
  GovernanceAdaptationLineageGraph,
  GovernanceAdaptationReplayIndex,
} from "@/types/governance-adaptation-ledger";

const LEDGER_VERSION = "governance-adaptation-ledger/v1" as const;
const LEDGER_TIMESTAMP = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<GovernanceAdaptationLedgerInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): GovernanceAdaptationLedgerApiSurface {
  const base: Omit<GovernanceAdaptationLedgerApiSurface, "integrity_hash"> = {
    api_id: "governance_adaptation_ledger_api",
    append_entry: "POST /governance-adaptation-ledger/append",
    retrieve_entries: "POST /governance-adaptation-ledger/entries",
    retrieve_lineage: "POST /governance-adaptation-ledger/lineage",
    retrieve_integrity: "POST /governance-adaptation-ledger/integrity",
    retrieve_replay_index: "POST /governance-adaptation-ledger/replay-index",
    replay_ledger: "POST /governance-adaptation-ledger/replay",
    retrieve_contract: "GET /governance-adaptation-ledger/contract",
    append_only: true,
    update_supported: false,
    delete_supported: false,
    mutation_supported: false,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function eventFor(scenario: Scenario): GovernanceAdaptationLedgerEventType {
  const map: Partial<Record<Scenario, GovernanceAdaptationLedgerEventType>> = {
    GOVERNANCE_DECISION: "GOVERNANCE_DECISION",
    CONSTITUTIONAL_REVIEW: "CONSTITUTIONAL_REVIEW",
    AUTHORITY_REVIEW: "AUTHORITY_REVIEW",
    POLICY_CONFLICT: "POLICY_CONFLICT",
    APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
    APPROVAL_COMPLETED: "APPROVAL_COMPLETED",
    SIMULATION_AUTHORIZED: "SIMULATION_AUTHORIZED",
    SIMULATION_DENIED: "SIMULATION_DENIED",
    OPERATOR_DECISION: "OPERATOR_DECISION",
    ESCALATION_CREATED: "ESCALATION_CREATED",
    ESCALATION_RESOLVED: "ESCALATION_RESOLVED",
    CERTIFICATION_UPDATED: "CERTIFICATION_UPDATED",
    ROLLBACK_REGISTERED: "ROLLBACK_REGISTERED",
    REPLAY_REGISTERED: "REPLAY_REGISTERED",
    LEDGER_VERIFIED: "LEDGER_VERIFIED",
  };
  return map[scenario] ?? "VALIDATION_RECORDED";
}

function failureFor(scenario: Scenario): GovernanceAdaptationLedgerFailure | undefined {
  const map: Partial<Record<Scenario, GovernanceAdaptationLedgerFailure>> = {
    APPEND_FAILURE: "LEDGER_APPEND_FAILED",
    ENTRY_MODIFIED: "LEDGER_ENTRY_MODIFIED",
    ENTRY_DELETED: "LEDGER_ENTRY_DELETED",
    HASH_MISMATCH: "HASH_VERIFICATION_FAILED",
    BROKEN_PARENT_HASH: "PARENT_HASH_CONTINUITY_BROKEN",
    BAD_TIMESTAMP: "TIMESTAMP_ORDERING_INVALID",
    MISSING_REPLAY_LINEAGE: "REPLAY_LINEAGE_INCOMPLETE",
    MISSING_ROLLBACK_LINEAGE: "ROLLBACK_LINEAGE_INCOMPLETE",
    MISSING_CERTIFICATION_LINEAGE: "CERTIFICATION_LINEAGE_INCOMPLETE",
    MISSING_EVIDENCE_LINK: "SUPPORTING_EVIDENCE_UNLINKED",
    MISSING_EVIDENCE: "SUPPORTING_EVIDENCE_UNLINKED",
    TENANT_UNVERIFIED: "TENANT_OWNERSHIP_UNVERIFIED",
    CROSS_TENANT_REFERENCE: "CROSS_TENANT_LEDGER_REFERENCE",
    BROKEN_CHRONOLOGY: "EVENT_CHRONOLOGY_UNRECONSTRUCTABLE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    LEDGER_CORRUPTION: "LEDGER_CORRUPTION_DETECTED",
  };
  return map[scenario];
}

function entryHashPayload(entry: Omit<GovernanceAdaptationLedgerEntry, "entry_hash" | "integrity_hash">): unknown {
  return {
    ledger_entry_id: entry.ledger_entry_id,
    tenant_id: entry.tenant_id,
    proposal_id: entry.proposal_id,
    event_type: entry.event_type,
    validation_reference: entry.validation_reference,
    parent_hash: entry.parent_hash,
    ledger_timestamp: entry.ledger_timestamp,
  };
}

function buildEntry(input: GovernanceAdaptationLedgerInput): GovernanceAdaptationLedgerEntry {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const constitutional = input.constitutional_result ?? validateConstitutionalAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance });
  const authority = input.authority_result ?? validateAuthorityBoundary({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional });
  const tenant = input.tenant_result ?? validateTenantIsolation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority });
  const conflict = input.conflict_result ?? detectAdaptivePolicyConflicts({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant });
  const event_type = eventFor(scenario);
  const proposal_id = adaptation.contract.adaptation_id || governance.validation.proposal_id;
  const tenant_id = scenario === "CROSS_TENANT_REFERENCE" ? "tenant_foreign_ref" : adaptation.contract.tenant_id;
  const evidence = scenario === "MISSING_EVIDENCE_LINK" || scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...adaptation.contract.supporting_evidence_refs, governance.validation.validation_id, constitutional.validation.validation_id, authority.validation.validation_id, tenant.validation.validation_id, conflict.analysis.conflict_id]);
  const replayLineage = scenario === "MISSING_REPLAY_LINEAGE" ? freezeArray([]) : freezeArray([governance.validation.replay_reference, constitutional.validation.replay_reference, authority.validation.replay_reference, tenant.validation.replay_reference, conflict.analysis.replay_reference].filter(Boolean));
  const rollbackLineage = scenario === "MISSING_ROLLBACK_LINEAGE" ? freezeArray([]) : freezeArray(["rollback_lineage_ref_governance_adaptation"]);
  const certificationLineage = scenario === "MISSING_CERTIFICATION_LINEAGE" ? freezeArray([]) : freezeArray(["certification_lineage_ref_governance_adaptation"]);
  const base: Omit<GovernanceAdaptationLedgerEntry, "entry_hash" | "integrity_hash"> = {
    ledger_entry_id: `governance_adaptation_ledger_${hash(`${scenario}:${proposal_id}:${event_type}`).slice(0, 16)}`,
    tenant_id,
    proposal_id,
    event_type,
    validation_reference: governance.validation.validation_id,
    governance_decision: governance.validation.governance_status,
    constitutional_review: constitutional.validation.constitutional_status,
    authority_review: authority.validation.authority_status,
    policy_conflicts: conflict.analysis.detected_conflicts.map((item) => item.conflict_ref),
    required_approvals: governance.validation.required_approvals.map((item) => item.approver_role),
    simulation_authorization: scenario === "SIMULATION_AUTHORIZED" ? "AUTHORIZED" : scenario === "SIMULATION_DENIED" ? "DENIED" : "NOT_REQUESTED",
    operator_decision: scenario === "OPERATOR_DECISION" || scenario === "APPROVAL_COMPLETED" ? "APPROVED" : "NOT_REQUESTED",
    escalation_reference: governance.validation.escalation_requirements[0]?.escalation_id ?? "",
    replay_lineage: replayLineage,
    rollback_lineage: rollbackLineage,
    certification_lineage: certificationLineage,
    evidence_references: evidence,
    parent_hash: scenario === "BROKEN_PARENT_HASH" ? "broken_parent_hash" : "GENESIS",
    ledger_timestamp: scenario === "BAD_TIMESTAMP" ? "2026-01-01T00:00:00.000Z" : LEDGER_TIMESTAMP,
    integrity_status: "VERIFIED",
    append_only: true,
    immutable: true,
    deleted: false,
  };
  const entry_hash = hash(entryHashPayload(base));
  const entry = Object.freeze({ ...base, entry_hash, integrity_hash: hashWithoutIntegrity({ ...base, entry_hash }) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...entry, entry_hash: hash({ tampered: entry.ledger_entry_id }), integrity_status: "FAILED" as const });
  if (scenario === "ENTRY_MODIFIED") return Object.freeze({ ...entry, immutable: false, integrity_status: "FAILED" as const });
  if (scenario === "ENTRY_DELETED") return Object.freeze({ ...entry, deleted: true, integrity_status: "FAILED" as const });
  return entry;
}

function collectFailures(entry: GovernanceAdaptationLedgerEntry, scenario: Scenario): readonly GovernanceAdaptationLedgerFailure[] {
  const failures: GovernanceAdaptationLedgerFailure[] = [];
  const direct = failureFor(scenario);
  if (direct) failures.push(direct);
  if (scenario === "APPEND_FAILURE") failures.push("LEDGER_APPEND_FAILED");
  if (!entry.immutable) failures.push("LEDGER_ENTRY_MODIFIED");
  if (entry.deleted) failures.push("LEDGER_ENTRY_DELETED");
  if (hash(entryHashPayload(entry)) !== entry.entry_hash || hashWithoutIntegrity(entry) !== entry.integrity_hash) failures.push("HASH_VERIFICATION_FAILED");
  if (entry.parent_hash !== "GENESIS") failures.push("PARENT_HASH_CONTINUITY_BROKEN");
  if (entry.ledger_timestamp < LEDGER_TIMESTAMP) failures.push("TIMESTAMP_ORDERING_INVALID");
  if (entry.replay_lineage.length === 0) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  if (entry.rollback_lineage.length === 0) failures.push("ROLLBACK_LINEAGE_INCOMPLETE");
  if (entry.certification_lineage.length === 0) failures.push("CERTIFICATION_LINEAGE_INCOMPLETE");
  if (entry.evidence_references.length === 0) failures.push("SUPPORTING_EVIDENCE_UNLINKED");
  if (!entry.tenant_id || entry.tenant_id === "tenant_unknown_or_mixed") failures.push("TENANT_OWNERSHIP_UNVERIFIED");
  if (entry.tenant_id.includes("foreign")) failures.push("CROSS_TENANT_LEDGER_REFERENCE");
  if (scenario === "BROKEN_CHRONOLOGY") failures.push("EVENT_CHRONOLOGY_UNRECONSTRUCTABLE");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_CORRUPTION") failures.push("LEDGER_CORRUPTION_DETECTED");
  return freezeArray([...new Set(failures)]);
}

function buildLineage(entry: GovernanceAdaptationLedgerEntry, failures: readonly GovernanceAdaptationLedgerFailure[]): GovernanceAdaptationLineageGraph {
  const base: Omit<GovernanceAdaptationLineageGraph, "integrity_hash"> = {
    graph_id: `governance_adaptation_lineage_${hash(entry.ledger_entry_id).slice(0, 14)}`,
    validation_sequence: freezeArray([entry.validation_reference].filter(Boolean)),
    decision_sequence: freezeArray([entry.governance_decision, entry.constitutional_review, entry.authority_review]),
    dependency_chain: freezeArray([...entry.evidence_references, ...entry.policy_conflicts]),
    replay_lineage: entry.replay_lineage,
    rollback_lineage: entry.rollback_lineage,
    certification_lineage: entry.certification_lineage,
    event_chronology: freezeArray([entry.event_type]),
    complete: failures.length === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIntegrityReport(entry: GovernanceAdaptationLedgerEntry, failures: readonly GovernanceAdaptationLedgerFailure[]): GovernanceAdaptationLedgerIntegrityReport {
  const base: Omit<GovernanceAdaptationLedgerIntegrityReport, "integrity_hash"> = {
    report_id: `governance_adaptation_integrity_${hash(entry.ledger_entry_id).slice(0, 14)}`,
    entries_verified: failures.length === 0 ? 1 : 0,
    hash_verified: !failures.includes("HASH_VERIFICATION_FAILED") && !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    parent_hash_continuity: !failures.includes("PARENT_HASH_CONTINUITY_BROKEN"),
    timestamp_ordering_verified: !failures.includes("TIMESTAMP_ORDERING_INVALID"),
    tenant_ownership_verified: !failures.includes("TENANT_OWNERSHIP_UNVERIFIED") && !failures.includes("CROSS_TENANT_LEDGER_REFERENCE"),
    referential_integrity_verified: !failures.includes("SUPPORTING_EVIDENCE_UNLINKED"),
    event_chronology_reconstructable: !failures.includes("EVENT_CHRONOLOGY_UNRECONSTRUCTABLE"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayIndex(entry: GovernanceAdaptationLedgerEntry, failures: readonly GovernanceAdaptationLedgerFailure[]): GovernanceAdaptationReplayIndex {
  const base: Omit<GovernanceAdaptationReplayIndex, "integrity_hash"> = {
    replay_index_id: `governance_adaptation_replay_index_${hash(entry.ledger_entry_id).slice(0, 14)}`,
    replay_refs: entry.replay_lineage,
    replay_hashes: entry.replay_lineage.map((ref) => hash(ref)),
    byte_identical: !failures.includes("REPLAY_DIVERGENCE") && entry.replay_lineage.length > 0,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceAdaptationLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({ entries: result.entries, lineage_graph: result.lineage_graph, integrity_report: result.integrity_report, replay_index: result.replay_index });
}

function resultIntegrityHash(result: Omit<GovernanceAdaptationLedgerResult, "integrity_hash">): string {
  return hash({
    governance_adaptation_ledger_version: result.governance_adaptation_ledger_version,
    api_surface_hash: result.api_surface.integrity_hash,
    entry_hashes: result.entries.map((entry) => entry.integrity_hash),
    lineage_hash: result.lineage_graph.integrity_hash,
    integrity_report_hash: result.integrity_report.integrity_hash,
    replay_index_hash: result.replay_index.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function appendGovernanceAdaptationLedger(input: GovernanceAdaptationLedgerInput = {}): GovernanceAdaptationLedgerResult {
  const api_surface = buildApiSurface();
  const scenario = input.scenario ?? "BASELINE";
  const entry = buildEntry(input);
  const failures = collectFailures(entry, scenario);
  const lineage_graph = buildLineage(entry, failures);
  const integrity_report = buildIntegrityReport(entry, failures);
  const replay_index = buildReplayIndex(entry, failures);
  const base: Omit<GovernanceAdaptationLedgerResult, "integrity_hash" | "replay_hash"> = {
    governance_adaptation_ledger_version: LEDGER_VERSION,
    api_surface,
    entries: freezeArray([entry]),
    lineage_graph,
    integrity_report,
    replay_index,
    validation_state: failures.length === 0 ? "CERTIFIED" : "FAIL_CLOSED",
    fail_closed: failures.length > 0,
    append_only: true,
    immutable: true,
    replayable: replay_index.byte_identical,
    tenant_isolated: integrity_report.tenant_ownership_verified,
    audit_ready: failures.length === 0,
    tamper_evident: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceAdaptationLedger(result: GovernanceAdaptationLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getGovernanceAdaptationLedgerFoundation(): GovernanceAdaptationLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_adaptation_ledger_version: LEDGER_VERSION,
    api_surface,
    result: appendGovernanceAdaptationLedger(),
  });
}

export const GovernanceAdaptationLedger = Object.freeze({
  append: appendGovernanceAdaptationLedger,
  replay: replayGovernanceAdaptationLedger,
});
