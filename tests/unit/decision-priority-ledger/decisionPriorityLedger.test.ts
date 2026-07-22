import { describe, expect, it } from "vitest";
import {
  buildPriorityLedgerObservability,
  getPriorityLedgerEngine,
  queryPriorityAudit,
  replayPriorityLedger,
  verifyPriorityLedgerIntegrity,
  writePriorityLedger,
} from "@/services/decision-priority-ledger";
import { explainPriorities } from "@/services/decision-priority-explanation-engine";
import { scoreDecisionPriorities } from "@/services/decision-priority-scoring-engine";

describe("Mission Control Phase 9.5.9 Priority Ledger", () => {
  it("writes immutable priority records with scoring, ranking, explanation, and replay lineage", () => {
    const first = writePriorityLedger();
    const second = writePriorityLedger();

    expect(first).toEqual(second);
    expect(first.ledger_status).toBe("PASS");
    expect(first.ledger_records).toHaveLength(1);
    expect(first.ledger_records[0]?.overall_priority_score).toBeGreaterThan(0);
    expect(first.ledger_records[0]?.factor_score_refs).toHaveLength(10);
    expect(first.ledger_records[0]?.explanation_ref).toContain("priority_explanation");
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.appendOnly).toBe(true);
    expect(first.immutable).toBe(true);
  });

  it("appends new records after existing history and reconstructs lineage", () => {
    const initial = writePriorityLedger();
    const scoring = scoreDecisionPriorities({ candidates: [{ decision_candidate_id: "later", scores: { mission_score: 95 } }] });
    const explanation = explainPriorities({ scoring_result: scoring });
    const appended = writePriorityLedger({ existing_records: initial.ledger_records, explanation_result: explanation });

    expect(appended.ledger_records).toHaveLength(2);
    expect(appended.ledger_records.map((record) => record.ledger_sequence_number)).toEqual([1, 2]);
    expect(appended.history_records[0]?.previous_priority_state).toBeNull();
    expect(appended.replay_indexes[0]?.priority_record_refs[0]).toBe(appended.ledger_records[1]?.ledger_record_id);
    expect(appended.ranking_timeline.sequence_valid).toBe(true);
  });

  it("preserves audit queries, metadata, and record integrity", () => {
    const result = writePriorityLedger();
    const audit = queryPriorityAudit(result);
    const candidateAudit = queryPriorityAudit(result, result.ledger_records[0]?.decision_candidate_id);
    const engine = getPriorityLedgerEngine();

    expect(verifyPriorityLedgerIntegrity(result.ledger_records[0]!)).toBe(true);
    expect(audit.priority_record_refs).toEqual(result.audit_report.priority_record_refs);
    expect(candidateAudit.priority_record_refs).toHaveLength(1);
    expect(result.metadata_record.ledger_version).toBe("priority-ledger/v1");
    expect(engine.engine_version).toBe("priority-ledger/v1");
  });

  it("fails closed for missing refs, duplicate sequences, tenant leakage, mutation/deletion attempts, ordering failure, integrity failure, and replay mismatch", () => {
    const noEvidence = writePriorityLedger({ explanation_result: explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ evidence_refs: [] }] }) }) });
    const noGovernance = writePriorityLedger({ explanation_result: explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ governance_refs: [] }] }) }) });
    const noReplay = writePriorityLedger({ explanation_result: explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ replay_refs: [] }] }) }) });
    const tenantLeak = writePriorityLedger({ explanation_result: explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ governance_refs: ["governance_tenant_beta_leak"] }] }) }) });
    const base = writePriorityLedger();
    const duplicate = writePriorityLedger({ existing_records: [base.ledger_records[0]!, base.ledger_records[0]!] });
    const mutation = writePriorityLedger({ attempted_mutation_refs: ["mutate-ledger-record"] });
    const deletion = writePriorityLedger({ attempted_deletion_refs: ["delete-ledger-record"] });
    const ordering = writePriorityLedger({ canonical_ordering_reproducible: false });
    const replayMismatch = writePriorityLedger({ expected_replay_hash: `${base.replay_hash}-wrong` });
    const tamperedRecord = { ...base.ledger_records[0]!, overall_priority_score: 1 };

    expect(noEvidence.failures).toContain("EVIDENCE_REFERENCES_MISSING");
    expect(noGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_REFERENCE_DETECTED");
    expect(duplicate.failures).toContain("DUPLICATE_LEDGER_SEQUENCE");
    expect(mutation.failures).toContain("LEDGER_MUTATION_DETECTED");
    expect(deletion.failures).toContain("LEDGER_DELETION_DETECTED");
    expect(ordering.failures).toContain("CANONICAL_ORDERING_FAILED");
    expect(replayMismatch.failures).toContain("LEDGER_REPLAY_MISMATCH");
    expect(verifyPriorityLedgerIntegrity(tamperedRecord)).toBe(false);
  });

  it("replays ledger output and reports observability", () => {
    const valid = writePriorityLedger();
    const invalid = writePriorityLedger({ attempted_mutation_refs: ["mutation"] });
    const replay = replayPriorityLedger(valid);
    const metrics = buildPriorityLedgerObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.ledger_records_written).toBeGreaterThan(0);
    expect(metrics.factor_ref_distribution.mission_score).toBeGreaterThan(0);
  });
});
