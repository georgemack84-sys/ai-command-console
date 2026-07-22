import { createDecisionReplayRecord } from "@/services/decision-replay-contract";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { DecisionReplayArtifactRef, DecisionReplayRecord } from "@/types/decision-replay-contract";
import type {
  ReplaySnapshotCaptureFoundation,
  ReplaySnapshotCaptureResult,
  ReplaySnapshotCaptureValidation,
  ReplaySnapshotFailure,
  ReplaySnapshotLedgerEntry,
  ReplaySnapshotLifecycleState,
  ReplaySnapshotRecord,
  ReplaySnapshotRegistryEntry,
  ReplaySnapshotType,
  SnapshotCoverageReport,
} from "@/types/decision-replay-snapshot-capture";

const CAPTURE_VERSION = "decision-replay-snapshot-capture/v1" as const;
const SNAPSHOT_VERSION = "decision-replay-snapshot/v1" as const;
const SNAPSHOT_SCHEMA_VERSION = "decision-replay-snapshot-schema/v1" as const;
const NOW = "2026-07-05T01:20:00.000Z";

export const REQUIRED_REPLAY_SNAPSHOT_TYPES: readonly ReplaySnapshotType[] = Object.freeze(["DECISION_CANDIDATE", "NORMALIZED_CANDIDATE", "DECISION_CONTEXT", "DEPENDENCY_GRAPH", "PRIORITY_RANKING", "CONFLICT_ANALYSIS", "GOVERNANCE_VALIDATION", "DECISION_PACKAGE", "OPERATOR_ACTION", "FINAL_DECISION"]);
export const REPLAY_SNAPSHOT_LIFECYCLE_STATES: readonly ReplaySnapshotLifecycleState[] = Object.freeze(["CREATED", "CAPTURED", "VALIDATED", "REGISTERED", "LEDGER_COMMITTED", "AVAILABLE_FOR_REPLAY", "REJECTED", "ARCHIVED"]);
export const REPLAY_SNAPSHOT_TERMINAL_STATES: readonly ReplaySnapshotLifecycleState[] = Object.freeze(["AVAILABLE_FOR_REPLAY", "REJECTED", "ARCHIVED"]);

type ReplaySnapshotScenario =
  | "BASELINE"
  | "MISSING_SNAPSHOT"
  | "DUPLICATE_SNAPSHOT"
  | "CORRUPTED_SNAPSHOT"
  | "INCOMPLETE_LINEAGE"
  | "CROSS_TENANT"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_REPLAY_REF"
  | "UNSUPPORTED_VERSION"
  | "UNKNOWN_STATE"
  | "REGISTRY_FAILURE"
  | "LEDGER_FAILURE";

type CaptureInput = Readonly<{
  replay_contract?: DecisionReplayRecord;
  scenario?: ReplaySnapshotScenario;
}>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

export function serializeReplaySnapshotContent(value: unknown): string {
  return serializeDecisionCanonically(value);
}

function ref(name: string, replay: DecisionReplayRecord, scenario: ReplaySnapshotScenario): DecisionReplayArtifactRef {
  return Object.freeze({
    ref_id: name ? `${name}_${replay.orchestration_id}` : "",
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : replay.tenant_id,
    orchestration_id: replay.orchestration_id,
    lineage_ref: name ? `lineage_${name}_${replay.orchestration_id}` : "",
    immutable: true,
  });
}

function contentFor(type: ReplaySnapshotType, replay: DecisionReplayRecord): object {
  const common = {
    orchestration_id: replay.orchestration_id,
    mission_id: replay.mission_id,
    tenant_id: replay.tenant_id,
    replay_id: replay.replay_id,
  };
  const payloads: Record<ReplaySnapshotType, object> = {
    DECISION_CANDIDATE: { ...common, candidate_id: "candidate:primary", originating_subsystem: "mission-control", recommendation_summary: "Proceed with governed decision orchestration.", evidence_refs: ["evidence:candidate"], confidence: 0.94, risks: ["operational-delay"], authority_requirements: ["operator-approval"] },
    NORMALIZED_CANDIDATE: { ...common, normalized_id: "normalized:candidate:primary", canonical_terms: ["governed-decision", "operator-approval"], standardized_refs: ["candidate:primary"], duplicate_resolution: "none", normalization_metadata: "canonical-v1" },
    DECISION_CONTEXT: { ...common, mission_context: "phase-9", environmental_context: "deterministic-replay", operational_context: "decision-orchestration", authority_context: "operator-supremacy", governance_context: "policy-bound", constitutional_context: "constitutional-required", dependency_context: "graph-bound" },
    DEPENDENCY_GRAPH: { ...common, graph_nodes: ["candidate", "context", "package"], graph_edges: ["candidate->context", "context->package"], dependency_types: ["requires"], blockers: [], prerequisites: ["context"], cycles: [], graph_ordering: ["candidate", "context", "package"] },
    PRIORITY_RANKING: { ...common, priority_scores: [0.91], ranking_order: ["candidate:primary"], weighting_factors: ["mission", "risk", "governance"], confidence_adjustments: [0.02], governance_weighting: 1, constitutional_weighting: 1, final_priority_rationale: "highest certified readiness" },
    CONFLICT_ANALYSIS: { ...common, conflict_classifications: [], conflict_severity: "NONE", arbitration_decisions: [], rejected_alternatives: [], tradeoffs: ["speed-vs-assurance"], conflict_resolution: "no-conflict" },
    GOVERNANCE_VALIDATION: { ...common, policy_evaluations: ["policy:pass"], constitutional_validation: "pass", authority_verification: "operator-authorized", approval_requirements: ["approval:operator"], compliance_decisions: ["compliant"], escalation_decisions: [] },
    DECISION_PACKAGE: { ...common, recommendations: ["approve"], alternatives: ["defer"], rejected_options: ["execute-without-approval"], risk_summaries: ["low"], confidence_summaries: ["high"], operator_guidance: ["review package"] },
    OPERATOR_ACTION: { ...common, approvals: ["approval:operator"], overrides: [], escalations: [], review_requests: [], evidence_requests: [], simulation_requests: [], comments: ["captured for replay"], timestamps: [NOW] },
    FINAL_DECISION: { ...common, final_decision_state: "READY_FOR_OPERATOR_DECISION", final_ranking: ["candidate:primary"], approvals: ["approval:operator"], governance_outcome: "pass", certification_outcome: "snapshot-ready", replay_references: [replay.replay_id], completion_status: "captured" },
  };
  return payloads[type];
}

function snapshotHashSource(snapshot: Omit<ReplaySnapshotRecord, "integrity_hash"> | ReplaySnapshotRecord): object {
  return {
    snapshot_id: snapshot.snapshot_id,
    snapshot_type: snapshot.snapshot_type,
    orchestration_id: snapshot.orchestration_id,
    mission_id: snapshot.mission_id,
    tenant_id: snapshot.tenant_id,
    snapshot_version: snapshot.snapshot_version,
    schema_version: snapshot.schema_version,
    serialized_snapshot: snapshot.serialized_snapshot,
    lineage_refs: snapshot.lineage_refs,
    replay_refs: snapshot.replay_refs,
    lifecycle_state: snapshot.lifecycle_state,
  };
}

export function computeReplaySnapshotIntegrityHash(snapshot: Omit<ReplaySnapshotRecord, "integrity_hash"> | ReplaySnapshotRecord): string {
  return hash(snapshotHashSource(snapshot));
}

function buildSnapshot(type: ReplaySnapshotType, replay: DecisionReplayRecord, scenario: ReplaySnapshotScenario): ReplaySnapshotRecord {
  const serialized = serializeReplaySnapshotContent(contentFor(type, replay));
  const base: Omit<ReplaySnapshotRecord, "integrity_hash"> = {
    snapshot_id: `snapshot_${type.toLowerCase()}_${replay.orchestration_id}`,
    snapshot_type: type,
    orchestration_id: replay.orchestration_id,
    mission_id: replay.mission_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : replay.tenant_id,
    snapshot_version: scenario === "UNSUPPORTED_VERSION" ? "decision-replay-snapshot/v999" as typeof SNAPSHOT_VERSION : SNAPSHOT_VERSION,
    schema_version: scenario === "UNSUPPORTED_VERSION" ? "decision-replay-snapshot-schema/v999" as typeof SNAPSHOT_SCHEMA_VERSION : SNAPSHOT_SCHEMA_VERSION,
    capture_timestamp: NOW,
    lifecycle_state: scenario === "UNKNOWN_STATE" ? "UNKNOWN" as ReplaySnapshotLifecycleState : "AVAILABLE_FOR_REPLAY",
    serialized_snapshot: serialized,
    lineage_refs: freezeArray(scenario === "INCOMPLETE_LINEAGE" && type === "FINAL_DECISION" ? [] : [ref(`snapshot_lineage_${type.toLowerCase()}`, replay, scenario)]),
    replay_refs: freezeArray(scenario === "MISSING_REPLAY_REF" && type === "FINAL_DECISION" ? [] : [ref("replay_contract", replay, scenario)]),
    governance_refs: freezeArray(scenario === "MISSING_GOVERNANCE" && type === "GOVERNANCE_VALIDATION" ? [] : [ref("governance_snapshot", replay, scenario)]),
    constitutional_refs: freezeArray(scenario === "MISSING_CONSTITUTIONAL" && type === "GOVERNANCE_VALIDATION" ? [] : [ref("constitutional_snapshot", replay, scenario)]),
    validation_status: "VALID",
  };
  const snapshot = Object.freeze({ ...base, integrity_hash: computeReplaySnapshotIntegrityHash(base) });
  if (scenario === "CORRUPTED_SNAPSHOT" && type === "FINAL_DECISION") return Object.freeze({ ...snapshot, integrity_hash: hash({ corrupted: snapshot.snapshot_id }) });
  return snapshot;
}

function buildSnapshots(replay: DecisionReplayRecord, scenario: ReplaySnapshotScenario): readonly ReplaySnapshotRecord[] {
  const types = scenario === "MISSING_SNAPSHOT" ? REQUIRED_REPLAY_SNAPSHOT_TYPES.filter((type) => type !== "FINAL_DECISION") : REQUIRED_REPLAY_SNAPSHOT_TYPES;
  const snapshots = types.map((type) => buildSnapshot(type, replay, scenario));
  if (scenario === "DUPLICATE_SNAPSHOT") return freezeArray([...snapshots, snapshots[0]!]);
  return freezeArray(snapshots);
}

function buildRegistry(snapshots: readonly ReplaySnapshotRecord[], scenario: ReplaySnapshotScenario): readonly ReplaySnapshotRegistryEntry[] {
  if (scenario === "REGISTRY_FAILURE") return freezeArray(snapshots.slice(0, -1).map((snapshot) => registryEntry(snapshot)));
  return freezeArray(snapshots.map((snapshot) => registryEntry(snapshot)));
}

function registryEntry(snapshot: ReplaySnapshotRecord): ReplaySnapshotRegistryEntry {
  return Object.freeze({
    snapshot_id: snapshot.snapshot_id,
    snapshot_type: snapshot.snapshot_type,
    orchestration_id: snapshot.orchestration_id,
    mission_id: snapshot.mission_id,
    tenant_id: snapshot.tenant_id,
    snapshot_version: snapshot.snapshot_version,
    lifecycle_state: snapshot.lifecycle_state,
    lineage_refs: freezeArray(snapshot.lineage_refs.map((entry) => entry.lineage_ref)),
    capture_timestamp: snapshot.capture_timestamp,
    integrity_hash: snapshot.integrity_hash,
  });
}

function ledgerHash(entry: Omit<ReplaySnapshotLedgerEntry, "integrity_hash"> | ReplaySnapshotLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

function buildLedger(snapshots: readonly ReplaySnapshotRecord[], scenario: ReplaySnapshotScenario): readonly ReplaySnapshotLedgerEntry[] {
  const source = scenario === "LEDGER_FAILURE" ? snapshots.slice(0, -1) : snapshots;
  return freezeArray(source.map((snapshot, index) => {
    const base: Omit<ReplaySnapshotLedgerEntry, "integrity_hash"> = {
      ledger_entry_id: `snapshot_ledger_${String(index + 1).padStart(2, "0")}_${snapshot.snapshot_id}`,
      sequence: index + 1,
      snapshot_id: snapshot.snapshot_id,
      snapshot_type: snapshot.snapshot_type,
      serialized_snapshot: snapshot.serialized_snapshot,
      snapshot_integrity_hash: snapshot.integrity_hash,
      lineage_ref: snapshot.lineage_refs[0]?.lineage_ref ?? "",
      replay_ref: snapshot.replay_refs[0]?.ref_id ?? "",
      validation_status: snapshot.validation_status,
      append_only: true,
      deleted: false,
    };
    return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
  }));
}

function duplicateTypes(snapshots: readonly ReplaySnapshotRecord[]): readonly ReplaySnapshotType[] {
  const seen = new Set<ReplaySnapshotType>();
  const duplicates: ReplaySnapshotType[] = [];
  for (const snapshot of snapshots) {
    if (seen.has(snapshot.snapshot_type)) duplicates.push(snapshot.snapshot_type);
    seen.add(snapshot.snapshot_type);
  }
  return freezeArray(duplicates);
}

function buildCoverage(orchestrationId: string, snapshots: readonly ReplaySnapshotRecord[]): SnapshotCoverageReport {
  const captured = new Set(snapshots.map((snapshot) => snapshot.snapshot_type));
  const missing = REQUIRED_REPLAY_SNAPSHOT_TYPES.filter((type) => !captured.has(type));
  const duplicates = duplicateTypes(snapshots);
  const capturedCount = REQUIRED_REPLAY_SNAPSHOT_TYPES.filter((type) => captured.has(type)).length;
  const replayReady = missing.length === 0 && duplicates.length === 0;
  const base: Omit<SnapshotCoverageReport, "integrity_hash"> = {
    orchestration_id: orchestrationId,
    required_snapshot_count: REQUIRED_REPLAY_SNAPSHOT_TYPES.length,
    captured_snapshot_count: capturedCount,
    missing_snapshots: freezeArray(missing),
    duplicate_snapshots: duplicates,
    coverage_percentage: Number(((capturedCount / REQUIRED_REPLAY_SNAPSHOT_TYPES.length) * 100).toFixed(2)),
    replay_ready: replayReady,
    validation_status: replayReady ? "VALID" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function refsValid(refs: readonly DecisionReplayArtifactRef[], replay: DecisionReplayRecord): boolean {
  return refs.length > 0 && refs.every((entry) => entry.ref_id && entry.lineage_ref && entry.immutable && entry.tenant_id === replay.tenant_id && entry.orchestration_id === replay.orchestration_id);
}

function collectFailures(input: {
  replay: DecisionReplayRecord;
  snapshots: readonly ReplaySnapshotRecord[];
  registry: readonly ReplaySnapshotRegistryEntry[];
  ledger: readonly ReplaySnapshotLedgerEntry[];
  coverage: SnapshotCoverageReport;
}): readonly ReplaySnapshotFailure[] {
  const failures: ReplaySnapshotFailure[] = [];
  if (!input.coverage.replay_ready) failures.push(input.coverage.missing_snapshots.length ? "SNAPSHOT_MISSING" : "DUPLICATE_IDENTITY");
  if (input.snapshots.some((snapshot) => snapshot.snapshot_version !== SNAPSHOT_VERSION || snapshot.schema_version !== SNAPSHOT_SCHEMA_VERSION)) failures.push("UNSUPPORTED_VERSION");
  if (input.snapshots.some((snapshot) => !REPLAY_SNAPSHOT_LIFECYCLE_STATES.includes(snapshot.lifecycle_state))) failures.push("UNKNOWN_LIFECYCLE_STATE");
  if (input.snapshots.some((snapshot) => snapshot.orchestration_id !== input.replay.orchestration_id || snapshot.tenant_id !== input.replay.tenant_id)) failures.push(input.snapshots.some((snapshot) => snapshot.tenant_id !== input.replay.tenant_id) ? "TENANT_MISMATCH" : "ORCHESTRATION_MISMATCH");
  if (input.snapshots.some((snapshot) => !refsValid(snapshot.lineage_refs, input.replay))) failures.push("INCOMPLETE_LINEAGE");
  if (input.snapshots.some((snapshot) => !refsValid(snapshot.replay_refs, input.replay))) failures.push("REPLAY_REFS_MISSING");
  if (input.snapshots.some((snapshot) => !refsValid(snapshot.governance_refs, input.replay))) failures.push("GOVERNANCE_REFS_MISSING");
  if (input.snapshots.some((snapshot) => !refsValid(snapshot.constitutional_refs, input.replay))) failures.push("CONSTITUTIONAL_REFS_MISSING");
  if (input.snapshots.some((snapshot) => !snapshot.serialized_snapshot)) failures.push("SERIALIZATION_FAILURE");
  if (input.snapshots.some((snapshot) => computeReplaySnapshotIntegrityHash(snapshot) !== snapshot.integrity_hash)) failures.push("INTEGRITY_MISMATCH");
  if (input.snapshots.some((snapshot) => !snapshot.snapshot_id || !snapshot.snapshot_type || !snapshot.capture_timestamp)) failures.push("INVALID_SCHEMA");
  if (input.registry.length !== input.snapshots.length || input.registry.some((entry) => !input.snapshots.some((snapshot) => snapshot.snapshot_id === entry.snapshot_id))) failures.push("REGISTRY_FAILURE");
  if (input.ledger.length !== input.snapshots.length || input.ledger.some((entry, index) => !entry.append_only || entry.deleted || entry.sequence !== index + 1 || ledgerHash(entry) !== entry.integrity_hash)) failures.push("LEDGER_COMMIT_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(orchestrationId: string, failures: readonly ReplaySnapshotFailure[]): ReplaySnapshotCaptureValidation {
  const has = (failure: ReplaySnapshotFailure) => failures.includes(failure);
  const base: Omit<ReplaySnapshotCaptureValidation, "integrity_hash"> = {
    validation_id: `snapshot_capture_validation_${orchestrationId}`,
    orchestration_id: orchestrationId,
    validation_status: failures.length ? "BLOCKED" : "VALID",
    snapshot_schema_valid: !has("INVALID_SCHEMA") && !has("UNSUPPORTED_VERSION") && !has("UNKNOWN_LIFECYCLE_STATE"),
    serialization_deterministic: !has("SERIALIZATION_FAILURE"),
    integrity_hashes_reproducible: !has("INTEGRITY_MISMATCH"),
    lineage_complete: !has("INCOMPLETE_LINEAGE"),
    replay_refs_complete: !has("REPLAY_REFS_MISSING"),
    governance_refs_preserved: !has("GOVERNANCE_REFS_MISSING"),
    constitutional_refs_preserved: !has("CONSTITUTIONAL_REFS_MISSING"),
    registry_complete: !has("REGISTRY_FAILURE"),
    ledger_append_only: !has("LEDGER_COMMIT_FAILURE"),
    coverage_complete: !has("SNAPSHOT_MISSING") && !has("DUPLICATE_IDENTITY"),
    replay_ready: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function captureDecisionReplaySnapshots(input: CaptureInput = {}): ReplaySnapshotCaptureResult {
  const replay_contract = input.replay_contract ?? createDecisionReplayRecord();
  const scenario = input.scenario ?? "BASELINE";
  const snapshots = buildSnapshots(replay_contract, scenario);
  const registry = buildRegistry(snapshots, scenario);
  const ledger = buildLedger(snapshots, scenario);
  const coverage_report = buildCoverage(replay_contract.orchestration_id, snapshots);
  const failures = collectFailures({ replay: replay_contract, snapshots, registry, ledger, coverage: coverage_report });
  const validation = buildValidation(replay_contract.orchestration_id, failures);
  const base: Omit<ReplaySnapshotCaptureResult, "integrity_hash"> = {
    capture_version: CAPTURE_VERSION,
    replay_contract,
    snapshots,
    registry,
    ledger,
    coverage_report,
    validation,
    lineage_chain: freezeArray(snapshots.map((snapshot) => snapshot.lineage_refs[0]?.lineage_ref ?? "")),
    deterministic: true,
    advisory_only: true,
    mutates_original_orchestration: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getReplaySnapshotCaptureFoundation(): ReplaySnapshotCaptureFoundation {
  return Object.freeze({
    capture_version: CAPTURE_VERSION,
    required_snapshot_types: REQUIRED_REPLAY_SNAPSHOT_TYPES,
    lifecycle_states: REPLAY_SNAPSHOT_LIFECYCLE_STATES,
    terminal_states: REPLAY_SNAPSHOT_TERMINAL_STATES,
    result: captureDecisionReplaySnapshots(),
  });
}

export const DecisionReplaySnapshotCapture = Object.freeze({
  capture: captureDecisionReplaySnapshots,
  serialize: serializeReplaySnapshotContent,
});
