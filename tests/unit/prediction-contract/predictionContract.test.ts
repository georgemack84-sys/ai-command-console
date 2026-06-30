import { describe, expect, it, vi } from "vitest";
import {
  buildPredictionObservabilitySurface,
  computePredictionHash,
  createPrediction,
  getPredictionContract,
  validatePrediction,
  validatePredictionLifecycleTransition,
} from "@/services/prediction-contract";
import type { PredictionContractFailure, PredictionContractScenario, PredictionType } from "@/types/prediction-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.1 Prediction Contract", () => {
  it("defines the deterministic advisory-only prediction doctrine", () => {
    const contract = getPredictionContract();

    expect(contract.doctrine.contract_version).toBe("prediction-contract/v8ALT.3.1");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.prediction_types).toEqual(["EXECUTION_BOTTLENECK", "RESOURCE_SHORTAGE", "GOVERNANCE_VIOLATION", "CONFIDENCE_COLLAPSE", "REPLAY_INSTABILITY", "INTEGRITY_DEGRADATION", "ORCHESTRATION_CONGESTION", "DEPENDENCY_FAILURE", "RECOVERY_RISK"]);
    expect(contract.doctrine.lifecycle_states).toContain("PUBLISHED");
    expect(contract.doctrine.evidence_sources).toContain("RECOVERY_HISTORY");
    expect(contract.validation.valid).toBe(true);
  });

  it("creates a valid prediction with evidence, governance, constitutional, lineage, replay, and integrity metadata", () => {
    const prediction = createPrediction();
    const validation = validatePrediction(prediction);

    expect(prediction.prediction_id).toMatch(/^PRED-/);
    expect(prediction.prediction_type).toBe("EXECUTION_BOTTLENECK");
    expect(prediction.prediction_category).toBe("EXECUTION");
    expect(prediction.forecast_state).toBe("PUBLISHED");
    expect(prediction.probability).toBeGreaterThanOrEqual(0);
    expect(prediction.probability).toBeLessThanOrEqual(1);
    expect(prediction.evidence.length).toBe(10);
    expect(prediction.governance_metadata?.governance_state).toBe("COMPLIANT");
    expect(prediction.constitutional_metadata?.operator_supremacy_preserved).toBe(true);
    expect(prediction.lineage_reference?.lineage_hash).toBeTruthy();
    expect(prediction.replay_reference?.replay_version).toBe("prediction-replay/v8ALT.3.1");
    expect(prediction.integrity_hash).toBeTruthy();
    expect(validation.valid).toBe(true);
  });

  it.each([
    "EXECUTION_BOTTLENECK",
    "RESOURCE_SHORTAGE",
    "GOVERNANCE_VIOLATION",
    "CONFIDENCE_COLLAPSE",
    "REPLAY_INSTABILITY",
    "INTEGRITY_DEGRADATION",
    "ORCHESTRATION_CONGESTION",
    "DEPENDENCY_FAILURE",
    "RECOVERY_RISK",
  ] as readonly PredictionType[])("supports prediction type %s", (prediction_type) => {
    const prediction = createPrediction({ prediction_type });

    expect(validatePrediction(prediction).type_supported).toBe(true);
    expect(validatePrediction(prediction).valid).toBe(true);
  });

  it("enforces valid lifecycle transitions and rejects invalid transitions", () => {
    expect(validatePredictionLifecycleTransition("CREATED", "VALIDATING").valid).toBe(true);
    expect(validatePredictionLifecycleTransition("READY", "PUBLISHED").valid).toBe(true);
    expect(validatePredictionLifecycleTransition("PUBLISHED", "EXPIRED").valid).toBe(true);

    const invalid = validatePredictionLifecycleTransition("CREATED", "PUBLISHED");
    expect(invalid.valid).toBe(false);
    expect(invalid.failure).toBe("LIFECYCLE_TRANSITION_INVALID");
  });

  it.each([
    ["MISSING_TENANT", "TENANT_ID_MISSING"],
    ["MISSING_MISSION", "MISSION_ID_MISSING"],
    ["UNSUPPORTED_TYPE", "UNSUPPORTED_PREDICTION_TYPE"],
    ["INVALID_TRANSITION", "LIFECYCLE_TRANSITION_INVALID"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_METADATA_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_REFERENCE_BROKEN"],
    ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_INTEGRITY", "INTEGRITY_HASH_MISSING"],
    ["CROSS_TENANT_REFERENCE", "TENANT_ISOLATION_INVALID"],
    ["NONDETERMINISTIC_CONFIDENCE", "CONFIDENCE_NONDETERMINISTIC"],
    ["AUTONOMOUS_ACTION_REQUESTED", "ADVISORY_ONLY_VIOLATION"],
    ["OPERATOR_APPROVAL_MISSING", "OPERATOR_APPROVAL_MISSING"],
  ] as readonly [PredictionContractScenario, PredictionContractFailure][])("fails closed for %s", (scenario, failure) => {
    const prediction = createPrediction({ scenario });
    const validation = validatePrediction(prediction);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("preserves advisory-only boundaries and never requests prediction-driven action in the baseline", () => {
    const prediction = createPrediction();
    const validation = validatePrediction(prediction);

    expect(prediction.advisory_only).toBe(true);
    expect(prediction.autonomous_action_requested).toBe(false);
    expect(prediction.execution_modified).toBe(false);
    expect(prediction.rollback_requested).toBe(false);
    expect(prediction.restart_requested).toBe(false);
    expect(prediction.governance_modified).toBe(false);
    expect(prediction.authority_bypassed).toBe(false);
    expect(validation.advisory_only).toBe(true);
  });

  it("hashes prediction records deterministically", () => {
    const first = createPrediction();
    const second = createPrediction();

    expect(second.prediction_hash).toBe(first.prediction_hash);
    expect(first.prediction_hash).toBe(computePredictionHash(first));
  });

  it("exposes operator-visible prediction diagnostics", () => {
    const surface = buildPredictionObservabilitySurface(createPrediction({ scenario: "MISSING_REPLAY" }));

    expect(surface.prediction_type).toBe("EXECUTION_BOTTLENECK");
    expect(surface.forecast_state).toBe("PUBLISHED");
    expect(surface.evidence_count).toBe(10);
    expect(surface.replay_present).toBe(false);
    expect(surface.advisory_only).toBe(true);
  });
});
