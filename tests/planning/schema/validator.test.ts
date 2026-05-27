import { describe, expect, it } from "vitest";

import { validateCanonicalPlan } from "@/services/planning/schema/schema-validator";

function buildPlan() {
  return {
    schemaVersion: "1.0.0",
    planId: "plan-validator",
    createdAt: "2026-05-14T00:00:00.000Z",
    mission: {
      objective: "Validate dependency graph",
      priority: "high",
      classification: "operational",
    },
    context: {
      sourceIds: [],
      evidenceRefs: [],
      constraints: [],
    },
    approvals: {
      required: false,
      policyRefs: [],
    },
    execution: {
      mode: "supervised",
      timeoutMs: 60000,
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: 1000,
      },
    },
    steps: [
      {
        stepId: "step-a",
        type: "analyze",
        title: "A",
        dependencies: [],
        action: {
          tool: "tool.a",
          operation: "inspect",
          parameters: {},
        },
        safety: {
          approvalRequired: false,
          dryRunSupported: true,
          riskLevel: "low",
        },
        execution: {
          timeoutMs: 1000,
          retryable: true,
          idempotent: true,
        },
        observability: {
          logLevel: "info",
          metricsEnabled: true,
        },
      },
      {
        stepId: "step-b",
        type: "validate",
        title: "B",
        dependencies: ["step-a"],
        action: {
          tool: "tool.b",
          operation: "validate",
          parameters: {},
        },
        safety: {
          approvalRequired: false,
          dryRunSupported: true,
          riskLevel: "medium",
        },
        execution: {
          timeoutMs: 1000,
          retryable: false,
          idempotent: true,
        },
        observability: {
          logLevel: "info",
          metricsEnabled: true,
        },
      },
    ],
    governance: {
      truthScoreRequired: 0.95,
      validationProfile: "strict",
    },
    metadata: {
      plannerVersion: "4.2.0",
      generatedBy: "planner-service",
    },
  };
}

describe("schema validator", () => {
  it("rejects unsupported schema version", () => {
    const plan = buildPlan();
    plan.schemaVersion = "9.0.0";

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("unsupported_version");
  });

  it("rejects duplicate step IDs", () => {
    const plan = buildPlan();
    plan.steps[1] = { ...plan.steps[1], stepId: "step-a" };

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("invalid_step_graph");
    expect(result.issues.some((issue) => issue.code === "PHASE42A_DUPLICATE_STEP_ID")).toBe(true);
  });

  it("rejects circular dependency graph", () => {
    const plan = buildPlan();
    plan.steps[0].dependencies = ["step-b"];

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("invalid_step_graph");
    expect(result.issues.some((issue) => issue.code === "PHASE42A_CIRCULAR_DEPENDENCY")).toBe(true);
  });

  it("rejects missing dependency target", () => {
    const plan = buildPlan();
    plan.steps[1].dependencies = ["step-missing"];

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("invalid_step_graph");
    expect(result.issues.some((issue) => issue.code === "PHASE42A_INVALID_STEP_GRAPH")).toBe(true);
  });

  it("rejects unsafe critical non-idempotent step without approval", () => {
    const plan = buildPlan();
    plan.steps[1].safety.riskLevel = "critical";
    plan.steps[1].safety.approvalRequired = false;
    plan.steps[1].execution.idempotent = false;

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("governance_violation");
    expect(result.issues.some((issue) => issue.code === "PHASE42A_UNSAFE_STEP")).toBe(true);
  });

  it("accepts valid dependency graph", () => {
    const result = validateCanonicalPlan(buildPlan());
    expect(result.status).toBe("valid");
  });
});

