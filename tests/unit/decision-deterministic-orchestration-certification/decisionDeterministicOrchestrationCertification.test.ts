import { describe, expect, it } from "vitest";
import {
  ORCHESTRATION_DETERMINISM_CHECKS,
  ORCHESTRATION_DETERMINISM_STAGES,
  computeOrchestrationExecutionHash,
  getDeterministicOrchestrationCertificationFoundation,
  replayDeterministicOrchestrationCertification,
  runDeterministicOrchestrationCertification,
} from "@/services/decision-deterministic-orchestration-certification";
import type { DeterministicOrchestrationCertificationFailure, DeterministicOrchestrationCertificationInput } from "@/types/decision-deterministic-orchestration-certification";

describe("Mission Control Phase 9.12.3 Deterministic Orchestration Certification", () => {
  it("publishes the deterministic orchestration certification foundation", () => {
    const foundation = getDeterministicOrchestrationCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-deterministic-orchestration-certification/v1");
    expect(foundation.stages).toEqual(ORCHESTRATION_DETERMINISM_STAGES);
    expect(foundation.checks).toEqual(ORCHESTRATION_DETERMINISM_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("compares repeated orchestration executions and verifies matching fingerprints", () => {
    const result = runDeterministicOrchestrationCertification();

    expect(result.executions).toHaveLength(2);
    expect(result.executions.every((execution) => computeOrchestrationExecutionHash(execution) === execution.integrity_hash)).toBe(true);
    expect(result.executions[0].fingerprint.final_orchestration_fingerprint).toBe(result.executions[1].fingerprint.final_orchestration_fingerprint);
    expect(result.comparison_report.difference_classification).toBe("NONE");
    expect(result.comparison_report.differences).toHaveLength(0);
  });

  it("validates deterministic output equivalence and ordering", () => {
    const result = runDeterministicOrchestrationCertification();

    expect(result.output_equivalence.validation_state).toBe("PASS");
    expect(result.output_equivalence.recommendations_match).toBe(true);
    expect(result.ordering_report.validation_state).toBe("PASS");
    expect(result.ordering_report.stage_order).toEqual(ORCHESTRATION_DETERMINISM_STAGES);
  });

  it("collects immutable evidence and writes certification ledger entries", () => {
    const result = runDeterministicOrchestrationCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.evidence_package.execution_evidence_refs).toHaveLength(2);
    expect(result.determinism_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.determinism_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the determinism report for production readiness", () => {
    const result = runDeterministicOrchestrationCertification();

    expect(result.determinism_report.certification_decision).toBe("PASS");
    expect(result.determinism_report.production_readiness).toBe("READY");
    expect(result.validation.foundation_certified).toBe(true);
    expect(result.validation.output_equivalent).toBe(true);
    expect(result.validation.fingerprints_reproducible).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runDeterministicOrchestrationCertification();

    expect(replayDeterministicOrchestrationCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_orchestrator_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["FOUNDATION_INVALID", "FOUNDATION_CERTIFICATION_INVALID"],
    ["INTAKE_VARIATION", "NONDETERMINISTIC_INTAKE"],
    ["NORMALIZATION_VARIATION", "NONDETERMINISTIC_NORMALIZATION"],
    ["CONTEXT_VARIATION", "NONDETERMINISTIC_CONTEXT_BUILDING"],
    ["GRAPH_VARIATION", "DEPENDENCY_GRAPH_VARIATION"],
    ["GRAPH_ORDER_VARIATION", "GRAPH_ORDERING_VARIATION"],
    ["ARBITRATION_VARIATION", "CONFLICT_ARBITRATION_INCONSISTENCY"],
    ["PRIORITY_VARIATION", "PRIORITY_SCORE_VARIATION"],
    ["TIE_BREAKING_VARIATION", "TIE_BREAKING_INCONSISTENCY"],
    ["PACKAGE_VARIATION", "DECISION_PACKAGE_VARIATION"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["OUTPUT_MISMATCH", "OUTPUT_MISMATCH"],
    ["FINGERPRINT_MISMATCH", "FINGERPRINT_MISMATCH"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["HIDDEN_PATH", "HIDDEN_ORCHESTRATION_PATH"],
    ["EVIDENCE_INCOMPLETE", "EVIDENCE_INCOMPLETE"],
    ["FAIL_OPEN", "FAIL_OPEN_PROCESSING"],
    ["TENANT_VARIATION", "TENANT_DEPENDENT_OUTPUT_VARIATION"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<DeterministicOrchestrationCertificationInput["scenario"]>, DeterministicOrchestrationCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runDeterministicOrchestrationCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.determinism_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_orchestrator_state).toBe(false);
  });

  it("fails closed when the role lacks decision visibility", () => {
    const result = runDeterministicOrchestrationCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runDeterministicOrchestrationCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayDeterministicOrchestrationCertification(tampered)).toBe(false);
  });
});
