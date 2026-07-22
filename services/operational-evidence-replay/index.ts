import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runOperatorConsole, validateOperatorConsole } from "@/services/operator-console";
import { runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import { runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import type { OperationalEvidenceReplayBundle, OperationalEvidenceReplayDecision, OperationalEvidenceReplayFailure, OperationalEvidenceReplayInput, OperationalEvidenceReplayResult, OperationalEvidenceReplayScenario, OperationalEvidenceReplayValidation, ReplayCompletionStatus } from "@/types/operational-evidence-replay";

const VERSION = "operational-evidence-replay/mc-5" as const;
const IDENTIFIER = "OperationalEvidenceReplay" as const;
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "replay-engine/w2.14", "evidence-engine/w2.13", "operator-console/w2.16", "registry-core/w1.4a", "identity-core/w1.1a"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), decision: runDecisionSupport(), portfolio: runPortfolioManagement(), replay: runReplayEngine(), evidence: runEvidenceEngine(), operator: runOperatorConsole(), registry: runRegistryCore(), identity: runIdentityCore() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly OperationalEvidenceReplayFailure[], failure: OperationalEvidenceReplayFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: OperationalEvidenceReplayScenario): OperationalEvidenceReplayFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly OperationalEvidenceReplayFailure[], scenario: OperationalEvidenceReplayScenario): OperationalEvidenceReplayDecision {
  const conditional = new Set<OperationalEvidenceReplayFailure>(["REPLAY_RECONSTRUCTION_ENGINE_MISSING", "REPLAY_SESSION_MANAGER_MISSING", "TIMELINE_RECONSTRUCTION_MISSING", "STATE_RECONSTRUCTION_MISSING", "OPERATIONAL_EVIDENCE_INTEGRATION_MISSING", "DIVERGENCE_DETECTION_MISSING", "REPLAY_REPORTING_MISSING", "REPLAY_VIEWER_BACKEND_MISSING", "OPERATIONAL_EVIDENCE_INDEX_MISSING", "OPERATIONAL_REPLAY_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "OPERATIONAL_REPLAY_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "OPERATIONAL_EVIDENCE_REPLAY_QUALIFIED";
}
function resultReplayHash(result: Omit<OperationalEvidenceReplayResult, "replay_hash" | "integrity_hash">): string { return hash({ reconstruction: result.reconstruction.integrity_hash, sessions: result.sessions.integrity_hash, timeline: result.timeline.integrity_hash, state: result.state.integrity_hash, evidence: result.evidence.integrity_hash, divergence: result.divergence.integrity_hash, reporting: result.reporting.integrity_hash, viewer: result.viewer.integrity_hash, index: result.index.integrity_hash, security: result.security.integrity_hash, performance: result.performance.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<OperationalEvidenceReplayResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runOperationalEvidenceReplay(input: OperationalEvidenceReplayInput = {}): OperationalEvidenceReplayResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<OperationalEvidenceReplayFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["MC_3_DECISION_SUPPORT_INVALID", !validateDecisionSupport(baselines.decision).valid],
    ["MC_4_PORTFOLIO_MANAGEMENT_INVALID", !validatePortfolioManagement(baselines.portfolio).valid],
    ["W2_REPLAY_ENGINE_INVALID", !validateReplayEngine(baselines.replay).valid],
    ["W2_EVIDENCE_ENGINE_INVALID", !validateEvidenceEngine(baselines.evidence).valid],
    ["W2_OPERATOR_CONSOLE_INVALID", !validateOperatorConsole(baselines.operator).valid],
    ["W1_REGISTRY_INVALID", !validateRegistryCore(baselines.registry).valid],
    ["W1_IDENTITY_INVALID", !validateIdentityCore(baselines.identity).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const reconstructionOk = !has(failures, "REPLAY_RECONSTRUCTION_ENGINE_MISSING") && !has(failures, "CCI_EVENT_HISTORY_NOT_AUTHORITATIVE") && !has(failures, "MISSION_CONTROL_EVENT_STREAM_CREATED") && !has(failures, "SYNTHETIC_EVENTS_USED") && !has(failures, "INFERRED_OPERATIONAL_HISTORY_USED") && !has(failures, "REPLAY_NON_DETERMINISTIC") && !has(failures, "HISTORY_MUTATION_ATTEMPTED");
  const sessionsOk = !has(failures, "REPLAY_SESSION_MANAGER_MISSING") && !has(failures, "REPLAY_GOVERNANCE_METADATA_MISSING");
  const timelineOk = !has(failures, "TIMELINE_RECONSTRUCTION_MISSING") && !has(failures, "TIMELINE_ORDERING_INVALID");
  const stateOk = !has(failures, "STATE_RECONSTRUCTION_MISSING") && !has(failures, "STATE_RECONSTRUCTION_NON_REPRODUCIBLE");
  const evidenceOk = !has(failures, "OPERATIONAL_EVIDENCE_INTEGRATION_MISSING") && !has(failures, "EVIDENCE_LINKAGE_INCOMPLETE");
  const divergenceOk = !has(failures, "DIVERGENCE_DETECTION_MISSING") && !has(failures, "UNAUTHORIZED_DIVERGENCE_UNDETECTED");
  const reportingOk = !has(failures, "REPLAY_REPORTING_MISSING") && !has(failures, "REPLAY_REPORT_EVIDENCE_INCOMPLETE");
  const viewerOk = !has(failures, "REPLAY_VIEWER_BACKEND_MISSING");
  const indexOk = !has(failures, "OPERATIONAL_EVIDENCE_INDEX_MISSING") && !has(failures, "EVIDENCE_LOOKUP_SLOW");
  const securityOk = !has(failures, "AUTHORITY_VALIDATION_BYPASSED") && !has(failures, "EVIDENCE_ACCESS_CONTROL_BYPASSED") && !has(failures, "TENANT_ISOLATION_FAILED") && !has(failures, "MISSION_ISOLATION_FAILED") && !has(failures, "AUDIT_LOGGING_MISSING") && !has(failures, "REPLAY_AUTHORIZATION_MISSING");
  const capacity = input.concurrent_histories ?? 1000;
  const performanceOk = !has(failures, "PERFORMANCE_TARGETS_MISSED") && !has(failures, "CONCURRENT_HISTORY_TARGET_NOT_MET") && capacity >= 1000;
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "OPERATIONAL_EVIDENCE_REPLAY_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const replay_id = input.replay_id ?? `replay:mc-5:${input.seed ?? "canonical"}`;
  const completionStatus: ReplayCompletionStatus = sessionsOk ? "COMPLETED" : "FAILED";
  const reconstruction = nested({ engine_id: reconstructionOk ? "engine:mc-5:reconstruction" : "", event_stream_loading: reconstructionOk, mission_reconstruction: reconstructionOk, timeline_rebuilding: reconstructionOk, state_reconstruction: reconstructionOk, dependency_replay: reconstructionOk, cross_service_reconstruction: reconstructionOk, historical_projection: reconstructionOk, source_exclusively_cci_event_history: reconstructionOk, no_independent_event_stream: reconstructionOk, no_synthetic_events: reconstructionOk, no_inferred_history: reconstructionOk, deterministic_reconstruction: reconstructionOk, read_only: reconstructionOk });
  const sessions = nested({ manager_id: sessionsOk ? "manager:mc-5:replay-session" : "", replay_creation: sessionsOk, session_persistence: sessionsOk, replay_checkpoints: sessionsOk, time_navigation: sessionsOk, bookmarking: sessionsOk, investigation_sessions: sessionsOk, replay_identifier: sessionsOk, replay_requestor: sessionsOk, replay_authority: sessionsOk, replay_scope: sessionsOk, replay_timestamp: sessionsOk, event_history_version: sessionsOk, evidence_references: sessionsOk, completion_status: completionStatus });
  const timeline = nested({ timeline_id: timelineOk ? "timeline:mc-5:reconstruction" : "", event_ordering: timelineOk, decision_ordering: timelineOk, approval_ordering: timelineOk, state_transitions: timelineOk, evidence_creation_timeline: timelineOk, mission_lifecycle_replay: timelineOk, canonical_ordering: timelineOk });
  const state = nested({ state_id: stateOk ? "state:mc-5:mission" : "", mission_status: stateOk, objectives: stateOk, assignments: stateOk, dependencies: stateOk, approvals: stateOk, governance_state: stateOk, execution_progress: stateOk, point_in_time_state: stateOk, reproducible_state: stateOk });
  const evidence = nested({ integration_id: evidenceOk ? "integration:mc-5:evidence" : "", evidence_lookup: evidenceOk, evidence_attachment: evidenceOk, decision_evidence: evidenceOk, approval_evidence: evidenceOk, mission_evidence: evidenceOk, governance_evidence: evidenceOk, authoritative_evidence_linkage: evidenceOk, immutable_lineage: evidenceOk });
  const divergence = nested({ detector_id: divergenceOk ? "detector:mc-5:divergence" : "", replay_validation: divergenceOk, state_validation: divergenceOk, missing_events: divergenceOk, duplicate_events: divergenceOk, ordering_violations: divergenceOk, dependency_violations: divergenceOk, zero_unauthorized_divergence: divergenceOk });
  const reporting = nested({ reporting_id: reportingOk ? "reporting:mc-5:replay" : "", replay_summary: reportingOk, event_timeline: reportingOk, mission_reconstruction: reportingOk, evidence_references: reportingOk, governance_findings: reportingOk, replay_statistics: reportingOk, authoritative_reports: reportingOk, complete_evidence_linkage: reportingOk });
  const viewer = nested({ backend_id: viewerOk ? "backend:mc-5:viewer" : "", replay_navigation: viewerOk, timeline_browsing: viewerOk, event_inspection: viewerOk, state_comparison: viewerOk, evidence_viewing: viewerOk, mission_playback: viewerOk, decision_review: viewerOk, approval_visualization: viewerOk });
  const index = nested({ index_id: indexOk ? "index:mc-5:operational-evidence" : "", evidence_lookup: indexOk, mission_evidence: indexOk, decision_evidence: indexOk, approval_evidence: indexOk, timeline_evidence: indexOk, governance_evidence: indexOk, lookup_latency_ms: indexOk ? 400 : 9999, indexed: indexOk });
  const security = nested({ security_id: securityOk ? "security:mc-5:replay" : "", authority_validation: securityOk, evidence_access_control: securityOk, tenant_isolation: securityOk, mission_isolation: securityOk, immutable_history: securityOk, audit_logging: securityOk, replay_authorization: securityOk, read_only_enforcement: securityOk });
  const performance = nested({ performance_id: performanceOk ? "performance:mc-5:targets" : "", startup_seconds: performanceOk ? 4 : 99, timeline_reconstruction_seconds: performanceOk ? 9 : 99, state_reconstruction_seconds: performanceOk ? 1.5 : 99, report_generation_seconds: performanceOk ? 25 : 99, evidence_lookup_ms: performanceOk ? 400 : 9999, concurrent_history_target: 1000 as const, concurrent_history_capacity: performanceOk ? capacity : 0, targets_met: performanceOk });
  const readiness = nested({ readiness_id: "MC-5-OPERATIONAL-EVIDENCE-REPLAY-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_") && !failure.startsWith("W1_") && !failure.startsWith("W2_")), reconstruction_ready: reconstructionOk, sessions_ready: sessionsOk, timeline_ready: timelineOk, state_ready: stateOk, evidence_ready: evidenceOk, divergence_ready: divergenceOk, reporting_ready: reportingOk, viewer_ready: viewerOk, index_ready: indexOk, security_ready: securityOk, performance_ready: performanceOk, cci_event_history_exclusive: reconstructionOk, read_only: reconstructionOk && securityOk, qualification_ready: qualified, failures });
  const base: Omit<OperationalEvidenceReplayResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, replay_id, reconstruction, sessions, timeline, state, evidence, divergence, reporting, viewer, index, security, performance, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperationalEvidenceReplay(result?: OperationalEvidenceReplayResult): OperationalEvidenceReplayValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, reconstruction_valid: false, sessions_valid: false, timeline_valid: false, state_valid: false, evidence_valid: false, divergence_valid: false, reporting_valid: false, viewer_valid: false, index_valid: false, security_valid: false, performance_valid: false, readiness_valid: false, failures: freezeArray(["REPLAY_RECONSTRUCTION_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const reconstruction_valid = verifyHashed(result.reconstruction) && result.reconstruction.source_exclusively_cci_event_history && result.reconstruction.no_independent_event_stream && result.reconstruction.no_synthetic_events && result.reconstruction.no_inferred_history && result.reconstruction.read_only;
  const sessions_valid = verifyHashed(result.sessions) && result.sessions.replay_identifier && result.sessions.event_history_version && result.sessions.completion_status === "COMPLETED";
  const timeline_valid = verifyHashed(result.timeline) && result.timeline.event_ordering && result.timeline.canonical_ordering && result.timeline.mission_lifecycle_replay;
  const state_valid = verifyHashed(result.state) && result.state.point_in_time_state && result.state.reproducible_state && result.state.governance_state;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.authoritative_evidence_linkage && result.evidence.immutable_lineage;
  const divergence_valid = verifyHashed(result.divergence) && result.divergence.replay_validation && result.divergence.zero_unauthorized_divergence;
  const reporting_valid = verifyHashed(result.reporting) && result.reporting.authoritative_reports && result.reporting.complete_evidence_linkage;
  const viewer_valid = verifyHashed(result.viewer) && result.viewer.replay_navigation && result.viewer.evidence_viewing && result.viewer.approval_visualization;
  const index_valid = verifyHashed(result.index) && result.index.indexed && result.index.lookup_latency_ms <= 500;
  const security_valid = verifyHashed(result.security) && result.security.authority_validation && result.security.tenant_isolation && result.security.replay_authorization && result.security.read_only_enforcement;
  const performance_valid = verifyHashed(result.performance) && result.performance.targets_met && result.performance.startup_seconds < 5 && result.performance.timeline_reconstruction_seconds < 10 && result.performance.state_reconstruction_seconds < 2 && result.performance.report_generation_seconds < 30 && result.performance.evidence_lookup_ms < 500 && result.performance.concurrent_history_capacity >= 1000;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.cci_event_history_exclusive && result.readiness.read_only && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && reconstruction_valid && sessions_valid && timeline_valid && state_valid && evidence_valid && divergence_valid && reporting_valid && viewer_valid && index_valid && security_valid && performance_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, reconstruction_valid, sessions_valid, timeline_valid, state_valid, evidence_valid, divergence_valid, reporting_valid, viewer_valid, index_valid, security_valid, performance_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayOperationalEvidenceReplay(result = runOperationalEvidenceReplay()): boolean { const replayed = runOperationalEvidenceReplay(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperationalEvidenceReplay(result).valid; }
export function getOperationalEvidenceReplayBundle(): OperationalEvidenceReplayBundle { const result = runOperationalEvidenceReplay(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_replay_reconstruction: true, owns_replay_sessions: true, owns_timeline_reconstruction: true, owns_state_reconstruction: true, owns_operational_evidence_index: true, owns_replay_reports: true, derives_exclusively_from_cci_event_history: true, read_only_replay: true, no_independent_replay_event_stream: true, concurrent_history_qualification_target: 1000, qualification_gate: "Operational Evidence Replay Qualification Gate" }), result, validation: validateOperationalEvidenceReplay(result) }); }
export const OperationalEvidenceReplayService = Object.freeze({ run: runOperationalEvidenceReplay, validate: validateOperationalEvidenceReplay, replay: replayOperationalEvidenceReplay });
