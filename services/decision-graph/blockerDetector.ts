import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
} from "./decisionGraphContractRoadmap";
import type {
  BlockerDetectorInput,
  BlockerDetectorReasonCode,
  BlockerDetectorResult,
  BlockerExplanation,
  BlockerLedgerRecord,
  BlockerRecord,
  BlockerSignal,
  DecisionBlockerType,
  DecisionConflictSeverity,
  DecisionGraphRoadmapNodeInput,
  DecisionRelationshipRecord,
} from "./types";

export const BLOCKER_DETECTOR_VERSION = "decision-blocker-detector/v1";
const BLOCKER_TIMESTAMP_REF = "blocker-ledger-timestamp-ref";

const SEVERITY_BY_TYPE: Readonly<Record<DecisionBlockerType, DecisionConflictSeverity>> = Object.freeze({
  GOVERNANCE_BLOCKER: "HIGH",
  AUTHORITY_BLOCKER: "CRITICAL",
  REPLAY_BLOCKER: "HIGH",
  CERTIFICATION_BLOCKER: "HIGH",
  RECOVERY_BLOCKER: "MEDIUM",
  DEPENDENCY_BLOCKER: "HIGH",
  CONFLICT_BLOCKER: "CRITICAL",
  SIMULATION_BLOCKER: "MEDIUM",
  EVIDENCE_BLOCKER: "MEDIUM",
  MISSION_BLOCKER: "HIGH",
});

const REASON_BY_TYPE: Readonly<Record<DecisionBlockerType, BlockerDetectorReasonCode>> = Object.freeze({
  GOVERNANCE_BLOCKER: "GOVERNANCE_REVIEW_PENDING_DETECTED",
  AUTHORITY_BLOCKER: "OPERATOR_APPROVAL_PENDING_DETECTED",
  REPLAY_BLOCKER: "REPLAY_REFERENCE_UNAVAILABLE_DETECTED",
  CERTIFICATION_BLOCKER: "CERTIFICATION_NOT_PASSED_DETECTED",
  RECOVERY_BLOCKER: "RECOVERY_PLAN_MISSING_DETECTED",
  DEPENDENCY_BLOCKER: "DEPENDENCY_UNRESOLVED_DETECTED",
  CONFLICT_BLOCKER: "CONFLICT_UNRESOLVED_DETECTED",
  SIMULATION_BLOCKER: "SIMULATION_NOT_EXECUTED_DETECTED",
  EVIDENCE_BLOCKER: "DEPENDENCY_VALIDATION_INCOMPLETE",
  MISSION_BLOCKER: "DEPENDENCY_VALIDATION_INCOMPLETE",
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: BlockerDetectorReasonCode[], reason: BlockerDetectorReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function recordHash(record: Omit<BlockerRecord, "integrity_hash"> | BlockerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as BlockerRecord;
  return hash(hashable);
}

function explanationHash(explanation: Omit<BlockerExplanation, "integrity_hash"> | BlockerExplanation): string {
  const { integrity_hash: _ignored, ...hashable } = explanation as BlockerExplanation;
  return hash(hashable);
}

function ledgerHash(record: Omit<BlockerLedgerRecord, "integrity_hash"> | BlockerLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as BlockerLedgerRecord;
  return hash(hashable);
}

function resultHash(result: Omit<BlockerDetectorResult, "integrity_hash"> | BlockerDetectorResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as BlockerDetectorResult;
  return hash(hashable);
}

function relationshipIntegrityHash(relationship: DecisionRelationshipRecord): string {
  const { integrity_hash: _ignored, ...hashable } = relationship;
  return hash(hashable);
}

function nodeMap(nodes: readonly DecisionGraphRoadmapNodeInput[]): Map<string, DecisionGraphRoadmapNodeInput> {
  return new Map(nodes.map((node) => [node.node_id, node]));
}

function blockerKey(signal: BlockerSignal): string {
  return [
    signal.node_id,
    signal.blocker_type,
    signal.required_action,
    hash({
      blocking_dependency_refs: normalizeStrings(signal.blocking_dependency_refs),
      governance_refs: normalizeStrings(signal.governance_refs),
      replay_refs: normalizeStrings(signal.replay_refs),
      evidence_refs: normalizeStrings(signal.evidence_refs),
    }),
  ].join("|");
}

function blockerId(graphId: string, signal: BlockerSignal, detectorVersion: string): string {
  return `blocker_${hash({ graph_id: graphId, key: blockerKey(signal), detector_version: detectorVersion }).slice(0, 32)}`;
}

function signalFromRelationship(relationship: DecisionRelationshipRecord): BlockerSignal | undefined {
  const base = {
    node_id: relationship.source_node_id,
    blocking_dependency_refs: [relationship.relationship_id],
    governance_refs: relationship.governance_refs,
    authority_refs: relationship.relationship_type === "requires_operator_approval" ? relationship.target_candidate_refs : [],
    replay_refs: relationship.replay_refs,
    evidence_refs: relationship.source_candidate_refs,
  };
  if (relationship.relationship_type === "requires_operator_approval") {
    return Object.freeze({ ...base, blocker_type: "AUTHORITY_BLOCKER", blocking_reason: "Operator approval is pending.", required_action: "obtain_operator_approval" });
  }
  if (relationship.relationship_type === "requires_governance_review") {
    return Object.freeze({ ...base, blocker_type: "GOVERNANCE_BLOCKER", blocking_reason: "Governance review is pending.", required_action: "complete_governance_review" });
  }
  if (relationship.relationship_type === "requires_simulation") {
    return Object.freeze({ ...base, blocker_type: "SIMULATION_BLOCKER", blocking_reason: "Simulation prerequisite is incomplete.", required_action: "complete_required_simulation" });
  }
  if (relationship.relationship_type === "requires_recovery_plan") {
    return Object.freeze({ ...base, blocker_type: "RECOVERY_BLOCKER", blocking_reason: "Recovery plan is missing.", required_action: "complete_recovery_plan" });
  }
  if (relationship.relationship_type === "requires_certification") {
    return Object.freeze({ ...base, blocker_type: "CERTIFICATION_BLOCKER", blocking_reason: "Certification gate has not passed.", required_action: "complete_certification_gate" });
  }
  return undefined;
}

function signalsFromDependency(input: BlockerDetectorInput): BlockerSignal[] {
  const result = input.dependency_validation;
  if (!result) return [];
  return [
    ...result.validation_records
      .filter((record) => record.dependency_status !== "COMPLETE")
      .map((record): BlockerSignal => Object.freeze({
        node_id: record.node_id,
        blocker_type: record.replay_status === "MISSING" || record.replay_status === "MISMATCH" ? "REPLAY_BLOCKER" : "DEPENDENCY_BLOCKER",
        blocking_reason: `Dependency validation failed: ${record.validation_reason}.`,
        required_action: "resolve_dependency_validation",
        blocking_dependency_refs: [record.dependency_id],
        governance_refs: record.governance_refs,
        authority_refs: [],
        replay_refs: record.replay_refs,
        evidence_refs: record.evidence_refs,
      })),
    ...result.missing_dependencies.map((record): BlockerSignal => Object.freeze({
      node_id: record.node_id,
      blocker_type: record.dependency_type === "requires_certification" ? "CERTIFICATION_BLOCKER"
        : record.dependency_type === "requires_recovery_plan" ? "RECOVERY_BLOCKER"
          : record.dependency_type === "requires_simulation" ? "SIMULATION_BLOCKER"
            : record.dependency_type === "requires_governance_review" ? "GOVERNANCE_BLOCKER"
              : record.dependency_type === "requires_operator_approval" ? "AUTHORITY_BLOCKER"
                : "DEPENDENCY_BLOCKER",
      blocking_reason: `Missing dependency: ${record.reason}.`,
      required_action: "satisfy_missing_dependency",
      blocking_dependency_refs: [record.missing_dependency_id],
      governance_refs: record.governance_refs,
      authority_refs: [],
      replay_refs: record.replay_refs,
      evidence_refs: record.evidence_refs,
    })),
  ];
}

function signalsFromConflict(input: BlockerDetectorInput): BlockerSignal[] {
  const result = input.conflict_detection;
  if (!result) return [];
  return result.conflicts
    .filter((conflict) => conflict.conflict_state !== "RESOLVED" && conflict.conflict_state !== "ARCHIVED")
    .flatMap((conflict) => [conflict.source_node_id, conflict.target_node_id].map((node_id): BlockerSignal => Object.freeze({
      node_id,
      blocker_type: "CONFLICT_BLOCKER",
      blocking_reason: `Unresolved conflict ${conflict.conflict_id} prevents ordering.`,
      required_action: "resolve_conflict",
      blocking_dependency_refs: [conflict.conflict_id],
      governance_refs: conflict.governance_refs,
      authority_refs: conflict.authority_refs,
      replay_refs: conflict.replay_refs,
      evidence_refs: conflict.evidence_refs,
      severity: conflict.severity,
    })));
}

function validateSignal(input: BlockerDetectorInput, signal: BlockerSignal, nodes: Map<string, DecisionGraphRoadmapNodeInput>, reasons: BlockerDetectorReasonCode[]): boolean {
  const node = nodes.get(signal.node_id);
  if (signal.hidden === true) {
    addReason(reasons, "HIDDEN_BLOCKER_DISCOVERED");
    return false;
  }
  if (signal.constitutional_violation === true) {
    addReason(reasons, "CONSTITUTIONAL_VIOLATION_DETECTED");
    return false;
  }
  if (!node || !signal.blocker_type || !SEVERITY_BY_TYPE[signal.blocker_type]) {
    addReason(reasons, "BLOCKER_CANNOT_BE_CLASSIFIED");
    return false;
  }
  if (node.tenant_id !== input.tenant_id || node.mission_id !== input.mission_id) {
    addReason(reasons, "TENANT_ISOLATION_VIOLATED");
    addReason(reasons, "CROSS_TENANT_BLOCKER_LEAKAGE_PREVENTED");
    return false;
  }
  if (signal.governance_refs.length === 0) {
    addReason(reasons, "GOVERNANCE_REFERENCES_MISSING");
    return false;
  }
  if (signal.replay_refs.length === 0) {
    addReason(reasons, "REPLAY_REFERENCES_MISSING");
    return false;
  }
  if (signal.blocker_type === "AUTHORITY_BLOCKER" && signal.authority_refs.length === 0) {
    addReason(reasons, "AUTHORITY_VALIDATION_INCOMPLETE");
    return false;
  }
  if (input.authorized_governance_refs?.length && !signal.governance_refs.every((ref) => input.authorized_governance_refs!.includes(ref))) {
    addReason(reasons, "GOVERNANCE_REFERENCES_MISSING");
    return false;
  }
  if (input.authorized_authority_refs?.length && !signal.authority_refs.every((ref) => input.authorized_authority_refs!.includes(ref))) {
    addReason(reasons, "AUTHORITY_VALIDATION_INCOMPLETE");
    return false;
  }
  return true;
}

function buildBlocker(input: { graphId: string; signal: BlockerSignal; detectorVersion: string }): BlockerRecord {
  const severity = input.signal.severity ?? SEVERITY_BY_TYPE[input.signal.blocker_type];
  const base: Omit<BlockerRecord, "integrity_hash"> = {
    blocker_id: blockerId(input.graphId, input.signal, input.detectorVersion),
    graph_id: input.graphId,
    node_id: input.signal.node_id,
    blocker_type: input.signal.blocker_type,
    severity,
    blocker_state: severity === "INFORMATIONAL" || severity === "LOW" ? "CONFIRMED" : "BLOCKING",
    blocking_reason: input.signal.blocking_reason,
    required_action: input.signal.required_action,
    blocking_dependency_refs: normalizeStrings(input.signal.blocking_dependency_refs),
    governance_refs: normalizeStrings(input.signal.governance_refs),
    authority_refs: normalizeStrings(input.signal.authority_refs),
    replay_refs: normalizeStrings(input.signal.replay_refs),
    evidence_refs: normalizeStrings(input.signal.evidence_refs),
    validator_version: input.detectorVersion,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(blocker: BlockerRecord, node: DecisionGraphRoadmapNodeInput): BlockerExplanation {
  const base: Omit<BlockerExplanation, "integrity_hash"> = {
    explanation_id: `explanation_${blocker.blocker_id}`,
    blocker_id: blocker.blocker_id,
    blocker_type: blocker.blocker_type,
    affected_decision: node.decision_candidate_id,
    blocking_prerequisite: blocker.blocking_dependency_refs[0] ?? blocker.required_action,
    validation_rule_triggered: blocker.blocker_type,
    evidence_chain: blocker.evidence_refs,
    governance_rationale: `Governance refs ${blocker.governance_refs.join(",")} require the blocker to remain active.`,
    authority_rationale: blocker.authority_refs.length > 0
      ? `Authority refs ${blocker.authority_refs.join(",")} must be satisfied before approval.`
      : "No authority evidence permits bypassing this blocker.",
    replay_refs: blocker.replay_refs,
    severity: blocker.severity,
    required_resolution_actions: Object.freeze([blocker.required_action]),
    expected_completion_conditions: Object.freeze(["prerequisite_completed", "evidence_recorded", "replay_verified"]),
  };
  return Object.freeze({ ...base, integrity_hash: explanationHash(base) });
}

function buildLedger(blocker: BlockerRecord): BlockerLedgerRecord {
  const base: Omit<BlockerLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `ledger_${blocker.blocker_id}`,
    blocker_id: blocker.blocker_id,
    graph_id: blocker.graph_id,
    node_id: blocker.node_id,
    blocker_type: blocker.blocker_type,
    severity: blocker.severity,
    blocker_state: blocker.blocker_state,
    required_action: blocker.required_action,
    governance_refs: blocker.governance_refs,
    authority_refs: blocker.authority_refs,
    replay_refs: blocker.replay_refs,
    evidence_refs: blocker.evidence_refs,
    timestamp: BLOCKER_TIMESTAMP_REF,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function updateNodes(nodes: readonly DecisionGraphRoadmapNodeInput[], blockers: readonly BlockerRecord[]): DecisionGraphRoadmapNodeInput[] {
  const refsByNode = new Map<string, string[]>();
  for (const blocker of blockers) {
    refsByNode.set(blocker.node_id, [...(refsByNode.get(blocker.node_id) ?? []), blocker.blocker_id]);
  }
  return [...nodes].map((node) => {
    const refs = normalizeStrings([...(node.blocker_refs ?? []), ...(refsByNode.get(node.node_id) ?? [])]);
    const state = refs.length > 0 ? "BLOCKED" : node.state;
    const hashable = { ...node, blocker_refs: refs, state, previous_state: node.state };
    return Object.freeze({
      ...hashable,
      integrity_hash: computeDecisionGraphNodeIntegrityHash(hashable, DECISION_GRAPH_CONTRACT_VERSION),
    } satisfies DecisionGraphRoadmapNodeInput);
  }).sort((a, b) => a.node_id.localeCompare(b.node_id));
}

function replayHash(input: {
  blockers: readonly BlockerRecord[];
  explanations: readonly BlockerExplanation[];
  updatedNodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger: readonly BlockerLedgerRecord[];
}): string {
  return hash(input);
}

function failResult(reasons: BlockerDetectorReasonCode[], detectorVersion: string): BlockerDetectorResult {
  const replay = hash({ failed: true, reasons: normalizeStrings(reasons), detectorVersion });
  const base: Omit<BlockerDetectorResult, "integrity_hash"> = {
    detection_status: "FAIL",
    certificationStatus: "FAIL",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as BlockerDetectorReasonCode[]),
    blockers: Object.freeze([]),
    explanations: Object.freeze([]),
    updated_nodes: Object.freeze([]),
    ledger_records: Object.freeze([]),
    blocked_node_ids: Object.freeze([]),
    eligible_for_ordering_node_ids: Object.freeze([]),
    eligible_for_approval_node_ids: Object.freeze([]),
    replay_package: Object.freeze({
      replay_id: "replay_blocker_detection_failed",
      graph_id: "",
      detector_version: detectorVersion,
      blocker_refs: Object.freeze([]),
      explanation_refs: Object.freeze([]),
      expected_replay_hash: replay,
    }),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function detectDecisionBlockers(input: BlockerDetectorInput): BlockerDetectorResult {
  const reasons: BlockerDetectorReasonCode[] = [];
  const detectorVersion = input.detector_version ?? BLOCKER_DETECTOR_VERSION;
  const nodes = nodeMap(input.nodes);
  addReason(reasons, "BLOCKER_RULE_REGISTRY_LOADED");
  addReason(reasons, "GRAPH_NODES_INSPECTED");

  const relationships = input.relationships ?? [];
  if (!relationships.every((relationship) => relationship.integrity_hash === relationshipIntegrityHash(relationship))) {
    return failResult([...reasons, "INTEGRITY_MISMATCH_DETECTED"], detectorVersion);
  }

  const signals = [
    ...relationships.map(signalFromRelationship).filter((item): item is BlockerSignal => Boolean(item)),
    ...signalsFromDependency(input),
    ...signalsFromConflict(input),
    ...(input.blocker_signals ?? []),
  ].sort((a, b) => blockerKey(a).localeCompare(blockerKey(b)));
  addReason(reasons, "DEPENDENCY_STATUS_EVALUATED");
  addReason(reasons, "PREREQUISITE_VALIDATION_COMPLETE");

  const deduped = new Map<string, BlockerSignal>();
  for (const signal of signals) {
    const key = blockerKey(signal);
    if (deduped.has(key)) continue;
    if (!validateSignal(input, signal, nodes, reasons)) return failResult(reasons, detectorVersion);
    deduped.set(key, signal);
    addReason(reasons, REASON_BY_TYPE[signal.blocker_type]);
  }

  const blockers = Object.freeze([...deduped.values()]
    .map((signal) => buildBlocker({ graphId: input.graph_id, signal, detectorVersion }))
    .sort((a, b) => a.blocker_id.localeCompare(b.blocker_id)));
  addReason(reasons, "BLOCKER_CLASSIFICATION_COMPLETE");
  addReason(reasons, "SEVERITY_EVALUATION_COMPLETE");

  const explanations = Object.freeze(blockers.map((blocker) => buildExplanation(blocker, nodes.get(blocker.node_id)!)));
  const explanationComplete = explanations.every((explanation) => (
    explanation.affected_decision.length > 0
    && explanation.blocking_prerequisite.length > 0
    && explanation.evidence_chain.length > 0
    && explanation.governance_rationale.length > 0
    && explanation.replay_refs.length > 0
    && explanation.required_resolution_actions.length > 0
    && explanation.expected_completion_conditions.length > 0
  ));
  if (!explanationComplete) return failResult([...reasons, "BLOCKER_EXPLANATION_INCOMPLETE"], detectorVersion);
  addReason(reasons, "BLOCKER_EXPLANATION_GENERATED");

  const updatedNodes = Object.freeze(updateNodes(input.nodes, blockers));
  const blockedNodeIds = normalizeStrings(blockers.map((blocker) => blocker.node_id));
  const eligible = normalizeStrings(input.nodes.map((node) => node.node_id).filter((nodeId) => !blockedNodeIds.includes(nodeId)));
  addReason(reasons, "BLOCKER_REFERENCES_ATTACHED");
  addReason(reasons, "BLOCKED_DECISIONS_EXCLUDED_FROM_RANKING");
  addReason(reasons, "BLOCKED_DECISIONS_EXCLUDED_FROM_APPROVAL");

  const ledger = Object.freeze(blockers.map(buildLedger));
  addReason(reasons, "BLOCKER_LEDGER_PERSISTED");
  addReason(reasons, "IMMUTABLE_BLOCKER_EVIDENCE_RECORDED");

  const replay = replayHash({ blockers, explanations, updatedNodes, ledger });
  if (input.replay_expected_hash && input.replay_expected_hash !== replay) return failResult([...reasons, "REPLAY_MISMATCH_DETECTED"], detectorVersion);
  addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_BLOCKERS");

  const base: Omit<BlockerDetectorResult, "integrity_hash"> = {
    detection_status: "PASS",
    certificationStatus: "PASS",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as BlockerDetectorReasonCode[]),
    blockers,
    explanations,
    updated_nodes: updatedNodes,
    ledger_records: ledger,
    blocked_node_ids: Object.freeze(blockedNodeIds),
    eligible_for_ordering_node_ids: Object.freeze(eligible),
    eligible_for_approval_node_ids: Object.freeze(eligible),
    replay_package: Object.freeze({
      replay_id: `replay_blocker_detection_${input.graph_id}`,
      graph_id: input.graph_id,
      detector_version: detectorVersion,
      blocker_refs: normalizeStrings(blockers.map((blocker) => blocker.blocker_id)),
      explanation_refs: normalizeStrings(explanations.map((explanation) => explanation.explanation_id)),
      expected_replay_hash: replay,
    }),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export const BlockerDetector = Object.freeze({
  detect: detectDecisionBlockers,
});
