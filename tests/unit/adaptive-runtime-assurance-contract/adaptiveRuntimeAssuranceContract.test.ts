import { describe, expect, it, vi } from "vitest";
import {
  buildAdaptiveRuntimeAssuranceObservabilitySurface,
  certifyAdaptiveRuntimeAssurance,
  computeAdaptiveRuntimeAssuranceHash,
  createAdaptiveRuntimeAssurance,
  getAdaptiveRuntimeAssuranceContract,
  replayAdaptiveRuntimeAssurance,
  validateAdaptiveLifecycleTransition,
  validateAdaptiveRuntimeAssurance,
} from "@/services/adaptive-runtime-assurance-contract";
import type { AdaptiveAssuranceFailure, AdaptiveRuntimeAssuranceScenario } from "@/types/adaptive-runtime-assurance-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1A Adaptive Runtime Assurance Contract", () => {
  it("defines canonical confidence, health, lifecycle, monitoring, and evidence schemas", () => {
    const contract = getAdaptiveRuntimeAssuranceContract();

    expect(contract.doctrine.contract_version).toBe("adaptive-runtime-assurance-contract/v8ALT.1A");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.confidence_levels).toEqual(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW", "INSUFFICIENT"]);
    expect(contract.doctrine.health_levels).toEqual(["OPTIMAL", "HEALTHY", "STABLE", "WATCH", "DEGRADED", "HIGH_RISK", "CRITICAL"]);
    expect(contract.doctrine.lifecycle_states).toEqual(["CREATED", "COLLECTING", "EVALUATING", "VALIDATING", "ASSESSING", "RECORDED", "CERTIFIED", "ARCHIVED"]);
    expect(contract.doctrine.monitoring_subsystems).toContain("GOVERNANCE");
    expect(contract.doctrine.evidence_types).toContain("CONSTITUTIONAL_VALIDATION");
    expect(contract.doctrine.advisory_only).toBe(true);
  });

  it("creates a certified baseline assurance record with complete monitoring, evidence, replay, lineage, and integrity metadata", () => {
    const assurance = createAdaptiveRuntimeAssurance();
    const validation = validateAdaptiveRuntimeAssurance(assurance);
    const certification = certifyAdaptiveRuntimeAssurance(assurance);

    expect(assurance.assurance_version).toBe("adaptive-runtime-assurance-contract/v8ALT.1A");
    expect(assurance.lifecycle_state).toBe("CERTIFIED");
    expect(assurance.assurance_state).toBe("CERTIFIED");
    expect(assurance.runtime_health).toBe("OPTIMAL");
    expect(assurance.overall_confidence).toBe("VERY_HIGH");
    expect(assurance.runtime_observations.length).toBe(9);
    expect(assurance.evidence.length).toBe(11);
    expect(assurance.evidence.every((item) => item.verification_status === "VERIFIED" && item.integrity_hash)).toBe(true);
    expect(assurance.replay_reference.replay_validation_status).toBe("VALID");
    expect(assurance.lineage_reference.governance_reference).toContain("governance:");
    expect(assurance.integrity.verification_status).toBe("VERIFIED");
    expect(validation.valid).toBe(true);
    expect(certification.certified).toBe(true);
    expect(certification.ready_for_runtime_confidence_engine).toBe(true);
  });

  it("enforces deterministic lifecycle transitions and rejects invalid transitions", () => {
    expect(validateAdaptiveLifecycleTransition("CREATED", "COLLECTING").valid).toBe(true);
    expect(validateAdaptiveLifecycleTransition("COLLECTING", "EVALUATING").valid).toBe(true);

    const invalid = validateAdaptiveLifecycleTransition("CREATED", "VALIDATING");
    expect(invalid.valid).toBe(false);
    expect(invalid.failure).toBe("LIFECYCLE_TRANSITION_INVALID");
  });

  it.each([
    ["MISSING_IDENTITY", "IDENTITY_MISSING"],
    ["LOW_CONFIDENCE", "CONFIDENCE_INVALID"],
    ["DEGRADED_HEALTH", "HEALTH_INVALID"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_INVALID"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_INVALID"],
    ["AUTHORITY_INVALID", "AUTHORITY_INVALID"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["LINEAGE_BROKEN", "LINEAGE_INVALID"],
    ["INTEGRITY_MISSING", "INTEGRITY_INVALID"],
    ["EXECUTION_AUTHORITY_ATTEMPT", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
    ["HIDDEN_STATE", "HIDDEN_STATE_DETECTED"],
  ] as readonly [AdaptiveRuntimeAssuranceScenario, AdaptiveAssuranceFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const assurance = createAdaptiveRuntimeAssurance({ scenario });
      const validation = validateAdaptiveRuntimeAssurance(assurance);
      const certification = certifyAdaptiveRuntimeAssurance(assurance);

      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
      expect(certification.certified).toBe(false);
      expect(certification.ready_for_runtime_confidence_engine).toBe(false);
      expect(assurance.recommendations.some((item) => item.includes("Resolve"))).toBe(true);
    },
  );

  it("preserves advisory-only boundaries and never authorizes or mutates execution in the baseline", () => {
    const assurance = createAdaptiveRuntimeAssurance();

    expect(assurance.advisory_only).toBe(true);
    expect(assurance.execution_authorized).toBe(false);
    expect(assurance.execution_modified).toBe(false);
    expect(assurance.governance_modified).toBe(false);
    expect(validateAdaptiveRuntimeAssurance(assurance).advisory_only).toBe(true);
  });

  it("replays and hashes assurance records deterministically", () => {
    const first = createAdaptiveRuntimeAssurance();
    const second = createAdaptiveRuntimeAssurance();
    const replay = replayAdaptiveRuntimeAssurance(first);

    expect(second.assurance_hash).toBe(first.assurance_hash);
    expect(second.integrity.integrity_hash).toBe(first.integrity.integrity_hash);
    expect(first.assurance_hash).toBe(computeAdaptiveRuntimeAssuranceHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.assurance_hash);
  });

  it("exposes operator visibility without hidden state", () => {
    const surface = buildAdaptiveRuntimeAssuranceObservabilitySurface(createAdaptiveRuntimeAssurance({ scenario: "REPLAY_MISMATCH" }));

    expect(surface.lifecycle_state).toBe("ASSESSING");
    expect(surface.replay_status).toBe("MISMATCH");
    expect(surface.detected_risks).toContain("REPLAY_INVALID");
    expect(surface.monitoring_records).toBe(9);
    expect(surface.evidence_records).toBe(11);
    expect(surface.advisory_only).toBe(true);
  });
});
