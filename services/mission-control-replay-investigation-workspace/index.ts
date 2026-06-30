import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runMissionControlGraphVisualizationEngine } from "@/services/mission-control-graph-visualization-engine";
import type {
  AuditExportRecord,
  EvidenceInspectionRecord,
  HistoricalComparisonRecord,
  InvestigationConsoleRecord,
  InvestigationIntegrityHashType,
  InvestigationIntegrityRecord,
  InvestigationLineageRecord,
  InvestigationLineageRelationship,
  InvestigationMode,
  InvestigationReplayMode,
  InvestigationReplayType,
  InvestigationSearchCategory,
  InvestigationSearchRecord,
  InvestigationTimelineEventType,
  InvestigationTimelineRecord,
  InvestigationValidationOutcome,
  ReplayInvestigationFailure,
  ReplayInvestigationScenario,
  ReplayInvestigationValidationTest,
  ReplayInvestigationWorkspaceInput,
  ReplayInvestigationWorkspaceObservabilitySurface,
  ReplayInvestigationWorkspaceReport,
  ReplayInvestigationWorkspaceValidationResult,
  ReplaySessionRecord,
} from "@/types/mission-control-replay-investigation-workspace";

const NOW = "2026-07-01T05:00:00.000Z";
const SCHEMA_VERSION = "mission-control-replay-investigation-workspace/v8J.4" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const EXECUTION_ID = "execution:autonomy:8j4:primary";
const OPERATOR_ID = "operator:mission-control:primary";
const REPLAY_REFERENCE = "replay:investigation-workspace:8j4:primary";
const LINEAGE_REFERENCE = "lineage:investigation-workspace:8j4:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailure(scenario?: ReplayInvestigationScenario): ReplayInvestigationFailure | null {
  const map: Partial<Record<ReplayInvestigationScenario, ReplayInvestigationFailure>> = {
    REPLAY_DIVERGENCE: "REPLAY_RECONSTRUCTION_DIVERGED",
    INTEGRITY_UNVERIFIED: "INTEGRITY_HASH_UNVERIFIED",
    LINEAGE_GAP: "LINEAGE_RELATIONSHIP_MISSING",
    NONDETERMINISTIC_TIMELINE: "TIMELINE_ORDER_NONDETERMINISTIC",
    INCOMPLETE_EVIDENCE: "EVIDENCE_INCOMPLETE",
    GOVERNANCE_HISTORY_GAP: "GOVERNANCE_HISTORY_UNRECONSTRUCTABLE",
    INCONSISTENT_COMPARISON: "HISTORICAL_COMPARISON_INCONSISTENT",
    NONDETERMINISTIC_SEARCH: "SEARCH_RESULTS_NONDETERMINISTIC",
    CROSS_TENANT_HISTORY: "CROSS_TENANT_HISTORY_EXPOSED",
    HISTORY_MUTATION_ATTEMPT: "HISTORICAL_DATA_MUTATION_ATTEMPTED",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    INTEGRITY_VERIFICATION_FAILED: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_HISTORICAL_STATE: "HIDDEN_HISTORICAL_STATE_VISIBLE",
    UNAUTHORIZED_INVESTIGATION_ACCESS: "UNAUTHORIZED_INVESTIGATION_ACCESS",
  };
  return scenario ? map[scenario] ?? null : null;
}

const replayTypes: readonly InvestigationReplayType[] = ["PLANNING_REPLAY", "EXECUTION_REPLAY", "DELEGATION_REPLAY", "ORCHESTRATION_REPLAY", "SUPERVISION_REPLAY", "INTERVENTION_REPLAY"];
const hashTypes: readonly InvestigationIntegrityHashType[] = ["EXECUTION_HASH", "REPLAY_HASH", "PLANNING_HASH", "SUPERVISION_HASH", "DECISION_HASH", "LINEAGE_HASH"];
const relationships: readonly InvestigationLineageRelationship[] = ["PARENT", "CHILD", "DERIVED", "REPLAY", "INTERVENTION", "SUPERVISION", "DEPENDENCY"];
const timelineTypes: readonly InvestigationTimelineEventType[] = ["MISSION_CREATED", "PLAN_GENERATED", "EXECUTION_STARTED", "CHECKPOINT_CREATED", "TASK_COMPLETED", "INTERVENTION_OCCURRED", "POLICY_WARNING", "AUTHORITY_VALIDATION", "ROLLBACK_STARTED", "ROLLBACK_COMPLETED", "MISSION_COMPLETED"];
const searchCategories: readonly InvestigationSearchCategory[] = ["MISSION", "EXECUTION", "PLAN", "TASK", "DECISION", "INTERVENTION", "POLICY", "AUTHORITY", "REPLAY", "LINEAGE", "CHECKPOINT", "ROLLBACK"];

function buildReplaySessions(replay_mode: InvestigationReplayMode, scenario?: ReplayInvestigationScenario): readonly ReplaySessionRecord[] {
  return freezeArray(replayTypes.map((replay_type, index) => {
    const missingReplay = scenario === "MISSING_REPLAY_REFERENCE" && index === 0;
    const diverged = scenario === "REPLAY_DIVERGENCE" && index === 1;
    const source = {
      replay_session_id: id("RIW-RS", "replay-session-id", { replay_type, replay_mode }),
      tenant_id: scenario === "CROSS_TENANT_HISTORY" && index === 2 ? "tenant:other" : TENANT_ID,
      mission_id: MISSION_ID,
      execution_id: EXECUTION_ID,
      replay_type,
      replay_mode,
      replay_state: replay_mode === "COMPARISON" ? "COMPARING" as const : "READY" as const,
      starting_checkpoint: `checkpoint:8j4:start:${index}`,
      ending_checkpoint: `checkpoint:8j4:end:${index}`,
      current_position: index,
      playback_speed: 1,
      controls: freezeArray(["PLAY", "PAUSE", "RESUME", "STEP_FORWARD", "STEP_BACKWARD", "JUMP_TO_CHECKPOINT", "JUMP_TO_INTERVENTION", "JUMP_TO_ROLLBACK", "JUMP_TO_DECISION", "SPEED_SELECTION"]),
      replay_reference: missingReplay ? "" : `${REPLAY_REFERENCE}:${replay_type.toLowerCase()}`,
      lineage_reference: `${LINEAGE_REFERENCE}:replay:${index}`,
      integrity_hash: diverged ? "replay-diverged" : hashValue("investigation-replay-integrity", { replay_type, index }),
      created_at: NOW,
    };
    return Object.freeze({ ...source, replay_hash: hashValue("investigation-replay-session", source) });
  }));
}

function buildIntegrityRecords(scenario?: ReplayInvestigationScenario): readonly InvestigationIntegrityRecord[] {
  return freezeArray(hashTypes.map((hash_type, index) => {
    const missing = scenario === "INTEGRITY_UNVERIFIED" && index === 0;
    const failed = scenario === "INTEGRITY_VERIFICATION_FAILED" && index === 1;
    const source = {
      integrity_record_id: id("RIW-IR", "integrity-record-id", hash_type),
      mission_id: MISSION_ID,
      execution_id: EXECUTION_ID,
      hash_type,
      hash_algorithm: "SHA-256" as const,
      hash_value: missing ? "" : hashValue("investigation-hash-value", { hash_type, index }),
      verification_status: missing ? "MISSING" as const : failed ? "MISMATCH" as const : "VERIFIED" as const,
      verification_timestamp: NOW,
      chain_position: index + 1,
      parent_hash: index === 0 ? null : hashValue("investigation-parent-hash", index - 1),
      replay_reference: scenario === "MISSING_REPLAY_REFERENCE" && index === 0 ? "" : `${REPLAY_REFERENCE}:integrity:${index}`,
      lineage_reference: `${LINEAGE_REFERENCE}:integrity:${index}`,
    };
    return Object.freeze({ ...source, integrity_record_hash: hashValue("investigation-integrity-record", source) });
  }));
}

function buildLineageRecords(scenario?: ReplayInvestigationScenario): readonly InvestigationLineageRecord[] {
  const visibleRelationships = scenario === "LINEAGE_GAP" ? relationships.filter((item) => item !== "SUPERVISION") : relationships;
  return freezeArray(visibleRelationships.map((relationship_type, index) => {
    const source = {
      lineage_record_id: id("RIW-LR", "lineage-record-id", relationship_type),
      tenant_id: scenario === "CROSS_TENANT_HISTORY" && index === 1 ? "tenant:other" : TENANT_ID,
      mission_id: MISSION_ID,
      parent_reference: `lineage-parent:8j4:${index}`,
      child_reference: `lineage-child:8j4:${index}`,
      lineage_depth: index,
      relationship_type,
      created_at: NOW,
      replay_reference: scenario === "MISSING_REPLAY_REFERENCE" && index === 0 ? "" : `${REPLAY_REFERENCE}:lineage:${index}`,
      integrity_hash: hashValue("investigation-lineage-integrity", { relationship_type, index }),
    };
    return Object.freeze({ ...source, lineage_hash: hashValue("investigation-lineage-record", source) });
  }));
}

function buildTimeline(scenario?: ReplayInvestigationScenario): readonly InvestigationTimelineRecord[] {
  const events = timelineTypes.map((event_type, index) => {
    const source = {
      timeline_event_id: id("RIW-TE", "timeline-event-id", event_type),
      mission_id: MISSION_ID,
      execution_id: EXECUTION_ID,
      event_type,
      event_state: event_type.includes("ROLLBACK") ? "ROLLBACK" : event_type.includes("INTERVENTION") ? "INTERVENED" : "RECORDED",
      event_timestamp: `2026-07-01T04:${(10 + index).toString().padStart(2, "0")}:00.000Z`,
      sequence_number: index + 1,
      branch_reference: event_type === "PLAN_GENERATED" ? "branch:8j4:primary" : null,
      checkpoint_reference: event_type === "CHECKPOINT_CREATED" ? "checkpoint:8j4:primary" : null,
      rollback_reference: event_type.includes("ROLLBACK") ? "rollback:8j4:primary" : null,
      replay_reference: scenario === "MISSING_REPLAY_REFERENCE" && index === 0 ? "" : `${REPLAY_REFERENCE}:timeline:${index}`,
      lineage_reference: `${LINEAGE_REFERENCE}:timeline:${index}`,
      integrity_hash: hashValue("investigation-timeline-integrity", { event_type, index }),
    };
    return Object.freeze({ ...source, timeline_hash: hashValue("investigation-timeline-record", source) });
  });
  return freezeArray(scenario === "NONDETERMINISTIC_TIMELINE" ? [events[1], events[0], ...events.slice(2)] : events);
}

function buildConsole(mode: InvestigationMode, scenario?: ReplayInvestigationScenario): InvestigationConsoleRecord {
  const source = {
    investigation_id: id("RIW-IC", "investigation-console-id", mode),
    operator_id: OPERATOR_ID,
    tenant_id: scenario === "CROSS_TENANT_HISTORY" ? "tenant:other" : TENANT_ID,
    mission_id: MISSION_ID,
    mode,
    search_type: "REPLAY" as const,
    search_parameters: Object.freeze({ mission_id: MISSION_ID, execution_id: EXECUTION_ID, tenant_id: TENANT_ID }),
    results_found: 12,
    comparison_mode: mode === "COMPARATIVE_ANALYSIS",
    generated_at: NOW,
  };
  return Object.freeze({ ...source, console_hash: hashValue("investigation-console-record", source) });
}

function buildComparisons(scenario?: ReplayInvestigationScenario): readonly HistoricalComparisonRecord[] {
  const types = ["EXECUTION_VS_EXECUTION", "PLAN_VS_PLAN", "REPLAY_VS_REPLAY", "DECISION_VS_DECISION", "INTERVENTION_VS_INTERVENTION", "GOVERNANCE_VS_GOVERNANCE"];
  return freezeArray(types.map((comparison_type, index) => {
    const inconsistent = scenario === "INCONSISTENT_COMPARISON" && index === 0;
    const source = {
      comparison_id: id("RIW-HC", "historical-comparison-id", comparison_type),
      comparison_type,
      compared_references: freezeArray([`history:left:${index}`, `history:right:${index}`]),
      state_differences: inconsistent ? 99 : index % 2,
      timeline_differences: inconsistent ? 99 : index,
      confidence_change: inconsistent ? 10 : Number((index * 0.02).toFixed(2)),
      risk_change: inconsistent ? 10 : Number((index * 0.03).toFixed(2)),
      policy_differences: inconsistent ? 99 : 0,
      authority_differences: inconsistent ? 99 : 0,
      outcome_differences: inconsistent ? 99 : index % 2,
      deterministic: !inconsistent,
    };
    return Object.freeze({ ...source, comparison_hash: hashValue("historical-comparison-record", source) });
  }));
}

function buildSearches(scenario?: ReplayInvestigationScenario): readonly InvestigationSearchRecord[] {
  return freezeArray(searchCategories.map((category, index) => {
    const nondeterministic = scenario === "NONDETERMINISTIC_SEARCH" && index === 0;
    const refs = [`${category.toLowerCase()}:result:001`, `${category.toLowerCase()}:result:002`];
    const source = {
      search_id: id("RIW-SR", "investigation-search-id", category),
      category,
      filters: Object.freeze({ mission_id: MISSION_ID, execution_id: EXECUTION_ID, tenant_id: TENANT_ID, replay_reference: REPLAY_REFERENCE }),
      result_references: freezeArray(nondeterministic ? refs.reverse() : refs),
      deterministic_order: !nondeterministic,
    };
    return Object.freeze({ ...source, search_hash: hashValue("investigation-search-record", source) });
  }));
}

function buildEvidence(scenario?: ReplayInvestigationScenario): readonly EvidenceInspectionRecord[] {
  const types = ["OBSERVATION", "DECISION_RATIONALE", "GOVERNANCE_JUSTIFICATION", "CONFIDENCE_REASONING", "RISK_ANALYSIS", "TRUTH_LEDGER_REFERENCE"];
  return freezeArray(types.map((evidence_type, index) => {
    const incomplete = scenario === "INCOMPLETE_EVIDENCE" && index === 0;
    const source = {
      evidence_record_id: id("RIW-ER", "evidence-record-id", evidence_type),
      mission_id: MISSION_ID,
      execution_id: EXECUTION_ID,
      evidence_type,
      source_reference: incomplete ? "" : `source:8j4:${index}`,
      supporting_record: incomplete ? "" : `supporting-record:8j4:${index}`,
      verification_status: incomplete ? "MISSING" as const : "VERIFIED" as const,
      timestamp: NOW,
    };
    return Object.freeze({ ...source, evidence_hash: hashValue("investigation-evidence-record", source) });
  }));
}

function buildAuditExports(replaySessions: readonly ReplaySessionRecord[], lineageRecords: readonly InvestigationLineageRecord[], integrityRecords: readonly InvestigationIntegrityRecord[], evidenceRecords: readonly EvidenceInspectionRecord[], scenario?: ReplayInvestigationScenario): readonly AuditExportRecord[] {
  const formats = ["REPLAY_REPORT", "TIMELINE_REPORT", "LINEAGE_REPORT", "INTEGRITY_REPORT", "INVESTIGATION_REPORT", "GOVERNANCE_REVIEW_REPORT"];
  return freezeArray(formats.map((export_format, index) => {
    const source = {
      export_id: id("RIW-AE", "audit-export-id", export_format),
      export_format,
      replay_references: freezeArray(replaySessions.map((item) => item.replay_reference).filter(Boolean)),
      lineage_references: freezeArray(lineageRecords.map((item) => item.child_reference)),
      integrity_hashes: freezeArray(integrityRecords.map((item) => item.hash_value).filter(Boolean)),
      evidence_references: freezeArray(evidenceRecords.map((item) => item.source_reference).filter(Boolean)),
      governance_references: freezeArray(scenario === "GOVERNANCE_HISTORY_GAP" ? [] : [`governance:8j4:${index}`]),
      timestamp: NOW,
    };
    return Object.freeze({ ...source, report_checksum: hashValue("investigation-audit-export", source) });
  }));
}

function validationTest(name: string, passed: boolean, failure: ReplayInvestigationFailure, evidence: readonly string[]): ReplayInvestigationValidationTest {
  const source = { name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence) };
  return Object.freeze({ test_id: id("RIW-VT", "replay-investigation-validation-test-id", name), ...source, test_hash: hashValue("replay-investigation-validation-test", source) });
}

function buildTests(report: Omit<ReplayInvestigationWorkspaceReport, "validation_tests" | "failures" | "validation_outcome" | "workspace_hash" | "integrity_hash">, scenario?: ReplayInvestigationScenario): readonly ReplayInvestigationValidationTest[] {
  const replayTypesPresent = new Set(report.replay_sessions.map((item) => item.replay_type));
  const hashTypesPresent = new Set(report.integrity_records.map((item) => item.hash_type));
  const lineageTypesPresent = new Set(report.lineage_records.map((item) => item.relationship_type));
  const timelineTypesPresent = new Set(report.timeline.map((item) => item.event_type));
  const searchTypesPresent = new Set(report.searches.map((item) => item.category));
  const evidence = freezeArray([report.workspace_id, report.graph_visualization.engine_hash]);
  const replayRefs = [...report.replay_sessions.map((item) => item.replay_reference), ...report.timeline.map((item) => item.replay_reference), ...report.integrity_records.map((item) => item.replay_reference)];
  const integrityHashes = [...report.replay_sessions.map((item) => item.integrity_hash), ...report.timeline.map((item) => item.integrity_hash), ...report.integrity_records.map((item) => item.hash_value)];
  const tenantIsolated = report.replay_sessions.every((item) => item.tenant_id === TENANT_ID) && report.lineage_records.every((item) => item.tenant_id === TENANT_ID) && report.investigation_console.tenant_id === TENANT_ID;
  const integrityFailure: ReplayInvestigationFailure = scenario === "INTEGRITY_VERIFICATION_FAILED" ? "INTEGRITY_VERIFICATION_FAILED" : "INTEGRITY_HASH_UNVERIFIED";
  return freezeArray([
    validationTest("replay workspace schema present", report.replay_sessions.length === 6 && report.integrity_records.length === 6, "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("replay viewer operational", report.replay_sessions.every((item) => item.replay_state !== "ERROR"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("planning replay visualized", replayTypesPresent.has("PLANNING_REPLAY"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("execution replay visualized", replayTypesPresent.has("EXECUTION_REPLAY"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("delegation replay visualized", replayTypesPresent.has("DELEGATION_REPLAY"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("orchestration replay visualized", replayTypesPresent.has("ORCHESTRATION_REPLAY"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("supervision replay visualized", replayTypesPresent.has("SUPERVISION_REPLAY"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("intervention replay visualized", replayTypesPresent.has("INTERVENTION_REPLAY"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("integrity viewer operational", report.integrity_records.every((item) => item.verification_status === "VERIFIED"), integrityFailure, evidence),
    validationTest("execution hashes displayed", hashTypesPresent.has("EXECUTION_HASH"), "INTEGRITY_HASH_UNVERIFIED", evidence),
    validationTest("replay hashes displayed", hashTypesPresent.has("REPLAY_HASH"), "INTEGRITY_HASH_UNVERIFIED", evidence),
    validationTest("planning hashes displayed", hashTypesPresent.has("PLANNING_HASH"), "INTEGRITY_HASH_UNVERIFIED", evidence),
    validationTest("supervision hashes displayed", hashTypesPresent.has("SUPERVISION_HASH"), "INTEGRITY_HASH_UNVERIFIED", evidence),
    validationTest("decision hashes displayed", hashTypesPresent.has("DECISION_HASH"), "INTEGRITY_HASH_UNVERIFIED", evidence),
    validationTest("lineage viewer operational", report.lineage_records.length === 7, "LINEAGE_RELATIONSHIP_MISSING", evidence),
    validationTest("ancestry displayed", lineageTypesPresent.has("PARENT"), "LINEAGE_RELATIONSHIP_MISSING", evidence),
    validationTest("descendants displayed", lineageTypesPresent.has("CHILD"), "LINEAGE_RELATIONSHIP_MISSING", evidence),
    validationTest("execution chain displayed", lineageTypesPresent.has("DEPENDENCY"), "LINEAGE_RELATIONSHIP_MISSING", evidence),
    validationTest("replay chain displayed", lineageTypesPresent.has("REPLAY"), "LINEAGE_RELATIONSHIP_MISSING", evidence),
    validationTest("supervision chain displayed", lineageTypesPresent.has("SUPERVISION"), "LINEAGE_RELATIONSHIP_MISSING", evidence),
    validationTest("timeline explorer operational", report.timeline.length === 11, "TIMELINE_ORDER_NONDETERMINISTIC", evidence),
    validationTest("chronological execution displayed", report.timeline.every((item, index) => item.sequence_number === index + 1), "TIMELINE_ORDER_NONDETERMINISTIC", evidence),
    validationTest("branching execution displayed", report.timeline.some((item) => item.branch_reference), "TIMELINE_ORDER_NONDETERMINISTIC", evidence),
    validationTest("intervention timeline displayed", timelineTypesPresent.has("INTERVENTION_OCCURRED"), "TIMELINE_ORDER_NONDETERMINISTIC", evidence),
    validationTest("checkpoint timeline displayed", timelineTypesPresent.has("CHECKPOINT_CREATED"), "TIMELINE_ORDER_NONDETERMINISTIC", evidence),
    validationTest("rollback timeline displayed", timelineTypesPresent.has("ROLLBACK_STARTED") && timelineTypesPresent.has("ROLLBACK_COMPLETED"), "TIMELINE_ORDER_NONDETERMINISTIC", evidence),
    validationTest("replay reconstruction deterministic", scenario !== "REPLAY_DIVERGENCE" && report.replay_sessions.every((item) => item.integrity_hash !== "replay-diverged"), "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("historical comparison deterministic", report.comparisons.every((item) => item.deterministic), "HISTORICAL_COMPARISON_INCONSISTENT", evidence),
    validationTest("execution search deterministic", searchTypesPresent.has("EXECUTION") && report.searches.every((item) => item.deterministic_order), "SEARCH_RESULTS_NONDETERMINISTIC", evidence),
    validationTest("intervention lookup deterministic", searchTypesPresent.has("INTERVENTION") && report.searches.every((item) => item.deterministic_order), "SEARCH_RESULTS_NONDETERMINISTIC", evidence),
    validationTest("policy lookup deterministic", searchTypesPresent.has("POLICY") && report.searches.every((item) => item.deterministic_order), "SEARCH_RESULTS_NONDETERMINISTIC", evidence),
    validationTest("lineage lookup deterministic", searchTypesPresent.has("LINEAGE") && report.searches.every((item) => item.deterministic_order), "SEARCH_RESULTS_NONDETERMINISTIC", evidence),
    validationTest("evidence references preserved", report.evidence_records.every((item) => item.source_reference && item.supporting_record && item.verification_status === "VERIFIED"), "EVIDENCE_INCOMPLETE", evidence),
    validationTest("replay references preserved", replayRefs.every(Boolean), "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("integrity hashes preserved", integrityHashes.every(Boolean), "INTEGRITY_HASH_UNVERIFIED", evidence),
    validationTest("audit reports reproducible", report.audit_exports.every((item) => item.report_checksum && item.governance_references.length > 0), "GOVERNANCE_HISTORY_UNRECONSTRUCTABLE", evidence),
    validationTest("tenant isolation enforced", tenantIsolated, "CROSS_TENANT_HISTORY_EXPOSED", evidence),
    validationTest("advisory-only investigation enforced", report.advisory_only && !report.history_mutation_allowed && !report.execution_authority_granted, "HISTORICAL_DATA_MUTATION_ATTEMPTED", evidence),
    validationTest("hidden historical state rejected", scenario !== "HIDDEN_HISTORICAL_STATE", "HIDDEN_HISTORICAL_STATE_VISIBLE", evidence),
    validationTest("unauthorized investigation access rejected", scenario !== "UNAUTHORIZED_INVESTIGATION_ACCESS", "UNAUTHORIZED_INVESTIGATION_ACCESS", evidence),
  ]);
}

export function computeReplayInvestigationWorkspaceHash(report: Omit<ReplayInvestigationWorkspaceReport, "workspace_hash"> | ReplayInvestigationWorkspaceReport): string {
  const { workspace_hash: _hash, ...source } = report as ReplayInvestigationWorkspaceReport;
  return hashValue("replay-investigation-workspace-report", source);
}

export function runReplayInvestigationWorkspace(input: ReplayInvestigationWorkspaceInput = {}): ReplayInvestigationWorkspaceReport {
  const scenario = input.scenario ?? "BASELINE";
  const graphVisualization = runMissionControlGraphVisualizationEngine({ replay_mode: "FORENSIC" });
  const replay_sessions = buildReplaySessions(input.replay_mode ?? "FORENSIC", scenario);
  const integrity_records = buildIntegrityRecords(scenario);
  const lineage_records = buildLineageRecords(scenario);
  const timeline = buildTimeline(scenario);
  const investigation_console = buildConsole(input.investigation_mode ?? "FORENSIC_INVESTIGATION", scenario);
  const comparisons = buildComparisons(scenario);
  const searches = buildSearches(scenario);
  const evidence_records = buildEvidence(scenario);
  const audit_exports = buildAuditExports(replay_sessions, lineage_records, integrity_records, evidence_records, scenario);
  const base = {
    phase_version: "8J.4" as const,
    schema_version: SCHEMA_VERSION,
    workspace_id: id("RIW", "replay-investigation-workspace-id", { scenario, replay: input.replay_mode ?? "FORENSIC" }),
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    graph_visualization: graphVisualization,
    replay_sessions,
    integrity_records,
    lineage_records,
    timeline,
    investigation_console,
    comparisons,
    searches,
    evidence_records,
    audit_exports,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    advisory_only: true as const,
    history_mutation_allowed: scenario === "HISTORY_MUTATION_ATTEMPT" ? true as never : false as const,
    execution_authority_granted: false as const,
  };
  const tests = buildTests(base, scenario);
  const scenarioSpecificFailure = scenarioFailure(scenario);
  const testFailures = tests.map((test) => test.failure_reason).filter((failure): failure is ReplayInvestigationFailure => Boolean(failure));
  const failures = freezeArray(scenarioSpecificFailure && !testFailures.includes(scenarioSpecificFailure) ? [...testFailures, scenarioSpecificFailure] : testFailures);
  const validation_outcome: InvestigationValidationOutcome = failures.length === 0 ? "VALID" : scenario === "UNAUTHORIZED_INVESTIGATION_ACCESS" ? "BLOCKED" : "INVALID";
  const integrity_hash = scenario === "INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("replay-investigation-workspace-integrity", { replay: replay_sessions.map((item) => item.replay_hash), integrity: integrity_records.map((item) => item.integrity_record_hash), lineage: lineage_records.map((item) => item.lineage_hash), timeline: timeline.map((item) => item.timeline_hash), evidence: evidence_records.map((item) => item.evidence_hash), audit: audit_exports.map((item) => item.report_checksum) });
  const report = { ...base, validation_outcome, validation_tests: tests, failures, integrity_hash };
  return Object.freeze({ ...report, workspace_hash: computeReplayInvestigationWorkspaceHash(report as ReplayInvestigationWorkspaceReport) });
}

export function validateReplayInvestigationWorkspace(report?: ReplayInvestigationWorkspaceReport): ReplayInvestigationWorkspaceValidationResult {
  if (!report) {
    const failures = freezeArray<ReplayInvestigationFailure>(["REPLAY_RECONSTRUCTION_DIVERGED"]);
    const source = { workspace_id: null, valid: false, validation_outcome: "INVALID" as const, failures, workspace_hash_valid: false, advisory_only: false, immutable_history: false };
    return Object.freeze({ ...source, validation_hash: hashValue("replay-investigation-workspace-validation", source) });
  }
  const workspace_hash_valid = computeReplayInvestigationWorkspaceHash(report) === report.workspace_hash;
  const immutable_history = !report.history_mutation_allowed && !report.execution_authority_granted;
  const valid = report.validation_outcome === "VALID" && workspace_hash_valid && report.advisory_only && immutable_history;
  const source = { workspace_id: report.workspace_id, valid, validation_outcome: report.validation_outcome, failures: report.failures, workspace_hash_valid, advisory_only: report.advisory_only, immutable_history };
  return Object.freeze({ ...source, validation_hash: hashValue("replay-investigation-workspace-validation", source) });
}

export function buildReplayInvestigationWorkspaceObservabilitySurface(report = runReplayInvestigationWorkspace()): ReplayInvestigationWorkspaceObservabilitySurface {
  return Object.freeze({
    workspace_id: report.workspace_id,
    validation_outcome: report.validation_outcome,
    replay_sessions: report.replay_sessions.length,
    integrity_records: report.integrity_records.length,
    lineage_records: report.lineage_records.length,
    timeline_events: report.timeline.length,
    comparisons: report.comparisons.length,
    searches: report.searches.length,
    evidence_records: report.evidence_records.length,
    audit_exports: report.audit_exports.length,
    failed_tests: report.validation_tests.filter((test) => !test.passed).length,
    failures: report.failures,
    advisory_only: report.advisory_only,
    history_mutation_allowed: report.history_mutation_allowed,
    execution_authority_granted: report.execution_authority_granted,
    workspace_hash: report.workspace_hash,
  });
}

export function getReplayInvestigationWorkspaceContract() {
  const report = runReplayInvestigationWorkspace();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-replay", "immutable-history", "evidence-based-investigation", "governance-transparency", "operator-supremacy", "replay-fidelity", "tenant-isolation", "advisory-only"]),
      schema_version: SCHEMA_VERSION,
      replay_types: freezeArray(replayTypes),
      replay_modes: freezeArray(["LIVE", "HISTORICAL", "STEP_BY_STEP", "CHECKPOINT", "FORENSIC", "COMPARISON"] as const),
      integrity_hash_types: freezeArray(hashTypes),
      investigation_modes: freezeArray(["REPLAY_ANALYSIS", "FAILURE_ANALYSIS", "FORENSIC_INVESTIGATION", "GOVERNANCE_REVIEW", "POLICY_ANALYSIS", "LINEAGE_ANALYSIS", "COMPARATIVE_ANALYSIS"] as const),
      search_categories: freezeArray(searchCategories),
      no_history_mutation: true,
      no_execution_authority: true,
    }),
    report,
    validation: validateReplayInvestigationWorkspace(report),
    observability: buildReplayInvestigationWorkspaceObservabilitySurface(report),
  });
}
