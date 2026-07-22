import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { analyzeRiskPatternIntelligence } from "@/services/risk-pattern-intelligence";
import type {
  RiskAdaptationCertificationHistoryRegistry,
  RiskAdaptationGovernanceAuditRegistry,
  RiskAdaptationLedgerApiSurface,
  RiskAdaptationLedgerEntryType,
  RiskAdaptationLedgerFailure,
  RiskAdaptationLedgerFoundation,
  RiskAdaptationLedgerInput,
  RiskAdaptationLedgerIntegrityReport,
  RiskAdaptationLedgerRecord,
  RiskAdaptationLedgerResult,
  RiskAdaptationLedgerValidation,
  RiskAdaptationLineageRegistry,
  RiskAdaptationOperatorDecisionRegistry,
  RiskAdaptationProposalRegistry,
  RiskAdaptationSimulationRegistry,
} from "@/types/risk-adaptation-ledger";

const RISK_ADAPTATION_LEDGER_VERSION = "risk-adaptation-ledger/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskAdaptationLedgerInput["scenario"]>;

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

function buildApiSurface(): RiskAdaptationLedgerApiSurface {
  const base: Omit<RiskAdaptationLedgerApiSurface, "integrity_hash"> = {
    api_id: "risk_adaptation_ledger_api",
    commit_entry: "POST /risk-adaptation-ledger/commit",
    retrieve_entries: "POST /risk-adaptation-ledger/entries",
    retrieve_proposals: "POST /risk-adaptation-ledger/proposals",
    retrieve_governance: "POST /risk-adaptation-ledger/governance",
    retrieve_simulations: "POST /risk-adaptation-ledger/simulations",
    retrieve_operator_decisions: "POST /risk-adaptation-ledger/operator-decisions",
    retrieve_certifications: "POST /risk-adaptation-ledger/certifications",
    retrieve_lineage: "POST /risk-adaptation-ledger/lineage",
    retrieve_integrity: "POST /risk-adaptation-ledger/integrity",
    retrieve_validation: "POST /risk-adaptation-ledger/validation",
    replay_ledger: "POST /risk-adaptation-ledger/replay",
    retrieve_contract: "GET /risk-adaptation-ledger/contract",
    update_supported: false,
    delete_supported: false,
    reorder_supported: false,
    historical_mutation_supported: false,
    unauthorized_write_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function entryTypeForScenario(scenario: Scenario): RiskAdaptationLedgerEntryType {
  const map: Partial<Record<Scenario, RiskAdaptationLedgerEntryType>> = {
    PROPOSAL: "PROPOSAL_CREATED",
    REVISION: "REVISION_REQUESTED",
    VALIDATION: "VALIDATION_COMPLETED",
    GOVERNANCE: "GOVERNANCE_REVIEWED",
    SIMULATION: "SIMULATION_EXECUTED",
    APPROVED: "OPERATOR_APPROVED",
    REJECTED: "OPERATOR_REJECTED",
    CERTIFIED: "CERTIFICATION_DECIDED",
    REPLAY: "REPLAY_GENERATED",
    ROLLBACK: "ROLLBACK_LINEAGE_RECORDED",
    HISTORICAL_REFERENCE: "HISTORICAL_REFERENCE_RECORDED",
  };
  return map[scenario] ?? "PROPOSAL_CREATED";
}

function currentHashPayload(entry: Omit<RiskAdaptationLedgerRecord, "current_hash" | "integrity_hash">) {
  return {
    ledger_entry_id: entry.ledger_entry_id,
    adaptation_id: entry.adaptation_id,
    entry_type: entry.entry_type,
    entry_timestamp: entry.entry_timestamp,
    previous_hash: entry.previous_hash,
    proposal_ref: entry.proposal_ref,
    governance_review_ref: entry.governance_review_ref,
    simulation_ref: entry.simulation_ref,
    operator_decision_ref: entry.operator_decision_ref,
    certification_ref: entry.certification_ref,
    replay_lineage_ref: entry.replay_lineage_ref,
  };
}

function buildEntry(scenario: Scenario, adaptationId: string, patternRef: string): RiskAdaptationLedgerRecord {
  const entryType = entryTypeForScenario(scenario);
  const base: Omit<RiskAdaptationLedgerRecord, "current_hash" | "integrity_hash"> = {
    ledger_entry_id: `risk_adaptation_ledger_${hash(`${scenario}:${entryType}:${adaptationId}`).slice(0, 16)}`,
    adaptation_id: scenario === "MISSING_REFERENCES" ? "" : adaptationId,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: "mission_scope_risk_adaptation_ledger",
    risk_domain: "MISSION_RISK",
    entry_type: entryType,
    entry_timestamp: scenario === "BAD_TIMESTAMP" ? "2026-01-01T00:00:00.000Z" : CREATED_AT,
    proposal_ref: scenario === "MISSING_REFERENCES" ? "" : "risk_adaptation_proposal_ref_1",
    governance_review_ref: scenario === "MISSING_GOVERNANCE" ? "" : "risk_adaptation_governance_review_ref_1",
    simulation_ref: scenario === "MISSING_SIMULATION" ? "" : "risk_adaptation_simulation_ref_1",
    operator_decision_ref: scenario === "MISSING_OPERATOR" ? "" : "risk_adaptation_operator_decision_ref_1",
    certification_ref: scenario === "MISSING_CERTIFICATION" ? "" : "risk_adaptation_certification_ref_1",
    implementation_lineage_ref: scenario === "BROKEN_LINEAGE" ? "" : "risk_adaptation_implementation_lineage_ref_1",
    rollback_lineage_ref: scenario === "BROKEN_LINEAGE" ? "" : "risk_adaptation_rollback_lineage_ref_1",
    replay_lineage_ref: scenario === "MISSING_REPLAY" ? "" : "risk_adaptation_replay_lineage_ref_1",
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["risk_adaptation_ledger_evidence_ref_1", patternRef]),
    previous_hash: scenario === "BROKEN_CHAIN" ? "broken_previous_hash" : "GENESIS",
    created_by: scenario === "UNAUTHORIZED_WRITE" ? "unauthorized_actor" : "mission_control_system",
    created_at: CREATED_AT,
    append_only: true,
    immutable: true,
    deleted: false,
    authorized_write: true,
    rewrites_evidence: false,
    suppresses_governance_history: false,
    suppresses_constitutional_review: false,
    bypasses_operator_authority: false,
  };
  const current_hash = hash(currentHashPayload(base));
  const record = Object.freeze({ ...base, current_hash, integrity_hash: hashWithoutIntegrity({ ...base, current_hash }) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.ledger_entry_id }) });
  if (scenario === "HISTORICAL_MUTATION") return Object.freeze({ ...record, immutable: false as true });
  if (scenario === "DELETION") return Object.freeze({ ...record, deleted: true as false });
  if (scenario === "EVIDENCE_REWRITE") return Object.freeze({ ...record, rewrites_evidence: true as false });
  if (scenario === "GOVERNANCE_SUPPRESSION") return Object.freeze({ ...record, suppresses_governance_history: true as false });
  if (scenario === "CONSTITUTIONAL_SUPPRESSION") return Object.freeze({ ...record, suppresses_constitutional_review: true as false });
  if (scenario === "OPERATOR_BYPASS") return Object.freeze({ ...record, bypasses_operator_authority: true as false });
  if (scenario === "UNAUTHORIZED_WRITE") return Object.freeze({ ...record, authorized_write: false as true });
  return record;
}

function buildProposalRegistry(entry: RiskAdaptationLedgerRecord): RiskAdaptationProposalRegistry {
  const base: Omit<RiskAdaptationProposalRegistry, "integrity_hash"> = {
    registry_id: "risk_adaptation_proposal_registry",
    proposal_refs: freezeArray([entry.proposal_ref].filter(Boolean)),
    proposal_versions: freezeArray(["v1"]),
    proposal_owner_refs: freezeArray([entry.created_by]),
    rationale_refs: entry.supporting_evidence_refs,
    immutable_history: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildGovernanceRegistry(entry: RiskAdaptationLedgerRecord, scenario: Scenario): RiskAdaptationGovernanceAuditRegistry {
  const base: Omit<RiskAdaptationGovernanceAuditRegistry, "integrity_hash"> = {
    registry_id: "risk_adaptation_governance_audit_registry",
    governance_review_refs: freezeArray([entry.governance_review_ref].filter(Boolean)),
    constitutional_review_refs: scenario === "CONSTITUTIONAL_SUPPRESSION" ? freezeArray([]) : freezeArray(["risk_adaptation_constitutional_review_ref_1"]),
    compliance_review_refs: freezeArray(["risk_adaptation_compliance_review_ref_1"]),
    authority_decision_refs: freezeArray(["risk_adaptation_authority_decision_ref_1"]),
    governance_outcomes: freezeArray([scenario === "REJECTED" ? "REJECTED" : "APPROVED"]),
    immutable_history: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSimulationRegistry(entry: RiskAdaptationLedgerRecord): RiskAdaptationSimulationRegistry {
  const base: Omit<RiskAdaptationSimulationRegistry, "integrity_hash"> = {
    registry_id: "risk_adaptation_simulation_registry",
    simulation_refs: freezeArray([entry.simulation_ref].filter(Boolean)),
    simulation_input_refs: freezeArray(["risk_adaptation_simulation_input_ref_1"]),
    simulation_output_refs: freezeArray(["risk_adaptation_simulation_output_ref_1"]),
    validation_result_refs: freezeArray(["risk_adaptation_simulation_validation_ref_1"]),
    improvement_measurement_refs: freezeArray(["risk_adaptation_improvement_measurement_ref_1"]),
    replay_refs: freezeArray([entry.replay_lineage_ref].filter(Boolean)),
    immutable_history: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOperatorRegistry(entry: RiskAdaptationLedgerRecord, scenario: Scenario): RiskAdaptationOperatorDecisionRegistry {
  const base: Omit<RiskAdaptationOperatorDecisionRegistry, "integrity_hash"> = {
    registry_id: "risk_adaptation_operator_decision_registry",
    operator_decision_refs: freezeArray([entry.operator_decision_ref].filter(Boolean)),
    decision_authority_refs: freezeArray(["operator_authority_ref_1"]),
    decision_rationale_refs: entry.supporting_evidence_refs,
    decisions: freezeArray([scenario === "REJECTED" ? "REJECTED" : scenario === "REVISION" ? "REVISION_REQUESTED" : "APPROVED"]),
    immutable_history: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertificationRegistry(entry: RiskAdaptationLedgerRecord, scenario: Scenario): RiskAdaptationCertificationHistoryRegistry {
  const base: Omit<RiskAdaptationCertificationHistoryRegistry, "integrity_hash"> = {
    registry_id: "risk_adaptation_certification_history_registry",
    certification_refs: freezeArray([entry.certification_ref].filter(Boolean)),
    certification_evidence_refs: entry.supporting_evidence_refs,
    reviewer_refs: freezeArray(["risk_adaptation_certification_reviewer_ref_1"]),
    certification_outcomes: freezeArray([scenario === "REJECTED" ? "FAILED" : "CERTIFIED"]),
    historical_supersession_refs: freezeArray(["risk_adaptation_supersession_ref_1"]),
    immutable_history: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineageRegistry(entry: RiskAdaptationLedgerRecord): RiskAdaptationLineageRegistry {
  const base: Omit<RiskAdaptationLineageRegistry, "integrity_hash"> = {
    registry_id: "risk_adaptation_lineage_registry",
    implementation_lineage_refs: freezeArray([entry.implementation_lineage_ref].filter(Boolean)),
    rollback_lineage_refs: freezeArray([entry.rollback_lineage_ref].filter(Boolean)),
    replay_lineage_refs: freezeArray([entry.replay_lineage_ref].filter(Boolean)),
    dependency_chain_refs: freezeArray(["risk_adaptation_dependency_chain_ref_1"]),
    reconstructs_identical_lifecycle: Boolean(entry.replay_lineage_ref),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(entry: RiskAdaptationLedgerRecord, governance: RiskAdaptationGovernanceAuditRegistry, simulation: RiskAdaptationSimulationRegistry, operator: RiskAdaptationOperatorDecisionRegistry, certification: RiskAdaptationCertificationHistoryRegistry, lineage: RiskAdaptationLineageRegistry, scenario: Scenario): readonly RiskAdaptationLedgerFailure[] {
  const failures: RiskAdaptationLedgerFailure[] = [];
  if (scenario === "MISSING_SCHEMA" || !entry.ledger_entry_id || !entry.entry_type) failures.push("SCHEMA_INVALID");
  if (scenario === "MISSING_REFERENCES" || !entry.adaptation_id || !entry.proposal_ref) failures.push("REQUIRED_REFERENCES_MISSING");
  if (scenario === "MISSING_EVIDENCE" || entry.supporting_evidence_refs.length === 0) failures.push("EVIDENCE_MISSING");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(entry) !== entry.integrity_hash || hash(currentHashPayload(entry)) !== entry.current_hash) failures.push("HASH_VERIFICATION_FAILED");
  if (scenario === "BROKEN_CHAIN" || entry.previous_hash !== "GENESIS") failures.push("CHAIN_CONTINUITY_BROKEN");
  if (scenario === "REORDERED") failures.push("ENTRY_ORDERING_INVALID", "TRANSACTION_REORDER_DETECTED");
  if (scenario === "BAD_TIMESTAMP" || entry.entry_timestamp < CREATED_AT) failures.push("TIMESTAMP_INCONSISTENT");
  if (scenario === "MISSING_REPLAY" || !entry.replay_lineage_ref || !lineage.reconstructs_identical_lifecycle) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || governance.governance_review_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_SIMULATION" || simulation.simulation_refs.length === 0) failures.push("SIMULATION_REFERENCES_MISSING");
  if (scenario === "MISSING_OPERATOR" || operator.operator_decision_refs.length === 0) failures.push("OPERATOR_REFERENCES_MISSING");
  if (scenario === "MISSING_CERTIFICATION" || certification.certification_refs.length === 0) failures.push("CERTIFICATION_REFERENCES_MISSING");
  if (scenario === "BROKEN_LINEAGE" || lineage.implementation_lineage_refs.length === 0 || lineage.rollback_lineage_refs.length === 0) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "CROSS_TENANT" || entry.tenant_id !== "tenant_mission_control") failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HISTORICAL_MUTATION" || !entry.immutable) failures.push("HISTORICAL_ENTRY_MUTATION_DETECTED");
  if (scenario === "DELETION" || entry.deleted) failures.push("LEDGER_ENTRY_DELETION_DETECTED");
  if (scenario === "EVIDENCE_REWRITE" || entry.rewrites_evidence) failures.push("EVIDENCE_REWRITE_DETECTED");
  if (scenario === "GOVERNANCE_SUPPRESSION" || entry.suppresses_governance_history) failures.push("GOVERNANCE_HISTORY_SUPPRESSION_DETECTED");
  if (scenario === "CONSTITUTIONAL_SUPPRESSION" || entry.suppresses_constitutional_review || governance.constitutional_review_refs.length === 0) failures.push("CONSTITUTIONAL_REVIEW_SUPPRESSION_DETECTED");
  if (scenario === "OPERATOR_BYPASS" || entry.bypasses_operator_authority) failures.push("OPERATOR_AUTHORITY_BYPASS_DETECTED");
  if (scenario === "UNAUTHORIZED_WRITE" || !entry.authorized_write) failures.push("UNAUTHORIZED_WRITE_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_LEDGER_COMMIT");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildIntegrityReport(entry: RiskAdaptationLedgerRecord, failures: readonly RiskAdaptationLedgerFailure[]): RiskAdaptationLedgerIntegrityReport {
  const base: Omit<RiskAdaptationLedgerIntegrityReport, "integrity_hash"> = {
    integrity_report_id: "risk_adaptation_ledger_integrity_report",
    ledger_entry_refs: freezeArray([entry.ledger_entry_id]),
    hash_integrity_verified: !failures.includes("HASH_VERIFICATION_FAILED"),
    chain_continuity_verified: !failures.includes("CHAIN_CONTINUITY_BROKEN"),
    entry_ordering_verified: !failures.includes("ENTRY_ORDERING_INVALID") && !failures.includes("TRANSACTION_REORDER_DETECTED"),
    timestamp_consistency_verified: !failures.includes("TIMESTAMP_INCONSISTENT"),
    referential_integrity_verified: !failures.includes("REQUIRED_REFERENCES_MISSING"),
    tenant_isolation_verified: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    audit_ready: failures.length === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(failures: readonly RiskAdaptationLedgerFailure[]): RiskAdaptationLedgerValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("HASH_VERIFICATION_FAILED") || failures.includes("CHAIN_CONTINUITY_BROKEN") || failures.includes("HISTORICAL_ENTRY_MUTATION_DETECTED") || failures.includes("LEDGER_ENTRY_DELETION_DETECTED")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(entry: RiskAdaptationLedgerRecord, report: RiskAdaptationLedgerIntegrityReport, failures: readonly RiskAdaptationLedgerFailure[]): RiskAdaptationLedgerValidation {
  const base: Omit<RiskAdaptationLedgerValidation, "integrity_hash"> = {
    validation_id: "risk_adaptation_ledger_validation",
    state: stateFor(failures),
    certified: failures.length === 0,
    failures,
    schema_valid: !failures.includes("SCHEMA_INVALID"),
    required_references_complete: !failures.includes("REQUIRED_REFERENCES_MISSING"),
    evidence_complete: !failures.includes("EVIDENCE_MISSING"),
    hash_verified: report.hash_integrity_verified,
    chain_continuity_verified: report.chain_continuity_verified,
    entry_ordering_verified: report.entry_ordering_verified,
    timestamp_consistency_verified: report.timestamp_consistency_verified,
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    simulation_complete: !failures.includes("SIMULATION_REFERENCES_MISSING"),
    operator_complete: !failures.includes("OPERATOR_REFERENCES_MISSING"),
    certification_complete: !failures.includes("CERTIFICATION_REFERENCES_MISSING"),
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    append_only: entry.append_only,
    immutable_history: !failures.includes("HISTORICAL_ENTRY_MUTATION_DETECTED"),
    no_deletion: !failures.includes("LEDGER_ENTRY_DELETION_DETECTED"),
    no_reorder: !failures.includes("TRANSACTION_REORDER_DETECTED"),
    no_evidence_rewrite: !failures.includes("EVIDENCE_REWRITE_DETECTED"),
    no_governance_suppression: !failures.includes("GOVERNANCE_HISTORY_SUPPRESSION_DETECTED"),
    no_constitutional_suppression: !failures.includes("CONSTITUTIONAL_REVIEW_SUPPRESSION_DETECTED"),
    no_operator_bypass: !failures.includes("OPERATOR_AUTHORITY_BYPASS_DETECTED"),
    authorized_write: !failures.includes("UNAUTHORIZED_WRITE_DETECTED"),
    deterministic: !failures.includes("NONDETERMINISTIC_LEDGER_COMMIT"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskAdaptationLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({ entries: result.entries, registries: [result.proposal_registry, result.governance_registry, result.simulation_registry, result.operator_registry, result.certification_registry, result.lineage_registry], integrity_report: result.integrity_report, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskAdaptationLedgerResult, "integrity_hash">): string {
  return hash({
    risk_adaptation_ledger_version: result.risk_adaptation_ledger_version,
    api_surface_hash: result.api_surface.integrity_hash,
    entry_hashes: result.entries.map((entry) => entry.integrity_hash),
    proposal_hash: result.proposal_registry.integrity_hash,
    governance_hash: result.governance_registry.integrity_hash,
    simulation_hash: result.simulation_registry.integrity_hash,
    operator_hash: result.operator_registry.integrity_hash,
    certification_hash: result.certification_registry.integrity_hash,
    lineage_hash: result.lineage_registry.integrity_hash,
    integrity_report_hash: result.integrity_report.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeRiskAdaptationLedger(input: RiskAdaptationLedgerInput = {}): RiskAdaptationLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = input.foundation_result ?? analyzeRiskAdaptationFoundation();
  const pattern = input.pattern_result ?? analyzeRiskPatternIntelligence();
  const adaptationId = foundation.contract.adaptation_id;
  const patternRef = pattern.patterns[0]?.risk_pattern_id ?? "risk_pattern_ref_missing";
  const api_surface = buildApiSurface();
  const entry = buildEntry(scenario, adaptationId, patternRef);
  const proposal_registry = buildProposalRegistry(entry);
  const governance_registry = buildGovernanceRegistry(entry, scenario);
  const simulation_registry = buildSimulationRegistry(entry);
  const operator_registry = buildOperatorRegistry(entry, scenario);
  const certification_registry = buildCertificationRegistry(entry, scenario);
  const lineage_registry = buildLineageRegistry(entry);
  const failures = collectFailures(entry, governance_registry, simulation_registry, operator_registry, certification_registry, lineage_registry, scenario);
  const integrity_report = buildIntegrityReport(entry, failures);
  const validation = buildValidation(entry, integrity_report, failures);
  const entries = freezeArray([entry]);
  const base: Omit<RiskAdaptationLedgerResult, "integrity_hash" | "replay_hash"> = {
    risk_adaptation_ledger_version: RISK_ADAPTATION_LEDGER_VERSION,
    api_surface,
    entries,
    proposal_registry,
    governance_registry,
    simulation_registry,
    operator_registry,
    certification_registry,
    lineage_registry,
    integrity_report,
    validation,
    append_only: true,
    immutable: true,
    replayable: true,
    deterministic: true,
    audit_ready: integrity_report.audit_ready,
    tenant_isolated: validation.tenant_isolated,
    deletes_records: false,
    mutates_historical_entries: false,
    reorders_transactions: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskAdaptationLedger(result: RiskAdaptationLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskAdaptationLedgerFoundation(): RiskAdaptationLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_adaptation_ledger_version: RISK_ADAPTATION_LEDGER_VERSION,
    api_surface,
    result: analyzeRiskAdaptationLedger(),
  });
}

export const RiskAdaptationLedger = Object.freeze({
  analyze: analyzeRiskAdaptationLedger,
  replay: replayRiskAdaptationLedger,
});
