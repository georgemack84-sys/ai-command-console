import { describe, expect, it } from "vitest";

import {
  getStrategyCandidateGenerationContract,
  replayStrategyCandidateGeneration,
  runStrategyCandidateGeneration,
  validateStrategyCandidateGeneration,
} from "../../../services/strategy-candidate-generation";
import type { StrategyCandidateScenario } from "../../../types/strategy-candidate-generation";

describe("strategy candidate generation", () => {
  it("generates a deterministic certified candidate set", () => {
    const first = runStrategyCandidateGeneration();
    const second = runStrategyCandidateGeneration();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.ready_for_downstream_evaluation).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateStrategyCandidateGeneration(first).valid).toBe(true);
    expect(replayStrategyCandidateGeneration(first)).toBe(true);
  });

  it("publishes strategy candidate generation doctrine", () => {
    const bundle = getStrategyCandidateGenerationContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.policy_bound_generation_required).toBe(true);
    expect(bundle.doctrine.evidence_linked_generation_required).toBe(true);
    expect(bundle.doctrine.duplicate_suppression_required).toBe(true);
    expect(bundle.doctrine.qualification_before_evaluation_required).toBe(true);
    expect(bundle.doctrine.closed_sets_are_immutable).toBe(true);
  });

  it("creates bounded policy-bound evidence-linked strategies", () => {
    const result = runStrategyCandidateGeneration();

    expect(result.generation_policy.policy_manifest_bound).toBe(true);
    expect(result.generation_policy.supported_strategy_types).toHaveLength(10);
    expect(result.candidates).toHaveLength(10);
    expect(result.candidates.every((candidate) => candidate.advisory_only && candidate.evidence_refs.length > 0 && candidate.policy_manifest_ref.length > 0)).toBe(true);
    expect(result.candidates.every((candidate) => candidate.origin_ref.length > 0 && candidate.governance_refs.length >= 2)).toBe(true);
  });

  it("validates eligibility, suppresses duplicates, consolidates lineage, and qualifies candidates", () => {
    const result = runStrategyCandidateGeneration();

    expect(result.eligibility.rejected_strategy_ids).toHaveLength(0);
    expect(result.duplicate_detection.outcomes.every((item) => item.outcome === "UNIQUE")).toBe(true);
    expect(result.duplicate_detection.duplicates_rejected).toBe(true);
    expect(result.consolidation.provenance_preserved).toBe(true);
    expect(result.consolidation.merged_lineage_refs).toHaveLength(10);
    expect(result.qualifications.every((record) => record.status === "QUALIFIED" && record.evidence_completeness === 1)).toBe(true);
  });

  it("closes and ledgers an immutable candidate set for downstream evaluation", () => {
    const result = runStrategyCandidateGeneration();

    expect(result.registry.complete).toBe(true);
    expect(result.registry.registered_strategy_ids).toHaveLength(10);
    expect(result.closure.state).toBe("CLOSED");
    expect(result.closure.immutable).toBe(true);
    expect(result.closure.reproducible).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.replay.identical_integrity_hashes).toBe(true);
  });

  it("runs the phase 12.4 certification suite", () => {
    const result = runStrategyCandidateGeneration();

    expect(result.certification.tests).toHaveLength(33);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for policy, evidence, eligibility, duplicate, consolidation, qualification, closure, registry, replay, and governance violations", () => {
    const scenarios: readonly StrategyCandidateScenario[] = [
      "POLICY_MANIFEST_MISSING",
      "EVIDENCE_MISSING",
      "AUTHORITY_INVALID",
      "GOVERNANCE_INCOMPLETE",
      "CONSTITUTIONAL_VIOLATION",
      "CROSS_TENANT_GENERATION",
      "UNSUPPORTED_OBJECTIVE",
      "INVALID_DEPENDENCIES",
      "UNSUPPORTED_ASSUMPTIONS",
      "DUPLICATE_DETECTION_NONDETERMINISTIC",
      "DUPLICATE_REGISTRATION_ALLOWED",
      "CONFLICTING_CANDIDATES_ALLOWED",
      "CONSOLIDATION_LOST_LINEAGE",
      "QUALIFICATION_MISSING",
      "EVIDENCE_SUFFICIENCY_FAILED",
      "CANDIDATE_SET_CLOSURE_FAILED",
      "CLOSURE_REPLAY_FAILED",
      "REGISTRY_INTEGRITY_FAILED",
      "LEDGER_NOT_APPEND_ONLY",
      "LINEAGE_MISSING",
      "ADVISORY_BOUNDARY_VIOLATION",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runStrategyCandidateGeneration({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.ready_for_downstream_evaluation).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateStrategyCandidateGeneration(result).valid).toBe(false);
    }
  });
});
