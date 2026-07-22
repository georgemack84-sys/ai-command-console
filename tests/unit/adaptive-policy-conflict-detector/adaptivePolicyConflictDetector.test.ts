import { describe, expect, it } from "vitest";
import {
  detectAdaptivePolicyConflicts,
  getAdaptivePolicyConflictDetectorFoundation,
  replayAdaptivePolicyConflictDetection,
} from "@/services/adaptive-policy-conflict-detector";
import type { AdaptivePolicyConflictFailure, AdaptivePolicyConflictScenario } from "@/types/adaptive-policy-conflict-detector";

describe("Mission Control Phase 10.8.5 Adaptive Policy Conflict Detector", () => {
  it("publishes the adaptive policy conflict detector foundation", () => {
    const foundation = getAdaptivePolicyConflictDetectorFoundation();

    expect(foundation.adaptive_policy_conflict_detector_version).toBe("adaptive-policy-conflict-detector/v1");
    expect(foundation.api_surface.analyze_conflicts).toBe("POST /adaptive-policy-conflict-detector/analyze");
    expect(foundation.api_surface.governance_override_supported).toBe(false);
    expect(foundation.api_surface.conflict_auto_resolution_supported).toBe(false);
    expect(foundation.result.analysis.conflict_status).toBe("NO_CONFLICT");
  });

  it("detects conflicts deterministically", () => {
    const first = detectAdaptivePolicyConflicts({ scenario: "POLICY_CONTRADICTION" });
    const second = detectAdaptivePolicyConflicts({ scenario: "POLICY_CONTRADICTION" });

    expect(first.analysis.conflict_id).toBe(second.analysis.conflict_id);
    expect(first.analysis.integrity_hash).toBe(second.analysis.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("remains advisory-only, transparent, and human-governed", () => {
    const result = detectAdaptivePolicyConflicts();

    expect(result.advisory_only).toBe(true);
    expect(result.human_governed).toBe(true);
    expect(result.conflict_transparent).toBe(true);
    expect(result.fail_closed).toBe(false);
  });

  it("detects and explains resolvable conflicts", () => {
    const result = detectAdaptivePolicyConflicts({ scenario: "POLICY_CONTRADICTION" });

    expect(result.analysis.detected_conflicts.length).toBe(1);
    expect(result.analysis.detected_conflicts[0].resolvable).toBe(true);
    expect(result.analysis.resolution_path.length).toBeGreaterThan(0);
    expect(result.analysis.required_reviewers.map((reviewer) => reviewer.reviewer_role)).toContain("governance_board");
    expect(result.analysis.conflict_status).toBe("REQUIRES_GOVERNANCE_REVIEW");
  });

  it("routes review states deterministically", () => {
    expect(detectAdaptivePolicyConflicts({ scenario: "RESOLUTION_AVAILABLE" }).analysis.conflict_status).toBe("RESOLUTION_AVAILABLE");
    expect(detectAdaptivePolicyConflicts({ scenario: "OPERATOR_REVIEW" }).analysis.conflict_status).toBe("REQUIRES_OPERATOR_REVIEW");
    expect(detectAdaptivePolicyConflicts({ scenario: "GOVERNANCE_REVIEW" }).analysis.conflict_status).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(detectAdaptivePolicyConflicts({ scenario: "CONSTITUTIONAL_REVIEW" }).analysis.conflict_status).toBe("REQUIRES_CONSTITUTIONAL_REVIEW");
    expect(detectAdaptivePolicyConflicts({ scenario: "MULTI_STAGE_REVIEW" }).analysis.conflict_status).toBe("REQUIRES_MULTI_STAGE_REVIEW");
  });

  it.each([
    ["POLICY_PRECEDENCE_FAILURE", "POLICY_PRECEDENCE_UNRESOLVED"],
    ["IRRECONCILABLE_POLICY", "IRRECONCILABLE_GOVERNANCE_CONSTITUTIONAL_CONFLICT"],
    ["MUTUALLY_EXCLUSIVE_APPROVALS", "MUTUALLY_EXCLUSIVE_APPROVALS"],
    ["CONSTITUTIONAL_CONFLICT", "UNRESOLVED_CONSTITUTIONAL_CONFLICT"],
    ["CERTIFICATION_BLOCKED", "BLOCKING_CERTIFICATION_CONFLICT"],
    ["AUTHORITY_EXPANSION", "UNAUTHORIZED_AUTHORITY_EXPANSION_CONFLICT"],
    ["AUDIT_UNMAINTAINABLE", "AUDIT_INTEGRITY_UNMAINTAINABLE"],
    ["REPLAY_UNGUARANTEED", "REPLAY_DETERMINISM_UNGUARANTEED"],
    ["CONTRADICTORY_EVIDENCE", "CONTRADICTORY_OR_INSUFFICIENT_EVIDENCE"],
    ["ROLLBACK_UNAVAILABLE", "ROLLBACK_UNAVAILABLE"],
    ["COMPLIANCE_UNSATISFIED", "COMPLIANCE_UNSATISFIED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_CONFLICT_REASONING"],
    ["LINEAGE_INCOMPLETE", "CONFLICT_LINEAGE_INCOMPLETE"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["LEDGER_FAILURE", "CONFLICT_DECISION_RECORDING_FAILED"],
  ] as readonly [AdaptivePolicyConflictScenario, AdaptivePolicyConflictFailure][])("fails closed for %s", (scenario, failure) => {
    const result = detectAdaptivePolicyConflicts({ scenario });

    expect(result.analysis.failures).toContain(failure);
    expect(result.analysis.conflict_status).toBe("FAIL_CLOSED");
    expect(result.fail_closed).toBe(true);
    expect(result.analysis.detected_conflicts[0].severity).toBe("FAIL_CLOSED");
  });

  it("records immutable conflict ledger evidence", () => {
    const result = detectAdaptivePolicyConflicts({ scenario: "APPROVAL_CONFLICT" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.replayable).toBe(true);
    expect(result.ledger_entry.conflict_id).toBe(result.analysis.conflict_id);
  });

  it("replays conflict analysis and detects tampering", () => {
    const result = detectAdaptivePolicyConflicts({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptivePolicyConflictDetection(result)).toBe(true);
    expect(replayAdaptivePolicyConflictDetection(tampered)).toBe(false);
  });
});
