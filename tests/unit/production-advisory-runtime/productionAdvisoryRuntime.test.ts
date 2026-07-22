import { describe, expect, it } from "vitest";
import {
  getProductionAdvisoryRuntimeBundle,
  replayProductionAdvisoryRuntime,
  runProductionAdvisoryRuntime,
  validateProductionAdvisoryRuntime,
} from "@/services/production-advisory-runtime";
import type { ProductionAdvisoryRuntimeFailure } from "@/types/production-advisory-runtime";

describe("Mission Control Phase 16.3 Production Advisory Runtime", () => {
  it("publishes production advisory runtime doctrine", () => {
    const bundle = getProductionAdvisoryRuntimeBundle();

    expect(bundle.doctrine.version).toBe("production-advisory-runtime/v16.3");
    expect(bundle.doctrine.upstream_phase).toBe("pilot-scope-enrollment/v16.2");
    expect(bundle.doctrine.lifecycle).toEqual(["INITIALIZED", "QUALIFIED", "READY", "PROCESSING", "RECOMMENDATION_PUBLISHED", "REPLAYABLE", "BLOCKED", "QUALIFICATION_FAILED", "POLICY_VIOLATION", "FAIL_CLOSED"]);
    expect(bundle.doctrine.recommendation_states).toEqual(["GENERATED", "VALIDATED", "EXPLAINED", "PUBLISHED", "REPLAYABLE"]);
    expect(bundle.doctrine.recommendation_outcomes).toContain("RECOMMENDATION_PUBLISHED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("qualifies advisory runtime before processing live inputs", () => {
    const result = runProductionAdvisoryRuntime();

    expect(result.qualification.valid).toBe(true);
    expect(result.qualification.runtime_version).toBe("production-advisory-runtime/v16.3");
    expect(result.qualification.tenant_qualified).toBe(true);
    expect(result.qualification.scope_authorized).toBe(true);
    expect(result.qualification.qualified_inputs_only).toBe(true);
    expect(result.observability.runtime_health).toBe("HEALTHY");
  });

  it("preserves advisory-only authority separation", () => {
    const result = runProductionAdvisoryRuntime();

    expect(result.policy.advisory_only).toBe(true);
    expect(result.policy.execution_authority_blocked).toBe(true);
    expect(result.policy.operator_authority_external).toBe(true);
    expect(result.operator_interaction.authority_separated).toBe(true);
    expect(result.operator_interaction.production_execution_permitted).toBe(false);
  });

  it("builds deterministic recommendation pipeline and decision context", () => {
    const result = runProductionAdvisoryRuntime();

    expect(result.pipeline.deterministic).toBe(true);
    expect(result.pipeline.evidence_resolved).toBe(true);
    expect(result.pipeline.explanation_generated).toBe(true);
    expect(result.decision_context.complete).toBe(true);
    expect(result.decision_context.replay_deterministic).toBe(true);
    expect(result.decision_context.supporting_evidence.length).toBeGreaterThan(0);
  });

  it("publishes immutable replayable advisory recommendations", () => {
    const result = runProductionAdvisoryRuntime();

    expect(result.recommendation.state).toBe("REPLAYABLE");
    expect(result.recommendation.outcome).toBe("RECOMMENDATION_PUBLISHED");
    expect(result.recommendation.immutable).toBe(true);
    expect(result.recommendation.replay_refs.length).toBeGreaterThan(0);
    expect(result.replay.outcome).toBe("PASS");
  });

  it("records immutable recommendation lineage and evidence ledger", () => {
    const result = runProductionAdvisoryRuntime();

    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.immutable).toBe(true);
    expect(result.lineage.recommendation_refs).toContain(result.recommendation.integrity_hash);
    expect(result.ledger).toHaveLength(10);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionAdvisoryRuntime();
    const second = runProductionAdvisoryRuntime();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionAdvisoryRuntime(first).valid).toBe(true);
    expect(replayProductionAdvisoryRuntime(first)).toBe(true);
  });

  it("executes the Phase 16.3 runtime certification matrix", () => {
    const result = runProductionAdvisoryRuntime();

    expect(result.certification_tests).toHaveLength(15);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Advisory boundary enforced",
      "Runtime deterministic",
      "Operator authority preserved",
      "Recommendations immutable",
      "Replay reproducible",
      "Recommendation lineage complete",
      "Decision context reproducible",
      "Evidence linkage complete",
      "Execution authority impossible",
      "Tenant isolation maintained",
      "Runtime qualification validated",
      "Policy enforcement deterministic",
      "Qualified inputs only",
      "Immutable evidence preserved",
      "Phase 16.2 pilot enrollment valid",
    ]);
  });

  it("supports conditional pass for non-constitutional runtime warnings", () => {
    const result = runProductionAdvisoryRuntime({ scenario: "NON_CONSTITUTIONAL_RUNTIME_WARNING" });
    const validation = validateProductionAdvisoryRuntime(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "ADVISORY_BOUNDARY_NOT_ENFORCED",
    "RUNTIME_NON_DETERMINISTIC",
    "OPERATOR_AUTHORITY_NOT_PRESERVED",
    "RECOMMENDATION_MUTABLE",
    "REPLAY_NOT_REPRODUCIBLE",
    "RECOMMENDATION_LINEAGE_INCOMPLETE",
    "DECISION_CONTEXT_NOT_REPRODUCIBLE",
    "EVIDENCE_LINKAGE_INCOMPLETE",
    "EXECUTION_AUTHORITY_POSSIBLE",
    "TENANT_ISOLATION_NOT_MAINTAINED",
    "RUNTIME_QUALIFICATION_INVALID",
    "POLICY_ENFORCEMENT_NON_DETERMINISTIC",
    "QUALIFIED_INPUTS_NOT_ENFORCED",
    "IMMUTABLE_EVIDENCE_NOT_PRESERVED",
    "PHASE_16_2_ENROLLMENT_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: ProductionAdvisoryRuntimeFailure) => {
    const result = runProductionAdvisoryRuntime({ scenario });
    const validation = validateProductionAdvisoryRuntime(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested recommendation tampering", () => {
    const result = runProductionAdvisoryRuntime();
    const tampered = {
      ...result,
      recommendation: {
        ...result.recommendation,
        immutable: false,
      },
    };

    expect(validateProductionAdvisoryRuntime(tampered).valid).toBe(false);
  });
});
