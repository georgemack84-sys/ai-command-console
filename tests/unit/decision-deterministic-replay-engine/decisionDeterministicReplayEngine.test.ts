import { describe, expect, it } from "vitest";
import {
  DETERMINISTIC_REPLAY_STATES,
  REPLAY_EQUALITY_DOMAINS,
  getDeterministicReplayEngineFoundation,
  runDeterministicReplay,
} from "@/services/decision-deterministic-replay-engine";

describe("Mission Control Phase 9.10.4 Deterministic Replay Engine", () => {
  it("publishes deterministic replay engine foundation", () => {
    const foundation = getDeterministicReplayEngineFoundation();

    expect(foundation.engine_version).toBe("decision-deterministic-replay-engine/v1");
    expect(foundation.replay_states).toEqual(DETERMINISTIC_REPLAY_STATES);
    expect(foundation.equality_domains).toEqual(REPLAY_EQUALITY_DOMAINS);
    expect(foundation.result.execution_record.replay_state).toBe("REPLAY_MATCHED");
  });

  it("restores every replay equality domain deterministically", () => {
    const first = runDeterministicReplay();
    const second = runDeterministicReplay();

    expect(second).toEqual(first);
    expect(first.restored_states.map((state) => state.equality_domain)).toEqual(REPLAY_EQUALITY_DOMAINS);
    expect(first.validation.overall_match_status).toBe("MATCH");
    expect(first.validation.divergence_detected).toBe(false);
  });

  it("generates execution record, report, and append-only ledger", () => {
    const result = runDeterministicReplay();

    expect(result.execution_record.replay_version).toBe("decision-deterministic-replay/v1");
    expect(result.execution_record.match_status).toBe("MATCH");
    expect(result.report.certification_ready).toBe(true);
    expect(result.report.replay_stage_results).toHaveLength(9);
    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0]?.append_only).toBe(true);
    expect(result.ledger[0]?.deleted).toBe(false);
  });

  it("preserves governance, constitutional, advisory, tenant, and no-live-execution boundaries", () => {
    const result = runDeterministicReplay();

    expect(result.report.governance_summary).toBe("governance outcomes preserved");
    expect(result.report.constitutional_summary).toBe("constitutional outcomes preserved");
    expect(result.report.operator_workflow_summary).toBe("operator workflow preserved");
    expect(result.advisory_only).toBe(true);
    expect(result.external_calls_blocked).toBe(true);
    expect(result.live_system_lookups_blocked).toBe(true);
    expect(result.mutates_original_orchestration).toBe(false);
  });

  it("detects divergence when replay output differs", () => {
    const result = runDeterministicReplay({ scenario: "DIVERGENCE" });

    expect(result.execution_record.replay_state).toBe("DIVERGENCE_DETECTED");
    expect(result.validation.overall_match_status).toBe("DIVERGENCE");
    expect(result.validation.divergence_refs).toContain("final_decision_state");
    expect(result.failures).toContain("REPLAY_OUTPUT_DIVERGENCE");
    expect(result.report.certification_ready).toBe(false);
  });

  it.each([
    ["INVALID_CONTRACT", "REPLAY_CONTRACT_INVALID"],
    ["MISSING_ARTIFACT", "REQUIRED_ARTIFACT_MISSING"],
    ["ARTIFACT_CORRUPTION", "ARTIFACT_INTEGRITY_MISMATCH"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["CROSS_TENANT", "TENANT_MISMATCH"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_ARTIFACT_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_ARTIFACT_MISSING"],
    ["MISSING_OPERATOR_WORKFLOW", "OPERATOR_WORKFLOW_ARTIFACT_MISSING"],
    ["NONDETERMINISTIC_VALUE", "NONDETERMINISTIC_VALUE_DETECTED"],
    ["FINAL_DECISION_MISSING", "FINAL_DECISION_REPRODUCTION_FAILED"],
    ["ORIGINAL_MUTATION", "ORIGINAL_ORCHESTRATION_MUTATED"],
    ["EXTERNAL_EXECUTION", "EXTERNAL_EXECUTION_ATTEMPTED"],
    ["LIVE_LOOKUP", "LIVE_SYSTEM_LOOKUP_ATTEMPTED"],
    ["LEDGER_FAILURE", "REPLAY_LEDGER_COMMIT_FAILURE"],
  ] as const)("fails closed for %s", (scenario, failure) => {
    const result = runDeterministicReplay({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.report.certification_ready).toBe(false);
  });
});
