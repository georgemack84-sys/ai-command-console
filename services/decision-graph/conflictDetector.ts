import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
} from "./decisionGraphContractRoadmap";
import type {
  ConflictDetectorInput,
  ConflictDetectorReasonCode,
  ConflictDetectorResult,
  ConflictExplanation,
  ConflictLedgerRecord,
  ConflictRecord,
  ConflictSignal,
  DecisionConflictSeverity,
  DecisionConflictType,
  DecisionGraphRoadmapNodeInput,
  DecisionRelationshipRecord,
} from "./types";

export const CONFLICT_DETECTOR_VERSION = "decision-conflict-detector/v1";
const CONFLICT_TIMESTAMP_REF = "conflict-ledger-timestamp-ref";

const SEVERITY_BY_TYPE: Readonly<Record<DecisionConflictType, DecisionConflictSeverity>> = Object.freeze({
  POLICY_CONFLICT: "HIGH",
  AUTHORITY_CONFLICT: "CRITICAL",
  MISSION_OBJECTIVE_CONFLICT: "HIGH",
  TENANT_SCOPE_CONFLICT: "CRITICAL",
  RISK_CONFLICT: "HIGH",
  ACTION_CONFLICT: "MEDIUM",
  GOVERNANCE_CONFLICT: "HIGH",
  CERTIFICATION_CONFLICT: "HIGH",
  RECOVERY_CONFLICT: "MEDIUM",
  DEPENDENCY_CONFLICT: "HIGH",
});

const REASON_BY_TYPE: Readonly<Record<DecisionConflictType, ConflictDetectorReasonCode>> = Object.freeze({
  POLICY_CONFLICT: "INCOMPATIBLE_GOVERNANCE_OUTCOMES_DETECTED",
  AUTHORITY_CONFLICT: "AUTHORITY_MISMATCH_DETECTED",
  MISSION_OBJECTIVE_CONFLICT: "MISSION_OBJECTIVE_CONFLICT_DETECTED",
  TENANT_SCOPE_CONFLICT: "TENANT_BOUNDARY_CONFLICT_DETECTED",
  RISK_CONFLICT: "CONTRADICTORY_RISK_RESPONSES_DETECTED",
  ACTION_CONFLICT: "COMPETING_PROPOSED_ACTIONS_DETECTED",
  GOVERNANCE_CONFLICT: "INCOMPATIBLE_GOVERNANCE_OUTCOMES_DETECTED",
  CERTIFICATION_CONFLICT: "CERTIFICATION_CONFLICT_DETECTED",
  RECOVERY_CONFLICT: "RECOVERY_POSTURE_CONFLICT_DETECTED",
  DEPENDENCY_CONFLICT: "DEPENDENCY_CONFLICT_DETECTED",
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: ConflictDetectorReasonCode[], reason: ConflictDetectorReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function recordHash(record: Omit<ConflictRecord, "integrity_hash"> | ConflictRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as ConflictRecord;
  return hash(hashable);
}

function explanationHash(explanation: Omit<ConflictExplanation, "integrity_hash"> | ConflictExplanation): string {
  const { integrity_hash: _ignored, ...hashable } = explanation as ConflictExplanation;
  return hash(hashable);
}

function ledgerHash(record: Omit<ConflictLedgerRecord, "integrity_hash"> | ConflictLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as ConflictLedgerRecord;
  return hash(hashable);
}

function resultHash(result: Omit<ConflictDetectorResult, "integrity_hash"> | ConflictDetectorResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as ConflictDetectorResult;
  return hash(hashable);
}

function relationshipIntegrityHash(relationship: DecisionRelationshipRecord): string {
  const { integrity_hash: _ignored, ...hashable } = relationship;
  return hash(hashable);
}

function nodeMap(nodes: readonly DecisionGraphRoadmapNodeInput[]): Map<string, DecisionGraphRoadmapNodeInput> {
  return new Map(nodes.map((node) => [node.node_id, node]));
}

function signalFromRelationship(relationship: DecisionRelationshipRecord): ConflictSignal {
  return Object.freeze({
    source_node_id: relationship.source_node_id,
    target_node_id: relationship.target_node_id,
    conflict_type: "DEPENDENCY_CONFLICT",
    rule_id: `relationship_${relationship.relationship_type}`,
    conflict_reason: "A resolver conflict relationship indicates incompatible graph decisions.",
    evidence_refs: relationship.source_candidate_refs,
    risk_refs: [],
    governance_refs: relationship.governance_refs,
    authority_refs: [],
    replay_refs: relationship.replay_refs,
  });
}

function conflictKey(signal: ConflictSignal): string {
  return [
    signal.source_node_id,
    signal.target_node_id,
    signal.conflict_type,
    signal.rule_id,
    hash({
      evidence_refs: normalizeStrings(signal.evidence_refs),
      risk_refs: normalizeStrings(signal.risk_refs),
      governance_refs: normalizeStrings(signal.governance_refs),
      replay_refs: normalizeStrings(signal.replay_refs),
    }),
  ].join("|");
}

function conflictId(graphId: string, signal: ConflictSignal, detectorVersion: string): string {
  return `conflict_${hash({
    graph_id: graphId,
    key: conflictKey(signal),
    detector_version: detectorVersion,
  }).slice(0, 32)}`;
}

function validateSignal(
  input: ConflictDetectorInput,
  signal: ConflictSignal,
  nodes: Map<string, DecisionGraphRoadmapNodeInput>,
  reasons: ConflictDetectorReasonCode[],
): boolean {
  const source = nodes.get(signal.source_node_id);
  const target = nodes.get(signal.target_node_id);
  if (signal.hidden === true) {
    addReason(reasons, "HIDDEN_CONFLICT_DISCOVERED");
    return false;
  }
  if (signal.ambiguous === true) {
    addReason(reasons, "RULE_AMBIGUITY_DETECTED");
    return false;
  }
  if (!signal.conflict_type || !SEVERITY_BY_TYPE[signal.conflict_type]) {
    addReason(reasons, "CONFLICT_CANNOT_BE_CLASSIFIED");
    return false;
  }
  if (!source || !target) {
    addReason(reasons, "CONFLICT_EXPLANATION_INCOMPLETE");
    return false;
  }
  if (source.tenant_id !== input.tenant_id || target.tenant_id !== input.tenant_id || source.tenant_id !== target.tenant_id) {
    addReason(reasons, "TENANT_BOUNDARY_VIOLATED");
    return false;
  }
  if (source.mission_id !== input.mission_id || target.mission_id !== input.mission_id || source.mission_id !== target.mission_id) {
    addReason(reasons, "CONFLICT_CANNOT_BE_CLASSIFIED");
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
  if (signal.conflict_type === "AUTHORITY_CONFLICT" && signal.authority_refs.length === 0) {
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

function buildConflict(input: {
  graphId: string;
  signal: ConflictSignal;
  detectorVersion: string;
}): ConflictRecord {
  const severity = input.signal.severity ?? SEVERITY_BY_TYPE[input.signal.conflict_type];
  const base: Omit<ConflictRecord, "integrity_hash"> = {
    conflict_id: conflictId(input.graphId, input.signal, input.detectorVersion),
    graph_id: input.graphId,
    source_node_id: input.signal.source_node_id,
    target_node_id: input.signal.target_node_id,
    conflict_type: input.signal.conflict_type,
    severity,
    conflict_state: severity === "INFORMATIONAL" || severity === "LOW" ? "CONFIRMED" : "BLOCKING",
    conflict_reason: input.signal.conflict_reason,
    evidence_refs: normalizeStrings(input.signal.evidence_refs),
    risk_refs: normalizeStrings(input.signal.risk_refs),
    governance_refs: normalizeStrings(input.signal.governance_refs),
    authority_refs: normalizeStrings(input.signal.authority_refs),
    replay_refs: normalizeStrings(input.signal.replay_refs),
    resolver_version: input.detectorVersion,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(conflict: ConflictRecord, signal: ConflictSignal, nodes: Map<string, DecisionGraphRoadmapNodeInput>): ConflictExplanation {
  const source = nodes.get(conflict.source_node_id);
  const target = nodes.get(conflict.target_node_id);
  const base: Omit<ConflictExplanation, "integrity_hash"> = {
    explanation_id: `explanation_${conflict.conflict_id}`,
    conflict_id: conflict.conflict_id,
    conflict_type: conflict.conflict_type,
    source_decision: source?.decision_candidate_id ?? conflict.source_node_id,
    target_decision: target?.decision_candidate_id ?? conflict.target_node_id,
    rule_triggered: signal.rule_id,
    evidence_chain: conflict.evidence_refs,
    governance_rationale: `Governance refs ${conflict.governance_refs.join(",")} require conflict gating.`,
    authority_rationale: conflict.authority_refs.length > 0
      ? `Authority refs ${conflict.authority_refs.join(",")} require operator/governance review.`
      : "No authority override permits simultaneous orchestration.",
    replay_refs: conflict.replay_refs,
    conflict_severity: conflict.severity,
    orchestration_impact: conflict.conflict_state === "BLOCKING" ? "BLOCKED" : "ADVISORY_ONLY",
    recommended_resolution_path: Object.freeze(["review_conflict", "select_governed_resolution", "record_replay_evidence"]),
  };
  return Object.freeze({ ...base, integrity_hash: explanationHash(base) });
}

function buildLedger(conflict: ConflictRecord): ConflictLedgerRecord {
  const base: Omit<ConflictLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `ledger_${conflict.conflict_id}`,
    conflict_id: conflict.conflict_id,
    graph_id: conflict.graph_id,
    source_node: conflict.source_node_id,
    target_node: conflict.target_node_id,
    conflict_type: conflict.conflict_type,
    severity: conflict.severity,
    conflict_state: conflict.conflict_state,
    governance_refs: conflict.governance_refs,
    authority_refs: conflict.authority_refs,
    replay_refs: conflict.replay_refs,
    evidence_refs: conflict.evidence_refs,
    timestamp: CONFLICT_TIMESTAMP_REF,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function updateNodes(nodes: readonly DecisionGraphRoadmapNodeInput[], conflicts: readonly ConflictRecord[]): DecisionGraphRoadmapNodeInput[] {
  const refsByNode = new Map<string, string[]>();
  for (const conflict of conflicts) {
    refsByNode.set(conflict.source_node_id, [...(refsByNode.get(conflict.source_node_id) ?? []), conflict.conflict_id]);
    refsByNode.set(conflict.target_node_id, [...(refsByNode.get(conflict.target_node_id) ?? []), conflict.conflict_id]);
  }
  return [...nodes]
    .map((node) => {
      const refs = normalizeStrings([...(node.conflict_refs ?? []), ...(refsByNode.get(node.node_id) ?? [])]);
      const state = refs.length > 0 ? "CONFLICT_DETECTED" : node.state;
      const hashable = { ...node, conflict_refs: refs, state, previous_state: node.state };
      return Object.freeze({
        ...hashable,
        integrity_hash: computeDecisionGraphNodeIntegrityHash(hashable, DECISION_GRAPH_CONTRACT_VERSION),
      } satisfies DecisionGraphRoadmapNodeInput);
    })
    .sort((a, b) => a.node_id.localeCompare(b.node_id));
}

function replayHash(input: {
  conflicts: readonly ConflictRecord[];
  explanations: readonly ConflictExplanation[];
  updatedNodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger: readonly ConflictLedgerRecord[];
  duplicateIds: readonly string[];
}): string {
  return hash(input);
}

function failResult(reasons: ConflictDetectorReasonCode[], detectorVersion: string): ConflictDetectorResult {
  const replay = hash({ failed: true, reasons: normalizeStrings(reasons), detectorVersion });
  const base: Omit<ConflictDetectorResult, "integrity_hash"> = {
    detection_status: "FAIL",
    certificationStatus: "FAIL",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as ConflictDetectorReasonCode[]),
    conflicts: Object.freeze([]),
    explanations: Object.freeze([]),
    updated_nodes: Object.freeze([]),
    ledger_records: Object.freeze([]),
    duplicate_conflict_ids: Object.freeze([]),
    replay_package: Object.freeze({
      replay_id: "replay_conflict_detection_failed",
      graph_id: "",
      detector_version: detectorVersion,
      conflict_refs: Object.freeze([]),
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

export function detectDecisionConflicts(input: ConflictDetectorInput): ConflictDetectorResult {
  const reasons: ConflictDetectorReasonCode[] = [];
  const detectorVersion = input.detector_version ?? CONFLICT_DETECTOR_VERSION;
  const nodes = nodeMap(input.nodes);

  addReason(reasons, "CONFLICT_RULE_REGISTRY_LOADED");
  addReason(reasons, "GRAPH_NODES_EVALUATED");

  const graphIntegrityValid = input.relationships.every((relationship) => relationship.integrity_hash === relationshipIntegrityHash(relationship));
  if (!graphIntegrityValid) return failResult([...reasons, "GRAPH_INTEGRITY_MISMATCH"], detectorVersion);

  const relationshipSignals = input.relationships
    .filter((relationship) => relationship.relationship_type === "conflicts_with")
    .map(signalFromRelationship);
  const signals = [...relationshipSignals, ...(input.conflict_signals ?? [])].sort((a, b) => conflictKey(a).localeCompare(conflictKey(b)));
  addReason(reasons, "RELATIONSHIP_ANALYSIS_COMPLETE");

  const deduped = new Map<string, ConflictSignal>();
  const duplicateIds: string[] = [];
  for (const signal of signals) {
    const key = conflictKey(signal);
    if (deduped.has(key)) {
      duplicateIds.push(key);
      continue;
    }
    if (!validateSignal(input, signal, nodes, reasons)) return failResult(reasons, detectorVersion);
    deduped.set(key, signal);
    addReason(reasons, REASON_BY_TYPE[signal.conflict_type]);
  }
  if (duplicateIds.length > 0) addReason(reasons, "DUPLICATE_CONFLICT_REGISTRATION_PREVENTED");

  const conflicts = Object.freeze([...deduped.values()].map((signal) => buildConflict({
    graphId: input.graph_id,
    signal,
    detectorVersion,
  })).sort((a, b) => a.conflict_id.localeCompare(b.conflict_id)));
  addReason(reasons, "CONFLICT_CLASSIFICATION_COMPLETE");
  addReason(reasons, "SEVERITY_EVALUATION_COMPLETE");

  const explanations = Object.freeze(conflicts.map((conflict) => {
    const signal = [...deduped.values()].find((item) => conflictId(input.graph_id, item, detectorVersion) === conflict.conflict_id)!;
    return buildExplanation(conflict, signal, nodes);
  }));
  const explanationComplete = explanations.every((explanation) => (
    explanation.rule_triggered.length > 0
    && explanation.evidence_chain.length > 0
    && explanation.governance_rationale.length > 0
    && explanation.replay_refs.length > 0
    && explanation.recommended_resolution_path.length > 0
  ));
  if (!explanationComplete) return failResult([...reasons, "CONFLICT_EXPLANATION_INCOMPLETE"], detectorVersion);
  addReason(reasons, "CONFLICT_EXPLANATION_GENERATED");

  const updatedNodes = Object.freeze(updateNodes(input.nodes, conflicts));
  addReason(reasons, "CONFLICT_REFERENCES_ATTACHED");
  if (conflicts.some((conflict) => conflict.conflict_state === "BLOCKING")) addReason(reasons, "CONFLICTING_NODES_BLOCKED");

  const ledger = Object.freeze(conflicts.map(buildLedger));
  addReason(reasons, "CONFLICT_LEDGER_PERSISTED");
  addReason(reasons, "IMMUTABLE_CONFLICT_EVIDENCE_RECORDED");

  const replay = replayHash({ conflicts, explanations, updatedNodes, ledger, duplicateIds: normalizeStrings(duplicateIds) });
  if (input.replay_expected_hash && input.replay_expected_hash !== replay) return failResult([...reasons, "REPLAY_MISMATCH_DETECTED"], detectorVersion);
  addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_CONFLICTS");

  const base: Omit<ConflictDetectorResult, "integrity_hash"> = {
    detection_status: "PASS",
    certificationStatus: "PASS",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as ConflictDetectorReasonCode[]),
    conflicts,
    explanations,
    updated_nodes: updatedNodes,
    ledger_records: ledger,
    duplicate_conflict_ids: Object.freeze(normalizeStrings(duplicateIds)),
    replay_package: Object.freeze({
      replay_id: `replay_conflict_detection_${input.graph_id}`,
      graph_id: input.graph_id,
      detector_version: detectorVersion,
      conflict_refs: normalizeStrings(conflicts.map((conflict) => conflict.conflict_id)),
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

export const ConflictDetector = Object.freeze({
  detect: detectDecisionConflicts,
});
