import { runOutcomeObservationEngine } from "@/services/outcome-observation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeObservationEngineResult } from "@/types/outcome-observation-engine";
import type {
  OutcomeEvidenceAuditReport,
  OutcomeEvidenceLedgerRecord,
  OutcomeEvidenceLifecycleState,
  OutcomeEvidenceLineage,
  OutcomeEvidenceLink,
  OutcomeEvidenceLinkType,
  OutcomeEvidenceMetrics,
  OutcomeEvidenceRecord,
  OutcomeEvidenceRegistryCheck,
  OutcomeEvidenceRegistryFailure,
  OutcomeEvidenceRegistryFoundation,
  OutcomeEvidenceRegistryInput,
  OutcomeEvidenceRegistryResult,
  OutcomeEvidenceRelationshipIndex,
  OutcomeEvidenceReplayIndex,
  OutcomeEvidenceType,
  OutcomeEvidenceValidation,
} from "@/types/outcome-evidence-registry";

const OUTCOME_EVIDENCE_REGISTRY_VERSION = "outcome-evidence-registry/v1" as const;

export const OUTCOME_EVIDENCE_TYPES: readonly OutcomeEvidenceType[] = Object.freeze(["OPERATIONAL_REPORT", "OPERATOR_EVIDENCE", "GOVERNANCE_EVIDENCE", "MISSION_EVIDENCE", "ROLLBACK_EVIDENCE", "AUDIT_REFERENCE", "SIMULATION_REFERENCE", "EXTERNAL_VERIFIED_EVIDENCE"]);
export const OUTCOME_EVIDENCE_REGISTRY_CHECKS: readonly OutcomeEvidenceRegistryCheck[] = Object.freeze(["OBSERVATION_VALIDATION", "EVIDENCE_IDENTITY", "EVIDENCE_SOURCE", "EVIDENCE_EXISTENCE", "EVIDENCE_LINKING", "EVIDENCE_LINEAGE", "EVIDENCE_INTEGRITY", "GOVERNANCE_TRACEABILITY", "REPLAY_RECONSTRUCTION", "RELATIONSHIP_DETERMINISM", "LEDGER_IMMUTABILITY", "TENANT_ISOLATION", "CONSTITUTIONAL_GOVERNANCE"]);
export const OUTCOME_EVIDENCE_LIFECYCLE: readonly OutcomeEvidenceLifecycleState[] = Object.freeze(["DISCOVERED", "REGISTERED", "VALIDATED", "LINKED", "RECORDED", "REPLAYABLE"]);

type Scenario = NonNullable<OutcomeEvidenceRegistryInput["scenario"]>;

const APPROVED_SOURCES = Object.freeze(["mission_control.outcome_observation", "mission_control.operator_workflow", "mission_control.governance", "mission_control.mission_telemetry", "mission_control.rollback", "mission_control.truth_ledger", "mission_control.simulation", "approved_external.system"]);

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

function state(pass: boolean): "PASS" | "FAIL" {
  return pass ? "PASS" : "FAIL";
}

function sourceForScenario(input: OutcomeEvidenceRegistryInput, scenario: Scenario): OutcomeObservationEngineResult {
  if (input.observation_engine) return input.observation_engine;
  if (scenario === "INVALID_OBSERVATION" || scenario === "NO_EVIDENCE") return runOutcomeObservationEngine({ scenario: "INCOMPLETE_EVIDENCE" });
  if (scenario === "MISSING_REPLAY") return runOutcomeObservationEngine({ scenario: "MISSING_REPLAY" });
  if (scenario === "MISSING_GOVERNANCE" || scenario === "CONSTITUTIONAL_BYPASS") return runOutcomeObservationEngine({ scenario: "MISSING_GOVERNANCE" });
  if (scenario === "TENANT_VIOLATION") return runOutcomeObservationEngine({ scenario: "TENANT_VIOLATION" });
  if (scenario === "INTEGRITY_FAILURE") return runOutcomeObservationEngine({ scenario: "HASH_MISMATCH" });
  return runOutcomeObservationEngine();
}

function visibleToRole(source: OutcomeObservationEngineResult, role: VisibilityRole): boolean {
  return source.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function typeForScenario(scenario: Scenario, ref: string, index: number): OutcomeEvidenceType {
  if (OUTCOME_EVIDENCE_TYPES.includes(scenario as OutcomeEvidenceType)) return scenario as OutcomeEvidenceType;
  if (ref.includes("operator") || index === 1) return "OPERATOR_EVIDENCE";
  if (ref.includes("governance") || index === 2) return "GOVERNANCE_EVIDENCE";
  if (ref.includes("rollback") || index === 3) return "ROLLBACK_EVIDENCE";
  if (ref.includes("audit") || ref.includes("ledger") || index === 4) return "AUDIT_REFERENCE";
  if (ref.includes("mission") || index === 5) return "MISSION_EVIDENCE";
  return "OPERATIONAL_REPORT";
}

function sourceForType(type: OutcomeEvidenceType, scenario: Scenario): string {
  if (scenario === "UNAUTHORIZED_SOURCE") return "unapproved.external.system";
  if (type === "OPERATOR_EVIDENCE") return "mission_control.operator_workflow";
  if (type === "GOVERNANCE_EVIDENCE") return "mission_control.governance";
  if (type === "MISSION_EVIDENCE") return "mission_control.mission_telemetry";
  if (type === "ROLLBACK_EVIDENCE") return "mission_control.rollback";
  if (type === "AUDIT_REFERENCE") return "mission_control.truth_ledger";
  if (type === "SIMULATION_REFERENCE") return "mission_control.simulation";
  if (type === "EXTERNAL_VERIFIED_EVIDENCE") return "approved_external.system";
  return "mission_control.outcome_observation";
}

function evidenceRefs(source: OutcomeObservationEngineResult, scenario: Scenario): readonly string[] {
  if (scenario === "NO_EVIDENCE" || scenario === "MISSING_REFERENCE") return freezeArray([]);
  return source.observation_record.actual_outcome_evidence_refs.length ? source.observation_record.actual_outcome_evidence_refs : freezeArray(["outcome-evidence:missing"]);
}

function buildEvidenceRecords(source: OutcomeObservationEngineResult, scenario: Scenario): readonly OutcomeEvidenceRecord[] {
  const refs = evidenceRefs(source, scenario);
  return freezeArray(refs.map((ref, index) => {
    const evidence_type = typeForScenario(scenario, ref, index);
    const idSeed = scenario === "DUPLICATE_EVIDENCE_ID" ? "duplicate" : `${source.observation_record.outcome_id}:${ref}:${evidence_type}`;
    const base: Omit<OutcomeEvidenceRecord, "integrity_hash"> = {
      evidence_id: `evidence_${hash(idSeed).slice(0, 16)}`,
      tenant_id: scenario === "TENANT_VIOLATION" && index === 0 ? `${source.observation_record.tenant_id}:foreign` : source.observation_record.tenant_id,
      mission_id: source.observation_record.mission_id,
      outcome_id: scenario === "ORPHAN_EVIDENCE" && index === 0 ? "orphan-outcome" : source.observation_record.outcome_id,
      decision_id: source.observation_record.decision_id,
      evidence_type,
      evidence_source: sourceForType(evidence_type, scenario),
      source_record_id: ref,
      observation_timestamp: source.observation_record.observed_timestamp,
      evidence_summary: scenario === "INFERRED_EVIDENCE" ? "Inferred evidence placeholder." : `${evidence_type.toLowerCase()} reference for observed outcome ${source.observation_record.outcome_id}`,
      evidence_refs: scenario === "MISSING_REFERENCE" ? freezeArray([]) : freezeArray([ref]),
      governance_refs: scenario === "MISSING_GOVERNANCE" || scenario === "CONSTITUTIONAL_BYPASS" ? freezeArray([]) : source.observation_record.governance_refs,
      replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : source.observation_record.replay_refs,
      lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray([source.observation_record.decision_id, source.observation_record.outcome_id, ref]),
      immutable_reference: true,
      original_evidence_altered: false,
    };
    const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "INTEGRITY_FAILURE" && index === 0) return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.evidence_id }) });
    if (scenario === "MODIFIED_AFTER_REGISTRATION" && index === 0) return Object.freeze({ ...built, evidence_summary: "Modified after registration.", integrity_hash: built.integrity_hash });
    if (scenario === "ORIGINAL_EVIDENCE_ALTERED" && index === 0) return Object.freeze({ ...built, original_evidence_altered: true as false, integrity_hash: built.integrity_hash });
    return built;
  }));
}

function link(link_type: OutcomeEvidenceLinkType, evidence_id: string, source_ref: string, target_ref: string, deterministic_order: number): OutcomeEvidenceLink {
  const base: Omit<OutcomeEvidenceLink, "integrity_hash"> = { link_id: `${link_type.toLowerCase()}_${deterministic_order}`, link_type, evidence_id, source_ref, target_ref, deterministic_order };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRelationshipIndex(source: OutcomeObservationEngineResult, records: readonly OutcomeEvidenceRecord[], scenario: Scenario): OutcomeEvidenceRelationshipIndex {
  const orderOffset = scenario === "NONDETERMINISTIC_RELATIONSHIP" ? 10 : 0;
  const outcome_links = freezeArray(records.map((record, index) => link("OUTCOME_TO_EVIDENCE", record.evidence_id, source.observation_record.outcome_id, record.source_record_id, index + orderOffset)));
  const decision_links = freezeArray(records.map((record, index) => link("DECISION_TO_EVIDENCE", record.evidence_id, source.observation_record.decision_id, record.source_record_id, index)));
  const mission_links = freezeArray(records.map((record, index) => link("MISSION_TO_EVIDENCE", record.evidence_id, source.observation_record.mission_id, record.source_record_id, index)));
  const operator_links = freezeArray(records.map((record, index) => link("OPERATOR_TO_EVIDENCE", record.evidence_id, source.observation_record.operator_workflow_id, record.source_record_id, index)));
  const governance_links = freezeArray(records.flatMap((record, index) => record.governance_refs.map((ref, refIndex) => link("GOVERNANCE_TO_EVIDENCE", record.evidence_id, ref, record.source_record_id, index + refIndex))));
  const rollback_links = freezeArray(records.map((record, index) => link("ROLLBACK_TO_EVIDENCE", record.evidence_id, source.observation_record.rollback_result, record.source_record_id, index)));
  const replay_links = freezeArray(records.flatMap((record, index) => record.replay_refs.map((ref, refIndex) => link("REPLAY_TO_EVIDENCE", record.evidence_id, ref, record.source_record_id, index + refIndex))));
  const truth_ledger_links = freezeArray(records.map((record, index) => link("TRUTH_LEDGER_TO_EVIDENCE", record.evidence_id, source.observation_ledger[0]?.ledger_id ?? "missing-ledger", record.source_record_id, index)));
  const base: Omit<OutcomeEvidenceRelationshipIndex, "integrity_hash"> = {
    index_id: "outcome_evidence_relationship_index",
    outcome_links,
    decision_links,
    mission_links,
    operator_links,
    governance_links,
    rollback_links,
    replay_links,
    truth_ledger_links,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineage(records: readonly OutcomeEvidenceRecord[], scenario: Scenario): readonly OutcomeEvidenceLineage[] {
  return freezeArray(records.map((record) => {
    const base: Omit<OutcomeEvidenceLineage, "integrity_hash"> = {
      lineage_id: `lineage_${record.evidence_id}`,
      evidence_id: record.evidence_id,
      parent_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray([record.decision_id, record.outcome_id]),
      child_refs: freezeArray([record.source_record_id]),
      supporting_refs: record.evidence_refs,
      conflicting_refs: freezeArray([]),
      replay_refs: record.replay_refs,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function collectFailures(input: {
  source: OutcomeObservationEngineResult;
  records: readonly OutcomeEvidenceRecord[];
  relationships: OutcomeEvidenceRelationshipIndex;
  lineage: readonly OutcomeEvidenceLineage[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeEvidenceRegistryFailure[] {
  const failures: OutcomeEvidenceRegistryFailure[] = [];
  const ids = input.records.map((record) => record.evidence_id);
  if (input.source.validation.validation_status !== "VALID" || input.scenario === "INVALID_OBSERVATION") failures.push("OBSERVATION_NOT_VALIDATED");
  if (!input.records.length || input.scenario === "NO_EVIDENCE") failures.push("OUTCOME_ACCEPTED_WITHOUT_EVIDENCE");
  if (input.records.some((record) => !record.evidence_refs.length) || input.scenario === "MISSING_REFERENCE") failures.push("EVIDENCE_REFERENCE_MISSING");
  if (new Set(ids).size !== ids.length || input.scenario === "DUPLICATE_EVIDENCE_ID") failures.push("DUPLICATE_EVIDENCE_ID_ACCEPTED");
  if (input.records.some((record) => !APPROVED_SOURCES.includes(record.evidence_source)) || input.scenario === "UNAUTHORIZED_SOURCE") failures.push("UNAUTHORIZED_EVIDENCE_SOURCE_ACCEPTED");
  if (input.records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || input.lineage.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash) || input.scenario === "INTEGRITY_FAILURE") failures.push("EVIDENCE_INTEGRITY_VERIFICATION_FAILED");
  if (input.records.some((record) => !record.replay_refs.length) || input.scenario === "MISSING_REPLAY") failures.push("REPLAY_REFERENCES_MISSING");
  if (input.records.some((record) => !record.governance_refs.length) || input.scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_LINEAGE_INCOMPLETE");
  if (input.lineage.some((entry) => !entry.parent_refs.length || !entry.supporting_refs.length || !entry.replay_refs.length) || input.scenario === "BROKEN_LINEAGE") failures.push("LINEAGE_GRAPH_BROKEN");
  if (input.scenario === "NONDETERMINISTIC_RELATIONSHIP" || input.relationships.outcome_links.some((entry, index) => entry.deterministic_order !== index)) failures.push("EVIDENCE_RELATIONSHIP_NONDETERMINISTIC");
  if (input.scenario === "MODIFIED_AFTER_REGISTRATION") failures.push("EVIDENCE_MODIFIED_AFTER_REGISTRATION");
  if (input.records.some((record) => record.tenant_id !== input.source.observation_record.tenant_id) || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATED");
  if (input.records.some((record) => record.outcome_id !== input.source.observation_record.outcome_id) || input.scenario === "ORPHAN_EVIDENCE") failures.push("ORPHAN_EVIDENCE_RECORD_CREATED");
  if (input.records.some((record) => record.evidence_summary.toLowerCase().includes("inferred")) || input.scenario === "INFERRED_EVIDENCE") failures.push("EVIDENCE_INFERRED");
  if (input.scenario === "ORIGINAL_EVIDENCE_ALTERED" || input.records.some((record) => record.original_evidence_altered)) failures.push("ORIGINAL_EVIDENCE_ALTERED");
  if (input.scenario === "CONSTITUTIONAL_BYPASS") failures.push("CONSTITUTIONAL_GOVERNANCE_BYPASSED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_EVIDENCE_REGISTRY_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly OutcomeEvidenceRegistryFailure[]): OutcomeEvidenceValidation {
  const has = (failure: OutcomeEvidenceRegistryFailure) => failures.includes(failure);
  const base: Omit<OutcomeEvidenceValidation, "integrity_hash"> = {
    validation_id: "outcome_evidence_registry_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    identity_valid: !has("DUPLICATE_EVIDENCE_ID_ACCEPTED") && !has("ORPHAN_EVIDENCE_RECORD_CREATED"),
    source_valid: !has("UNAUTHORIZED_EVIDENCE_SOURCE_ACCEPTED"),
    evidence_exists: !has("OUTCOME_ACCEPTED_WITHOUT_EVIDENCE") && !has("EVIDENCE_REFERENCE_MISSING"),
    evidence_not_inferred: !has("EVIDENCE_INFERRED"),
    integrity_valid: !has("EVIDENCE_INTEGRITY_VERIFICATION_FAILED"),
    governance_valid: !has("GOVERNANCE_LINEAGE_INCOMPLETE") && !has("CONSTITUTIONAL_GOVERNANCE_BYPASSED"),
    replay_valid: !has("REPLAY_REFERENCES_MISSING"),
    lineage_complete: !has("LINEAGE_GRAPH_BROKEN"),
    relationships_deterministic: !has("EVIDENCE_RELATIONSHIP_NONDETERMINISTIC"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    immutable_after_registration: !has("EVIDENCE_MODIFIED_AFTER_REGISTRATION"),
    original_evidence_preserved: !has("ORIGINAL_EVIDENCE_ALTERED"),
    constitutional_governance_preserved: !has("CONSTITUTIONAL_GOVERNANCE_BYPASSED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayIndex(records: readonly OutcomeEvidenceRecord[], lineage: readonly OutcomeEvidenceLineage[]): OutcomeEvidenceReplayIndex {
  const reconstruction_order = freezeArray(records.map((record) => record.evidence_id).sort());
  const base: Omit<OutcomeEvidenceReplayIndex, "integrity_hash"> = {
    replay_index_id: "outcome_evidence_replay_index",
    evidence_ids: freezeArray(records.map((record) => record.evidence_id)),
    replay_refs: freezeArray([...new Set(records.flatMap((record) => record.replay_refs))]),
    lineage_refs: freezeArray(lineage.map((entry) => entry.lineage_id)),
    reconstruction_order,
    reconstruction_hash: hash({ reconstruction_order, lineage }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly OutcomeEvidenceRecord[], relationships: OutcomeEvidenceRelationshipIndex, lineage: readonly OutcomeEvidenceLineage[], failures: readonly OutcomeEvidenceRegistryFailure[]): readonly OutcomeEvidenceLedgerRecord[] {
  return freezeArray(records.map((record, index) => {
    const base: Omit<OutcomeEvidenceLedgerRecord, "integrity_hash"> = {
      ledger_id: `outcome_evidence_ledger_${String(index + 1).padStart(3, "0")}`,
      evidence_id: record.evidence_id,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      outcome_id: record.outcome_id,
      lifecycle_state: failures.length ? "VALIDATED" : "REPLAYABLE",
      evidence_hash: record.integrity_hash,
      relationship_hash: relationships.integrity_hash,
      lineage_hash: lineage[index]?.integrity_hash ?? "missing-lineage",
      timestamp: record.observation_timestamp,
      sequence_number: index + 1,
      append_only: true,
      deleted: false,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildMetrics(records: readonly OutcomeEvidenceRecord[], failures: readonly OutcomeEvidenceRegistryFailure[]): OutcomeEvidenceMetrics {
  const has = (failure: OutcomeEvidenceRegistryFailure) => failures.includes(failure);
  const base: Omit<OutcomeEvidenceMetrics, "integrity_hash"> = {
    metrics_id: "outcome_evidence_registry_metrics",
    evidence_records_registered: failures.length ? 0 : records.length,
    evidence_records_rejected: failures.length ? records.length || 1 : 0,
    evidence_by_category: freezeArray(records.map((record) => record.evidence_type)),
    missing_evidence_detections: has("OUTCOME_ACCEPTED_WITHOUT_EVIDENCE") || has("EVIDENCE_REFERENCE_MISSING") ? 1 : 0,
    integrity_validation_failures: has("EVIDENCE_INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    lineage_completeness_score: has("LINEAGE_GRAPH_BROKEN") ? 0 : 1,
    replay_reconstruction_success_rate: has("REPLAY_REFERENCES_MISSING") || has("LINEAGE_GRAPH_BROKEN") ? 0 : 1,
    duplicate_evidence_attempts: has("DUPLICATE_EVIDENCE_ID_ACCEPTED") ? 1 : 0,
    orphan_evidence_attempts: has("ORPHAN_EVIDENCE_RECORD_CREATED") ? 1 : 0,
    registry_processing_latency_ms: 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(validation: OutcomeEvidenceValidation): OutcomeEvidenceAuditReport {
  const base: Omit<OutcomeEvidenceAuditReport, "integrity_hash"> = {
    report_id: "outcome_evidence_registry_audit_report",
    tenant_id: "tenant_mission_control",
    checks: OUTCOME_EVIDENCE_REGISTRY_CHECKS,
    registry_operational: true,
    linker_operational: validation.relationships_deterministic,
    validator_operational: validation.validation_status === "VALID",
    lineage_tracker_operational: validation.lineage_complete,
    relationship_index_operational: validation.relationships_deterministic,
    integrity_manager_operational: validation.integrity_valid,
    replay_index_operational: validation.replay_valid,
    evidence_identities_deterministic: validation.identity_valid,
    evidence_required_for_outcomes: validation.evidence_exists,
    evidence_references_immutable: validation.immutable_after_registration,
    orphan_evidence_prevented: !validation.failures.includes("ORPHAN_EVIDENCE_RECORD_CREATED"),
    original_evidence_unmodified: validation.original_evidence_preserved,
    adaptive_intelligence_ready: validation.validation_status === "VALID",
    failure_analysis: validation.failures,
    certification_decision: state(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeEvidenceRegistryResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    evidence_registry: result.evidence_registry,
    relationship_index: result.relationship_index,
    lineage_tracker: result.lineage_tracker,
    replay_index: result.replay_index,
    validation: result.validation,
    evidence_ledger: result.evidence_ledger,
    audit_report: result.audit_report,
  });
}

export function runOutcomeEvidenceRegistry(input: OutcomeEvidenceRegistryInput = {}): OutcomeEvidenceRegistryResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const observation_engine = sourceForScenario(input, scenario);
  const evidence_registry = buildEvidenceRecords(observation_engine, scenario);
  const relationship_index = buildRelationshipIndex(observation_engine, evidence_registry, scenario);
  const lineage_tracker = buildLineage(evidence_registry, scenario);
  const failures = collectFailures({ source: observation_engine, records: evidence_registry, relationships: relationship_index, lineage: lineage_tracker, role, scenario });
  const replay_index = buildReplayIndex(evidence_registry, lineage_tracker);
  const validation = buildValidation(failures);
  const evidence_ledger = buildLedger(evidence_registry, relationship_index, lineage_tracker, failures);
  const metrics = buildMetrics(evidence_registry, failures);
  const audit_report = buildAudit(validation);
  const lifecycle: readonly OutcomeEvidenceLifecycleState[] = failures.length ? freezeArray<OutcomeEvidenceLifecycleState>(["DISCOVERED", "REGISTERED", "VALIDATED"]) : OUTCOME_EVIDENCE_LIFECYCLE;
  const base: Omit<OutcomeEvidenceRegistryResult, "integrity_hash" | "replay_hash"> = {
    outcome_evidence_registry_version: OUTCOME_EVIDENCE_REGISTRY_VERSION,
    observation_engine,
    evidence_registry,
    relationship_index,
    lineage_tracker,
    replay_index,
    validation,
    evidence_ledger,
    metrics,
    audit_report,
    lifecycle,
    deterministic: true,
    replayable: true,
    registry_only: true,
    creates_evidence: false,
    permits_inference: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeEvidenceRegistry(result: OutcomeEvidenceRegistryResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeEvidenceRegistryHash(record: Omit<OutcomeEvidenceRecord, "integrity_hash"> | OutcomeEvidenceRecord): string {
  return hashWithoutIntegrity(record);
}

export function getOutcomeEvidenceRegistryFoundation(): OutcomeEvidenceRegistryFoundation {
  return Object.freeze({
    outcome_evidence_registry_version: OUTCOME_EVIDENCE_REGISTRY_VERSION,
    checks: OUTCOME_EVIDENCE_REGISTRY_CHECKS,
    evidence_types: OUTCOME_EVIDENCE_TYPES,
    lifecycle: OUTCOME_EVIDENCE_LIFECYCLE,
    result: runOutcomeEvidenceRegistry(),
  });
}

export const OutcomeEvidenceRegistry = Object.freeze({
  run: runOutcomeEvidenceRegistry,
  replay: replayOutcomeEvidenceRegistry,
});
