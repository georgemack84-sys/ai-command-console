import { describe, expect, it } from "vitest";
import {
  REPLAY_DIFFERENCE_CATEGORIES,
  REPLAY_DIFFERENCE_OUTCOMES,
  detectReplayDifferences,
  getReplayDifferenceDetectorFoundation,
} from "@/services/decision-replay-difference-detector";

describe("Mission Control Phase 9.10.5 Replay Difference Detector", () => {
  it("publishes the difference detector foundation", () => {
    const foundation = getReplayDifferenceDetectorFoundation();

    expect(foundation.detector_version).toBe("decision-replay-difference-detector/v1");
    expect(foundation.categories).toEqual(REPLAY_DIFFERENCE_CATEGORIES);
    expect(foundation.outcomes).toEqual(REPLAY_DIFFERENCE_OUTCOMES);
    expect(foundation.result.diff_result.difference_outcome).toBe("IDENTICAL");
  });

  it("classifies identical replay correctly", () => {
    const result = detectReplayDifferences();

    expect(result.diff_result.diff_status).toBe("PASS");
    expect(result.diff_result.difference_count).toBe(0);
    expect(result.drift_report.certification_disposition).toBe("CERTIFICATION_READY");
    expect(result.dashboard.certification_ready).toBe(true);
  });

  it.each([
    ["CANDIDATE_MISMATCH", "CANDIDATE_MISMATCH"],
    ["CONTEXT_MISMATCH", "CONTEXT_MISMATCH"],
    ["PRIORITY_MISMATCH", "PRIORITY_MISMATCH"],
    ["CONFLICT_MISMATCH", "CONFLICT_MISMATCH"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_MISMATCH"],
    ["PACKAGE_MISMATCH", "PACKAGE_MISMATCH"],
    ["OPERATOR_MISMATCH", "OPERATOR_MISMATCH"],
    ["OUTCOME_MISMATCH", "OUTCOME_MISMATCH"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_MISMATCH"],
  ] as const)("detects %s", (scenario, category) => {
    const result = detectReplayDifferences({ scenario });

    expect(result.diff_result.difference_records[0]?.difference_category).toBe(category);
    expect(result.diff_result.difference_count).toBe(1);
    expect(result.diff_result.diff_status).toBe("BLOCKED");
    expect(result.certification_ready).toBe(false);
  });

  it("allows explicitly minor differences without certification block", () => {
    const result = detectReplayDifferences({ scenario: "MINOR_DIFFERENCE" });

    expect(result.diff_result.difference_outcome).toBe("MINOR_DIFFERENCE");
    expect(result.diff_result.diff_status).toBe("PASS");
    expect(result.dashboard.certification_ready).toBe(true);
  });

  it("blocks governance, replay, and integrity outcomes appropriately", () => {
    expect(detectReplayDifferences({ scenario: "GOVERNANCE_MISMATCH" }).diff_result.difference_outcome).toBe("GOVERNANCE_DIFFERENCE");
    expect(detectReplayDifferences({ scenario: "OUTCOME_MISMATCH" }).diff_result.difference_outcome).toBe("REPLAY_FAILURE");
    expect(detectReplayDifferences({ scenario: "INTEGRITY_MISMATCH" }).diff_result.difference_outcome).toBe("INTEGRITY_FAILURE");
  });

  it("fails closed for unknown root cause, cross-tenant comparison, broken lineage, and unsupported versions", () => {
    expect(detectReplayDifferences({ scenario: "UNKNOWN_CAUSE" }).diff_result.root_cause_summary).toContain("UNKNOWN_CAUSE");
    expect(detectReplayDifferences({ scenario: "UNKNOWN_CAUSE" }).certification_ready).toBe(false);
    expect(detectReplayDifferences({ scenario: "CROSS_TENANT" }).diff_result.root_cause_summary).toContain("TENANT_BOUNDARY_VIOLATION");
    expect(detectReplayDifferences({ scenario: "BROKEN_LINEAGE" }).diff_result.root_cause_summary).toContain("LINEAGE_BREAK");
    expect(detectReplayDifferences({ scenario: "UNSUPPORTED_VERSION" }).diff_result.root_cause_summary).toContain("UNSUPPORTED_VERSION");
  });

  it("generates explanations, drift reports, dashboard model, immutable records, and ledger", () => {
    const result = detectReplayDifferences({ scenario: "OUTCOME_MISMATCH" });

    expect(result.diff_result.difference_records[0]?.explanation).toContain("Replay difference detected");
    expect(result.drift_report.explanation).toContain("Replay difference detected");
    expect(result.dashboard.difference_categories).toContain("OUTCOME_MISMATCH");
    expect(Object.isFrozen(result.diff_result.difference_records[0])).toBe(true);
    expect(result.ledger[0]?.append_only).toBe(true);
    expect(result.ledger[0]?.deleted).toBe(false);
  });

  it("preserves advisory-only boundaries and does not mutate records", () => {
    const result = detectReplayDifferences({ scenario: "INTEGRITY_MISMATCH" });

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_original_records).toBe(false);
    expect(result.dashboard.integrity_status).toBe("FAILED");
  });
});
