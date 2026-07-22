import { describe, expect, it } from "vitest";
import {
  getProductionReplayDeterminismBundle,
  replayProductionReplayDeterminism,
  runProductionReplayDeterminism,
  validateProductionReplayDeterminism,
} from "@/services/production-replay-determinism";
import type { ProductionReplayDeterminismFailure } from "@/types/production-replay-determinism";

describe("Mission Control Phase 16.5 Production Replay & Determinism", () => {
  it("publishes production replay determinism doctrine", () => {
    const bundle = getProductionReplayDeterminismBundle();

    expect(bundle.doctrine.version).toBe("production-replay-determinism/v16.5");
    expect(bundle.doctrine.upstream_phase).toBe("live-evidence-collection/v16.4");
    expect(bundle.doctrine.divergence_categories).toEqual(["NO_DIVERGENCE", "INPUT_DIVERGENCE", "CONFIGURATION_DIVERGENCE", "DEPENDENCY_DIVERGENCE", "POLICY_DIVERGENCE", "MODEL_DIVERGENCE", "ORDERING_DIVERGENCE", "EVIDENCE_DIVERGENCE", "EXPLANATION_DIVERGENCE", "OUTPUT_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("reconstructs production advisory behavior deterministically", () => {
    const result = runProductionReplayDeterminism();

    expect(result.engine.deterministic).toBe(true);
    expect(result.engine.advisory_only).toBe(true);
    expect(result.engine.mutates_production_state).toBe(false);
    expect(result.engine.reconstructed_recommendations.length).toBeGreaterThan(0);
    expect(result.engine.reconstructed_explanations.length).toBeGreaterThan(0);
  });

  it("compares replay output with original production behavior", () => {
    const result = runProductionReplayDeterminism();

    expect(result.comparator.recommendation_equal).toBe(true);
    expect(result.comparator.explanation_equal).toBe(true);
    expect(result.comparator.confidence_equal).toBe(true);
    expect(result.comparator.evidence_equal).toBe(true);
    expect(result.comparator.deterministic_behavior).toBe(true);
  });

  it("classifies and governs replay divergence", () => {
    const result = runProductionReplayDeterminism();

    expect(result.divergence.divergence_category).toBe("NO_DIVERGENCE");
    expect(result.divergence.classification_status).toBe("CLASSIFIED");
    expect(result.divergence.resolution_status).toBe("NOT_REQUIRED");
    expect(result.divergence.deterministic_classification).toBe(true);
  });

  it("records immutable replay history and unified lineage", () => {
    const result = runProductionReplayDeterminism();

    expect(result.replay_record.determinism_status).toBe("DETERMINISTIC");
    expect(result.replay_record.certification_status).toBe("CERTIFIED");
    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.immutable).toBe(true);
    expect(result.lineage.duplicate_lineage_created).toBe(false);
    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
  });

  it("exposes replay observability without certification blockers", () => {
    const result = runProductionReplayDeterminism();

    expect(result.observability.replay_success_rate).toBe(1);
    expect(result.observability.replay_determinism).toBe(true);
    expect(result.observability.explanation_consistency).toBe(true);
    expect(result.observability.certification_blockers).toBe(0);
    expect(result.observability.unresolved_replay_divergence).toBe(0);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionReplayDeterminism();
    const second = runProductionReplayDeterminism();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionReplayDeterminism(first).valid).toBe(true);
    expect(replayProductionReplayDeterminism(first)).toBe(true);
  });

  it("executes the Phase 16.5 replay certification matrix", () => {
    const result = runProductionReplayDeterminism();

    expect(result.certification_tests).toHaveLength(12);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Replay deterministic",
      "Divergence governed",
      "Replay reproducible",
      "Explanations consistent",
      "Evidence integrity verified",
      "Replay lineage complete",
      "Replay evidence immutable",
      "Unexplained divergence blocks certification",
      "Advisory boundary preserved",
      "Tenant isolation maintained",
      "Evidence platform reused",
      "Phase 16.4 evidence valid",
    ]);
  });

  it("supports conditional pass for non-constitutional replay warnings", () => {
    const result = runProductionReplayDeterminism({ scenario: "NON_CONSTITUTIONAL_REPLAY_WARNING" });
    const validation = validateProductionReplayDeterminism(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "REPLAY_NOT_DETERMINISTIC",
    "DIVERGENCE_NOT_GOVERNED",
    "REPLAY_NOT_REPRODUCIBLE",
    "EXPLANATIONS_NOT_CONSISTENT",
    "EVIDENCE_INTEGRITY_NOT_VERIFIED",
    "REPLAY_LINEAGE_INCOMPLETE",
    "REPLAY_EVIDENCE_MUTABLE",
    "UNEXPLAINED_DIVERGENCE_NOT_BLOCKING",
    "ADVISORY_BOUNDARY_NOT_PRESERVED",
    "TENANT_ISOLATION_NOT_MAINTAINED",
    "EVIDENCE_PLATFORM_NOT_REUSED",
    "PHASE_16_4_EVIDENCE_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: ProductionReplayDeterminismFailure) => {
    const result = runProductionReplayDeterminism({ scenario });
    const validation = validateProductionReplayDeterminism(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested replay engine tampering", () => {
    const result = runProductionReplayDeterminism();
    const tampered = {
      ...result,
      engine: {
        ...result.engine,
        deterministic: false,
      },
    };

    expect(validateProductionReplayDeterminism(tampered).valid).toBe(false);
  });
});
