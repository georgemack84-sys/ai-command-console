import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { runDelegationEngine, validateDelegationEngine } from "@/services/delegation-engine";
import { runCollaborationEngine, validateCollaborationEngine } from "@/services/collaboration-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import { runCertificationEngine, validateCertificationEngine } from "@/services/certification-engine";
import type { OperatorConsoleBundle, OperatorConsoleDecision, OperatorConsoleFailure, OperatorConsoleInput, OperatorConsoleResult, OperatorConsoleScenario, OperatorConsoleValidation, OperatorWorkspace } from "@/types/operator-console";

const VERSION = "operator-console/w2.16" as const;
const IDENTIFIER = "OperatorConsole" as const;
const WORKSPACES = Object.freeze<OperatorWorkspace[]>(["Runtime Operations", "Governance Review", "Evidence Investigation", "Replay Analysis", "Certification Review", "Collaboration Oversight", "Delegation Management", "Safety Monitoring", "Policy Administration", "Emergency Response"]);
const UPSTREAM_REFS = Object.freeze(["caf-constitutional-foundation/w2.0", "agent-registry/w2.1", "lifecycle-engine/w2.2", "capability-registry/w2.3", "skill-registry/w2.4", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "runtime-orchestrator/w2.10", "delegation-engine/w2.11", "collaboration-engine/w2.12", "evidence-engine/w2.13", "replay-engine/w2.14", "certification-engine/w2.15"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { constitutional: runCafConstitutionalFoundation(), agent: runAgentRegistry(), lifecycle: runLifecycleEngine(), capability: runCapabilityRegistry(), skill: runSkillRegistry(), authority: runAuthorityValidator(), policy: runPolicyGate(), safety: runSafetyGate(), planning: runPlanningEngine(), memory: runMemoryEngine(), runtime: runRuntimeOrchestrator(), delegation: runDelegationEngine(), collaboration: runCollaborationEngine(), evidence: runEvidenceEngine(), replay: runReplayEngine(), certification: runCertificationEngine() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly OperatorConsoleFailure[], failure: OperatorConsoleFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: OperatorConsoleScenario): OperatorConsoleFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly OperatorConsoleFailure[], scenario: OperatorConsoleScenario): OperatorConsoleDecision {
  const conditional = new Set<OperatorConsoleFailure>(["OPERATOR_CONSOLE_MISSING", "DASHBOARD_MISSING", "APPROVAL_QUEUE_MISSING", "EVIDENCE_EXPLORER_MISSING", "REPLAY_EXPLORER_MISSING", "CERTIFICATION_EXPLORER_MISSING", "EMERGENCY_CONTROLS_MISSING", "GOVERNANCE_VIEW_MISSING", "NOTIFICATION_SERVICE_MISSING", "WORKSPACE_ISOLATION_MISSING", "OPERATIONAL_EVIDENCE_MISSING", "OPERATOR_CONSOLE_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "OPERATOR_CONSOLE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "OPERATOR_CONSOLE_QUALIFIED";
}
function resultReplayHash(result: Omit<OperatorConsoleResult, "replay_hash" | "integrity_hash">): string { return hash({ console: result.console.integrity_hash, dashboard: result.dashboard.integrity_hash, approval: result.approval_queue.integrity_hash, evidence_explorer: result.evidence_explorer.integrity_hash, replay_explorer: result.replay_explorer.integrity_hash, certification_explorer: result.certification_explorer.integrity_hash, emergency: result.emergency_controls.integrity_hash, governance: result.governance_views.integrity_hash, notifications: result.notifications.integrity_hash, workspaces: result.workspaces.integrity_hash, security: result.security.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<OperatorConsoleResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runOperatorConsole(input: OperatorConsoleInput = {}): OperatorConsoleResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<OperatorConsoleFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["W2_0_CONSTITUTIONAL_FOUNDATION_INVALID", !validateCafConstitutionalFoundation(baselines.constitutional).valid],
    ["W2_1_AGENT_REGISTRY_INVALID", !validateAgentRegistry(baselines.agent).valid],
    ["W2_2_LIFECYCLE_ENGINE_INVALID", !validateLifecycleEngine(baselines.lifecycle).valid],
    ["W2_3_CAPABILITY_REGISTRY_INVALID", !validateCapabilityRegistry(baselines.capability).valid],
    ["W2_4_SKILL_REGISTRY_INVALID", !validateSkillRegistry(baselines.skill).valid],
    ["W2_5_AUTHORITY_VALIDATOR_INVALID", !validateAuthorityValidator(baselines.authority).valid],
    ["W2_6_POLICY_GATE_INVALID", !validatePolicyGate(baselines.policy).valid],
    ["W2_7_SAFETY_GATE_INVALID", !validateSafetyGate(baselines.safety).valid],
    ["W2_8_PLANNING_ENGINE_INVALID", !validatePlanningEngine(baselines.planning).valid],
    ["W2_9_MEMORY_ENGINE_INVALID", !validateMemoryEngine(baselines.memory).valid],
    ["W2_10_RUNTIME_ORCHESTRATOR_INVALID", !validateRuntimeOrchestrator(baselines.runtime).valid],
    ["W2_11_DELEGATION_ENGINE_INVALID", !validateDelegationEngine(baselines.delegation).valid],
    ["W2_12_COLLABORATION_ENGINE_INVALID", !validateCollaborationEngine(baselines.collaboration).valid],
    ["W2_13_EVIDENCE_ENGINE_INVALID", !validateEvidenceEngine(baselines.evidence).valid],
    ["W2_14_REPLAY_ENGINE_INVALID", !validateReplayEngine(baselines.replay).valid],
    ["W2_15_CERTIFICATION_ENGINE_INVALID", !validateCertificationEngine(baselines.certification).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const consoleOk = !has(failures, "OPERATOR_CONSOLE_MISSING");
  const dashboardOk = !has(failures, "DASHBOARD_MISSING") && !has(failures, "DASHBOARD_VISIBILITY_INCOMPLETE");
  const approvalOk = !has(failures, "APPROVAL_QUEUE_MISSING") && !has(failures, "APPROVAL_SIGNATURE_MISSING") && !has(failures, "APPROVAL_EVIDENCE_MISSING");
  const evidenceExplorerOk = !has(failures, "EVIDENCE_EXPLORER_MISSING") && !has(failures, "EVIDENCE_LINEAGE_MISSING");
  const replayExplorerOk = !has(failures, "REPLAY_EXPLORER_MISSING") && !has(failures, "REPLAY_EXECUTION_NOT_AUTHORIZED") && !has(failures, "REPLAY_READ_ONLY_BYPASSED");
  const certificationExplorerOk = !has(failures, "CERTIFICATION_EXPLORER_MISSING") && !has(failures, "CERTIFICATION_DRILLDOWN_MISSING");
  const emergencyOk = !has(failures, "EMERGENCY_CONTROLS_MISSING") && !has(failures, "EMERGENCY_AUTHORITY_BYPASSED") && !has(failures, "EMERGENCY_POLICY_BYPASSED") && !has(failures, "EMERGENCY_SAFETY_BYPASSED") && !has(failures, "EMERGENCY_AUDIT_MISSING");
  const governanceOk = !has(failures, "GOVERNANCE_VIEW_MISSING");
  const notificationOk = !has(failures, "NOTIFICATION_SERVICE_MISSING");
  const workspacesOk = !has(failures, "WORKSPACE_ISOLATION_MISSING");
  const securityOk = !has(failures, "OPERATOR_AUTHENTICATION_MISSING") && !has(failures, "ROLE_AUTHORIZATION_MISSING") && !has(failures, "TENANT_ISOLATION_FAILED") && !has(failures, "SIGNED_ACTIONS_MISSING") && !has(failures, "AUDIT_LOGGING_MISSING");
  const evidenceOk = !has(failures, "OPERATIONAL_EVIDENCE_MISSING") && !has(failures, "OPERATOR_REPLAY_ARTIFACTS_MISSING");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "OPERATOR_CONSOLE_QUALIFIED";
  const console = nested({ console_id: consoleOk ? `console:w2.16:operator:${input.seed ?? "canonical"}` : "", dashboards: consoleOk, operator_workspaces: consoleOk, approval_workflows: consoleOk, replay_viewer: consoleOk, evidence_explorer: consoleOk, certification_explorer: consoleOk, advisory_supervisory_only: consoleOk, constitutional_bypass_prevented: consoleOk });
  const dashboard = nested({ dashboard_id: dashboardOk ? "dashboard:w2.16:operations" : "", runtime_status: dashboardOk, agent_status: dashboardOk, active_missions: dashboardOk, planning_status: dashboardOk, memory_utilization: dashboardOk, collaboration_sessions: dashboardOk, delegation_graph: dashboardOk, health_indicators: dashboardOk, runtime_alerts: dashboardOk, policy_violations: dashboardOk, safety_events: dashboardOk, certification_status: dashboardOk, evidence_status: dashboardOk, replay_availability: dashboardOk, realtime_visibility: dashboardOk });
  const approval_queue = nested({ queue_id: approvalOk ? "queue:w2.16:operator-approvals" : "", pending_approvals: approvalOk, escalated_decisions: approvalOk, constitutional_overrides: approvalOk, policy_exceptions: approvalOk, safety_approvals: approvalOk, delegation_approvals: approvalOk, runtime_pause_requests: approvalOk, mission_approvals: approvalOk, certification_approvals: approvalOk, qualification_reviews: approvalOk, authority_source: approvalOk, justification: approvalOk, evidence_references: approvalOk, operator_identity: approvalOk, digital_signature: approvalOk, timestamp: approvalOk });
  const evidence_explorer = nested({ explorer_id: evidenceExplorerOk ? "explorer:w2.16:evidence" : "", browsing: evidenceExplorerOk, packages: evidenceExplorerOk, lineage_visualization: evidenceExplorerOk, validation: evidenceExplorerOk, search: evidenceExplorerOk, timelines: evidenceExplorerOk, provenance_inspection: evidenceExplorerOk, immutable_references: evidenceExplorerOk, runtime_actions: evidenceExplorerOk, plans: evidenceExplorerOk, memories: evidenceExplorerOk, certifications: evidenceExplorerOk, replay_sessions: evidenceExplorerOk, safety_events: evidenceExplorerOk, policy_decisions: evidenceExplorerOk });
  const replay_explorer = nested({ explorer_id: replayExplorerOk ? "explorer:w2.16:replay" : "", replay_launch: replayExplorerOk, execution_playback: replayExplorerOk, timeline_navigation: replayExplorerOk, divergence_visualization: replayExplorerOk, decision_comparison: replayExplorerOk, evidence_overlay: replayExplorerOk, runtime_inspection: replayExplorerOk, state_comparison: replayExplorerOk, replay_reports: replayExplorerOk, read_only_by_default: replayExplorerOk, authorized_execution_only: replayExplorerOk });
  const certification_explorer = nested({ explorer_id: certificationExplorerOk ? "explorer:w2.16:certification" : "", agent_certifications: certificationExplorerOk, capability_certifications: certificationExplorerOk, skill_certifications: certificationExplorerOk, runtime_certifications: certificationExplorerOk, qualification_reports: certificationExplorerOk, certification_history: certificationExplorerOk, expiration_tracking: certificationExplorerOk, certification_evidence: certificationExplorerOk, certification_lineage: certificationExplorerOk, artifact_drilldown: certificationExplorerOk });
  const emergency_controls = nested({ panel_id: emergencyOk ? "panel:w2.16:emergency-controls" : "", emergency_stop: emergencyOk, runtime_suspension: emergencyOk, runtime_isolation: emergencyOk, mission_cancellation: emergencyOk, delegation_revocation: emergencyOk, operator_takeover: emergencyOk, quarantine: emergencyOk, safe_shutdown: emergencyOk, recovery_initiation: emergencyOk, constitutional_authority: emergencyOk, policy_validation: emergencyOk, safety_validation: emergencyOk, immutable_audit: emergencyOk, operator_authentication: emergencyOk, mfa_confirmation: emergencyOk, governance_bypass_prevented: emergencyOk });
  const governance_views = nested({ view_id: governanceOk ? "view:w2.16:governance" : "", authority_decisions: governanceOk, policy_decisions: governanceOk, safety_decisions: governanceOk, lifecycle_state: governanceOk, evidence: governanceOk, replay: governanceOk, certification: governanceOk, runtime_health: governanceOk, consolidated_visibility: governanceOk });
  const notifications = nested({ service_id: notificationOk ? "service:w2.16:notifications" : "", alerts: notificationOk, escalations: notificationOk, approval_requests: notificationOk, emergencies: notificationOk, certification_changes: notificationOk, deterministic_delivery: notificationOk, audit_recorded: notificationOk });
  const workspaces = nested({ workspace_id: workspacesOk ? "workspace:w2.16:operator" : "", workspaces: workspacesOk ? freezeArray(WORKSPACES) : freezeArray<OperatorWorkspace>([]), runtime_operations: workspacesOk, governance_review: workspacesOk, evidence_investigation: workspacesOk, replay_analysis: workspacesOk, certification_review: workspacesOk, collaboration_oversight: workspacesOk, delegation_management: workspacesOk, safety_monitoring: workspacesOk, policy_administration: workspacesOk, emergency_response: workspacesOk, tenant_isolated: workspacesOk });
  const security = nested({ security_id: securityOk ? "security:w2.16:operator-console" : "", authenticated_operators: securityOk, role_based_authorization: securityOk, authority_validation: securityOk, policy_validation: securityOk, safety_validation: securityOk, signed_actions: securityOk, immutable_audit_logging: securityOk, tenant_isolation: securityOk, no_governance_bypass: securityOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.16:operator-evidence" : "", records: evidenceOk ? freezeArray(["operator:actions", "operator:approvals", "operator:emergency", "operator:dashboard", "operator:replay", "operator:certification", "operator:governance", "operator:audit", "operator:session", "operator:operational"]) : freezeArray<string>([]), operator_actions: evidenceOk, approval_decisions: evidenceOk, emergency_actions: evidenceOk, dashboard_snapshots: evidenceOk, replay_sessions: evidenceOk, certification_reviews: evidenceOk, governance_reviews: evidenceOk, audit_records: evidenceOk, session_history: evidenceOk, operational_evidence: evidenceOk, immutable: evidenceOk, lineage_tracked: evidenceOk, replay_artifacts: evidenceOk });
  const readiness = nested({ readiness_id: "W2.16-OPERATOR-CONSOLE-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("W2_")), console_ready: consoleOk, dashboard_ready: dashboardOk, approval_ready: approvalOk, evidence_ready: evidenceExplorerOk, replay_ready: replayExplorerOk, certification_ready: certificationExplorerOk, emergency_ready: emergencyOk, governance_ready: governanceOk, notification_ready: notificationOk, workspaces_ready: workspacesOk, security_ready: securityOk, operational_evidence_ready: evidenceOk, qualification_ready: qualified, failures });
  const base: Omit<OperatorConsoleResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), console, dashboard, approval_queue, evidence_explorer, replay_explorer, certification_explorer, emergency_controls, governance_views, notifications, workspaces, security, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperatorConsole(result?: OperatorConsoleResult): OperatorConsoleValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, console_valid: false, dashboard_valid: false, approval_valid: false, evidence_explorer_valid: false, replay_explorer_valid: false, certification_explorer_valid: false, emergency_valid: false, governance_valid: false, notification_valid: false, workspaces_valid: false, security_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["OPERATOR_CONSOLE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const console_valid = verifyHashed(result.console) && result.console.advisory_supervisory_only && result.console.constitutional_bypass_prevented;
  const dashboard_valid = verifyHashed(result.dashboard) && result.dashboard.runtime_status && result.dashboard.policy_violations && result.dashboard.certification_status && result.dashboard.replay_availability && result.dashboard.realtime_visibility;
  const approval_valid = verifyHashed(result.approval_queue) && result.approval_queue.authority_source && result.approval_queue.evidence_references && result.approval_queue.digital_signature && result.approval_queue.timestamp;
  const evidence_explorer_valid = verifyHashed(result.evidence_explorer) && result.evidence_explorer.lineage_visualization && result.evidence_explorer.provenance_inspection && result.evidence_explorer.immutable_references;
  const replay_explorer_valid = verifyHashed(result.replay_explorer) && result.replay_explorer.divergence_visualization && result.replay_explorer.read_only_by_default && result.replay_explorer.authorized_execution_only;
  const certification_explorer_valid = verifyHashed(result.certification_explorer) && result.certification_explorer.qualification_reports && result.certification_explorer.certification_lineage && result.certification_explorer.artifact_drilldown;
  const emergency_valid = verifyHashed(result.emergency_controls) && result.emergency_controls.constitutional_authority && result.emergency_controls.policy_validation && result.emergency_controls.safety_validation && result.emergency_controls.immutable_audit && result.emergency_controls.governance_bypass_prevented;
  const governance_valid = verifyHashed(result.governance_views) && result.governance_views.authority_decisions && result.governance_views.policy_decisions && result.governance_views.safety_decisions && result.governance_views.consolidated_visibility;
  const notification_valid = verifyHashed(result.notifications) && result.notifications.alerts && result.notifications.escalations && result.notifications.deterministic_delivery && result.notifications.audit_recorded;
  const workspaces_valid = verifyHashed(result.workspaces) && result.workspaces.workspaces.length === 10 && result.workspaces.emergency_response && result.workspaces.tenant_isolated;
  const security_valid = verifyHashed(result.security) && result.security.authenticated_operators && result.security.role_based_authorization && result.security.authority_validation && result.security.policy_validation && result.security.safety_validation && result.security.signed_actions && result.security.tenant_isolation && result.security.no_governance_bypass;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 10 && result.evidence.operational_evidence && result.evidence.immutable && result.evidence.lineage_tracked && result.evidence.replay_artifacts;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.security_ready && result.readiness.operational_evidence_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && console_valid && dashboard_valid && approval_valid && evidence_explorer_valid && replay_explorer_valid && certification_explorer_valid && emergency_valid && governance_valid && notification_valid && workspaces_valid && security_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, console_valid, dashboard_valid, approval_valid, evidence_explorer_valid, replay_explorer_valid, certification_explorer_valid, emergency_valid, governance_valid, notification_valid, workspaces_valid, security_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayOperatorConsole(result = runOperatorConsole()): boolean { const replayed = runOperatorConsole(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperatorConsole(result).valid; }
export function getOperatorConsoleBundle(): OperatorConsoleBundle { const result = runOperatorConsole(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_human_control_surface: true, owns_operations_dashboard: true, owns_approval_queue: true, owns_evidence_explorer: true, owns_replay_explorer: true, owns_certification_explorer: true, owns_emergency_controls: true, advisory_supervisory_only: true, cannot_bypass_constitutional_governance: true, qualification_gate: "Operator Console Qualification Gate" }), result, validation: validateOperatorConsole(result) }); }
export const OperatorConsoleService = Object.freeze({ run: runOperatorConsole, validate: validateOperatorConsole, replay: replayOperatorConsole });
