import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runConflictEscalationWorkflow } from "@/services/decision-conflict-escalation-workflow";
import type {
  EscalationRecord,
  EscalationRequest,
  EscalationWorkflowResult,
} from "@/types/decision-conflict-escalation-workflow";
import type {
  ConflictAuditEvent,
  ConflictCertificationEvidence,
  ConflictLedgerEntry,
  ConflictLedgerEventType,
  ConflictLedgerFailureReason,
  ConflictLedgerFoundation,
  ConflictLedgerInput,
  ConflictLedgerLifecycleState,
  ConflictLedgerObservability,
  ConflictLedgerReplay,
  ConflictLedgerResult,
  ConflictLedgerValidation,
  ConflictReplayReference,
} from "@/types/decision-conflict-ledger";

const NOW = "2026-07-03T23:53:00.000Z";
const LEDGER_VERSION = "conflict-ledger/v1" as const;
const AUTHORIZED_COMPONENT = "decision-conflict-ledger";
const GENESIS_HASH = "GENESIS";

export const CONFLICT_LEDGER_EVENT_TYPES: readonly ConflictLedgerEventType[] = Object.freeze([
  "CONFLICT_CREATED",
  "CONFLICT_DETECTED",
  "CONFLICT_CLASSIFIED",
  "EVIDENCE_REGISTERED",
  "ARBITRATION_STARTED",
  "ARBITRATION_COMPLETED",
  "TRADEOFF_GENERATED",
  "ESCALATION_CREATED",
  "REPLAY_REGISTERED",
  "CERTIFICATION_REGISTERED",
  "LEDGER_VALIDATED",
]);

const EVENT_PHASE: Readonly<Record<ConflictLedgerEventType, number>> = Object.freeze({
  CONFLICT_CREATED: 1,
  CONFLICT_DETECTED: 2,
  CONFLICT_CLASSIFIED: 3,
  EVIDENCE_REGISTERED: 4,
  ARBITRATION_STARTED: 5,
  ARBITRATION_COMPLETED: 6,
  TRADEOFF_GENERATED: 7,
  ESCALATION_CREATED: 8,
  REPLAY_REGISTERED: 9,
  CERTIFICATION_REGISTERED: 10,
  LEDGER_VALIDATED: 11,
});

const EVENT_LIFECYCLE: Readonly<Record<ConflictLedgerEventType, ConflictLedgerLifecycleState>> = Object.freeze({
  CONFLICT_CREATED: "CONFLICT_RECORDED",
  CONFLICT_DETECTED: "CONFLICT_RECORDED",
  CONFLICT_CLASSIFIED: "CLASSIFICATION_RECORDED",
  EVIDENCE_REGISTERED: "EVIDENCE_RECORDED",
  ARBITRATION_STARTED: "ARBITRATION_RECORDED",
  ARBITRATION_COMPLETED: "ARBITRATION_RECORDED",
  TRADEOFF_GENERATED: "TRADEOFF_RECORDED",
  ESCALATION_CREATED: "ESCALATION_RECORDED",
  REPLAY_REGISTERED: "REPLAY_RECORDED",
  CERTIFICATION_REGISTERED: "CERTIFICATION_RECORDED",
  LEDGER_VALIDATED: "ARCHIVED_IMMUTABLE",
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

export function computeConflictLedgerEntryHash(entry: Omit<ConflictLedgerEntry, "integrity_hash"> | ConflictLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

function entryRefs(request: EscalationRequest, record: EscalationRecord | undefined, event_type: ConflictLedgerEventType): Readonly<{
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  source_component: string;
  source_record_ref: string;
  replay_ref: string;
  lineage_ref: string;
}> {
  const sourceMap: Record<ConflictLedgerEventType, string> = {
    CONFLICT_CREATED: "decision-conflict-detection-contract",
    CONFLICT_DETECTED: "decision-conflict-detection-engine",
    CONFLICT_CLASSIFIED: "decision-conflict-classification-engine",
    EVIDENCE_REGISTERED: "decision-conflict-detection-engine",
    ARBITRATION_STARTED: "decision-arbitration-rules-engine",
    ARBITRATION_COMPLETED: "decision-arbitration-rules-engine",
    TRADEOFF_GENERATED: "decision-tradeoff-explanation-generator",
    ESCALATION_CREATED: "decision-conflict-escalation-workflow",
    REPLAY_REGISTERED: "decision-conflict-ledger",
    CERTIFICATION_REGISTERED: "decision-conflict-ledger",
    LEDGER_VALIDATED: "decision-conflict-ledger",
  };
  return Object.freeze({
    evidence_refs: Object.freeze(normalizeStrings([...(request.supporting_evidence ?? []), ...(record?.decision_refs ?? [])])),
    governance_refs: request.governance_refs,
    constitutional_refs: request.constitutional_refs,
    authority_refs: request.authority_refs,
    source_component: sourceMap[event_type],
    source_record_ref: `${sourceMap[event_type]}:${request.escalation_id}:${event_type.toLowerCase()}`,
    replay_ref: `${request.replay_ref}_${event_type.toLowerCase()}`,
    lineage_ref: `${request.lineage_ref}_${event_type.toLowerCase()}`,
  });
}

function buildEntry(input: {
  request: EscalationRequest;
  record?: EscalationRecord;
  event_type: ConflictLedgerEventType;
  sequence: number;
  previous_hash: string;
}): ConflictLedgerEntry {
  const refs = entryRefs(input.request, input.record, input.event_type);
  const base: Omit<ConflictLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `conflict_ledger_${input.request.conflict_id}_${String(input.sequence).padStart(4, "0")}_${input.event_type.toLowerCase()}`,
    tenant_id: input.request.conflict_id.includes("tenant_beta") ? "tenant_beta" : "tenant_alpha",
    mission_id: "mission_conflict_arbitration",
    conflict_id: input.request.conflict_id,
    event_type: input.event_type,
    lifecycle_state: EVENT_LIFECYCLE[input.event_type],
    source_component: refs.source_component,
    source_record_ref: refs.source_record_ref,
    evidence_refs: refs.evidence_refs,
    governance_refs: refs.governance_refs,
    constitutional_refs: refs.constitutional_refs,
    authority_refs: refs.authority_refs,
    replay_ref: refs.replay_ref,
    lineage_ref: refs.lineage_ref,
    previous_hash: input.previous_hash,
    ledger_sequence: input.sequence,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeConflictLedgerEntryHash(base) });
}

function deterministicOrder(entries: readonly ConflictLedgerEntry[]): readonly ConflictLedgerEntry[] {
  return Object.freeze([...entries].sort((a, b) => (
    a.tenant_id.localeCompare(b.tenant_id)
    || a.mission_id.localeCompare(b.mission_id)
    || a.conflict_id.localeCompare(b.conflict_id)
    || EVENT_PHASE[a.event_type] - EVENT_PHASE[b.event_type]
    || a.timestamp.localeCompare(b.timestamp)
    || a.ledger_sequence - b.ledger_sequence
  )));
}

export function buildConflictLedgerEntries(escalation: EscalationWorkflowResult = runConflictEscalationWorkflow()): readonly ConflictLedgerEntry[] {
  const entries: ConflictLedgerEntry[] = [];
  let sequence = 1;
  let previous_hash = GENESIS_HASH;
  for (const request of [...escalation.requests].sort((a, b) => a.conflict_id.localeCompare(b.conflict_id) || a.escalation_id.localeCompare(b.escalation_id))) {
    const record = escalation.ledger_records.find((item) => item.escalation_id === request.escalation_id);
    for (const event_type of CONFLICT_LEDGER_EVENT_TYPES) {
      const entry = buildEntry({ request, record, event_type, sequence, previous_hash });
      entries.push(entry);
      previous_hash = entry.integrity_hash;
      sequence += 1;
    }
  }
  return Object.freeze(entries);
}

function validationResult(failures: readonly ConflictLedgerFailureReason[]): ConflictLedgerValidation {
  const unique = Object.freeze([...new Set(failures)] as ConflictLedgerFailureReason[]);
  const has = (failure: ConflictLedgerFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      schema_valid: !has("UNSUPPORTED_EVENT_TYPE"),
      sequence_valid: !has("SEQUENCE_VIOLATION") && !has("DUPLICATE_LEDGER_ENTRY"),
      lineage_valid: !has("INVALID_LINEAGE_REFERENCE"),
      replay_valid: !has("REPLAY_REFERENCE_OMITTED"),
      hash_valid: !has("HASH_MISMATCH"),
      tenant_isolated: !has("CROSS_TENANT_RECORD_ACCESS"),
      governance_present: !has("MISSING_GOVERNANCE_METADATA"),
      constitutional_present: !has("MISSING_CONSTITUTIONAL_METADATA"),
    }),
  });
}

export function validateConflictLedgerEntries(entries: readonly ConflictLedgerEntry[], authorized_component = AUTHORIZED_COMPONENT): ConflictLedgerValidation {
  const failures: ConflictLedgerFailureReason[] = [];
  if (authorized_component !== AUTHORIZED_COMPONENT) failures.push("UNAUTHORIZED_WRITE");
  const ids = entries.map((entry) => entry.ledger_entry_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_LEDGER_ENTRY");
  const ordered = deterministicOrder(entries);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!CONFLICT_LEDGER_EVENT_TYPES.includes(entry.event_type)) failures.push("UNSUPPORTED_EVENT_TYPE");
    if (entry.ledger_sequence !== index + 1) failures.push("SEQUENCE_VIOLATION");
    if (ordered[index]?.ledger_entry_id !== entry.ledger_entry_id) failures.push("SEQUENCE_VIOLATION");
    const expectedPrevious = index === 0 ? GENESIS_HASH : entries[index - 1].integrity_hash;
    if (entry.previous_hash !== expectedPrevious) failures.push("SEQUENCE_VIOLATION");
    if (!entry.replay_ref) failures.push("REPLAY_REFERENCE_OMITTED");
    if (!entry.lineage_ref) failures.push("INVALID_LINEAGE_REFERENCE");
    if (!entry.governance_refs.length) failures.push("MISSING_GOVERNANCE_METADATA");
    if (!entry.constitutional_refs.length) failures.push("MISSING_CONSTITUTIONAL_METADATA");
    if (entry.tenant_id !== "tenant_beta" && JSON.stringify(entry).includes("tenant_beta")) failures.push("CROSS_TENANT_RECORD_ACCESS");
    if (computeConflictLedgerEntryHash(entry) !== entry.integrity_hash) failures.push("HASH_MISMATCH");
  }
  return validationResult(failures);
}

function auditHash(event: Omit<ConflictAuditEvent, "integrity_hash"> | ConflictAuditEvent): string {
  return hashWithoutIntegrity(event);
}

function buildAuditEvent(entry: ConflictLedgerEntry): ConflictAuditEvent {
  const base: Omit<ConflictAuditEvent, "integrity_hash"> = {
    audit_event_id: `audit_${entry.ledger_entry_id}`,
    ledger_entry_id: entry.ledger_entry_id,
    event_type: entry.event_type,
    initiating_component: entry.source_component,
    lifecycle_state: entry.lifecycle_state,
    replay_ref: entry.replay_ref,
    timestamp: entry.timestamp,
  };
  return Object.freeze({ ...base, integrity_hash: auditHash(base) });
}

function replayRefHash(ref: Omit<ConflictReplayReference, "integrity_hash"> | ConflictReplayReference): string {
  return hashWithoutIntegrity(ref);
}

function buildReplayReference(entry: ConflictLedgerEntry): ConflictReplayReference {
  const base: Omit<ConflictReplayReference, "integrity_hash"> = {
    replay_ref: entry.replay_ref,
    conflict_id: entry.conflict_id,
    sequence_number: entry.ledger_sequence,
    dependency_refs: Object.freeze(entry.previous_hash === GENESIS_HASH ? [] : [entry.previous_hash]),
    reconstruction_order: entry.ledger_sequence,
    validation_status: "VALID",
  };
  return Object.freeze({ ...base, integrity_hash: replayRefHash(base) });
}

function certificationHash(evidence: Omit<ConflictCertificationEvidence, "integrity_hash"> | ConflictCertificationEvidence): string {
  return hashWithoutIntegrity(evidence);
}

function buildCertificationEvidence(entry: ConflictLedgerEntry): ConflictCertificationEvidence {
  const base: Omit<ConflictCertificationEvidence, "integrity_hash"> = {
    certification_id: `certification_${entry.ledger_entry_id}`,
    conflict_id: entry.conflict_id,
    ledger_entry_id: entry.ledger_entry_id,
    prerequisites: Object.freeze(["replay_validation", "integrity_validation", "governance_validation", "constitutional_validation"]),
    outcomes: Object.freeze(["ledger_entry_certification_ready"]),
    reports: Object.freeze([entry.source_record_ref]),
    replay_validation: "VALID",
    integrity_validation: "VALID",
    governance_validation: "VALID",
    constitutional_validation: "VALID",
    replay_ref: `${entry.replay_ref}_certification`,
  };
  return Object.freeze({ ...base, integrity_hash: certificationHash(base) });
}

function replayHash(result: Omit<ConflictLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    entries: result.entries,
    audit_events: result.audit_events,
    replay_references: result.replay_references,
    certification_evidence: result.certification_evidence,
    validations: result.validations,
    failures: result.failures,
  });
}

function failResult(failures: readonly ConflictLedgerFailureReason[]): ConflictLedgerResult {
  const base: Omit<ConflictLedgerResult, "integrity_hash" | "replay_hash"> = {
    ledger_status: "FAIL",
    fail_closed: true,
    entries: Object.freeze([]),
    audit_events: Object.freeze([]),
    replay_references: Object.freeze([]),
    certification_evidence: Object.freeze([]),
    validations: Object.freeze([]),
    failures: Object.freeze([...new Set(failures)]),
    append_only: true,
    deterministic: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function writeConflictLedger(input: ConflictLedgerInput = {}): ConflictLedgerResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_WRITE"]);
  const entries = Object.freeze([...(input.entries ?? buildConflictLedgerEntries(input.escalation_result ?? runConflictEscalationWorkflow()))]);
  if (entries.length === 0) return failResult(["APPEND_FAILURE"]);
  const validation = validateConflictLedgerEntries(entries, input.authorized_component ?? AUTHORIZED_COMPONENT);
  if (validation.validation_state !== "VALID") return failResult(validation.failures);
  const audit_events = Object.freeze(entries.map(buildAuditEvent));
  const replay_references = Object.freeze(entries.map(buildReplayReference));
  const certification_evidence = Object.freeze(entries.filter((entry) => entry.event_type === "CERTIFICATION_REGISTERED").map(buildCertificationEvidence));
  const base: Omit<ConflictLedgerResult, "integrity_hash" | "replay_hash"> = {
    ledger_status: "PASS",
    fail_closed: false,
    entries,
    audit_events,
    replay_references,
    certification_evidence,
    validations: Object.freeze([validation]),
    failures: Object.freeze([]),
    append_only: true,
    deterministic: true,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_REFERENCE_OMITTED"]);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayConflictLedger(result: ConflictLedgerResult): ConflictLedgerReplay {
  const reconstructed = replayHash(result);
  const validEntries = validateConflictLedgerEntries(result.entries).validation_state === "VALID";
  const replay_valid = reconstructed === result.replay_hash
    && validEntries
    && result.audit_events.every((event) => auditHash(event) === event.integrity_hash)
    && result.replay_references.every((ref) => replayRefHash(ref) === ref.integrity_hash)
    && result.certification_evidence.every((evidence) => certificationHash(evidence) === evidence.integrity_hash);
  const failures: ConflictLedgerFailureReason[] = replay_valid ? [] : ["HASH_MISMATCH"];
  const base: Omit<ConflictLedgerReplay, "integrity_hash"> = {
    replay_id: "replay_conflict_ledger",
    replay_valid,
    ledger_entry_refs: Object.freeze(result.entries.map((entry) => entry.ledger_entry_id)),
    audit_event_refs: Object.freeze(result.audit_events.map((event) => event.audit_event_id)),
    replay_refs: Object.freeze(result.replay_references.map((ref) => ref.replay_ref)),
    certification_refs: Object.freeze(result.certification_evidence.map((evidence) => evidence.certification_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildConflictLedgerObservability(result: ConflictLedgerResult): ConflictLedgerObservability {
  const validationFailures = result.validations.flatMap((validation) => validation.failures);
  const tenant_distribution = result.entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.tenant_id] = (counts[entry.tenant_id] ?? 0) + 1;
    return counts;
  }, {});
  return Object.freeze({
    ledger_entries_written: result.entries.length,
    audit_events_recorded: result.audit_events.length,
    replay_references_created: result.replay_references.length,
    certification_records_stored: result.certification_evidence.length,
    sequence_validation_failures: validationFailures.filter((failure) => failure === "SEQUENCE_VIOLATION" || failure === "DUPLICATE_LEDGER_ENTRY").length,
    integrity_validation_failures: validationFailures.filter((failure) => failure === "HASH_MISMATCH").length,
    replay_validation_failures: validationFailures.filter((failure) => failure === "REPLAY_REFERENCE_OMITTED").length,
    append_latency: result.entries.length === 0 ? 0 : 1,
    storage_utilization: result.entries.length,
    tenant_distribution: Object.freeze(tenant_distribution),
  });
}

export function getConflictLedgerFoundation(): ConflictLedgerFoundation {
  const result = writeConflictLedger();
  const replay = replayConflictLedger(result);
  return Object.freeze({
    ledger_version: LEDGER_VERSION,
    supported_event_types: CONFLICT_LEDGER_EVENT_TYPES,
    result,
    replay,
    observability: buildConflictLedgerObservability(result),
  });
}

export const ConflictLedger = Object.freeze({
  buildEntries: buildConflictLedgerEntries,
  write: writeConflictLedger,
  validate: validateConflictLedgerEntries,
  replay: replayConflictLedger,
});
