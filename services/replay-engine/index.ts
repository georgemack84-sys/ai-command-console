import { runCollaborationEngine, validateCollaborationEngine } from "@/services/collaboration-engine";
import { runDelegationEngine, validateDelegationEngine } from "@/services/delegation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import type { ReplayEngineBundle, ReplayEngineDecision, ReplayEngineFailure, ReplayEngineInput, ReplayEngineResult, ReplayEngineScenario, ReplayEngineValidation } from "@/types/replay-engine";

const VERSION = "replay-engine/w2.14" as const;
const IDENTIFIER = "ReplayEngine" as const;
let memoryBaseline: ReturnType<typeof runMemoryEngine> | undefined;
let runtimeBaseline: ReturnType<typeof runRuntimeOrchestrator> | undefined;
let delegationBaseline: ReturnType<typeof runDelegationEngine> | undefined;
let collaborationBaseline: ReturnType<typeof runCollaborationEngine> | undefined;
let evidenceBaseline: ReturnType<typeof runEvidenceEngine> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ReplayEngineFailure[], failure: ReplayEngineFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: ReplayEngineScenario): ReplayEngineFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly ReplayEngineFailure[], scenario: ReplayEngineScenario): ReplayEngineDecision {
  const conditional = new Set<ReplayEngineFailure>(["RUNTIME_REPLAY_MISSING", "DECISION_REPLAY_MISSING", "EXECUTION_CONTROL_REPLAY_MISSING", "DIVERGENCE_DETECTION_MISSING", "REPLAY_SERVICE_MISSING", "REPLAY_API_MISSING", "TIMELINE_API_MISSING", "DIVERGENCE_API_MISSING", "REPLAY_EXPLORER_MISSING", "REPLAY_REPORTS_MISSING", "REPLAY_EVIDENCE_MISSING", "REPLAY_ENGINE_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "REPLAY_ENGINE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "REPLAY_ENGINE_QUALIFIED";
}
function resultReplayHash(result: Omit<ReplayEngineResult, "replay_hash" | "integrity_hash">): string { return hash({ runtime: result.runtime_replay.integrity_hash, decision: result.decision_replay.integrity_hash, execution: result.execution_control.integrity_hash, divergence: result.divergence_detection.integrity_hash, apis: result.apis.integrity_hash, explorer: result.explorer.integrity_hash, reports: result.reports.integrity_hash, security: result.security.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<ReplayEngineResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runReplayEngine(input: ReplayEngineInput = {}): ReplayEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<ReplayEngineFailure>(direct ? [direct] : []);
  memoryBaseline ??= runMemoryEngine(); runtimeBaseline ??= runRuntimeOrchestrator(); delegationBaseline ??= runDelegationEngine(); collaborationBaseline ??= runCollaborationEngine(); evidenceBaseline ??= runEvidenceEngine();
  const upstream = [
    ["W2_9_MEMORY_ENGINE_INVALID", !validateMemoryEngine(memoryBaseline).valid],
    ["W2_10_RUNTIME_ORCHESTRATOR_INVALID", !validateRuntimeOrchestrator(runtimeBaseline).valid],
    ["W2_11_DELEGATION_ENGINE_INVALID", !validateDelegationEngine(delegationBaseline).valid],
    ["W2_12_COLLABORATION_ENGINE_INVALID", !validateCollaborationEngine(collaborationBaseline).valid],
    ["W2_13_EVIDENCE_ENGINE_INVALID", !validateEvidenceEngine(evidenceBaseline).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const runtimeOk = !has(failures, "RUNTIME_REPLAY_MISSING") && !has(failures, "RUNTIME_REPLAY_NON_DETERMINISTIC") && !has(failures, "RUNTIME_STATE_RECONSTRUCTION_FAILED") && !has(failures, "TIMELINE_RECONSTRUCTION_FAILED");
  const decisionOk = !has(failures, "DECISION_REPLAY_MISSING") && !has(failures, "DECISION_REPLAY_INACCURATE") && !has(failures, "AUTHORITY_POLICY_SAFETY_REPLAY_FAILED");
  const executionOk = !has(failures, "EXECUTION_CONTROL_REPLAY_MISSING") && !has(failures, "CHECKPOINT_REPLAY_FAILED") && !has(failures, "RECOVERY_REPLAY_FAILED") && !has(failures, "LIFECYCLE_REPLAY_FAILED");
  const divergenceOk = !has(failures, "DIVERGENCE_DETECTION_MISSING") && !has(failures, "DIVERGENCE_UNDETECTED") && !has(failures, "ROOT_CAUSE_ATTRIBUTION_MISSING") && !has(failures, "REPLAY_CONFIDENCE_MISSING");
  const apisOk = !has(failures, "REPLAY_SERVICE_MISSING") && !has(failures, "REPLAY_API_MISSING") && !has(failures, "TIMELINE_API_MISSING") && !has(failures, "DIVERGENCE_API_MISSING");
  const explorerOk = !has(failures, "REPLAY_EXPLORER_MISSING");
  const reportsOk = !has(failures, "REPLAY_REPORTS_MISSING") && !has(failures, "REPLAY_REPORT_NOT_SIGNED") && !has(failures, "REPLAY_REPORT_NOT_IMMUTABLE");
  const securityOk = !has(failures, "TENANT_ISOLATION_FAILED") && !has(failures, "REPLAY_AUTHORIZATION_MISSING") && !has(failures, "EVIDENCE_INTEGRITY_BYPASSED") && !has(failures, "REPLAY_AUDIT_LOGGING_MISSING");
  const evidenceOk = !has(failures, "REPLAY_EVIDENCE_MISSING") && !has(failures, "REPLAY_EVIDENCE_NOT_PUBLISHED") && !has(failures, "REPLAY_EVIDENCE_NOT_IMMUTABLE");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "REPLAY_ENGINE_QUALIFIED";
  const runtime_replay = nested({ service_id: runtimeOk ? `service:w2.14:runtime-replay:${input.seed ?? "canonical"}` : "", snapshot_loader: runtimeOk, timeline_builder: runtimeOk, context_restoration: runtimeOk, state_reconstruction: runtimeOk, event_replay_engine: runtimeOk, runtime_validation: runtimeOk, time_navigation: runtimeOk, session_management: runtimeOk, complete_execution_reconstruction: runtimeOk, deterministic_restoration: runtimeOk });
  const decision_replay = nested({ service_id: decisionOk ? "service:w2.14:decision-replay" : "", decision_timeline: decisionOk, planning_replay: decisionOk, memory_retrieval_replay: decisionOk, tool_invocation_replay: decisionOk, capability_selection_replay: decisionOk, policy_decision_replay: decisionOk, safety_decision_replay: decisionOk, authority_decision_replay: decisionOk, approvals_replay: decisionOk, restrictions_replay: decisionOk, delegation_replay: decisionOk, collaboration_replay: decisionOk, accurate_reconstruction: decisionOk });
  const execution_control = nested({ service_id: executionOk ? "service:w2.14:execution-control-replay" : "", task_replay: executionOk, workflow_replay: executionOk, checkpoint_replay: executionOk, recovery_replay: executionOk, suspension_replay: executionOk, resume_replay: executionOk, failure_replay: executionOk, retry_replay: executionOk, lifecycle_reconstruction: executionOk, orchestration_replay: executionOk });
  const divergence_detection = nested({ engine_id: divergenceOk ? "engine:w2.14:divergence" : "", timeline_comparison: divergenceOk, decision_comparison: divergenceOk, memory_comparison: divergenceOk, tool_output_comparison: divergenceOk, runtime_state_comparison: divergenceOk, event_comparison: divergenceOk, evidence_comparison: divergenceOk, drift_identification: divergenceOk, divergence_reports: divergenceOk, replay_confidence: divergenceOk, deterministic_validation: divergenceOk, root_cause_attribution: divergenceOk });
  const apis = nested({ api_id: apisOk ? "api:w2.14:replay" : "", start_replay: apisOk, resume_replay: apisOk, pause_replay: apisOk, stop_replay: apisOk, compare_replay: apisOk, validate_replay: apisOk, get_timeline: apisOk, get_execution: apisOk, get_checkpoint: apisOk, get_decision: apisOk, get_evidence: apisOk, compare_decision: apisOk, compare_state: apisOk, compare_runtime: apisOk, compare_evidence: apisOk, generate_report: apisOk, stable: apisOk });
  const explorer = nested({ explorer_id: explorerOk ? "explorer:w2.14:replay" : "", execution_timeline: explorerOk, decision_visualization: explorerOk, evidence_navigation: explorerOk, replay_inspection: explorerOk, state_visualization: explorerOk, divergence_visualization: explorerOk, secure_access: explorerOk, tenant_isolated: explorerOk });
  const reports = nested({ report_id: reportsOk ? "report:w2.14:replay" : "", replay_reports: reportsOk, divergence_reports: reportsOk, deterministic_verification_reports: reportsOk, replay_evidence: reportsOk, certification_reports: reportsOk, signed: reportsOk, immutable: reportsOk, audit_ready: reportsOk });
  const security = nested({ security_id: securityOk ? "security:w2.14:replay" : "", tenant_isolation: securityOk, authority_validation: securityOk, evidence_integrity: securityOk, immutable_replay_records: securityOk, replay_authorization: securityOk, signed_reports: securityOk, audit_logging: securityOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.14:replay-evidence" : "", records: evidenceOk ? freezeArray(["replay:runtime", "replay:decision", "replay:divergence", "replay:determinism", "replay:audit", "replay:certification"]) : freezeArray<string>([]), replay_evidence: evidenceOk, runtime_replay_evidence: evidenceOk, decision_replay_evidence: evidenceOk, divergence_evidence: evidenceOk, deterministic_validation_evidence: evidenceOk, audit_records: evidenceOk, certification_evidence: evidenceOk, published_to_evidence_service: evidenceOk, immutable: evidenceOk });
  const readiness = nested({ readiness_id: "W2.14-REPLAY-ENGINE-READINESS-001", decision, phase_ready: qualified, memory_ready: !has(failures, "W2_9_MEMORY_ENGINE_INVALID"), runtime_ready: !has(failures, "W2_10_RUNTIME_ORCHESTRATOR_INVALID"), delegation_ready: !has(failures, "W2_11_DELEGATION_ENGINE_INVALID"), collaboration_ready: !has(failures, "W2_12_COLLABORATION_ENGINE_INVALID"), evidence_ready: !has(failures, "W2_13_EVIDENCE_ENGINE_INVALID"), runtime_replay_ready: runtimeOk, decision_replay_ready: decisionOk, execution_control_ready: executionOk, divergence_ready: divergenceOk, apis_ready: apisOk, explorer_ready: explorerOk, reports_ready: reportsOk, security_ready: securityOk, replay_evidence_ready: evidenceOk, no_unexplained_divergence: divergenceOk, failures });
  const base: Omit<ReplayEngineResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, memory_engine_ref: "memory-engine/w2.9", runtime_orchestrator_ref: "runtime-orchestrator/w2.10", delegation_engine_ref: "delegation-engine/w2.11", collaboration_engine_ref: "collaboration-engine/w2.12", evidence_engine_ref: "evidence-engine/w2.13", runtime_replay, decision_replay, execution_control, divergence_detection, apis, explorer, reports, security, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateReplayEngine(result?: ReplayEngineResult): ReplayEngineValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, runtime_replay_valid: false, decision_replay_valid: false, execution_control_valid: false, divergence_valid: false, apis_valid: false, explorer_valid: false, reports_valid: false, security_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["RUNTIME_REPLAY_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const runtime_replay_valid = verifyHashed(result.runtime_replay) && result.runtime_replay.complete_execution_reconstruction && result.runtime_replay.deterministic_restoration;
  const decision_replay_valid = verifyHashed(result.decision_replay) && result.decision_replay.authority_decision_replay && result.decision_replay.policy_decision_replay && result.decision_replay.safety_decision_replay && result.decision_replay.accurate_reconstruction;
  const execution_control_valid = verifyHashed(result.execution_control) && result.execution_control.checkpoint_replay && result.execution_control.recovery_replay && result.execution_control.lifecycle_reconstruction;
  const divergence_valid = verifyHashed(result.divergence_detection) && result.divergence_detection.deterministic_validation && result.divergence_detection.root_cause_attribution && result.divergence_detection.replay_confidence;
  const apis_valid = verifyHashed(result.apis) && result.apis.start_replay && result.apis.validate_replay && result.apis.generate_report && result.apis.stable;
  const explorer_valid = verifyHashed(result.explorer) && result.explorer.execution_timeline && result.explorer.divergence_visualization && result.explorer.tenant_isolated;
  const reports_valid = verifyHashed(result.reports) && result.reports.signed && result.reports.immutable && result.reports.certification_reports;
  const security_valid = verifyHashed(result.security) && result.security.tenant_isolation && result.security.evidence_integrity && result.security.replay_authorization;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 6 && result.evidence.published_to_evidence_service && result.evidence.immutable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.no_unexplained_divergence && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && runtime_replay_valid && decision_replay_valid && execution_control_valid && divergence_valid && apis_valid && explorer_valid && reports_valid && security_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, runtime_replay_valid, decision_replay_valid, execution_control_valid, divergence_valid, apis_valid, explorer_valid, reports_valid, security_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayReplayEngine(result = runReplayEngine()): boolean { const replayed = runReplayEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateReplayEngine(result).valid; }
export function getReplayEngineBundle(): ReplayEngineBundle { const result = runReplayEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_runtime_replay: true, owns_decision_replay: true, owns_execution_control_replay: true, owns_divergence_detection: true, owns_replay_apis: true, owns_replay_explorer: true, owns_replay_reports: true, owns_replay_security: true, owns_replay_evidence: true, verification_not_execution: true, qualification_gate: "Replay Engine Qualification Gate" }), result, validation: validateReplayEngine(result) }); }
export const ReplayEngineService = Object.freeze({ run: runReplayEngine, validate: validateReplayEngine, replay: replayReplayEngine });
