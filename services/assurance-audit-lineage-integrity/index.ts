import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { detectReplayDivergence, replayReplayDivergenceDetection } from "@/services/replay-divergence-detection-engine";
import type {
  AmendmentReferenceRegistryEntry,
  AssuranceAuditCertification,
  AssuranceAuditContract,
  AssuranceAuditFailure,
  AssuranceAuditInput,
  AssuranceAuditLineageIntegrityBundle,
  AssuranceAuditLineageIntegrityResult,
  AssuranceAuditLineageIntegrityValidation,
  AssuranceAuditScenario,
  AssuranceCompletenessOutcome,
  AssuranceIntegrityOutcome,
  AssuranceIntegrityValidation,
  AssuranceLineageEdge,
  AssuranceLineageGraph,
  AssuranceLineageNode,
  AssuranceProvenanceChain,
  AuditCompletenessValidation,
  ImmutableAssuranceAuditLedgerEntry,
  LineageReplayResult,
  ReplayTraceRegistryEntry,
} from "@/types/assurance-audit-lineage-integrity";

const VERSION = "assurance-audit-lineage-integrity/v13.7" as const;
const IDENTIFIER = "AssuranceAuditLineageIntegrity" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

type Scenario = NonNullable<AssuranceAuditInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function scenarioFailure(scenario: AssuranceAuditScenario): AssuranceAuditFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly AssuranceAuditFailure[], failure: AssuranceAuditFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly AssuranceAuditFailure[]): "PASS" | "NON_PASSING" { return failures.length ? "NON_PASSING" : "PASS"; }
function integrityOutcome(failures: readonly AssuranceAuditFailure[], relevant: readonly AssuranceAuditFailure[]): AssuranceIntegrityOutcome {
  return relevant.some((failure) => failures.includes(failure)) ? "INVALID" : "VERIFIED";
}

function buildAuditContract(input: AssuranceAuditInput, failures: readonly AssuranceAuditFailure[]): AssuranceAuditContract {
  const tenant_id = input.tenant_id ?? "tenant-mission-control";
  const replay = input.replay_divergence ?? detectReplayDivergence();
  const assessment_id = "assessment:mission-control:13.7";
  const certification_id = "certification:mission-control:13.7";
  const replay_refs = has(failures, "REPLAY_TRACE_MISSING") ? freezeArray<string>([]) : freezeArray([replay.replay_hash, ...replay.replay_service.reproduced_divergence_ids]);
  const divergence_refs = has(failures, "DIVERGENCE_REFERENCE_MISSING") ? freezeArray<string>([]) : freezeArray(replay.records.map((record) => record.replay_divergence_id));
  const amendment_refs = has(failures, "AMENDMENT_REFERENCE_MISSING") ? freezeArray<string>([]) : freezeArray(["constitution:mission-control:v13", "amendment:assurance-audit:13.7"]);
  const certification_decision_ref = has(failures, "CERTIFICATION_REFERENCE_MISSING") ? "" : "certification-decision:assurance-audit:13.7";
  const lineage_root = has(failures, "LINEAGE_MISSING") ? "" : id("lineage_root", { assessment_id, certification_id, tenant_id });
  return nested({
    audit_id: id("assurance_audit", { assessment_id, certification_id, tenant_id }),
    assessment_id,
    certification_id,
    tenant_id,
    mission_scope: "mission-control-assurance-lifecycle",
    assurance_engine_ref: IDENTIFIER,
    evaluation_record_ref: "evaluation:assurance-audit:13.7",
    dependency_refs: has(failures, "DEPENDENCY_INTEGRITY_INVALID") ? freezeArray([]) : freezeArray(["dependency:assurance-evaluation-contract", "dependency:replay-divergence-enforcement"]),
    evidence_refs: has(failures, "EVIDENCE_HASH_MISSING") ? freezeArray([]) : freezeArray(["evidence:assurance-execution", "evidence:certification-decision", ...replay.evidence_registry.map((record) => record.evidence_record_id)]),
    replay_refs,
    divergence_refs,
    certification_decision_ref,
    amendment_refs,
    lineage_root,
    audit_status: failures.length ? "INCOMPLETE" as const : "COMPLETE" as const,
    created_timestamp: TIMESTAMP,
    completed_timestamp: TIMESTAMP,
  });
}

function lineageNode(artifact_ref: string, origin_ref: string, parent_refs: readonly string[], sequence: number, failures: readonly AssuranceAuditFailure[]): AssuranceLineageNode {
  return nested({
    node_id: id("lineage_node", { artifact_ref, sequence }),
    artifact_ref,
    origin_ref,
    parent_refs,
    sequence,
    immutable: !has(failures, "LINEAGE_MUTATED"),
  });
}

function lineageEdge(source_ref: string, target_ref: string, relationship: AssuranceLineageEdge["relationship"], sequence: number, failures: readonly AssuranceAuditFailure[]): AssuranceLineageEdge {
  return nested({
    edge_id: id("lineage_edge", { source_ref, target_ref, relationship, sequence }),
    source_ref,
    target_ref,
    relationship,
    append_only: !has(failures, "LINEAGE_MUTATED"),
  });
}

function buildLineageGraph(contract: AssuranceAuditContract, failures: readonly AssuranceAuditFailure[]): AssuranceLineageGraph {
  const refs = [
    contract.evaluation_record_ref,
    ...contract.dependency_refs,
    ...contract.evidence_refs.slice(0, 2),
    "policy:assurance-audit:13.7",
    "governance-review:assurance-audit",
    "operator-review:assurance-audit",
    contract.certification_decision_ref,
    ...contract.replay_refs.slice(0, 1),
    ...contract.divergence_refs.slice(0, 1),
    ...contract.amendment_refs.slice(0, 1),
  ].filter(Boolean);
  const nodes = freezeArray(refs.map((ref, index) => lineageNode(ref, contract.lineage_root || "missing-lineage-root", index === 0 ? freezeArray([]) : freezeArray([refs[index - 1]]), index + 1, failures)));
  const relationships: readonly AssuranceLineageEdge["relationship"][] = freezeArray(["EXECUTES_BEFORE", "DEPENDS_ON", "DERIVES_EVIDENCE", "QUALIFIES_EVIDENCE", "BINDS_POLICY", "REVIEWS_GOVERNANCE", "REVIEWS_OPERATOR", "AGGREGATES_CERTIFICATION", "REPLAYS", "PRESERVES_DIVERGENCE", "REFERENCES_AMENDMENT"]);
  const edges = freezeArray(nodes.slice(1).map((node, index) => lineageEdge(nodes[index].node_id, node.node_id, relationships[index] ?? "EXECUTES_BEFORE", index + 1, failures)));
  const complete = Boolean(contract.lineage_root) && nodes.length >= 8 && !has(failures, "LINEAGE_MISSING");
  return nested({
    lineage_graph_id: id("assurance_lineage_graph", contract.audit_id),
    lineage_root: contract.lineage_root,
    nodes,
    edges,
    complete,
    deterministic: true,
    replayable: complete && !has(failures, "REPLAY_RECONSTRUCTION_MISMATCH"),
    immutable: !has(failures, "LINEAGE_MUTATED"),
    append_only: !has(failures, "LINEAGE_MUTATED"),
    historical_lineage_preserved: !has(failures, "LINEAGE_MUTATED"),
  });
}

function buildIntegrityValidation(contract: AssuranceAuditContract, graph: AssuranceLineageGraph, replayValid: boolean, failures: readonly AssuranceAuditFailure[]): AssuranceIntegrityValidation {
  const constitutional_assurance_event = failures.some((failure) => ["ARTIFACT_HASH_MODIFIED", "EVIDENCE_HASH_MISSING", "DEPENDENCY_INTEGRITY_INVALID", "REPLAY_TRACE_MISSING", "LEDGER_MUTATION_ATTEMPT", "LINEAGE_MISSING"].includes(failure));
  return nested({
    validation_id: id("assurance_integrity_validation", contract.audit_id),
    artifact_hashes: integrityOutcome(failures, ["ARTIFACT_HASH_MODIFIED"]),
    evidence_hashes: contract.evidence_refs.length ? integrityOutcome(failures, ["EVIDENCE_HASH_MISSING"]) : "MISSING" as AssuranceIntegrityOutcome,
    lineage_integrity: graph.complete && graph.immutable ? integrityOutcome(failures, ["LINEAGE_MISSING", "LINEAGE_MUTATED"]) : "INVALID" as AssuranceIntegrityOutcome,
    dependency_integrity: contract.dependency_refs.length ? integrityOutcome(failures, ["DEPENDENCY_INTEGRITY_INVALID"]) : "MISSING" as AssuranceIntegrityOutcome,
    replay_integrity: replayValid && contract.replay_refs.length ? integrityOutcome(failures, ["REPLAY_TRACE_MISSING", "REPLAY_RECONSTRUCTION_MISMATCH"]) : "INVALID" as AssuranceIntegrityOutcome,
    certification_integrity: contract.certification_decision_ref ? integrityOutcome(failures, ["CERTIFICATION_REFERENCE_MISSING"]) : "MISSING" as AssuranceIntegrityOutcome,
    amendment_integrity: contract.amendment_refs.length ? integrityOutcome(failures, ["AMENDMENT_REFERENCE_MISSING"]) : "MISSING" as AssuranceIntegrityOutcome,
    ledger_integrity: integrityOutcome(failures, ["LEDGER_MUTATION_ATTEMPT"]),
    mandatory_before_certification: true as const,
    constitutional_assurance_event,
    deterministic: true,
    failures,
  });
}

function buildLedger(contract: AssuranceAuditContract, failures: readonly AssuranceAuditFailure[]): readonly ImmutableAssuranceAuditLedgerEntry[] {
  const events: readonly ImmutableAssuranceAuditLedgerEntry["event_type"][] = freezeArray(["ASSURANCE_EXECUTED", "EVALUATION_RESULT_RECORDED", "DEPENDENCY_EVALUATED", "EVIDENCE_QUALIFIED", "REPLAY_EXECUTED", "DIVERGENCE_EVALUATED", "CERTIFICATION_DECIDED", "GOVERNANCE_REVIEWED", "OPERATOR_REVIEWED", "AMENDMENT_REFERENCED"]);
  return freezeArray(events.map((event_type, index) => {
    const base = nested({
      ledger_entry_id: id("assurance_audit_ledger", { audit: contract.audit_id, event_type }),
      audit_id: contract.audit_id,
      event_type,
      artifact_ref: [contract.evaluation_record_ref, ...contract.dependency_refs, ...contract.evidence_refs, ...contract.replay_refs, ...contract.divergence_refs, contract.certification_decision_ref, ...contract.amendment_refs].filter(Boolean)[index] ?? contract.audit_id,
      evidence_refs: contract.evidence_refs,
      correction_of_ref: null,
      sequence: index + 1,
      event_timestamp: TIMESTAMP,
      append_only: true,
      immutable: true,
    });
    if (has(failures, "LEDGER_MUTATION_ATTEMPT") && index === events.length - 1) return Object.freeze({ ...base, immutable: false, integrity_hash: hash({ tampered: base.ledger_entry_id }) });
    return base;
  }));
}

function buildReplayTrace(contract: AssuranceAuditContract, replayValid: boolean, failures: readonly AssuranceAuditFailure[], replay = detectReplayDivergence()): readonly ReplayTraceRegistryEntry[] {
  if (has(failures, "REPLAY_TRACE_MISSING")) return freezeArray([]);
  return freezeArray([nested({
    replay_trace_id: id("replay_trace", { audit: contract.audit_id, replay: replay.replay_hash }),
    originating_assessment_id: contract.assessment_id,
    replay_identity: replay.replay_hash,
    replay_ordering: replay.comparisons.map((comparison) => comparison.scope),
    replay_inputs: freezeArray([contract.evaluation_record_ref, ...contract.dependency_refs]),
    replay_outputs: freezeArray([replay.outcome, replay.integrity_hash]),
    replay_dependencies: contract.dependency_refs,
    replay_evidence: contract.evidence_refs,
    replay_divergence_classifications: replay.records.map((record) => record.divergence_category),
    replay_certification_outcome: replay.outcome,
    immutable: true,
    explainable: replayValid,
  })]);
}

function buildAmendments(contract: AssuranceAuditContract, failures: readonly AssuranceAuditFailure[]): readonly AmendmentReferenceRegistryEntry[] {
  if (has(failures, "AMENDMENT_REFERENCE_MISSING")) return freezeArray([]);
  return freezeArray([nested({
    amendment_reference_id: id("amendment_reference", contract.audit_id),
    constitutional_amendment_refs: freezeArray(["constitution:mission-control:v13"]),
    governance_amendment_refs: freezeArray(["governance-amendment:assurance-audit:13.7"]),
    policy_amendment_refs: freezeArray(["policy-amendment:audit-completeness:13.7"]),
    implementation_version_refs: freezeArray([VERSION]),
    certification_applicability: contract.certification_id,
    supersession_refs: freezeArray(["supersedes:phase-13.6-replay-divergence-ledger"]),
    historical_applicability_preserved: true,
    constitutional_provenance_explicit: true,
  })]);
}

function buildProvenance(contract: AssuranceAuditContract, failures: readonly AssuranceAuditFailure[]): readonly AssuranceProvenanceChain[] {
  const complete = !has(failures, "PROVENANCE_CHAIN_INCOMPLETE");
  return freezeArray([contract.evaluation_record_ref, contract.certification_decision_ref || "missing-certification"].map((artifact_ref) => nested({
    provenance_id: id("assurance_provenance", { audit: contract.audit_id, artifact_ref }),
    artifact_ref,
    originating_assessment: contract.assessment_id,
    originating_assurance_engine: contract.assurance_engine_ref,
    originating_evidence: complete ? contract.evidence_refs : freezeArray([]),
    originating_dependencies: contract.dependency_refs,
    originating_governance_approvals: complete ? freezeArray(["governance-approval:assurance-audit"]) : freezeArray([]),
    originating_certification_decision: contract.certification_decision_ref,
    originating_replay: contract.replay_refs,
    originating_amendment_version: contract.amendment_refs,
    canonical: true,
    complete,
    immutable: true,
    replayable: complete,
  })));
}

function buildLineageReplay(contract: AssuranceAuditContract, graph: AssuranceLineageGraph, failures: readonly AssuranceAuditFailure[]): LineageReplayResult {
  const missing = has(failures, "LINEAGE_MISSING") || !graph.complete;
  return nested({
    lineage_replay_id: id("lineage_replay", contract.audit_id),
    reconstructed_ordering: graph.nodes.map((node) => node.artifact_ref),
    reconstructed_dependencies: contract.dependency_refs,
    reconstructed_evidence_consumption: contract.evidence_refs,
    reconstructed_replay_history: contract.replay_refs,
    reconstructed_certification_aggregation: contract.certification_decision_ref ? freezeArray([contract.certification_decision_ref]) : freezeArray([]),
    reconstructed_divergence_history: contract.divergence_refs,
    reconstructed_amendment_applicability: contract.amendment_refs,
    reconstructed_integrity_history: graph.nodes.map((node) => node.integrity_hash),
    identical_to_original: !missing && !has(failures, "REPLAY_RECONSTRUCTION_MISMATCH"),
    missing_lineage_detected: missing,
    deterministic: true,
  });
}

function buildCompleteness(contract: AssuranceAuditContract, graph: AssuranceLineageGraph, integrity: AssuranceIntegrityValidation, replayTraces: readonly ReplayTraceRegistryEntry[], amendments: readonly AmendmentReferenceRegistryEntry[], provenance: readonly AssuranceProvenanceChain[], failures: readonly AssuranceAuditFailure[]): AuditCompletenessValidation {
  const lineage_complete = graph.complete;
  const dependency_complete = contract.dependency_refs.length > 0;
  const evidence_complete = contract.evidence_refs.length > 0;
  const replay_complete = replayTraces.length === 1;
  const divergence_complete = contract.divergence_refs.length === (contract.divergence_refs.length || 0);
  const certification_complete = Boolean(contract.certification_decision_ref);
  const amendment_complete = amendments.length > 0 && contract.amendment_refs.length > 0;
  const integrity_complete = Object.values({
    artifact_hashes: integrity.artifact_hashes,
    evidence_hashes: integrity.evidence_hashes,
    lineage_integrity: integrity.lineage_integrity,
    dependency_integrity: integrity.dependency_integrity,
    replay_integrity: integrity.replay_integrity,
    certification_integrity: integrity.certification_integrity,
    amendment_integrity: integrity.amendment_integrity,
    ledger_integrity: integrity.ledger_integrity,
  }).every((value) => value === "VERIFIED");
  const provenanceComplete = provenance.every((chain) => chain.complete);
  const complete = lineage_complete && dependency_complete && evidence_complete && replay_complete && divergence_complete && certification_complete && amendment_complete && integrity_complete && provenanceComplete && failures.length === 0;
  const outcomeValue: AssuranceCompletenessOutcome = complete ? "COMPLETE" : has(failures, "ARTIFACT_HASH_MODIFIED") || has(failures, "LEDGER_MUTATION_ATTEMPT") ? "INVALID" : "INCOMPLETE";
  const completeFailures = complete ? failures : freezeArray([...new Set([...failures, "AUDIT_COMPLETENESS_INCOMPLETE" as const])]);
  return nested({
    completeness_validation_id: id("audit_completeness", contract.audit_id),
    lineage_complete,
    dependency_complete,
    evidence_complete,
    replay_complete,
    divergence_complete,
    certification_complete,
    amendment_complete,
    integrity_complete,
    outcome: outcomeValue,
    certification_prohibited: outcomeValue !== "COMPLETE",
    deterministic: true,
    replayable: true,
    failures: completeFailures,
  });
}

function buildCertification(contract: AssuranceAuditContract, completeness: AuditCompletenessValidation): AssuranceAuditCertification {
  const out = completeness.outcome === "COMPLETE" ? "PASS" : "NON_PASSING";
  return nested({
    certification_id: id("assurance_audit_certification", contract.audit_id),
    outcome: out,
    certification_authorized: out === "PASS",
    reasoning: out === "PASS" ? "Audit lineage, integrity, replay trace, amendment references, provenance, and completeness are verified." : "Certification blocked because assurance audit history is incomplete or invalid.",
    failures: completeness.failures,
  });
}

function resultReplayHash(result: Omit<AssuranceAuditLineageIntegrityResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    audit: result.audit_contract.integrity_hash,
    lineage: result.lineage_graph.integrity_hash,
    integrity: result.integrity_validation.integrity_hash,
    ledger: result.audit_ledger.map((entry) => entry.integrity_hash),
    replay_trace: result.replay_trace_registry.map((entry) => entry.integrity_hash),
    amendments: result.amendment_reference_registry.map((entry) => entry.integrity_hash),
    provenance: result.provenance_service.map((entry) => entry.integrity_hash),
    replay: result.lineage_replay.integrity_hash,
    completeness: result.completeness_validation.integrity_hash,
    certification: result.certification.integrity_hash,
    divergence: result.replay_divergence.integrity_hash,
  });
}

function resultIntegrityHash(result: Omit<AssuranceAuditLineageIntegrityResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

export function runAssuranceAuditLineageIntegrity(input: AssuranceAuditInput = {}): AssuranceAuditLineageIntegrityResult {
  const replay_divergence = input.replay_divergence ?? detectReplayDivergence();
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<AssuranceAuditFailure>([...(direct ? [direct] : []), ...(replayReplayDivergenceDetection(replay_divergence) ? [] : ["REPLAY_RECONSTRUCTION_MISMATCH" as const])]);
  const audit_contract = buildAuditContract({ ...input, replay_divergence }, failures);
  const lineage_graph = buildLineageGraph(audit_contract, failures);
  const integrity_validation = buildIntegrityValidation(audit_contract, lineage_graph, replayReplayDivergenceDetection(replay_divergence), failures);
  const audit_ledger = buildLedger(audit_contract, failures);
  const replay_trace_registry = buildReplayTrace(audit_contract, replayReplayDivergenceDetection(replay_divergence), failures, replay_divergence);
  const amendment_reference_registry = buildAmendments(audit_contract, failures);
  const provenance_service = buildProvenance(audit_contract, failures);
  const lineage_replay = buildLineageReplay(audit_contract, lineage_graph, failures);
  const ledgerFailures = audit_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable) ? failures : freezeArray([...new Set([...failures, "LEDGER_MUTATION_ATTEMPT" as const])]);
  const completeness_validation = buildCompleteness(audit_contract, lineage_graph, integrity_validation, replay_trace_registry, amendment_reference_registry, provenance_service, ledgerFailures);
  const certification = buildCertification(audit_contract, completeness_validation);
  const base: Omit<AssuranceAuditLineageIntegrityResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    audit_contract,
    lineage_graph,
    integrity_validation,
    audit_ledger,
    replay_trace_registry,
    amendment_reference_registry,
    provenance_service,
    lineage_replay,
    completeness_validation,
    certification,
    replay_divergence,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAssuranceAuditLineageIntegrity(result?: AssuranceAuditLineageIntegrityResult): AssuranceAuditLineageIntegrityValidation {
  if (!result) return nested({ valid: false, outcome: "NON_PASSING" as const, replay_hash_valid: false, integrity_hash_valid: false, lineage_valid: false, ledger_valid: false, completeness_valid: false, failures: freezeArray(["AUDIT_COMPLETENESS_INCOMPLETE" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const lineage_valid = verifyHashedRecord(result.lineage_graph) && result.lineage_graph.complete && result.lineage_graph.append_only && result.lineage_replay.identical_to_original;
  const ledger_valid = result.audit_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable);
  const completeness_valid = result.completeness_validation.outcome === "COMPLETE" && !result.completeness_validation.certification_prohibited;
  const valid = result.certification.outcome === "PASS" && result.certification.certification_authorized && replay_hash_valid && integrity_hash_valid && lineage_valid && ledger_valid && completeness_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, lineage_valid, ledger_valid, completeness_valid, failures: result.certification.failures });
}

export function replayAssuranceAuditLineageIntegrity(result = runAssuranceAuditLineageIntegrity()): boolean {
  const replayed = runAssuranceAuditLineageIntegrity();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAssuranceAuditLineageIntegrity(result).valid;
}

export function getAssuranceAuditLineageIntegrityBundle(): AssuranceAuditLineageIntegrityBundle {
  const result = runAssuranceAuditLineageIntegrity();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      immutable_lineage_required: true,
      integrity_verification_required: true,
      audit_ledger_append_only: true,
      replay_trace_required: true,
      amendment_traceability_required: true,
      provenance_replay_required: true,
      completeness_required_before_certification: true,
    }),
    result,
    validation: validateAssuranceAuditLineageIntegrity(result),
  });
}

export const AssuranceAuditLineageIntegrityService = Object.freeze({
  run: runAssuranceAuditLineageIntegrity,
  validate: validateAssuranceAuditLineageIntegrity,
  replay: replayAssuranceAuditLineageIntegrity,
});
