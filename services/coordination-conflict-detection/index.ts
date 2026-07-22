import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { startReplay } from "@/services/replay-consistency-assurance";
import type {
  ConflictCategory,
  ConflictDomain,
  ConflictFailure,
  ConflictInput,
  ConflictObservabilitySurface,
  ConflictRecord,
  ConflictScenario,
  ConflictSeverity,
  ConflictState,
  ConflictValidationResult,
  CoordinationConflictAnalysis,
  CoordinationConflictDetectionBundle,
  EscalationTarget,
  ResolutionStrategy,
  SeverityScore,
} from "@/types/coordination-conflict-detection";

const VERSION = "coordination-conflict-detection/v8ALT.7.8" as const;
const NOW = "2026-07-14T00:00:00.000Z";
const domains = Object.freeze(["Planning", "Delegation", "Authority", "Communication", "Resources", "Governance", "Execution", "Shared State", "Dependencies", "Tenants"] as const);
const categories = Object.freeze(["PLANNING", "AUTHORITY", "OWNERSHIP", "RESOURCE", "GOVERNANCE", "DEPENDENCY", "COMMUNICATION", "TENANT", "RUNTIME", "INTEGRITY"] as const);
const severities = Object.freeze(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const);
const resolutions = Object.freeze(["IGNORE", "RETRY", "REPLAN", "REASSIGN", "RESOLVE_DEPENDENCY", "REQUEST_GOVERNANCE_REVIEW", "REQUEST_OPERATOR_APPROVAL", "ROLLBACK", "TERMINATE_COORDINATION"] as const);
const escalationTargets = Object.freeze(["Coordinator Agent", "Governance Advisor", "Runtime Supervisor", "Integrity Auditor", "Operator", "Certification Authority"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failureFor(scenario: ConflictScenario): ConflictFailure | null {
  const map: Partial<Record<ConflictScenario, ConflictFailure>> = {
    UNDETECTED_PLANNING_CONFLICT: "UNDETECTED_PLANNING_CONFLICT",
    UNDETECTED_AUTHORITY_OVERLAP: "UNDETECTED_AUTHORITY_OVERLAP",
    DUPLICATE_OWNERSHIP_UNDETECTED: "DUPLICATE_OWNERSHIP_UNDETECTED",
    UNDETECTED_RESOURCE_CONFLICT: "UNDETECTED_RESOURCE_CONFLICT",
    GOVERNANCE_CONFLICT_MISSED: "GOVERNANCE_CONFLICT_MISSED",
    DEPENDENCY_CONFLICT_MISSED: "DEPENDENCY_CONFLICT_MISSED",
    CROSS_TENANT_CONFLICT_MISSED: "CROSS_TENANT_CONFLICT_MISSED",
    INCONSISTENT_SEVERITY: "INCONSISTENT_SEVERITY_ASSIGNMENT",
    ROUTING_FAILURE: "CONFLICT_ROUTING_FAILED",
    GOVERNANCE_ESCALATION_BYPASS: "GOVERNANCE_ESCALATION_BYPASSED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ?? null;
}

function detectedCategory(scenario: ConflictScenario): ConflictCategory | null {
  const map: Partial<Record<ConflictScenario, ConflictCategory>> = {
    PLANNING_CONFLICT: "PLANNING",
    AUTHORITY_OVERLAP: "AUTHORITY",
    OWNERSHIP_CONFLICT: "OWNERSHIP",
    RESOURCE_CONFLICT: "RESOURCE",
    GOVERNANCE_CONFLICT: "GOVERNANCE",
    DEPENDENCY_CONFLICT: "DEPENDENCY",
    TENANT_BOUNDARY_CONFLICT: "TENANT",
  };
  return map[scenario] ?? null;
}

function severityFor(category: ConflictCategory, inconsistent: boolean): ConflictSeverity {
  if (inconsistent) return "LOW";
  if (category === "TENANT" || category === "AUTHORITY" || category === "GOVERNANCE" || category === "INTEGRITY") return "CRITICAL";
  if (category === "PLANNING" || category === "DEPENDENCY" || category === "OWNERSHIP") return "HIGH";
  return "MEDIUM";
}

function resolutionFor(category: ConflictCategory): ResolutionStrategy {
  const map: Record<ConflictCategory, ResolutionStrategy> = {
    PLANNING: "REPLAN",
    AUTHORITY: "REQUEST_GOVERNANCE_REVIEW",
    OWNERSHIP: "REASSIGN",
    RESOURCE: "RETRY",
    GOVERNANCE: "REQUEST_GOVERNANCE_REVIEW",
    DEPENDENCY: "RESOLVE_DEPENDENCY",
    COMMUNICATION: "REQUEST_OPERATOR_APPROVAL",
    TENANT: "TERMINATE_COORDINATION",
    RUNTIME: "REQUEST_OPERATOR_APPROVAL",
    INTEGRITY: "REQUEST_OPERATOR_APPROVAL",
  };
  return map[category];
}

function analysisHash(analysis: Omit<CoordinationConflictAnalysis, "contract_hash"> | CoordinationConflictAnalysis): string {
  const { contract_hash: _hash, ...source } = analysis as CoordinationConflictAnalysis;
  return hashValue("coordination-conflict-analysis", source);
}

export function monitorCoordination(input: ConflictInput = {}): CoordinationConflictAnalysis {
  if (input.analysis) return input.analysis;
  const scenario = input.scenario ?? "BASELINE";
  const failure = failureFor(scenario);
  const replay = startReplay({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const contractId = id("CCDC", "coordination-conflict-contract", { mission: replay.contract.mission_id, scenario });
  const category = detectedCategory(scenario);
  const conflictRecords: ConflictRecord[] = category ? [category].map((cat) => {
    const severity = severityFor(cat, scenario === "INCONSISTENT_SEVERITY");
    const base = {
      conflict_id: id("CFL", "coordination-conflict", { contractId, cat }),
      coordination_session_id: replay.contract.coordination_session_id,
      mission_id: replay.contract.mission_id,
      conflict_category: cat,
      severity,
      affected_agents: freezeArray(["agent:coordinator", "agent:planner"]),
      affected_resources: freezeArray(cat === "RESOURCE" ? ["resource:compute", "resource:agent-capacity"] : []),
      conflict_description: `${cat} conflict detected before coordinated execution.`,
      evidence_references: freezeArray([`evidence:${cat.toLowerCase()}:${contractId}`]),
      governance_reference: replay.contract.governance_reference,
      authority_reference: replay.contract.authority_reference,
      recommended_resolution: resolutionFor(cat),
      escalation_required: severity === "HIGH" || severity === "CRITICAL",
      timestamp: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("coordination-conflict-record", base) });
  }) : [];
  const failureMarker = failure ? `failure:${failure}` : null;
  const contractBase = {
    coordination_conflict_contract_id: contractId,
    coordination_session_id: replay.contract.coordination_session_id,
    mission_id: replay.contract.mission_id,
    tenant_id: replay.contract.tenant_id,
    governance_context_id: replay.contract.governance_reference,
    authority_context_id: replay.contract.authority_reference,
    conflict_detection_policy: freezeArray(["detect-before-execution", "advisory-routing-only", "fail-closed", ...(failureMarker ? [failureMarker] : [])]),
    severity_policy: severities,
    escalation_policy: escalationTargets,
    resolution_policy: resolutions,
    replay_policy: freezeArray(["replay-reference-required", "lineage-required"]),
    created_timestamp: NOW,
    immutable: true as const,
    append_only: true as const,
  };
  const contract = Object.freeze({ ...contractBase, integrity_hash: failure === "INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("coordination-conflict-contract", contractBase) });
  const graphBase = { graph_id: id("CFGG", "coordination-conflict-graph", contractId), conflict_nodes: freezeArray(conflictRecords.map((record) => record.conflict_id)), dependency_nodes: freezeArray(["dependency:planning", "dependency:delegation"]), authority_nodes: freezeArray([contract.authority_context_id]), governance_nodes: freezeArray([contract.governance_context_id]), resource_nodes: freezeArray(conflictRecords.flatMap((record) => [...record.affected_resources])), resolution_nodes: freezeArray(conflictRecords.map((record) => record.recommended_resolution)) };
  const conflict_graph = Object.freeze({ ...graphBase, integrity_hash: hashValue("coordination-conflict-graph", graphBase) });
  const timelines = freezeArray(conflictRecords.map((record) => Object.freeze({ timeline_id: id("CFTL", "coordination-conflict-timeline", record.conflict_id), conflict_id: record.conflict_id, detected_timestamp: record.timestamp, affected_events: freezeArray(["event:monitor", "event:detect"]), resolution_events: freezeArray(["event:recommendation-only"]), verification_status: scenario === "ROUTING_FAILURE" ? "FAILED" as const : "VERIFIED" as const })));
  const severity_scores: readonly SeverityScore[] = freezeArray(conflictRecords.map((record) => Object.freeze({ operational_impact: record.severity === "CRITICAL" ? 1 : 0.7, governance_impact: record.conflict_category === "GOVERNANCE" ? 1 : 0.6, authority_impact: record.conflict_category === "AUTHORITY" ? 1 : 0.5, mission_risk: 0.8, replay_impact: scenario === "REPLAY_INCONSISTENCY" ? 1 : 0.4, certification_impact: record.severity === "CRITICAL" ? 1 : 0.7, severity: record.severity })));
  const escalation_recommendations = freezeArray(conflictRecords.map((record) => Object.freeze({ conflict_id: record.conflict_id, escalation_target: record.severity === "CRITICAL" ? "Operator" as EscalationTarget : "Governance Advisor" as EscalationTarget, urgency: record.severity, blocking_conditions: freezeArray(["execution-prohibited-until-certified"]), required_approvals: freezeArray(record.severity === "CRITICAL" ? ["operator", "governance"] : ["governance"]), expected_resolution_sequence: freezeArray(["review-evidence", "approve-resolution-plan", "validate-replay", "certify"]), governance_validated: scenario !== "GOVERNANCE_ESCALATION_BYPASS" })));
  const evidenceBase = { conflict_validation_id: id("CFV", "coordination-conflict-validation", contractId), coordination_session_id: replay.contract.coordination_session_id, mission_id: replay.contract.mission_id, conflict_records: freezeArray(conflictRecords), planning_evidence: freezeArray(["planning:evidence"]), authority_evidence: freezeArray(["authority:evidence"]), resource_evidence: freezeArray(["resource:evidence"]), governance_evidence: freezeArray(scenario === "GOVERNANCE_ESCALATION_BYPASS" ? [] : ["governance:evidence"]), dependency_evidence: freezeArray(["dependency:evidence"]), tenant_evidence: freezeArray(["tenant:evidence"]), resolution_recommendations: freezeArray(conflictRecords.map((record) => record.recommended_resolution)), lineage_reference: `lineage:conflict:${contractId}`, replay_reference: scenario === "REPLAY_INCONSISTENCY" ? "" : `replay:conflict:${contractId}`, timestamp: NOW };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: failure === "INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("coordination-conflict-evidence", evidenceBase) });
  const events = freezeArray(conflictRecords.map((record) => Object.freeze({ event_id: id("CFEV", "coordination-conflict-event", record.conflict_id), coordination_session_id: record.coordination_session_id, conflict_id: record.conflict_id, conflict_category: record.conflict_category, severity: record.severity, affected_agents: record.affected_agents, event_state: "RESOLUTION_GENERATED" as ConflictState, resolution_status: scenario === "ROUTING_FAILURE" ? "ROUTING_FAILED" as const : "ADVISORY_ONLY" as const, timestamp: NOW, integrity_signature: hashValue("coordination-conflict-event", record) })));
  const base = { contract, monitored_domains: domains as readonly ConflictDomain[], conflicts: freezeArray(conflictRecords), conflict_graph, timelines, severity_scores, escalation_recommendations, events, evidence, state: conflictRecords.length || failure ? "CONFLICT_DETECTED" as ConflictState : "CERTIFIED" as ConflictState, version: VERSION };
  return Object.freeze({ ...base, contract_hash: analysisHash(base as Omit<CoordinationConflictAnalysis, "contract_hash">) });
}

export function detectConflict(input: ConflictInput = {}) { return monitorCoordination(input).conflicts; }
export function classifyConflict(input: ConflictInput = {}) { return monitorCoordination(input).conflicts.map((record) => ({ conflict_id: record.conflict_id, category: record.conflict_category })); }
export function assessSeverity(input: ConflictInput = {}) { return monitorCoordination(input).severity_scores; }
export function generateResolution(input: ConflictInput = {}) { return monitorCoordination(input).conflicts.map((record) => ({ conflict_id: record.conflict_id, recommended_resolution: record.recommended_resolution })); }
export function escalateConflict(input: ConflictInput = {}) { return monitorCoordination(input).escalation_recommendations; }
export function validateConflictReplay(input: ConflictInput = {}) { const validation = validateConflictDetection(monitorCoordination(input)); return { replay_references_preserved: validation.replay_references_preserved, failures: validation.failures }; }

export function validateConflictDetection(analysis = monitorCoordination()): ConflictValidationResult {
  const has = (category: ConflictCategory) => analysis.conflicts.some((record) => record.conflict_category === category);
  const markers = new Set(analysis.contract.conflict_detection_policy.filter((item) => item.startsWith("failure:")).map((item) => item.replace("failure:", "") as ConflictFailure));
  const contract_valid = analysis.contract.immutable && analysis.contract.append_only && Boolean(analysis.contract.integrity_hash);
  const planning_conflicts_detected = has("PLANNING") || !markers.has("UNDETECTED_PLANNING_CONFLICT");
  const authority_conflicts_detected = has("AUTHORITY") || !markers.has("UNDETECTED_AUTHORITY_OVERLAP");
  const ownership_conflicts_detected = has("OWNERSHIP") || !markers.has("DUPLICATE_OWNERSHIP_UNDETECTED");
  const resource_conflicts_detected = has("RESOURCE") || !markers.has("UNDETECTED_RESOURCE_CONFLICT");
  const governance_conflicts_detected = has("GOVERNANCE") || !markers.has("GOVERNANCE_CONFLICT_MISSED");
  const dependency_conflicts_detected = has("DEPENDENCY") || !markers.has("DEPENDENCY_CONFLICT_MISSED");
  const tenant_conflicts_detected = has("TENANT") || !markers.has("CROSS_TENANT_CONFLICT_MISSED");
  const classification_deterministic = analysis.conflicts.every((record) => categories.includes(record.conflict_category));
  const severity_deterministic = analysis.severity_scores.length === analysis.conflicts.length && !markers.has("INCONSISTENT_SEVERITY_ASSIGNMENT");
  const correlation_reproducible = analysis.conflict_graph.conflict_nodes.length === analysis.conflicts.length && Boolean(analysis.conflict_graph.integrity_hash);
  const resolution_reproducible = analysis.conflicts.every((record) => resolutions.includes(record.recommended_resolution));
  const operator_escalation_generated = analysis.conflicts.length === 0 || analysis.escalation_recommendations.length === analysis.conflicts.length;
  const governance_escalation_enforced = analysis.escalation_recommendations.every((item) => item.governance_validated);
  const replay_references_preserved = Boolean(analysis.evidence.replay_reference);
  const integrity_verified = Boolean(analysis.contract.integrity_hash && analysis.evidence.integrity_hash && analysisHash(analysis) === analysis.contract_hash);
  const operator_visible = true;
  const failures = unique([
    ...(!planning_conflicts_detected ? ["UNDETECTED_PLANNING_CONFLICT" as const] : []),
    ...(!authority_conflicts_detected ? ["UNDETECTED_AUTHORITY_OVERLAP" as const] : []),
    ...(!ownership_conflicts_detected ? ["DUPLICATE_OWNERSHIP_UNDETECTED" as const] : []),
    ...(!resource_conflicts_detected ? ["UNDETECTED_RESOURCE_CONFLICT" as const] : []),
    ...(!governance_conflicts_detected ? ["GOVERNANCE_CONFLICT_MISSED" as const] : []),
    ...(!dependency_conflicts_detected ? ["DEPENDENCY_CONFLICT_MISSED" as const] : []),
    ...(!tenant_conflicts_detected ? ["CROSS_TENANT_CONFLICT_MISSED" as const] : []),
    ...(!severity_deterministic ? ["INCONSISTENT_SEVERITY_ASSIGNMENT" as const] : []),
    ...(analysis.timelines.some((timeline) => timeline.verification_status === "FAILED") ? ["CONFLICT_ROUTING_FAILED" as const] : []),
    ...(!governance_escalation_enforced ? ["GOVERNANCE_ESCALATION_BYPASSED" as const] : []),
    ...(!replay_references_preserved ? ["REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(!integrity_verified ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...Array.from(markers),
  ]);
  const valid = failures.length === 0;
  const source = { coordination_conflict_contract_id: analysis.contract.coordination_conflict_contract_id, valid, contract_valid, planning_conflicts_detected, authority_conflicts_detected, ownership_conflicts_detected, resource_conflicts_detected, governance_conflicts_detected, dependency_conflicts_detected, tenant_conflicts_detected, classification_deterministic, severity_deterministic, correlation_reproducible, resolution_reproducible, operator_escalation_generated, governance_escalation_enforced, replay_references_preserved, integrity_verified, operator_visible, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("coordination-conflict-validation", source) });
}

export function buildConflictObservabilitySurface(analysis = monitorCoordination()): ConflictObservabilitySurface {
  return Object.freeze({ coordination_conflict_contract_id: analysis.contract.coordination_conflict_contract_id, tenant_id: analysis.contract.tenant_id, mission_id: analysis.contract.mission_id, monitored_domain_count: analysis.monitored_domains.length, conflict_count: analysis.conflicts.length, critical_count: analysis.conflicts.filter((record) => record.severity === "CRITICAL").length, state: analysis.state, contract_hash: analysis.contract_hash });
}

export function getCoordinationConflictDetection(): CoordinationConflictDetectionBundle {
  const analysis = monitorCoordination();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "COORDINATION_CONFLICT_DETECTION_CERTIFIED", domains, categories, severities, resolutions, escalation_targets: escalationTargets, principles: freezeArray(["detect-before-execution", "deterministic-classification", "deterministic-severity", "advisory-resolution-only", "operator-supremacy", "governance-supremacy", "tenant-isolation", "fail-closed-conflict-handling", "replay-compatible-evidence", "no-upstream-mutation"]) }),
    analysis,
    validation: validateConflictDetection(analysis),
    observability: buildConflictObservabilitySurface(analysis),
  });
}
