import { evaluateFailClosedEnforcement } from "@/services/fail-closed-enforcement-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { FailClosedEnforcementResult } from "@/types/fail-closed-enforcement-engine";
import type {
  GovernanceDecisionArchive,
  GovernanceDecisionLedgerFailureReason,
  GovernanceDecisionLedgerFoundation,
  GovernanceDecisionLedgerInput,
  GovernanceDecisionLedgerQuery,
  GovernanceDecisionLedgerRecord,
  GovernanceDecisionLedgerReplay,
  GovernanceDecisionLedgerResult,
  GovernanceDecisionLedgerValidation,
  GovernanceDecisionLedgerObservability,
  GovernanceLedgerQueryType,
  GovernanceReviewRecord,
  GovernanceTimelineEvent,
  OperatorApprovalRecord,
} from "@/types/governance-decision-ledger";

const LEDGER_VERSION = "governance-decision-ledger/v1" as const;
const AUTHORIZED_COMPONENT = "governance-decision-ledger";
const NOW = "2026-07-04T00:46:00.000Z";

export const GOVERNANCE_LEDGER_QUERY_TYPES: readonly GovernanceLedgerQueryType[] = Object.freeze([
  "governance_decision",
  "mission_timeline",
  "operator_approvals",
  "governance_reviews",
  "enforcement_outcomes",
  "replay_references",
  "certification_history",
  "lineage_history",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

export function computeGovernanceDecisionLedgerHash(record: Omit<GovernanceDecisionLedgerRecord, "integrity_hash"> | GovernanceDecisionLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function ledgerId(enforcement: FailClosedEnforcementResult): string {
  return `governance_decision_ledger_${enforcement.governance_decision.governance_decision_id}`;
}

function collectReplayRefs(enforcement: FailClosedEnforcementResult): readonly string[] {
  return normalize([
    ...enforcement.governance_decision.replay_refs,
    enforcement.governance_policy_result.evidence.replay_ref,
    enforcement.constitutional_result.evidence_report.replay_ref,
    enforcement.authority_result.evidence_report.replay_ref,
    enforcement.tenant_result.evidence_report.replay_ref,
    enforcement.certification_replay_result.evidence_package.replay_ref,
    enforcement.certification_replay_result.replay_report.report_id,
    enforcement.integrity_lineage_result.evidence_report.replay_ref,
    enforcement.decision_report.replay_ref,
    ...enforcement.ledger_records.flatMap((record) => [...record.replay_refs]),
  ]);
}

function collectLineageRefs(enforcement: FailClosedEnforcementResult): readonly string[] {
  return normalize([
    ...enforcement.governance_decision.lineage_refs,
    ...enforcement.certification_replay_result.evidence_package.certification_lineage,
    ...enforcement.integrity_lineage_result.lineage_nodes.map((node) => node.lineage_id),
    ...enforcement.integrity_lineage_result.evidence_report.lineage_results,
  ]);
}

function createLedgerRecord(enforcement: FailClosedEnforcementResult): GovernanceDecisionLedgerRecord {
  const base: Omit<GovernanceDecisionLedgerRecord, "integrity_hash"> = {
    ledger_id: ledgerId(enforcement),
    governance_decision_id: enforcement.governance_decision.governance_decision_id,
    mission_id: enforcement.governance_decision.mission_id,
    tenant_id: enforcement.governance_decision.tenant_id,
    validation_results: enforcement.decision_report.validation_summary.filter((item) => item.validation_type === "governance" || item.validation_type === "governance_policy").map((item) => `${item.validation_type}:${item.validation_result}`),
    constitutional_results: [enforcement.constitutional_result.evidence_report.validation_result],
    authority_results: [enforcement.authority_result.evidence_report.authority_outcome, ...enforcement.authority_result.evaluations.map((item) => item.authority_result)],
    tenant_results: [enforcement.tenant_result.evidence_report.isolation_result, ...enforcement.tenant_result.evaluations.map((item) => item.isolation_result)],
    certification_results: [enforcement.certification_replay_result.evidence_package.validation_outcome],
    replay_results: [enforcement.certification_replay_result.replay_report.reconstruction_status, enforcement.certification_replay_result.replay_report.determinism_status],
    integrity_results: [enforcement.integrity_lineage_result.validation_outcome, enforcement.integrity_lineage_result.verification_record.verification_result],
    enforcement_outcome: enforcement.evaluation_record.enforcement_outcome,
    evidence_refs: enforcement.decision_report.evidence_refs,
    lineage_refs: collectLineageRefs(enforcement),
    replay_refs: collectReplayRefs(enforcement),
    created_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeGovernanceDecisionLedgerHash(base) });
}

function timelineHash(event: Omit<GovernanceTimelineEvent, "integrity_hash"> | GovernanceTimelineEvent): string {
  return hashWithoutIntegrity(event);
}

function timelineEvent(input: Omit<GovernanceTimelineEvent, "integrity_hash">): GovernanceTimelineEvent {
  return Object.freeze({ ...input, integrity_hash: timelineHash(input) });
}

function buildTimeline(enforcement: FailClosedEnforcementResult, ledger: GovernanceDecisionLedgerRecord): readonly GovernanceTimelineEvent[] {
  const decision = enforcement.governance_decision;
  const eventSeeds: readonly Pick<GovernanceTimelineEvent, "event_type" | "event_result" | "evidence_refs" | "replay_refs">[] = [
    { event_type: "Decision Candidate", event_result: decision.decision_candidate_id, evidence_refs: decision.evidence_refs, replay_refs: decision.replay_refs },
    { event_type: "Governance Validation", event_result: enforcement.governance_policy_result.evidence.validation_state, evidence_refs: enforcement.decision_report.evidence_refs, replay_refs: [enforcement.governance_policy_result.evidence.replay_ref] },
    { event_type: "Constitution Validation", event_result: enforcement.constitutional_result.evidence_report.validation_result, evidence_refs: enforcement.constitutional_result.evidence_report.evidence_refs, replay_refs: [enforcement.constitutional_result.evidence_report.replay_ref] },
    { event_type: "Authority Validation", event_result: enforcement.authority_result.evidence_report.authority_outcome, evidence_refs: enforcement.authority_result.evidence_report.evidence_refs, replay_refs: [enforcement.authority_result.evidence_report.replay_ref] },
    { event_type: "Tenant Validation", event_result: enforcement.tenant_result.evidence_report.isolation_result, evidence_refs: enforcement.tenant_result.evidence_report.evidence_refs, replay_refs: [enforcement.tenant_result.evidence_report.replay_ref] },
    { event_type: "Certification Validation", event_result: enforcement.certification_replay_result.evidence_package.validation_outcome, evidence_refs: enforcement.certification_replay_result.evidence_package.evidence_refs, replay_refs: [enforcement.certification_replay_result.evidence_package.replay_ref] },
    { event_type: "Replay Validation", event_result: enforcement.certification_replay_result.replay_report.reconstruction_status, evidence_refs: enforcement.certification_replay_result.evidence_package.evidence_refs, replay_refs: enforcement.certification_replay_result.replay_report.replay_references },
    { event_type: "Integrity Validation", event_result: enforcement.integrity_lineage_result.validation_outcome, evidence_refs: enforcement.integrity_lineage_result.evidence_report.evidence_refs, replay_refs: [enforcement.integrity_lineage_result.evidence_report.replay_ref] },
    { event_type: "Enforcement Decision", event_result: enforcement.evaluation_record.enforcement_outcome, evidence_refs: enforcement.decision_report.evidence_refs, replay_refs: [enforcement.decision_report.replay_ref] },
    { event_type: "Ledger Record Created", event_result: ledger.ledger_id, evidence_refs: ledger.evidence_refs, replay_refs: ledger.replay_refs },
  ];
  const events: Omit<GovernanceTimelineEvent, "integrity_hash">[] = eventSeeds.map((event, index) => ({
    event_id: `governance_timeline_${ledger.governance_decision_id}_${String(index + 1).padStart(2, "0")}`,
    governance_decision_id: ledger.governance_decision_id,
    event_order: index + 1,
    occurred_at: NOW,
    ...event,
  }));
  return Object.freeze(events.map((event) => timelineEvent(event)));
}

function approvalHash(record: Omit<OperatorApprovalRecord, "integrity_hash"> | OperatorApprovalRecord): string {
  return hashWithoutIntegrity(record);
}

function buildOperatorApprovals(enforcement: FailClosedEnforcementResult): readonly OperatorApprovalRecord[] {
  const approvals = enforcement.evaluation_record.approval_requirements.length > 0 ? enforcement.evaluation_record.approval_requirements : ["not_required"];
  return Object.freeze(approvals.map((approval, index) => {
    const base: Omit<OperatorApprovalRecord, "integrity_hash"> = {
      approval_id: `operator_approval_${enforcement.governance_decision.governance_decision_id}_${String(index + 1).padStart(2, "0")}`,
      governance_decision_id: enforcement.governance_decision.governance_decision_id,
      operator_identity: approval.includes("operator") ? "operator_authority" : "governance_authority",
      approval_outcome: approval === "not_required" ? "NOT_REQUIRED" : "PENDING",
      approval_scope: approval,
      approval_rationale: `Approval requirement preserved from upstream validation: ${approval}.`,
      approval_evidence: enforcement.decision_report.evidence_refs,
      approved_at: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: approvalHash(base) });
  }));
}

function reviewHash(record: Omit<GovernanceReviewRecord, "integrity_hash"> | GovernanceReviewRecord): string {
  return hashWithoutIntegrity(record);
}

function buildGovernanceReviews(enforcement: FailClosedEnforcementResult): readonly GovernanceReviewRecord[] {
  const reviewRequired = enforcement.evaluation_record.enforcement_outcome === "ALLOW_WITH_GOVERNANCE_REVIEW" || enforcement.evaluation_record.enforcement_outcome === "ESCALATE";
  const base: Omit<GovernanceReviewRecord, "integrity_hash"> = {
    review_id: `governance_review_${enforcement.governance_decision.governance_decision_id}_01`,
    governance_decision_id: enforcement.governance_decision.governance_decision_id,
    reviewer_ref: reviewRequired ? "governance_review_board" : "not_required",
    review_outcome: reviewRequired ? "ESCALATED" : "NOT_REQUIRED",
    review_rationale: reviewRequired ? `Review required for outcome ${enforcement.evaluation_record.enforcement_outcome}.` : "No governance review required by enforcement outcome.",
    evidence_refs: enforcement.decision_report.evidence_refs,
    replay_refs: [enforcement.decision_report.replay_ref],
    reviewed_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: reviewHash(base) })]);
}

function archiveHash(archive: Omit<GovernanceDecisionArchive, "integrity_hash"> | GovernanceDecisionArchive): string {
  return hashWithoutIntegrity(archive);
}

function buildArchive(
  ledger: GovernanceDecisionLedgerRecord,
  timeline: readonly GovernanceTimelineEvent[],
  approvals: readonly OperatorApprovalRecord[],
  reviews: readonly GovernanceReviewRecord[],
): GovernanceDecisionArchive {
  const base: Omit<GovernanceDecisionArchive, "integrity_hash"> = {
    archive_id: `governance_decision_archive_${ledger.governance_decision_id}`,
    governance_decision_id: ledger.governance_decision_id,
    ledger_ref: ledger.ledger_id,
    timeline_refs: timeline.map((event) => event.event_id),
    approval_refs: approvals.map((approval) => approval.approval_id),
    review_refs: reviews.map((review) => review.review_id),
    evidence_refs: ledger.evidence_refs,
    replay_refs: ledger.replay_refs,
    export_ref: `export_${ledger.ledger_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: archiveHash(base) });
}

function validationResult(failures: readonly GovernanceDecisionLedgerFailureReason[]): GovernanceDecisionLedgerValidation {
  const unique = Object.freeze([...new Set(failures)] as GovernanceDecisionLedgerFailureReason[]);
  const has = (failure: GovernanceDecisionLedgerFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      governance_decision_present: !has("MISSING_GOVERNANCE_DECISION_ID"),
      validations_complete: !has("INCOMPLETE_VALIDATION_RESULTS") && !has("ENFORCEMENT_RECORD_INVALID"),
      replay_refs_present: !has("MISSING_REPLAY_REFERENCES"),
      lineage_refs_present: !has("MISSING_LINEAGE_REFERENCES"),
      evidence_refs_well_formed: !has("MALFORMED_EVIDENCE_REFERENCE"),
      integrity_hash_valid: !has("INVALID_INTEGRITY_HASH"),
      append_only: !has("FINALIZED_RECORD_MODIFICATION_ATTEMPT") && !has("RECORD_DELETION_ATTEMPT"),
      ordering_valid: !has("RECORD_ORDERING_VIOLATION") && !has("DUPLICATE_LEDGER_IDENTIFIER"),
    }),
  });
}

function ledgerFailures(input: {
  enforcement: FailClosedEnforcementResult;
  ledger: GovernanceDecisionLedgerRecord;
  timeline: readonly GovernanceTimelineEvent[];
  approvals: readonly OperatorApprovalRecord[];
  reviews: readonly GovernanceReviewRecord[];
  archive: GovernanceDecisionArchive;
  existing: readonly GovernanceDecisionLedgerRecord[];
  modification: boolean;
  deletion: boolean;
  authorized: boolean;
}): readonly GovernanceDecisionLedgerFailureReason[] {
  const failures: GovernanceDecisionLedgerFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_GOVERNANCE_LEDGER_ACCESS");
  if (!input.ledger.governance_decision_id) failures.push("MISSING_GOVERNANCE_DECISION_ID");
  if (input.existing.some((record) => record.ledger_id === input.ledger.ledger_id)) failures.push("DUPLICATE_LEDGER_IDENTIFIER");
  if (input.modification) failures.push("FINALIZED_RECORD_MODIFICATION_ATTEMPT");
  if (input.deletion) failures.push("RECORD_DELETION_ATTEMPT");
  if (input.enforcement.enforcement_status !== "PASS" && input.enforcement.evaluation_record.enforcement_outcome !== "FAIL_CLOSED") failures.push("ENFORCEMENT_RECORD_INVALID");
  if (input.ledger.validation_results.length === 0 || input.ledger.constitutional_results.length === 0 || input.ledger.authority_results.length === 0 || input.ledger.tenant_results.length === 0 || input.ledger.certification_results.length === 0 || input.ledger.integrity_results.length === 0) failures.push("INCOMPLETE_VALIDATION_RESULTS");
  if (input.ledger.replay_refs.length === 0) failures.push("MISSING_REPLAY_REFERENCES");
  if (input.ledger.lineage_refs.length === 0) failures.push("MISSING_LINEAGE_REFERENCES");
  if (input.ledger.evidence_refs.some((ref) => !ref.startsWith("evidence_"))) failures.push("MALFORMED_EVIDENCE_REFERENCE");
  if (computeGovernanceDecisionLedgerHash(input.ledger) !== input.ledger.integrity_hash) failures.push("INVALID_INTEGRITY_HASH");
  if (input.timeline.some((event, index) => event.event_order !== index + 1)) failures.push("RECORD_ORDERING_VIOLATION");
  if (input.timeline.some((event) => timelineHash(event) !== event.integrity_hash)) failures.push("INVALID_INTEGRITY_HASH");
  if (input.approvals.some((approval) => approvalHash(approval) !== approval.integrity_hash)) failures.push("INVALID_INTEGRITY_HASH");
  if (input.reviews.some((review) => reviewHash(review) !== review.integrity_hash)) failures.push("INVALID_INTEGRITY_HASH");
  if (archiveHash(input.archive) !== input.archive.integrity_hash) failures.push("INVALID_INTEGRITY_HASH");
  return Object.freeze([...new Set(failures)] as GovernanceDecisionLedgerFailureReason[]);
}

function resultReplayHash(result: Omit<GovernanceDecisionLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    enforcement_result: result.enforcement_result,
    ledger_record: result.ledger_record,
    timeline: result.timeline,
    operator_approvals: result.operator_approvals,
    governance_reviews: result.governance_reviews,
    archive: result.archive,
    validation: result.validation,
    failures: result.failures,
  });
}

export function writeGovernanceDecisionLedger(input: GovernanceDecisionLedgerInput = {}): GovernanceDecisionLedgerResult {
  const enforcement = input.enforcement_result ?? evaluateFailClosedEnforcement();
  const ledger_record = createLedgerRecord(enforcement);
  const timeline = buildTimeline(enforcement, ledger_record);
  const operator_approvals = buildOperatorApprovals(enforcement);
  const governance_reviews = buildGovernanceReviews(enforcement);
  const archive = buildArchive(ledger_record, timeline, operator_approvals, governance_reviews);
  const failures = ledgerFailures({
    enforcement,
    ledger: ledger_record,
    timeline,
    approvals: operator_approvals,
    reviews: governance_reviews,
    archive,
    existing: input.existing_records ?? [],
    modification: input.record_modification_attempt ?? false,
    deletion: input.record_deletion_attempt ?? false,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = validationResult(failures);
  const base: Omit<GovernanceDecisionLedgerResult, "integrity_hash" | "replay_hash"> = {
    ledger_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    enforcement_result: enforcement,
    ledger_record,
    timeline,
    operator_approvals,
    governance_reviews,
    archive,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayValidation = validationResult(["REPLAY_DIVERGENCE"]);
    const replayBase: Omit<GovernanceDecisionLedgerResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      ledger_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      failures: replayValidation.failures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

function queryHash(query: Omit<GovernanceDecisionLedgerQuery, "integrity_hash"> | GovernanceDecisionLedgerQuery): string {
  return hashWithoutIntegrity(query);
}

export function queryGovernanceDecisionLedger(result: GovernanceDecisionLedgerResult, query_type: GovernanceLedgerQueryType): GovernanceDecisionLedgerQuery {
  const queryResultMap: Record<GovernanceLedgerQueryType, readonly string[]> = {
    governance_decision: [result.ledger_record.governance_decision_id],
    mission_timeline: result.timeline.map((event) => `${event.event_order}:${event.event_type}:${event.event_result}`),
    operator_approvals: result.operator_approvals.map((approval) => `${approval.operator_identity}:${approval.approval_outcome}:${approval.approval_scope}`),
    governance_reviews: result.governance_reviews.map((review) => `${review.reviewer_ref}:${review.review_outcome}`),
    enforcement_outcomes: [result.ledger_record.enforcement_outcome],
    replay_references: result.ledger_record.replay_refs,
    certification_history: result.ledger_record.certification_results,
    lineage_history: result.ledger_record.lineage_refs,
  };
  const base: Omit<GovernanceDecisionLedgerQuery, "integrity_hash"> = {
    query_id: `governance_ledger_query_${query_type}_${result.ledger_record.governance_decision_id}`,
    query_type,
    records: [result.ledger_record.ledger_id],
    results: queryResultMap[query_type],
    replay_refs: result.ledger_record.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: queryHash(base) });
}

export function readGovernanceDecisionLedger(result: GovernanceDecisionLedgerResult, governance_decision_id: string): GovernanceDecisionLedgerRecord | undefined {
  return result.ledger_record.governance_decision_id === governance_decision_id ? result.ledger_record : undefined;
}

export function replayGovernanceDecisionLedger(result: GovernanceDecisionLedgerResult): GovernanceDecisionLedgerReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && computeGovernanceDecisionLedgerHash(result.ledger_record) === result.ledger_record.integrity_hash
    && result.timeline.every((event) => timelineHash(event) === event.integrity_hash)
    && result.operator_approvals.every((approval) => approvalHash(approval) === approval.integrity_hash)
    && result.governance_reviews.every((review) => reviewHash(review) === review.integrity_hash)
    && archiveHash(result.archive) === result.archive.integrity_hash;
  const failures: GovernanceDecisionLedgerFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<GovernanceDecisionLedgerReplay, "integrity_hash"> = {
    replay_id: "replay_governance_decision_ledger",
    replay_valid,
    governance_decision_id: result.ledger_record.governance_decision_id,
    ledger_ref: result.ledger_record.ledger_id,
    timeline_refs: result.timeline.map((event) => event.event_id),
    enforcement_outcome: result.ledger_record.enforcement_outcome,
    validation_results: [
      ...result.ledger_record.validation_results,
      ...result.ledger_record.constitutional_results,
      ...result.ledger_record.authority_results,
      ...result.ledger_record.tenant_results,
      ...result.ledger_record.certification_results,
      ...result.ledger_record.replay_results,
      ...result.ledger_record.integrity_results,
    ],
    approval_refs: result.operator_approvals.map((approval) => approval.approval_id),
    review_refs: result.governance_reviews.map((review) => review.review_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildGovernanceDecisionLedgerObservability(result: GovernanceDecisionLedgerResult): GovernanceDecisionLedgerObservability {
  return Object.freeze({
    ledger_write_events: 1,
    ledger_read_events: readGovernanceDecisionLedger(result, result.ledger_record.governance_decision_id) ? 1 : 0,
    integrity_verification_events: result.validation.checks.integrity_hash_valid ? 1 : 0,
    replay_retrieval_events: replayGovernanceDecisionLedger(result).replay_valid ? 1 : 0,
    audit_query_events: GOVERNANCE_LEDGER_QUERY_TYPES.length,
    governance_review_events: result.governance_reviews.length,
    operator_approval_events: result.operator_approvals.length,
    lineage_reconstruction_events: result.ledger_record.lineage_refs.length,
    export_events: 1,
  });
}

export function getGovernanceDecisionLedgerFoundation(): GovernanceDecisionLedgerFoundation {
  const result = writeGovernanceDecisionLedger();
  const replay = replayGovernanceDecisionLedger(result);
  return Object.freeze({
    ledger_version: LEDGER_VERSION,
    query_types: GOVERNANCE_LEDGER_QUERY_TYPES,
    result,
    replay,
    observability: buildGovernanceDecisionLedgerObservability(result),
  });
}

export const GovernanceDecisionLedger = Object.freeze({
  write: writeGovernanceDecisionLedger,
  read: readGovernanceDecisionLedger,
  query: queryGovernanceDecisionLedger,
  replay: replayGovernanceDecisionLedger,
});
