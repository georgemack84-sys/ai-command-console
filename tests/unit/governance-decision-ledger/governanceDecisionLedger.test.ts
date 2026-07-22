import { describe, expect, it } from "vitest";
import { evaluateFailClosedEnforcement } from "@/services/fail-closed-enforcement-engine";
import {
  GOVERNANCE_LEDGER_QUERY_TYPES,
  computeGovernanceDecisionLedgerHash,
  getGovernanceDecisionLedgerFoundation,
  queryGovernanceDecisionLedger,
  readGovernanceDecisionLedger,
  replayGovernanceDecisionLedger,
  writeGovernanceDecisionLedger,
} from "@/services/governance-decision-ledger";

describe("Mission Control Phase 9.7.9 Governance Decision Ledger", () => {
  it("publishes the governance decision ledger foundation", () => {
    const foundation = getGovernanceDecisionLedgerFoundation();

    expect(foundation.ledger_version).toBe("governance-decision-ledger/v1");
    expect(foundation.query_types).toEqual(GOVERNANCE_LEDGER_QUERY_TYPES);
    expect(foundation.result.ledger_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
    expect(foundation.observability.ledger_write_events).toBe(1);
  });

  it("writes complete deterministic governance ledger records", () => {
    const first = writeGovernanceDecisionLedger();
    const second = writeGovernanceDecisionLedger();

    expect(first).toEqual(second);
    expect(first.ledger_record.governance_decision_id).toBe(first.enforcement_result.governance_decision.governance_decision_id);
    expect(first.ledger_record.validation_results.length).toBeGreaterThan(0);
    expect(first.ledger_record.constitutional_results.length).toBeGreaterThan(0);
    expect(first.ledger_record.authority_results.length).toBeGreaterThan(0);
    expect(first.ledger_record.tenant_results.length).toBeGreaterThan(0);
    expect(first.ledger_record.certification_results.length).toBeGreaterThan(0);
    expect(first.ledger_record.replay_results.length).toBeGreaterThan(0);
    expect(first.ledger_record.integrity_results.length).toBeGreaterThan(0);
    expect(first.timeline).toHaveLength(10);
  });

  it("supports deterministic reads and query types", () => {
    const result = writeGovernanceDecisionLedger();

    expect(readGovernanceDecisionLedger(result, result.ledger_record.governance_decision_id)).toEqual(result.ledger_record);
    for (const queryType of GOVERNANCE_LEDGER_QUERY_TYPES) {
      const query = queryGovernanceDecisionLedger(result, queryType);
      expect(query.query_type).toBe(queryType);
      expect(query.records).toEqual([result.ledger_record.ledger_id]);
      expect(query.results.length).toBeGreaterThan(0);
    }
  });

  it("records operator approvals, governance reviews, archive refs, and enforcement outcome", () => {
    const enforcement = evaluateFailClosedEnforcement();
    const result = writeGovernanceDecisionLedger({ enforcement_result: enforcement });

    expect(result.ledger_record.enforcement_outcome).toBe(enforcement.evaluation_record.enforcement_outcome);
    expect(result.operator_approvals.length).toBeGreaterThan(0);
    expect(result.governance_reviews).toHaveLength(1);
    expect(result.archive.ledger_ref).toBe(result.ledger_record.ledger_id);
    expect(result.archive.timeline_refs).toEqual(result.timeline.map((event) => event.event_id));
  });

  it("rejects duplicate ids, modification attempts, deletion attempts, and unauthorized access", () => {
    const valid = writeGovernanceDecisionLedger();

    expect(writeGovernanceDecisionLedger({ existing_records: [valid.ledger_record] }).failures).toContain("DUPLICATE_LEDGER_IDENTIFIER");
    expect(writeGovernanceDecisionLedger({ record_modification_attempt: true }).failures).toContain("FINALIZED_RECORD_MODIFICATION_ATTEMPT");
    expect(writeGovernanceDecisionLedger({ record_deletion_attempt: true }).failures).toContain("RECORD_DELETION_ATTEMPT");
    expect(writeGovernanceDecisionLedger({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_GOVERNANCE_LEDGER_ACCESS");
  });

  it("rejects invalid enforcement records and replay mismatches", () => {
    const valid = writeGovernanceDecisionLedger();
    const badEnforcement = { ...valid.enforcement_result, enforcement_status: "FAIL" as const, evaluation_record: { ...valid.enforcement_result.evaluation_record, enforcement_outcome: "ALLOW" as const } };

    expect(writeGovernanceDecisionLedger({ enforcement_result: badEnforcement }).failures).toContain("ENFORCEMENT_RECORD_INVALID");
    expect(writeGovernanceDecisionLedger({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("detects ledger integrity tampering during replay", () => {
    const result = writeGovernanceDecisionLedger();
    const tamperedLedger = { ...result.ledger_record, enforcement_outcome: "BLOCK" as const };
    const replay = replayGovernanceDecisionLedger(result);
    const tamperedReplay = replayGovernanceDecisionLedger({ ...result, ledger_record: tamperedLedger });

    expect(computeGovernanceDecisionLedgerHash(result.ledger_record)).toBe(result.ledger_record.integrity_hash);
    expect(replay.replay_valid).toBe(true);
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });

  it("reconstructs identical governance history from ledger contents", () => {
    const result = writeGovernanceDecisionLedger();
    const replay = replayGovernanceDecisionLedger(result);

    expect(replay.timeline_refs).toEqual(result.timeline.map((event) => event.event_id));
    expect(replay.enforcement_outcome).toBe(result.ledger_record.enforcement_outcome);
    expect(replay.validation_results).toContain(result.ledger_record.certification_results[0]);
    expect(replay.approval_refs).toEqual(result.operator_approvals.map((approval) => approval.approval_id));
    expect(replay.review_refs).toEqual(result.governance_reviews.map((review) => review.review_id));
  });
});
