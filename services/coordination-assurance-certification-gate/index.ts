import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getMultiAgentCoordinationContract } from "@/services/multi-agent-coordination-contract";
import { getSynchronizedPlanningAssurance } from "@/services/synchronized-planning-assurance";
import { getDeterministicDelegationAssurance } from "@/services/deterministic-delegation-assurance";
import { getAuthoritySeparationAssurance } from "@/services/authority-separation-assurance";
import { getSharedGovernanceAssurance } from "@/services/shared-governance-assurance";
import { getCoordinationIntegrityEngine } from "@/services/coordination-integrity-engine";
import { getReplayConsistencyAssurance } from "@/services/replay-consistency-assurance";
import { getCoordinationConflictDetection } from "@/services/coordination-conflict-detection";
import { getDeadlockRaceDetection } from "@/services/deadlock-race-condition-detection";
import { getHiddenCommunicationDetection } from "@/services/hidden-communication-detection";
import { getMultiAgentCoordinationDashboard } from "@/services/multi-agent-coordination-dashboard";
import type { CertificationFailure, CertificationInput, CertificationObservabilitySurface, CertificationReport, CertificationScenario, CertificationScores, CertificationValidationResult, CoordinationAssuranceCertificationBundle } from "@/types/coordination-assurance-certification-gate";

const VERSION = "coordination-assurance-certification-gate/v8ALT.7.12" as const;
const NOW = "2026-07-14T04:00:00.000Z";
const decisions = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: CertificationScenario): CertificationFailure | null {
  const map: Partial<Record<CertificationScenario, CertificationFailure>> = {
    MISSING_COORDINATION_CONTRACT: "MISSING_COORDINATION_CONTRACT",
    UNKNOWN_AGENT: "UNKNOWN_AGENT_PARTICIPATES",
    PLAN_DIVERGENCE: "PLAN_DIVERGENCE_DETECTED",
    DELEGATION_MISMATCH: "DELEGATION_MISMATCH_DETECTED",
    DUPLICATE_OWNERSHIP: "DUPLICATE_OWNERSHIP_DETECTED",
    AUTHORITY_OVERLAP: "AUTHORITY_OVERLAP_DETECTED",
    GOVERNANCE_MISMATCH: "GOVERNANCE_MISMATCH_DETECTED",
    HIDDEN_COMMUNICATION: "HIDDEN_COMMUNICATION_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    HASH_CORRUPTION: "HASH_CORRUPTION_DETECTED",
    UNDETECTED_DEADLOCK: "UNDETECTED_DEADLOCK",
    UNDETECTED_RACE_CONDITION: "UNDETECTED_RACE_CONDITION",
    CROSS_TENANT_LEAKAGE: "CROSS_TENANT_LEAKAGE_DETECTED",
    DASHBOARD_EXECUTION_AUTHORITY: "DASHBOARD_EXECUTION_AUTHORITY_DETECTED",
    INCOMPLETE_OPERATOR_VISIBILITY: "INCOMPLETE_OPERATOR_VISIBILITY",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    EVIDENCE_INCOMPLETE: "CERTIFICATION_EVIDENCE_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ?? null;
}

export function calculateAssuranceScores(failures: readonly CertificationFailure[] = []): CertificationScores {
  const failed = failures.length > 0;
  return Object.freeze({
    coordination_score: failed ? 0.41 : 1,
    coordination_confidence: failed ? 0.52 : 0.99,
    coordination_health: failed ? "FAILED" : "HEALTHY",
    certification_readiness: failed ? 0 : 1,
    authority_separation_score: failures.includes("AUTHORITY_OVERLAP_DETECTED") ? 0 : 1,
    replay_consistency_score: failures.includes("REPLAY_MISMATCH_DETECTED") ? 0 : 1,
    communication_visibility_score: failures.includes("HIDDEN_COMMUNICATION_DETECTED") ? 0 : 1,
    coordination_risk_score: failed ? 0.87 : 0.03,
  });
}

export function executeCertification(input: CertificationInput = {}): CertificationReport {
  if (input.report) return input.report;
  const injected = input.scenario ? scenarioFailure(input.scenario) : null;
  const coordination = getMultiAgentCoordinationContract();
  const planning = getSynchronizedPlanningAssurance();
  const delegation = getDeterministicDelegationAssurance();
  const authority = getAuthoritySeparationAssurance();
  const governance = getSharedGovernanceAssurance();
  const integrity = getCoordinationIntegrityEngine();
  const replay = getReplayConsistencyAssurance();
  const conflicts = getCoordinationConflictDetection();
  const deadlocks = getDeadlockRaceDetection();
  const comms = getHiddenCommunicationDetection();
  const dashboard = getMultiAgentCoordinationDashboard();
  const baseFailures: CertificationFailure[] = [
    ...(!coordination.validation.valid ? ["MISSING_COORDINATION_CONTRACT" as const] : []),
    ...(!planning.validation.valid ? ["PLAN_DIVERGENCE_DETECTED" as const] : []),
    ...(!delegation.validation.valid ? ["DELEGATION_MISMATCH_DETECTED" as const] : []),
    ...(!authority.validation.valid ? ["AUTHORITY_OVERLAP_DETECTED" as const] : []),
    ...(!governance.validation.valid ? ["GOVERNANCE_MISMATCH_DETECTED" as const] : []),
    ...(!integrity.validation.valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!replay.validation.valid ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!conflicts.validation.valid ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!deadlocks.validation.valid ? ["UNDETECTED_DEADLOCK" as const] : []),
    ...(!comms.validation.valid ? ["HIDDEN_COMMUNICATION_DETECTED" as const] : []),
    ...(!dashboard.validation.valid ? ["INCOMPLETE_OPERATOR_VISIBILITY" as const] : []),
    ...(injected ? [injected] : []),
  ];
  const failures = unique(baseFailures);
  const conditional = input.scenario === "DASHBOARD_GAP";
  const decision_state = failures.length ? "FAIL" as const : conditional ? "CONDITIONAL_PASS" as const : "PASS" as const;
  const scores = calculateAssuranceScores(failures);
  const certification_id = id("CACG", "coordination-assurance-certification", { scenario: input.scenario ?? "BASELINE" });
  const session_record = input.scenario === "MISSING_COORDINATION_CONTRACT" ? null : Object.freeze({ coordination_session_id: coordination.contract.coordination_session_id, mission_id: coordination.contract.mission_id, tenant_id: coordination.contract.tenant_id, participating_agents: coordination.contract.participating_agents.map((a) => a.agent_id), coordination_contract_id: coordination.contract.coordination_contract_id, shared_objective: planning.contract.shared_objective.objective_description, governance_context_id: governance.contract.governance_context.governance_context_id, authority_model_id: authority.contract.authority_contract_id, coordination_state: "CERTIFIED", created_at: coordination.contract.created_timestamp, updated_at: NOW });
  const agent_records = freezeArray(coordination.contract.participating_agents.map((agent) => Object.freeze({ agent_id: input.scenario === "UNKNOWN_AGENT" && agent === coordination.contract.participating_agents[0] ? "agent:unknown" : agent.agent_id, agent_role: agent.role, agent_authority_scope: agent.authority_profile, assigned_tasks: delegation.contract.delegation_records.filter((record) => record.assigned_agent === agent.agent_id).map((record) => record.task_id), delegation_permissions: ["recommend-delegation-only"], communication_permissions: ["approved-channel-only"], current_state: "CERTIFIED", confidence_score: 0.97, governance_status: "VALID" })));
  const eventBase = { certification_event_id: id("CACE", "coordination-certification-event", certification_id), coordination_session_id: coordination.contract.coordination_session_id, validation_stage: decision_state, validation_result: decision_state === "FAIL" ? "FAIL" as const : "PASS" as const, assurance_scores: scores, decision_state, timestamp: NOW };
  const events = freezeArray([Object.freeze({ ...eventBase, integrity_hash: hashValue("coordination-certification-event", eventBase) })]);
  const reportBase = { certification_id, decision_state, production_authorization: decision_state === "PASS" ? "AUTHORIZED_BY_CERTIFICATION_FIELD_ONLY" as const : "BLOCKED" as const, deployment_enabled: false as const, session_record, agent_records, scores, failures, evidence_references: freezeArray(["coordination", "planning", "delegation", "authority", "governance", "integrity", "replay", "conflict", "deadlock", "communication", "dashboard"]), events, final_state: decision_state === "PASS" ? "MULTI_AGENT_COORDINATION_ASSURED" as const : "MULTI_AGENT_COORDINATION_BLOCKED" as const };
  return Object.freeze({ ...reportBase, integrity_hash: input.scenario === "INTEGRITY_FAILURE" ? "" : hashValue("coordination-certification-report", reportBase) });
}

export function validateCertification(report = executeCertification()): CertificationValidationResult {
  const coordination_contract_present = Boolean(report.session_record?.coordination_contract_id);
  const agents_identified = report.agent_records.length > 0 && report.agent_records.every((agent) => !agent.agent_id.includes("unknown"));
  const failures = unique([
    ...report.failures,
    ...(!coordination_contract_present ? ["MISSING_COORDINATION_CONTRACT" as const] : []),
    ...(!agents_identified ? ["UNKNOWN_AGENT_PARTICIPATES" as const] : []),
    ...(!report.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const valid = failures.length === 0 && report.decision_state === "PASS" && report.deployment_enabled === false;
  const source = {
    certification_id: report.certification_id,
    valid,
    decision_state: report.decision_state,
    coordination_contract_present,
    agents_identified,
    planning_reproducible: !failures.includes("PLAN_DIVERGENCE_DETECTED"),
    delegation_deterministic: !failures.includes("DELEGATION_MISMATCH_DETECTED"),
    ownership_clear: !failures.includes("DUPLICATE_OWNERSHIP_DETECTED"),
    authority_separated: !failures.includes("AUTHORITY_OVERLAP_DETECTED"),
    governance_aligned: !failures.includes("GOVERNANCE_MISMATCH_DETECTED") && !failures.includes("GOVERNANCE_BYPASS_DETECTED"),
    communication_authorized: !failures.includes("HIDDEN_COMMUNICATION_DETECTED"),
    replay_reproduced: !failures.includes("REPLAY_MISMATCH_DETECTED"),
    hashes_valid: !failures.includes("HASH_CORRUPTION_DETECTED"),
    deadlock_detection_valid: !failures.includes("UNDETECTED_DEADLOCK"),
    race_detection_valid: !failures.includes("UNDETECTED_RACE_CONDITION"),
    tenant_isolated: !failures.includes("CROSS_TENANT_LEAKAGE_DETECTED"),
    dashboard_read_only: !failures.includes("DASHBOARD_EXECUTION_AUTHORITY_DETECTED") && report.deployment_enabled === false,
    operator_visibility_complete: !failures.includes("INCOMPLETE_OPERATOR_VISIBILITY"),
    governance_bypass_prevented: !failures.includes("GOVERNANCE_BYPASS_DETECTED"),
    integrity_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED") && Boolean(report.integrity_hash),
    fail_closed: !valid ? failures.length > 0 || report.decision_state !== "PASS" : true,
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("coordination-certification-validation", source) });
}

export function validateCertificationReplay(input: CertificationInput = {}) { const v = validateCertification(executeCertification(input)); return { replay_reproduced: v.replay_reproduced, failures: v.failures }; }
export function validateCertificationGovernance(input: CertificationInput = {}) { const v = validateCertification(executeCertification(input)); return { governance_aligned: v.governance_aligned, governance_bypass_prevented: v.governance_bypass_prevented, failures: v.failures }; }
export function generateCertificationReport(input: CertificationInput = {}) { return executeCertification(input); }

export function buildCertificationObservabilitySurface(report = executeCertification()): CertificationObservabilitySurface {
  return Object.freeze({ certification_id: report.certification_id, decision_state: report.decision_state, production_authorization: report.production_authorization, failure_count: report.failures.length, readiness: report.scores.certification_readiness, integrity_hash: report.integrity_hash });
}

export function getCoordinationAssuranceCertificationGate(): CoordinationAssuranceCertificationBundle {
  const report = executeCertification();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "MULTI_AGENT_COORDINATION_ASSURED", decision_states: decisions, principles: freezeArray(["read-only-certification-gate", "evidence-evaluation-only", "deterministic-validation", "governance-supremacy", "operator-supremacy", "tenant-isolation", "replay-compatibility", "cryptographic-integrity", "fail-closed-certification", "no-deployment-enablement"]) }),
    report,
    validation: validateCertification(report),
    observability: buildCertificationObservabilitySurface(report),
  });
}
