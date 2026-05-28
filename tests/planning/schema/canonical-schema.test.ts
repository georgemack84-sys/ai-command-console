import { describe, expect, it } from "vitest";

import { validateCanonicalPlan } from "@/services/planning/schema/schema-validator";

function buildValidPlan() {
  return {
    schemaVersion: "1.0.0",
    planId: "plan-001",
    createdAt: "2026-05-14T00:00:00.000Z",
    mission: {
      objective: "Inspect runtime readiness",
      priority: "normal",
      classification: "informational",
    },
    context: {
      sourceIds: ["source-b", "source-a"],
      evidenceRefs: ["evidence-b", "evidence-a"],
      constraints: ["constraint-b", "constraint-a"],
    },
    approvals: {
      required: false,
      policyRefs: ["policy-b", "policy-a"],
    },
    execution: {
      mode: "dry_run",
      timeoutMs: 30000,
      retryPolicy: {
        maxAttempts: 1,
        backoffMs: 0,
      },
    },
    steps: [
      {
        stepId: "step-001",
        type: "analyze",
        title: "Inspect inputs",
        dependencies: [],
        action: {
          tool: "tool.inspect",
          operation: "inspect",
          parameters: { path: "/tmp" },
        },
        safety: {
          approvalRequired: false,
          dryRunSupported: true,
          riskLevel: "low",
        },
        execution: {
          timeoutMs: 15000,
          retryable: true,
          idempotent: true,
        },
        observability: {
          logLevel: "info",
          metricsEnabled: true,
        },
      },
    ],
    governance: {
      truthScoreRequired: 0.9,
      validationProfile: "default",
    },
    metadata: {
      plannerVersion: "4.2.0",
      generatedBy: "planner-service",
    },
  };
}

describe("canonical schema", () => {
  it("accepts a valid canonical plan", () => {
    const result = validateCanonicalPlan(buildValidPlan());
    expect(result.status).toBe("valid");
    expect(result.normalized?.planId).toBe("plan-001");
  });

  it("rejects missing schemaVersion", () => {
    const plan = buildValidPlan();
    delete (plan as { schemaVersion?: string }).schemaVersion;

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("missing_required_field");
    expect(result.issues.some((issue) => issue.code === "PHASE42A_SCHEMA_VERSION_MISSING")).toBe(true);
  });

  it("rejects unknown root field", () => {
    const plan = {
      ...buildValidPlan(),
      surprise: true,
    };

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("unknown_field");
  });

  it("rejects unknown nested field", () => {
    const plan = buildValidPlan();
    const nested = plan.steps[0] as Record<string, unknown>;
    nested.unknownNested = true;

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("unknown_field");
  });

  it("rejects invalid enum", () => {
    const plan = buildValidPlan();
    plan.mission.priority = "urgent" as "normal";

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("invalid_enum");
  });

  it("rejects malformed steps", () => {
    const plan = buildValidPlan();
    (plan.steps[0] as { action?: unknown }).action = null;

    const result = validateCanonicalPlan(plan);
    expect(result.status).toBe("invalid_schema");
  });
});

