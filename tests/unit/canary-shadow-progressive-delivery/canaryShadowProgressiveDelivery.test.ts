import { describe, expect, it } from "vitest";
import {
  getCanaryShadowProgressiveDeliveryBundle,
  replayCanaryShadowProgressiveDelivery,
  runCanaryShadowProgressiveDelivery,
  validateCanaryShadowProgressiveDelivery,
} from "@/services/canary-shadow-progressive-delivery";
import type { ProgressiveDeliveryFailure } from "@/types/canary-shadow-progressive-delivery";

describe("Mission Control Phase 15.5 Canary, Shadow & Progressive Delivery", () => {
  it("publishes progressive delivery doctrine", () => {
    const bundle = getCanaryShadowProgressiveDeliveryBundle();

    expect(bundle.doctrine.version).toBe("canary-shadow-progressive-delivery/v15.5");
    expect(bundle.doctrine.upstream_phase).toBe("deployment-orchestration-promotion-governance/v15.4");
    expect(bundle.doctrine.exposure_stages).toEqual(["0%", "1%", "5%", "10%", "25%", "50%", "100%"]);
    expect(bundle.doctrine.recommendation_outcomes).toEqual(["CONTINUE", "HOLD", "REQUIRE_REVIEW", "RECOMMEND_ROLLBACK", "REQUIRE_REQUALIFICATION"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("isolates shadow execution without production effects", () => {
    const result = runCanaryShadowProgressiveDelivery();

    expect(result.shadow_execution.execution_isolation).toBe(true);
    expect(result.shadow_execution.production_state_modified).toBe(false);
    expect(result.shadow_execution.external_side_effects_executed).toBe(false);
    expect(result.shadow_execution.replayable).toBe(true);
    expect(result.shadow_execution.evidence_refs.length).toBeGreaterThan(0);
  });

  it("governs canary activation and progressive exposure", () => {
    const result = runCanaryShadowProgressiveDelivery();

    expect(result.canary.deterministic).toBe(true);
    expect(result.canary.tenant_canary).toBe(true);
    expect(result.canary.capability_canary).toBe(true);
    expect(result.exposure_policy.maximum_rollout).toBe("50%");
    expect(result.exposure_policy.governed).toBe(true);
    expect(result.exposure_decision.current_stage).toBe("10%");
    expect(result.exposure_decision.unsafe_expansion_blocked).toBe(true);
  });

  it("compares production behavior and preserves advisory rollback authority", () => {
    const result = runCanaryShadowProgressiveDelivery();

    expect(result.comparison.reproducible).toBe(true);
    expect(result.comparison.deterministic).toBe(true);
    expect(result.comparison.divergence_detected).toBe(false);
    expect(result.recommendation.outcome).toBe("CONTINUE");
    expect(result.recommendation.mission_control_initiates_rollback).toBe(false);
    expect(result.recommendation.deployment_authority_required).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runCanaryShadowProgressiveDelivery();
    const second = runCanaryShadowProgressiveDelivery();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCanaryShadowProgressiveDelivery(first).valid).toBe(true);
    expect(replayCanaryShadowProgressiveDelivery(first)).toBe(true);
  });

  it("executes the complete Phase 15.5 certification matrix", () => {
    const result = runCanaryShadowProgressiveDelivery();

    expect(result.certification_tests).toHaveLength(20);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Shadow execution isolated",
      "Production effects prevented during shadow execution",
      "Canary activation deterministic",
      "Exposure policies enforced",
      "Progressive rollout deterministic",
      "Percentage exposure bounded",
      "Tenant-scoped rollout enforced",
      "Capability-scoped activation enforced",
      "Production comparison reproducible",
      "Divergence detection deterministic",
      "Rollback recommendations reproducible",
      "Mission Control advisory-only boundary preserved",
      "Deployment authority separation enforced",
      "Replay deterministic",
      "Audit lineage complete",
      "Exposure history immutable",
      "Policy violations fail closed",
      "Unsafe rollout expansion blocked",
      "Certification lineage preserved",
      "Production governance maintained",
    ]);
  });

  it("supports conditional pass for non-constitutional delivery warnings", () => {
    const result = runCanaryShadowProgressiveDelivery({ scenario: "NON_CONSTITUTIONAL_DELIVERY_WARNING" });
    const validation = validateCanaryShadowProgressiveDelivery(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "SHADOW_EXECUTION_NOT_ISOLATED",
    "PRODUCTION_EFFECTS_NOT_PREVENTED",
    "CANARY_ACTIVATION_NON_DETERMINISTIC",
    "EXPOSURE_POLICIES_NOT_ENFORCED",
    "PROGRESSIVE_ROLLOUT_NON_DETERMINISTIC",
    "PERCENTAGE_EXPOSURE_UNBOUNDED",
    "TENANT_SCOPED_ROLLOUT_NOT_ENFORCED",
    "CAPABILITY_SCOPED_ACTIVATION_NOT_ENFORCED",
    "PRODUCTION_COMPARISON_NOT_REPRODUCIBLE",
    "DIVERGENCE_DETECTION_NON_DETERMINISTIC",
    "ROLLBACK_RECOMMENDATION_NOT_REPRODUCIBLE",
    "ADVISORY_BOUNDARY_BREACH",
    "DEPLOYMENT_AUTHORITY_SEPARATION_BREACH",
    "REPLAY_NON_DETERMINISTIC",
    "AUDIT_LINEAGE_INCOMPLETE",
    "EXPOSURE_HISTORY_MUTABLE",
    "POLICY_VIOLATION_NOT_FAIL_CLOSED",
    "UNSAFE_EXPANSION_NOT_BLOCKED",
    "CERTIFICATION_LINEAGE_LOST",
    "PRODUCTION_GOVERNANCE_NOT_MAINTAINED",
  ] as const)("fails certification for %s", (scenario: ProgressiveDeliveryFailure) => {
    const result = runCanaryShadowProgressiveDelivery({ scenario });
    const validation = validateCanaryShadowProgressiveDelivery(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested exposure tampering", () => {
    const result = runCanaryShadowProgressiveDelivery();
    const tampered = {
      ...result,
      exposure_decision: {
        ...result.exposure_decision,
        current_stage: "100%" as const,
      },
    };

    expect(validateCanaryShadowProgressiveDelivery(tampered).valid).toBe(false);
  });
});
