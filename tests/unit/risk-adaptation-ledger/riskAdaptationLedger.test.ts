import { describe, expect, it } from "vitest";
import { analyzeRiskAdaptationLedger, getRiskAdaptationLedgerFoundation, replayRiskAdaptationLedger } from "@/services/risk-adaptation-ledger";
import type { RiskAdaptationLedgerFailure, RiskAdaptationLedgerScenario } from "@/types/risk-adaptation-ledger";

describe("Mission Control Phase 10.7.6 Risk Adaptation Ledger", () => {
  it("publishes the risk adaptation ledger foundation", () => {
    const foundation = getRiskAdaptationLedgerFoundation();

    expect(foundation.risk_adaptation_ledger_version).toBe("risk-adaptation-ledger/v1");
    expect(foundation.api_surface.commit_entry).toBe("POST /risk-adaptation-ledger/commit");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("commits ledger entries deterministically", () => {
    const first = analyzeRiskAdaptationLedger({ scenario: "CERTIFIED" });
    const second = analyzeRiskAdaptationLedger({ scenario: "CERTIFIED" });

    expect(first.entries[0].ledger_entry_id).toBe(second.entries[0].ledger_entry_id);
    expect(first.entries[0].current_hash).toBe(second.entries[0].current_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("records all lifecycle entry types", () => {
    expect(analyzeRiskAdaptationLedger({ scenario: "PROPOSAL" }).entries[0].entry_type).toBe("PROPOSAL_CREATED");
    expect(analyzeRiskAdaptationLedger({ scenario: "REVISION" }).entries[0].entry_type).toBe("REVISION_REQUESTED");
    expect(analyzeRiskAdaptationLedger({ scenario: "VALIDATION" }).entries[0].entry_type).toBe("VALIDATION_COMPLETED");
    expect(analyzeRiskAdaptationLedger({ scenario: "GOVERNANCE" }).entries[0].entry_type).toBe("GOVERNANCE_REVIEWED");
    expect(analyzeRiskAdaptationLedger({ scenario: "SIMULATION" }).entries[0].entry_type).toBe("SIMULATION_EXECUTED");
    expect(analyzeRiskAdaptationLedger({ scenario: "APPROVED" }).entries[0].entry_type).toBe("OPERATOR_APPROVED");
    expect(analyzeRiskAdaptationLedger({ scenario: "REJECTED" }).entries[0].entry_type).toBe("OPERATOR_REJECTED");
    expect(analyzeRiskAdaptationLedger({ scenario: "CERTIFIED" }).entries[0].entry_type).toBe("CERTIFICATION_DECIDED");
    expect(analyzeRiskAdaptationLedger({ scenario: "REPLAY" }).entries[0].entry_type).toBe("REPLAY_GENERATED");
    expect(analyzeRiskAdaptationLedger({ scenario: "ROLLBACK" }).entries[0].entry_type).toBe("ROLLBACK_LINEAGE_RECORDED");
    expect(analyzeRiskAdaptationLedger({ scenario: "HISTORICAL_REFERENCE" }).entries[0].entry_type).toBe("HISTORICAL_REFERENCE_RECORDED");
  });

  it("preserves lifecycle registries", () => {
    const result = analyzeRiskAdaptationLedger({ scenario: "APPROVED" });

    expect(result.proposal_registry.proposal_refs.length).toBeGreaterThan(0);
    expect(result.governance_registry.governance_review_refs.length).toBeGreaterThan(0);
    expect(result.simulation_registry.simulation_refs.length).toBeGreaterThan(0);
    expect(result.operator_registry.operator_decision_refs.length).toBeGreaterThan(0);
    expect(result.certification_registry.certification_refs.length).toBeGreaterThan(0);
    expect(result.lineage_registry.rollback_lineage_refs.length).toBeGreaterThan(0);
  });

  it("verifies immutable append-only integrity", () => {
    const result = analyzeRiskAdaptationLedger({ scenario: "BASELINE" });

    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.deletes_records).toBe(false);
    expect(result.mutates_historical_entries).toBe(false);
    expect(result.reorders_transactions).toBe(false);
    expect(result.integrity_report.hash_integrity_verified).toBe(true);
    expect(result.integrity_report.chain_continuity_verified).toBe(true);
    expect(result.validation.no_deletion).toBe(true);
  });

  it("replays the ledger", () => {
    const result = analyzeRiskAdaptationLedger({ scenario: "REPLAY" });

    expect(replayRiskAdaptationLedger(result)).toBe(true);
  });

  it.each([
    ["MISSING_SCHEMA", "SCHEMA_INVALID"],
    ["MISSING_REFERENCES", "REQUIRED_REFERENCES_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["HASH_MISMATCH", "HASH_VERIFICATION_FAILED"],
    ["BROKEN_CHAIN", "CHAIN_CONTINUITY_BROKEN"],
    ["REORDERED", "TRANSACTION_REORDER_DETECTED"],
    ["BAD_TIMESTAMP", "TIMESTAMP_INCONSISTENT"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_REFERENCES_MISSING"],
    ["MISSING_OPERATOR", "OPERATOR_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REFERENCES_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HISTORICAL_MUTATION", "HISTORICAL_ENTRY_MUTATION_DETECTED"],
    ["DELETION", "LEDGER_ENTRY_DELETION_DETECTED"],
    ["EVIDENCE_REWRITE", "EVIDENCE_REWRITE_DETECTED"],
    ["GOVERNANCE_SUPPRESSION", "GOVERNANCE_HISTORY_SUPPRESSION_DETECTED"],
    ["CONSTITUTIONAL_SUPPRESSION", "CONSTITUTIONAL_REVIEW_SUPPRESSION_DETECTED"],
    ["OPERATOR_BYPASS", "OPERATOR_AUTHORITY_BYPASS_DETECTED"],
    ["UNAUTHORIZED_WRITE", "UNAUTHORIZED_WRITE_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_LEDGER_COMMIT"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskAdaptationLedgerScenario, RiskAdaptationLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRiskAdaptationLedger({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.deletes_records).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = analyzeRiskAdaptationLedger({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects hash and chain integrity failures", () => {
    expect(analyzeRiskAdaptationLedger({ scenario: "HASH_MISMATCH" }).validation.state).toBe("REJECTED");
    expect(analyzeRiskAdaptationLedger({ scenario: "BROKEN_CHAIN" }).validation.state).toBe("REJECTED");
  });

  it("detects replay tampering", () => {
    const result = analyzeRiskAdaptationLedger({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskAdaptationLedger(tampered)).toBe(false);
  });
});
