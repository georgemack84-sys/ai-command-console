import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import {
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
} from "./decisionGraphContractRoadmap";
import type {
  DecisionGraphNodeBuildReasonCode,
  DecisionGraphNodeBuilderAuditRecord,
  DecisionGraphNodeBuilderInput,
  DecisionGraphNodeBuilderResult,
  DecisionGraphNodeRecord,
  DecisionGraphNodeState,
  DecisionGraphNodeType,
  DecisionGraphRoadmapNodeInput,
} from "./types";

const NORMALIZED_VERSION = "decision-candidate-normalization/v1" as const;

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DecisionGraphNodeBuildReasonCode[], reason: DecisionGraphNodeBuildReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function candidateHash(candidate: DecisionCandidate): string {
  const { integrity_hash: _integrityHash, ...hashable } = candidate;
  return hash(hashable);
}

function recordHash(record: Omit<DecisionGraphNodeRecord, "integrity_hash"> | DecisionGraphNodeRecord): string {
  const { integrity_hash: _integrityHash, ...hashable } = record as DecisionGraphNodeRecord;
  return hash(hashable);
}

function auditHash(record: Omit<DecisionGraphNodeBuilderAuditRecord, "integrity_hash"> | DecisionGraphNodeBuilderAuditRecord): string {
  const { integrity_hash: _integrityHash, ...hashable } = record as DecisionGraphNodeBuilderAuditRecord;
  return hash(hashable);
}

function resultHash(result: Omit<DecisionGraphNodeBuilderResult, "integrity_hash"> | DecisionGraphNodeBuilderResult): string {
  const { integrity_hash: _integrityHash, ...hashable } = result as DecisionGraphNodeBuilderResult;
  return hash(hashable);
}

function candidateComplete(candidate: DecisionCandidate | undefined): candidate is DecisionCandidate {
  return Boolean(candidate)
    && candidate!.candidate_id.length > 0
    && candidate!.source_system.length > 0
    && candidate!.source_record_ref.length > 0
    && candidate!.tenant_id.length > 0
    && candidate!.mission_id.length > 0
    && candidate!.decision_type.length > 0
    && candidate!.proposed_action.length > 0
    && candidate!.rationale_summary.length > 0
    && candidate!.evidence_refs.length > 0
    && candidate!.integrity_hash.length > 0;
}

function mapDecisionType(decisionType: string): DecisionGraphNodeType {
  const normalized = decisionType.toUpperCase();
  if (normalized.includes("SIMULATION")) return "SIMULATION";
  if (normalized.includes("GOVERNANCE")) return "GOVERNANCE";
  if (normalized.includes("ESCALATION")) return "ESCALATION";
  if (normalized.includes("CONSTRAINT")) return "CONSTRAINT";
  if (normalized.includes("OBSERVABILITY")) return "OBSERVABILITY";
  return "RECOMMENDATION";
}

export function generateDecisionGraphNodeId(
  candidate: DecisionCandidate,
  normalizedVersion = NORMALIZED_VERSION,
  graphContractVersion = DECISION_GRAPH_CONTRACT_VERSION,
): string {
  return `node_${hash({
    tenant_id: candidate.tenant_id,
    mission_id: candidate.mission_id,
    decision_candidate_id: candidate.candidate_id,
    decision_type: candidate.decision_type,
    source_record_ref: candidate.source_record_ref,
    normalized_version: normalizedVersion,
    graph_contract_version: graphContractVersion,
  }).slice(0, 32)}`;
}

function buildAudit(
  nodeId: string,
  candidateId: string,
  event: DecisionGraphNodeBuildReasonCode,
  result: "PASS" | "FAIL",
): DecisionGraphNodeBuilderAuditRecord {
  const base: Omit<DecisionGraphNodeBuilderAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${nodeId}_${event.toLowerCase()}`,
    node_id: nodeId,
    decision_candidate_id: candidateId,
    audit_event: event,
    result,
    replay_ref: `replay_${nodeId}_${event.toLowerCase()}`,
  };
  return Object.freeze({ ...base, integrity_hash: auditHash(base) });
}

function buildRejectedRecord(
  candidate: DecisionCandidate | undefined,
  reason: DecisionGraphNodeBuildReasonCode,
  graphContractVersion: string,
): DecisionGraphNodeRecord {
  const nodeId = candidate ? generateDecisionGraphNodeId(candidate, NORMALIZED_VERSION, graphContractVersion) : "node_rejected_missing_candidate";
  const base: Omit<DecisionGraphNodeRecord, "integrity_hash"> = {
    node_id: nodeId,
    decision_candidate_id: candidate?.candidate_id ?? "",
    tenant_id: candidate?.tenant_id ?? "",
    mission_id: candidate?.mission_id ?? "",
    decision_type: candidate ? mapDecisionType(candidate.decision_type) : "RECOMMENDATION",
    priority: 0,
    state: "REJECTED",
    source_candidate_hash: candidate?.integrity_hash ?? "",
    graph_contract_version: graphContractVersion,
    governance_refs: normalizeStrings(candidate?.governance_refs ?? []),
    replay_refs: normalizeStrings(candidate?.replay_refs ?? []),
    registration_status: "REJECTED",
    rejection_reason: reason,
    created_from_candidate_ref: candidate?.source_record_ref ?? "",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildRecord(node: DecisionGraphRoadmapNodeInput, graphContractVersion: string, sourceRecordRef: string): DecisionGraphNodeRecord {
  const base: Omit<DecisionGraphNodeRecord, "integrity_hash"> = {
    node_id: node.node_id,
    decision_candidate_id: node.decision_candidate_id,
    tenant_id: node.tenant_id,
    mission_id: node.mission_id,
    decision_type: node.decision_type,
    priority: node.priority,
    state: node.state,
    source_candidate_hash: node.source_candidate_hash,
    graph_contract_version: graphContractVersion,
    governance_refs: normalizeStrings(node.governance_refs),
    replay_refs: normalizeStrings(node.replay_refs),
    registration_status: "REGISTERED",
    created_from_candidate_ref: sourceRecordRef,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function makeResult(input: {
  status: "PASS" | "FAIL";
  reasons: readonly DecisionGraphNodeBuildReasonCode[];
  node?: DecisionGraphRoadmapNodeInput;
  record: DecisionGraphNodeRecord;
  audits: readonly DecisionGraphNodeBuilderAuditRecord[];
}): DecisionGraphNodeBuilderResult {
  const base: Omit<DecisionGraphNodeBuilderResult, "integrity_hash"> = {
    build_status: input.status,
    certificationStatus: input.status,
    reasonCodes: Object.freeze(normalizeStrings(input.reasons) as DecisionGraphNodeBuildReasonCode[]),
    node: input.node,
    node_record: input.record,
    audit_records: Object.freeze([...input.audits]),
    replay_ref: `replay_node_builder_${input.record.node_id}`,
    deterministic: true,
    failClosed: true,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function buildDecisionGraphNodeFromCandidate(input: DecisionGraphNodeBuilderInput = {}): DecisionGraphNodeBuilderResult {
  const reasons: DecisionGraphNodeBuildReasonCode[] = [];
  const audits: DecisionGraphNodeBuilderAuditRecord[] = [];
  const graphContractVersion = input.graph_contract_version ?? DECISION_GRAPH_CONTRACT_VERSION;
  const candidate = input.candidate;
  const candidateId = candidate?.candidate_id ?? "";
  const provisionalNodeId = candidate ? generateDecisionGraphNodeId(candidate, input.normalized_version ?? NORMALIZED_VERSION, graphContractVersion) : "node_rejected_missing_candidate";

  addReason(reasons, "CANDIDATE_RECEIVED");
  addReason(reasons, "CANDIDATE_VALIDATION_STARTED");
  audits.push(buildAudit(provisionalNodeId, candidateId, "CANDIDATE_RECEIVED", "PASS"));

  const reject = (reason: DecisionGraphNodeBuildReasonCode): DecisionGraphNodeBuilderResult => {
    addReason(reasons, reason);
    addReason(reasons, "CANDIDATE_REJECTED");
    const record = buildRejectedRecord(candidate, reason, graphContractVersion);
    audits.push(buildAudit(record.node_id, record.decision_candidate_id, reason, "FAIL"));
    return makeResult({ status: "FAIL", reasons, record, audits });
  };

  if (input.hidden_runtime_context !== undefined) return reject("HIDDEN_RUNTIME_CONTEXT_REJECTED");
  if (input.requested_node_id !== undefined) return reject("RANDOM_NODE_ID_REJECTED");
  if (!candidateComplete(candidate)) return reject(candidate ? "CANDIDATE_INCOMPLETE" : "CANDIDATE_INVALID");

  addReason(reasons, "CANDIDATE_VALID");

  if (candidate.governance_refs.length === 0) return reject("MISSING_GOVERNANCE_REFS");
  addReason(reasons, "GOVERNANCE_REFS_ATTACHED");

  if (candidate.replay_refs.length === 0) return reject("MISSING_REPLAY_REFS");
  addReason(reasons, "REPLAY_REFS_ATTACHED");

  if (candidate.integrity_hash !== candidateHash(candidate)) return reject("CANDIDATE_HASH_MISMATCH");
  addReason(reasons, "CANDIDATE_HASH_VERIFIED");

  if ((input.tenant_id ?? candidate.tenant_id) !== candidate.tenant_id) return reject("TENANT_MISMATCH");
  addReason(reasons, "TENANT_SCOPE_VALID");

  if ((input.mission_id ?? candidate.mission_id) !== candidate.mission_id) return reject("MISSION_MISMATCH");
  addReason(reasons, "MISSION_SCOPE_VALID");

  if (!candidate.advisory_only) return reject("ADVISORY_ONLY_STATUS_VIOLATED");
  addReason(reasons, "ADVISORY_ONLY_STATUS_PRESERVED");

  const nodeId = generateDecisionGraphNodeId(candidate, input.normalized_version ?? NORMALIZED_VERSION, graphContractVersion);
  addReason(reasons, "NODE_ID_GENERATED");

  const duplicate = (input.existing_node_records ?? []).find((record) => record.node_id === nodeId);
  if (duplicate) {
    return reject(duplicate.tenant_id === candidate.tenant_id ? "DUPLICATE_NODE_ID" : "CROSS_TENANT_NODE_COLLISION_BLOCKED");
  }

  const state: DecisionGraphNodeState = input.queue_relationship_resolution === true ? "RELATIONSHIPS_PENDING" : "REGISTERED";
  addReason(reasons, "NODE_STATE_REGISTERED");

  const nodeCore: Omit<DecisionGraphRoadmapNodeInput, "integrity_hash"> = {
    node_id: nodeId,
    decision_candidate_id: candidate.candidate_id,
    tenant_id: candidate.tenant_id,
    mission_id: candidate.mission_id,
    decision_type: mapDecisionType(candidate.decision_type),
    priority: candidate.authority_required || candidate.operator_required ? 1 : 0,
    state,
    previous_state: "CREATED",
    dependency_refs: Object.freeze([]),
    conflict_refs: Object.freeze([]),
    blocker_refs: Object.freeze([]),
    supporting_refs: Object.freeze([]),
    weakening_refs: Object.freeze([]),
    supersession_refs: Object.freeze([]),
    escalation_refs: Object.freeze([]),
    governance_refs: Object.freeze(normalizeStrings(candidate.governance_refs)),
    authority_refs: Object.freeze(candidate.authority_required ? [`authority_${candidate.candidate_id}`] : []),
    simulation_refs: Object.freeze([]),
    recovery_refs: Object.freeze([]),
    certification_refs: Object.freeze([]),
    replay_refs: Object.freeze(normalizeStrings(candidate.replay_refs)),
    source_candidate_hash: candidate.integrity_hash,
    created_at: candidate.source_record_ref,
    updated_at: candidate.source_record_ref,
  };
  addReason(reasons, "CANDIDATE_NODE_MAPPING_COMPLETE");

  const node = Object.freeze({
    ...nodeCore,
    integrity_hash: computeDecisionGraphNodeIntegrityHash(nodeCore, graphContractVersion),
  } satisfies DecisionGraphRoadmapNodeInput);
  addReason(reasons, "NODE_INTEGRITY_HASH_COMPUTED");

  if (node.integrity_hash !== computeDecisionGraphNodeIntegrityHash(node, graphContractVersion)) return reject("NODE_HASH_MISMATCH");
  addReason(reasons, "NODE_HASH_REPRODUCIBLE");
  addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_NODE");

  const record = buildRecord(node, graphContractVersion, candidate.source_record_ref);
  addReason(reasons, "NODE_REGISTERED");
  audits.push(buildAudit(node.node_id, node.decision_candidate_id, "NODE_REGISTERED", "PASS"));

  return makeResult({ status: "PASS", reasons, node, record, audits });
}

export const DecisionGraphNodeBuilder = Object.freeze({
  build: buildDecisionGraphNodeFromCandidate,
  generateNodeId: generateDecisionGraphNodeId,
});
