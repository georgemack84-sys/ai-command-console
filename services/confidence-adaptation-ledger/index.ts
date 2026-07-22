import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { generateConfidenceAdaptationProposal } from "@/services/confidence-adaptation-proposal-generator";
import type {
  ConfidenceAdaptationLedgerApiSurface,
  ConfidenceAdaptationLedgerFailure,
  ConfidenceAdaptationLedgerFoundation,
  ConfidenceAdaptationLedgerInput,
  ConfidenceAdaptationLedgerRecord,
  ConfidenceAdaptationLedgerRegistry,
  ConfidenceAdaptationLedgerResult,
  ConfidenceAdaptationLedgerValidation,
  ConfidenceCalibrationLineage,
  ConfidenceCertificationRecord,
  ConfidenceLedgerEventType,
  ConfidencePatternCategory,
  ConfidenceReplayRecord,
  ConfidenceRollbackRecord,
} from "@/types/confidence-adaptation-ledger";

const CONFIDENCE_LEDGER_VERSION = "confidence-adaptation-ledger/v1" as const;
const LEDGER_TIMESTAMP = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<ConfidenceAdaptationLedgerInput["scenario"]>;

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

function buildApiSurface(): ConfidenceAdaptationLedgerApiSurface {
  const base: Omit<ConfidenceAdaptationLedgerApiSurface, "integrity_hash"> = {
    api_id: "confidence_adaptation_ledger_api",
    record_ledger: "POST /confidence-adaptation-ledger/analyze",
    retrieve_records: "POST /confidence-adaptation-ledger/records",
    retrieve_proposal_history: "POST /confidence-adaptation-ledger/proposal-history",
    retrieve_governance: "POST /confidence-adaptation-ledger/governance",
    retrieve_simulation: "POST /confidence-adaptation-ledger/simulation",
    retrieve_lineage: "POST /confidence-adaptation-ledger/lineage",
    retrieve_replay_lineage: "POST /confidence-adaptation-ledger/replay-lineage",
    retrieve_certification: "POST /confidence-adaptation-ledger/certification",
    retrieve_rollback: "POST /confidence-adaptation-ledger/rollback",
    retrieve_patterns: "POST /confidence-adaptation-ledger/patterns",
    retrieve_registry: "POST /confidence-adaptation-ledger/registry",
    verify_ledger: "POST /confidence-adaptation-ledger/verify",
    replay_analysis: "POST /confidence-adaptation-ledger/replay",
    retrieve_contract: "GET /confidence-adaptation-ledger/contract",
    update_supported: false,
    delete_supported: false,
    production_confidence_mutation_supported: false,
    model_update_supported: false,
    historical_record_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function allPatterns(): readonly ConfidencePatternCategory[] {
  return freezeArray(["OVERCONFIDENCE", "UNDERCONFIDENCE", "FALSE_CERTAINTY", "FALSE_CAUTION", "EVIDENCE_INFLATION", "EVIDENCE_INSUFFICIENCY", "UNKNOWN_UNCERTAINTY", "PREDICTION_INSTABILITY", "MISSION_SPECIFIC_BIAS", "OPERATOR_SPECIFIC_CONFIDENCE_BEHAVIOR", "DOMAIN_SPECIFIC_CALIBRATION_DRIFT", "CONFIDENCE_SATURATION", "CONFIDENCE_COLLAPSE"]);
}

function eventTypesFor(scenario: Scenario): readonly ConfidenceLedgerEventType[] {
  if (scenario === "ROLLBACK") return freezeArray(["PROPOSAL_CREATED", "ROLLBACK_PLAN_RECORDED", "OPERATOR_DECISION_RECORDED"]);
  if (scenario === "CERTIFIED") return freezeArray(["PROPOSAL_CREATED", "GOVERNANCE_REVIEW_RECORDED", "SIMULATION_RECORDED", "REPLAY_VALIDATED", "OPERATOR_DECISION_RECORDED", "CERTIFICATION_DECISION_RECORDED"]);
  return freezeArray(["PROPOSAL_CREATED", "GOVERNANCE_REVIEW_RECORDED", "SIMULATION_RECORDED", "REPLAY_VALIDATED", "OPERATOR_DECISION_RECORDED", "ROLLBACK_PLAN_RECORDED"]);
}

function buildLedgerRecords(scenario: Scenario, proposalId: string, proposalTenant: string): readonly ConfidenceAdaptationLedgerRecord[] {
  const proposal_id = scenario === "MISSING_PROPOSAL" ? "" : proposalId;
  const evidence_refs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["evidence_ref_confidence_ledger_1"]);
  const governance_refs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_confidence_ledger_1"]);
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_ledger_1"]);
  return freezeArray(eventTypesFor(scenario).map((event, index) => {
    const base: Omit<ConfidenceAdaptationLedgerRecord, "integrity_hash"> = {
      ledger_record_id: `confidence_ledger_${hash(`${scenario}:${proposal_id}:${event}`).slice(0, 16)}`,
      proposal_id,
      tenant_id: scenario === "CROSS_TENANT" && index === 0 ? "tenant_mission_control:foreign" : proposalTenant,
      mission_scope: "mission_scope_confidence_adaptation",
      ledger_event_type: event,
      event_timestamp: LEDGER_TIMESTAMP,
      proposal_version: "v1",
      governance_status: event === "GOVERNANCE_REVIEW_RECORDED" ? "REQUIRED" : "RECORDED",
      operator_status: event === "OPERATOR_DECISION_RECORDED" ? "OPERATOR_APPROVAL_REQUIRED" : "PENDING",
      simulation_status: event === "SIMULATION_RECORDED" ? "PENDING" : "ARCHIVED",
      certification_status: scenario === "CERTIFIED" ? "CERTIFIED" : event === "CERTIFICATION_DECISION_RECORDED" ? "PENDING_REVIEW" : "SIMULATION_REQUIRED",
      rollback_status: event === "ROLLBACK_PLAN_RECORDED" ? "PLANNED" : "NOT_REQUIRED",
      evidence_refs,
      governance_refs,
      replay_refs,
      append_only: true,
      immutable: true,
      updated: scenario === "LEDGER_UPDATE" && index === 0,
      deleted: scenario === "LEDGER_DELETE" && index === 0,
      advisory_only: true,
      modifies_production_confidence: false,
      updates_confidence_model: false,
      mutates_historical_records: false,
    };
    const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "MISSING_INTEGRITY" && index === 0) return Object.freeze({ ...record, integrity_hash: "" });
    if (scenario === "PRODUCTION_MUTATION" && index === 0) return Object.freeze({ ...record, modifies_production_confidence: true as false });
    if (scenario === "MODEL_UPDATE" && index === 0) return Object.freeze({ ...record, updates_confidence_model: true as false });
    if (scenario === "HISTORICAL_RECORD_MUTATION" && index === 0) return Object.freeze({ ...record, mutates_historical_records: true as false });
    return record;
  }));
}

function buildLineage(scenario: Scenario, proposalId: string): ConfidenceCalibrationLineage {
  const base: Omit<ConfidenceCalibrationLineage, "integrity_hash"> = {
    lineage_id: `confidence_calibration_lineage_${hash(proposalId).slice(0, 14)}`,
    proposal_id: scenario === "MISSING_PROPOSAL" ? "" : proposalId,
    parent_proposal_id: scenario === "BROKEN_LINEAGE" ? null : "parent_confidence_proposal_1",
    child_proposal_ids: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["child_confidence_proposal_1"]),
    calibration_version: "confidence-calibration-v1",
    superseded_by: null,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_lineage_1"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayRecord(scenario: Scenario, proposalId: string): ConfidenceReplayRecord {
  const replayRefs = scenario === "REPLAY_BYPASS" || scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["historical_confidence_ref_1"]);
  const base: Omit<ConfidenceReplayRecord, "integrity_hash"> = {
    replay_record_id: `confidence_replay_record_${hash(proposalId).slice(0, 14)}`,
    proposal_id: proposalId,
    replay_version: "v1",
    historical_confidence_refs: replayRefs,
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["evidence_ref_confidence_replay_1"]),
    outcome_refs: freezeArray(["outcome_ref_confidence_replay_1"]),
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_confidence_replay_1"]),
    simulation_refs: freezeArray(["simulation_ref_confidence_replay_1"]),
    approval_refs: scenario === "OPERATOR_APPROVAL_BYPASS" ? freezeArray([]) : freezeArray(["approval_ref_operator_1"]),
    replay_verification_status: replayRefs.length ? "VERIFIED" : "FAILED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertificationRecord(scenario: Scenario, proposalId: string): ConfidenceCertificationRecord {
  const reviewer_refs = scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : freezeArray(["reviewer_ref_governance_1"]);
  const base: Omit<ConfidenceCertificationRecord, "integrity_hash"> = {
    certification_id: `confidence_certification_${hash(proposalId).slice(0, 14)}`,
    proposal_id: proposalId,
    certification_status: scenario === "REJECTED" ? "REJECTED" : scenario === "CERTIFIED" ? "CERTIFIED" : "SIMULATION_REQUIRED",
    certification_version: "v1",
    reviewer_refs,
    simulation_result: scenario === "HIGH_RISK" ? "PENDING" : "PASSED",
    replay_result: scenario === "REPLAY_BYPASS" ? "FAILED" : "VERIFIED",
    approval_result: scenario === "OPERATOR_APPROVAL_BYPASS" ? "PENDING" : "APPROVED",
    certification_timestamp: LEDGER_TIMESTAMP,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_certification_1"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRollbackRecord(scenario: Scenario, proposalId: string): ConfidenceRollbackRecord {
  const base: Omit<ConfidenceRollbackRecord, "integrity_hash"> = {
    rollback_id: `confidence_rollback_${hash(proposalId).slice(0, 14)}`,
    proposal_id: proposalId,
    rollback_plan: scenario === "MISSING_ROLLBACK" ? "" : "Rollback to last certified confidence calibration and preserve audit lineage.",
    rollback_triggers: scenario === "MISSING_ROLLBACK" ? freezeArray([]) : freezeArray(["simulation_regression", "operator_rejection"]),
    rollback_approvals: scenario === "MISSING_ROLLBACK" ? freezeArray([]) : freezeArray(["governance_rollback_approval_1"]),
    rollback_status: scenario === "ROLLBACK" ? "APPROVED" : "PLANNED",
    recovery_validation_refs: scenario === "MISSING_ROLLBACK" ? freezeArray([]) : freezeArray(["recovery_validation_ref_1"]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_rollback_1"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(records: readonly ConfidenceAdaptationLedgerRecord[], lineage: ConfidenceCalibrationLineage, replay: ConfidenceReplayRecord, certification: ConfidenceCertificationRecord, rollback: ConfidenceRollbackRecord, scenario: Scenario): ConfidenceAdaptationLedgerRegistry {
  const events: ConfidenceLedgerEventType[] = ["PROPOSAL_CREATED", "GOVERNANCE_REVIEW_RECORDED", "SIMULATION_RECORDED", "REPLAY_VALIDATED", "OPERATOR_DECISION_RECORDED", "CERTIFICATION_DECISION_RECORDED", "ROLLBACK_PLAN_RECORDED", "IMPLEMENTATION_DECISION_RECORDED"];
  const patterns: readonly ConfidencePatternCategory[] = scenario === "ALL_PATTERNS" ? allPatterns() : freezeArray(["OVERCONFIDENCE", "EVIDENCE_INSUFFICIENCY", "CONFIDENCE_SATURATION", "CONFIDENCE_COLLAPSE"]);
  const event_index = events.reduce((index, event) => ({ ...index, [event]: freezeArray(records.filter((record) => record.ledger_event_type === event).map((record) => record.ledger_record_id)) }), {} as Record<ConfidenceLedgerEventType, readonly string[]>);
  const pattern_index = allPatterns().reduce((index, pattern) => ({ ...index, [pattern]: patterns.includes(pattern) ? records.map((record) => record.ledger_record_id) : freezeArray([]) }), {} as Record<ConfidencePatternCategory, readonly string[]>);
  const base: Omit<ConfidenceAdaptationLedgerRegistry, "integrity_hash"> = {
    registry_id: `confidence_adaptation_ledger_registry_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    ledger_record_refs: records.map((record) => record.ledger_record_id),
    lineage_refs: freezeArray([lineage.lineage_id]),
    replay_record_refs: freezeArray([replay.replay_record_id]),
    certification_record_refs: freezeArray([certification.certification_id]),
    rollback_record_refs: freezeArray([rollback.rollback_id]),
    preserved_patterns: patterns,
    event_index: Object.freeze(event_index),
    pattern_index: Object.freeze(pattern_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(records: readonly ConfidenceAdaptationLedgerRecord[], lineage: ConfidenceCalibrationLineage, replay: ConfidenceReplayRecord, certification: ConfidenceCertificationRecord, rollback: ConfidenceRollbackRecord, registry: ConfidenceAdaptationLedgerRegistry, scenario: Scenario): readonly ConfidenceAdaptationLedgerFailure[] {
  const failures: ConfidenceAdaptationLedgerFailure[] = [];
  if (scenario === "MISSING_PROPOSAL" || records.some((record) => !record.proposal_id) || !lineage.proposal_id) failures.push("PROPOSAL_REFERENCE_MISSING");
  if (scenario === "MISSING_EVIDENCE" || records.some((record) => record.evidence_refs.length === 0) || replay.evidence_refs.length === 0) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || records.some((record) => record.governance_refs.length === 0) || replay.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCE_MISSING");
  if (scenario === "MISSING_REPLAY" || records.some((record) => record.replay_refs.length === 0) || lineage.replay_refs.length === 0 || replay.replay_verification_status !== "VERIFIED" || certification.replay_refs.length === 0 || rollback.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_INTEGRITY" || records.some((record) => !record.integrity_hash)) failures.push("INTEGRITY_HASH_MISSING");
  if (scenario === "BROKEN_LINEAGE" || !lineage.parent_proposal_id || lineage.child_proposal_ids.length === 0) failures.push("LINEAGE_CHAIN_INCOMPLETE");
  if (scenario === "MISSING_CERTIFICATION" || certification.reviewer_refs.length === 0) failures.push("CERTIFICATION_HISTORY_MISSING");
  if (scenario === "MISSING_ROLLBACK" || !rollback.rollback_plan || rollback.rollback_approvals.length === 0) failures.push("ROLLBACK_HISTORY_MISSING");
  if (scenario === "CROSS_TENANT" || records.some((record) => record.tenant_id !== registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "LEDGER_UPDATE" || records.some((record) => record.updated)) failures.push("LEDGER_UPDATE_DETECTED");
  if (scenario === "LEDGER_DELETE" || records.some((record) => record.deleted)) failures.push("LEDGER_DELETE_DETECTED");
  if (scenario === "PRODUCTION_MUTATION" || records.some((record) => record.modifies_production_confidence)) failures.push("PRODUCTION_CONFIDENCE_MUTATION_DETECTED");
  if (scenario === "MODEL_UPDATE" || records.some((record) => record.updates_confidence_model)) failures.push("CONFIDENCE_MODEL_UPDATE_DETECTED");
  if (scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS_DETECTED");
  if (scenario === "REPLAY_BYPASS" || replay.replay_verification_status !== "VERIFIED") failures.push("REPLAY_BYPASS_DETECTED");
  if (scenario === "OPERATOR_APPROVAL_BYPASS" || replay.approval_refs.length === 0) failures.push("OPERATOR_APPROVAL_BYPASS_DETECTED");
  if (scenario === "AUDIT_DISABLED") failures.push("AUDIT_LOGGING_DISABLED");
  if (scenario === "HISTORICAL_RECORD_MUTATION" || records.some((record) => record.mutates_historical_records)) failures.push("HISTORICAL_RECORD_MUTATION_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_LEDGER_RECORDING");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(records: readonly ConfidenceAdaptationLedgerRecord[], lineage: ConfidenceCalibrationLineage, replay: ConfidenceReplayRecord, certification: ConfidenceCertificationRecord, rollback: ConfidenceRollbackRecord, registry: ConfidenceAdaptationLedgerRegistry, failures: readonly ConfidenceAdaptationLedgerFailure[]): ConfidenceAdaptationLedgerValidation {
  const recordsVerified = records.every((record) => record.integrity_hash && hashWithoutIntegrity(record) === record.integrity_hash);
  const integrityVerified = recordsVerified && hashWithoutIntegrity(lineage) === lineage.integrity_hash && hashWithoutIntegrity(replay) === replay.integrity_hash && hashWithoutIntegrity(certification) === certification.integrity_hash && hashWithoutIntegrity(rollback) === rollback.integrity_hash && hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<ConfidenceAdaptationLedgerValidation, "integrity_hash"> = {
    validation_id: "confidence_adaptation_ledger_validation",
    state: failures.includes("REPLAY_REFERENCES_MISSING") ? "PENDING_REPLAY" : failures.length ? "FAILED" : "VERIFIED",
    verified: failures.length === 0 && integrityVerified,
    failures,
    proposal_referenced: !failures.includes("PROPOSAL_REFERENCE_MISSING"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCE_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    integrity_complete: !failures.includes("INTEGRITY_HASH_MISSING"),
    lineage_complete: !failures.includes("LINEAGE_CHAIN_INCOMPLETE"),
    certification_complete: !failures.includes("CERTIFICATION_HISTORY_MISSING"),
    rollback_complete: !failures.includes("ROLLBACK_HISTORY_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_LEDGER_RECORDING"),
    append_only: records.every((record) => record.append_only && !record.updated),
    immutable: records.every((record) => record.immutable && !record.deleted) && registry.immutable && !registry.deleted,
    audit_logging_enabled: !failures.includes("AUDIT_LOGGING_DISABLED"),
    advisory_only: records.every((record) => record.advisory_only),
    no_production_confidence_mutation: records.every((record) => !record.modifies_production_confidence),
    no_model_update: records.every((record) => !record.updates_confidence_model),
    no_historical_record_mutation: records.every((record) => !record.mutates_historical_records),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ConfidenceAdaptationLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({ ledger_records: result.ledger_records, calibration_lineage: result.calibration_lineage, replay_record: result.replay_record, certification_record: result.certification_record, rollback_record: result.rollback_record, registry: result.registry, validation: result.validation });
}

function resultIntegrityHash(result: Omit<ConfidenceAdaptationLedgerResult, "integrity_hash">): string {
  return hash({
    confidence_adaptation_ledger_version: result.confidence_adaptation_ledger_version,
    api_surface_hash: result.api_surface.integrity_hash,
    ledger_hashes: result.ledger_records.map((record) => record.integrity_hash),
    lineage_hash: result.calibration_lineage.integrity_hash,
    replay_hash_record: result.replay_record.integrity_hash,
    certification_hash: result.certification_record.integrity_hash,
    rollback_hash: result.rollback_record.integrity_hash,
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function recordConfidenceAdaptationLedger(input: ConfidenceAdaptationLedgerInput = {}): ConfidenceAdaptationLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const proposalResult = input.proposal_result ?? generateConfidenceAdaptationProposal();
  const proposal = proposalResult.proposals[0];
  const proposalId = proposal?.proposal_id ?? "proposal_ref_missing";
  const tenantId = proposal?.tenant_id ?? "tenant_mission_control";
  const api_surface = buildApiSurface();
  const ledger_records = buildLedgerRecords(scenario, proposalId, tenantId);
  const calibration_lineage = buildLineage(scenario, proposalId);
  const replay_record = buildReplayRecord(scenario, proposalId);
  const certification_record = buildCertificationRecord(scenario, proposalId);
  const rollback_record = buildRollbackRecord(scenario, proposalId);
  const registry = buildRegistry(ledger_records, calibration_lineage, replay_record, certification_record, rollback_record, scenario);
  const failures = collectFailures(ledger_records, calibration_lineage, replay_record, certification_record, rollback_record, registry, scenario);
  const validation = buildValidation(ledger_records, calibration_lineage, replay_record, certification_record, rollback_record, registry, failures);
  const base: Omit<ConfidenceAdaptationLedgerResult, "integrity_hash" | "replay_hash"> = {
    confidence_adaptation_ledger_version: CONFIDENCE_LEDGER_VERSION,
    api_surface,
    ledger_records,
    calibration_lineage,
    replay_record,
    certification_record,
    rollback_record,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    audit_ready: validation.verified,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    append_only: true,
    immutable: true,
    modifies_production_confidence: false,
    updates_confidence_model: false,
    mutates_historical_records: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayConfidenceAdaptationLedger(result: ConfidenceAdaptationLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getConfidenceAdaptationLedgerFoundation(): ConfidenceAdaptationLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    confidence_adaptation_ledger_version: CONFIDENCE_LEDGER_VERSION,
    api_surface,
    result: recordConfidenceAdaptationLedger(),
  });
}

export const ConfidenceAdaptationLedger = Object.freeze({
  record: recordConfidenceAdaptationLedger,
  replay: replayConfidenceAdaptationLedger,
});
