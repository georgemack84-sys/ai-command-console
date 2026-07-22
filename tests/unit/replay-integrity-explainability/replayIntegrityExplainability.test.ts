import { describe, expect, it } from "vitest";
import {
  getReplayIntegrityExplainabilityBundle,
  replayReplayIntegrityExplainability,
  runReplayIntegrityExplainability,
  validateReplayIntegrityExplainability,
} from "@/services/replay-integrity-explainability";
import type { ReplayIntegrityFailure } from "@/types/replay-integrity-explainability";

describe("Mission Control Phase 14.10 Replay, Integrity & Explainability", () => {
  it("publishes replay integrity doctrine", () => {
    const bundle = getReplayIntegrityExplainabilityBundle();

    expect(bundle.doctrine.version).toBe("replay-integrity-explainability/v14.10");
    expect(bundle.doctrine.certification_lineage_phase).toBe("certification-lineage-supersession/v14.9");
    expect(bundle.doctrine.replay_lifecycle).toEqual(["REGISTERED", "PREPARED", "EXECUTING", "VERIFYING", "COMPLETED", "FAILED", "DIVERGED", "INVALID", "CANCELLED"]);
    expect(bundle.doctrine.integrity_outcomes).toEqual(["IDENTICAL", "ACCEPTABLE_VARIANCE", "DIVERGED", "INVALID"]);
    expect(bundle.doctrine.divergence_categories).toHaveLength(9);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines the replay contract and execution record", () => {
    const result = runReplayIntegrityExplainability();

    expect(result.contract.never_modifies_history).toBe(true);
    expect(result.contract.original_execution_canonical).toBe(true);
    expect(result.execution.replay_status).toBe("COMPLETED");
    expect(result.execution.replay_inputs.length).toBeGreaterThan(0);
    expect(result.execution.replay_outputs.length).toBeGreaterThan(0);
    expect(result.execution.integrity_status).toBe("IDENTICAL");
  });

  it("verifies replay integrity and artifacts", () => {
    const result = runReplayIntegrityExplainability();

    expect(result.replay_integrity.outcome).toBe("IDENTICAL");
    expect(result.replay_integrity.execution_ordering_valid).toBe(true);
    expect(result.replay_integrity.outputs_valid).toBe(true);
    expect(result.artifact_integrity.integrity_state).toBe("VERIFIED");
    expect(result.artifact_integrity.artifact_hashes_verified).toBe(true);
    expect(result.artifact_integrity.audit_chain_validated).toBe(true);
  });

  it("produces deterministic explanations", () => {
    const result = runReplayIntegrityExplainability();

    expect(result.explanation.deterministic).toBe(true);
    expect(result.explanation.reproducible).toBe(true);
    expect(result.explanation.immutable).toBe(true);
    expect(result.explanation.decision_sequence).toHaveLength(5);
    expect(result.explanation.evidence_chain.length).toBeGreaterThan(0);
    expect(result.explanation.governance_references.length).toBeGreaterThan(0);
  });

  it("records immutable replay ledger and divergence registry", () => {
    const result = runReplayIntegrityExplainability();

    expect(result.replay_ledger).toHaveLength(6);
    expect(result.replay_ledger.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.lineage_ref)).toBe(true);
    expect(result.divergences).toHaveLength(9);
    expect(result.divergences.find((entry) => entry.category === "UNEXPLAINED_DIVERGENCE")?.certification_blocked).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runReplayIntegrityExplainability();
    const second = runReplayIntegrityExplainability();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateReplayIntegrityExplainability(first).valid).toBe(true);
    expect(replayReplayIntegrityExplainability(first)).toBe(true);
  });

  it("executes the complete certification matrix", () => {
    const result = runReplayIntegrityExplainability();

    expect(result.certification_tests).toHaveLength(20);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Replay Contract enforced",
      "Replay deterministic",
      "Replay ordering reproducible",
      "Replay inputs reconstructed",
      "Replay outputs reproducible",
      "Dependency graph preserved",
      "Environment restored",
      "Integrity validation deterministic",
      "Artifact hashes verified",
      "Lineage preserved",
      "Explainability deterministic",
      "Evidence chain complete",
      "Governance reasoning reproducible",
      "Certification reasoning reproducible",
      "Replay Ledger immutable",
      "Replay history complete",
      "Divergence detection deterministic",
      "Unexplained divergence blocks certification",
      "Audit trail immutable",
      "Constitutional ownership preserved",
    ]);
  });

  it("supports conditional pass for non-constitutional explanation warnings", () => {
    const result = runReplayIntegrityExplainability({ scenario: "NON_CONSTITUTIONAL_EXPLANATION_WARNING" });
    const validation = validateReplayIntegrityExplainability(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "REPLAY_CONTRACT_FAILURE",
    "REPLAY_NON_DETERMINISTIC",
    "ORDERING_NOT_REPRODUCIBLE",
    "INPUT_RECONSTRUCTION_FAILED",
    "OUTPUT_REPRODUCTION_FAILED",
    "DEPENDENCY_GRAPH_LOST",
    "ENVIRONMENT_RESTORE_FAILED",
    "INTEGRITY_VALIDATION_NON_DETERMINISTIC",
    "ARTIFACT_HASH_FAILURE",
    "LINEAGE_LOST",
    "EXPLAINABILITY_NON_DETERMINISTIC",
    "EVIDENCE_CHAIN_INCOMPLETE",
    "GOVERNANCE_REASONING_NOT_REPRODUCIBLE",
    "CERTIFICATION_REASONING_NOT_REPRODUCIBLE",
    "LEDGER_MUTABLE",
    "REPLAY_HISTORY_INCOMPLETE",
    "DIVERGENCE_DETECTION_NON_DETERMINISTIC",
    "UNEXPLAINED_DIVERGENCE_NOT_BLOCKED",
    "AUDIT_MUTABLE",
    "CONSTITUTIONAL_OWNERSHIP_LOST",
  ] as const)("fails certification for %s", (scenario: ReplayIntegrityFailure) => {
    const result = runReplayIntegrityExplainability({ scenario });
    const validation = validateReplayIntegrityExplainability(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested explanation tampering", () => {
    const result = runReplayIntegrityExplainability();
    const tampered = {
      ...result,
      explanation: {
        ...result.explanation,
        execution_summary: "tampered",
      },
    };

    expect(validateReplayIntegrityExplainability(tampered).valid).toBe(false);
  });
});
