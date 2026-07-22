import { describe, expect, it } from "vitest";
import {
  getProductionReplayDigitalTwinValidationBundle,
  replayProductionReplayDigitalTwinValidation,
  runProductionReplayDigitalTwinValidation,
  validateProductionReplayDigitalTwinValidation,
} from "@/services/production-replay-digital-twin-validation";
import type { ProductionReplayFailure } from "@/types/production-replay-digital-twin-validation";

describe("Mission Control Phase 15.8 Production Replay & Digital Twin Validation", () => {
  it("publishes production replay doctrine", () => {
    const bundle = getProductionReplayDigitalTwinValidationBundle();

    expect(bundle.doctrine.version).toBe("production-replay-digital-twin-validation/v15.8");
    expect(bundle.doctrine.upstream_phase).toBe("live-tenant-isolation-qualification/v15.7");
    expect(bundle.doctrine.lifecycle).toEqual(["REPLAY_REQUESTED", "PRODUCTION_CAPTURED", "DIGITAL_TWIN_INITIALIZED", "REPLAY_EXECUTED", "COMPARISON_COMPLETE", "DIVERGENCE_CLASSIFIED", "QUALIFICATION_EVALUATED", "RECORDED"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("keeps replay advisory-only and digital twins isolated", () => {
    const result = runProductionReplayDigitalTwinValidation();

    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.replay_never_modifies_production).toBe(true);
    expect(result.digital_twin.synchronized).toBe(true);
    expect(result.digital_twin.isolated_from_production).toBe(true);
    expect(result.digital_twin.no_production_side_effects).toBe(true);
  });

  it("reconstructs replay and comparison deterministically", () => {
    const result = runProductionReplayDigitalTwinValidation();

    expect(result.replay_record.replay_status).toBe("COMPLETED");
    expect(result.replay_record.comparison_result).toBe("IDENTICAL");
    expect(result.comparison.inputs_reproduced).toBe(true);
    expect(result.comparison.execution_ordering_reproduced).toBe(true);
    expect(result.comparison.outputs_compared).toBe(true);
    expect(result.comparison.deterministic).toBe(true);
  });

  it("classifies divergence and preserves immutable ledger evidence", () => {
    const result = runProductionReplayDigitalTwinValidation();

    expect(result.divergence.categories_evaluated).toHaveLength(8);
    expect(result.divergence.unexplained_divergence_ignored).toBe(false);
    expect(result.qualification.outcome).toBe("QUALIFIED");
    expect(result.ledger).toHaveLength(6);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.replayable && entry.tenant_isolated)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionReplayDigitalTwinValidation();
    const second = runProductionReplayDigitalTwinValidation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionReplayDigitalTwinValidation(first).valid).toBe(true);
    expect(replayProductionReplayDigitalTwinValidation(first)).toBe(true);
  });

  it("executes the Phase 15.8 certification matrix", () => {
    const result = runProductionReplayDigitalTwinValidation();

    expect(result.certification_tests).toHaveLength(19);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Production decisions replayable",
      "Production digital twins synchronized",
      "Live-to-replay comparisons deterministic",
      "Divergence detected and classified",
      "Replay qualification reproducible",
      "Unexplained divergence fail-closed",
      "Deterministic containment operational",
      "Replay evidence immutable",
      "Lineage complete",
      "Tenant isolation preserved",
      "Governance authority maintained",
      "Replay remains advisory-only",
      "Production input reproduction",
      "Configuration replay",
      "Dependency replay",
      "Policy replay",
      "Model replay",
      "Execution ordering",
      "Output comparison",
    ]);
  });

  it("supports conditional pass for non-constitutional replay warnings", () => {
    const result = runProductionReplayDigitalTwinValidation({ scenario: "NON_CONSTITUTIONAL_REPLAY_WARNING" });
    const validation = validateProductionReplayDigitalTwinValidation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "PRODUCTION_DECISIONS_NOT_REPLAYABLE",
    "DIGITAL_TWIN_NOT_SYNCHRONIZED",
    "COMPARISON_NON_DETERMINISTIC",
    "DIVERGENCE_NOT_CLASSIFIED",
    "QUALIFICATION_NOT_REPRODUCIBLE",
    "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED",
    "CONTAINMENT_NOT_DETERMINISTIC",
    "REPLAY_EVIDENCE_MUTABLE",
    "LINEAGE_INCOMPLETE",
    "TENANT_ISOLATION_NOT_PRESERVED",
    "GOVERNANCE_AUTHORITY_NOT_MAINTAINED",
    "REPLAY_NOT_ADVISORY_ONLY",
    "PRODUCTION_INPUT_NOT_REPRODUCED",
    "CONFIGURATION_NOT_REPLAYED",
    "DEPENDENCY_NOT_REPLAYED",
    "POLICY_NOT_REPLAYED",
    "MODEL_NOT_REPLAYED",
    "EXECUTION_ORDERING_NOT_REPRODUCED",
    "OUTPUT_COMPARISON_FAILED",
  ] as const)("fails certification for %s", (scenario: ProductionReplayFailure) => {
    const result = runProductionReplayDigitalTwinValidation({ scenario });
    const validation = validateProductionReplayDigitalTwinValidation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested replay record tampering", () => {
    const result = runProductionReplayDigitalTwinValidation();
    const tampered = {
      ...result,
      replay_record: {
        ...result.replay_record,
        replay_status: "FAILED" as const,
      },
    };

    expect(validateProductionReplayDigitalTwinValidation(tampered).valid).toBe(false);
  });
});
