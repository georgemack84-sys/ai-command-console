import { describe, expect, it } from "vitest";
import {
  buildDecisionIntegrityObservability,
  createDecisionIntegrityEvaluation,
  detectDecisionMutation,
  generateDecisionIntegrityHash,
  getDecisionIntegrityFramework,
  serializeDecisionCanonically,
  validateDecisionIntegrity,
  validateDecisionOrdering,
  validateReplayIntegrityHash,
} from "@/services/decision-integrity";
import type { DecisionIntegrityFailure, DecisionIntegrityInput } from "@/types/decision-integrity";

describe("decision integrity and immutability rules", () => {
  it("builds a verified append-only integrity framework", () => {
    const framework = getDecisionIntegrityFramework();

    expect(framework.evaluation.verification_state).toBe("VERIFIED");
    expect(framework.validation.validation_status).toBe("VALID");
    expect(framework.evaluation.advisory_only).toBe(true);
    expect(framework.evaluation.integrity_record.integrity_algorithm).toBe("SHA-256");
    expect(framework.evaluation.integrity_record.append_only).toBe(true);
    expect(framework.evaluation.ledger).toHaveLength(1);
    expect(framework.mutation_report.mutation_detected).toBe(false);
  });

  it("serializes canonically and hashes deterministically", () => {
    const left = { beta: 2, alpha: { zeta: "e\u0301", gamma: undefined } };
    const right = { alpha: { gamma: undefined, zeta: "\u00e9" }, beta: 2 };

    expect(serializeDecisionCanonically(left)).toBe(serializeDecisionCanonically(right));
    expect(generateDecisionIntegrityHash(left)).toBe(generateDecisionIntegrityHash(right));
  });

  it("preserves replay and lineage hashes in integrity metadata", () => {
    const evaluation = createDecisionIntegrityEvaluation({
      parent_hash: "parent_hash_001",
    });

    expect(evaluation.integrity_record.parent_hash).toBe("parent_hash_001");
    expect(evaluation.metadata.replay_hash).toBe(evaluation.integrity_record.replay_hash);
    expect(evaluation.metadata.lineage_hash).toBe(evaluation.integrity_record.lineage_hash);
    expect(evaluation.audit_record.audit_id).toBe(evaluation.metadata.audit_refs[0]);
  });

  it.each<[
    NonNullable<DecisionIntegrityInput["scenario"]>,
    DecisionIntegrityFailure,
  ]>([
    ["HASH_MISMATCH", "HASH_MISMATCH"],
    ["SERIALIZATION_MISMATCH", "SERIALIZATION_MISMATCH"],
    ["ORDERING_VIOLATION", "ORDERING_VIOLATION"],
    ["HISTORICAL_MUTATION", "HISTORICAL_MUTATION"],
    ["OVERWRITE_ATTEMPT", "OVERWRITE_ATTEMPT"],
    ["RECORD_DELETION", "RECORD_DELETION"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["LINEAGE_INCONSISTENCY", "LINEAGE_INCONSISTENCY"],
    ["GOVERNANCE_TAMPERING", "GOVERNANCE_EVIDENCE_TAMPERING"],
    ["CONSTITUTIONAL_TAMPERING", "CONSTITUTIONAL_EVIDENCE_TAMPERING"],
    ["LIFECYCLE_EDIT", "UNAUTHORIZED_LIFECYCLE_EDIT"],
    ["UNSUPPORTED_SERIALIZATION", "UNSUPPORTED_SERIALIZATION_VERSION"],
    ["UNSUPPORTED_ALGORITHM", "UNSUPPORTED_INTEGRITY_ALGORITHM"],
    ["TENANT_VIOLATION", "TENANT_BOUNDARY_VIOLATION"],
  ])("fails closed for %s", (scenario, failure) => {
    const evaluation = createDecisionIntegrityEvaluation({ scenario });
    const validation = validateDecisionIntegrity(evaluation);

    expect(validation.validation_status).toBe("FAILED_CLOSED");
    expect(validation.failures).toContain(failure);
  });

  it("detects historical mutation between integrity snapshots", () => {
    const original = createDecisionIntegrityEvaluation();
    const candidate = createDecisionIntegrityEvaluation({ scenario: "HISTORICAL_MUTATION" });

    const report = detectDecisionMutation(original, candidate);

    expect(report.mutation_detected).toBe(true);
    expect(report.failures).toContain("HISTORICAL_MUTATION");
    expect(report.original_hash).not.toBe(report.candidate_hash);
  });

  it("exposes ordering and replay validation entrypoints", () => {
    const ordering = createDecisionIntegrityEvaluation({ scenario: "ORDERING_VIOLATION" });
    const replay = createDecisionIntegrityEvaluation({ scenario: "REPLAY_INCONSISTENCY" });

    expect(validateDecisionOrdering(ordering).checks.ordering_valid).toBe(false);
    expect(validateReplayIntegrityHash(replay).checks.replay_compatible).toBe(false);
  });

  it("emits integrity observability metrics", () => {
    const evaluations = [
      createDecisionIntegrityEvaluation(),
      createDecisionIntegrityEvaluation({ scenario: "ORDERING_VIOLATION" }),
      createDecisionIntegrityEvaluation({ scenario: "OVERWRITE_ATTEMPT" }),
      createDecisionIntegrityEvaluation({ scenario: "SERIALIZATION_MISMATCH" }),
    ];

    const observability = buildDecisionIntegrityObservability(evaluations);

    expect(observability.integrity_validations).toBe(4);
    expect(observability.verification_failures).toBe(3);
    expect(observability.ordering_violations).toBe(1);
    expect(observability.append_only_violations).toBe(1);
    expect(observability.serialization_mismatches).toBe(1);
    expect(observability.integrity_algorithm_usage["SHA-256"]).toBe(4);
    expect(observability.verification_success_rate).toBe(0.25);
  });
});
