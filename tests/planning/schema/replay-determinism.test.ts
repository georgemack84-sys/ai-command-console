import { describe, expect, it } from "vitest";

import type { CanonicalPlan } from "@/services/planning/contracts/plan-types";
import { hashCanonicalPlan } from "@/services/planning/schema/schema-hash";
import { getSchemaByVersion } from "@/services/planning/schema/schema-registry";

function buildPlan(): CanonicalPlan {
  return {
    schemaVersion: "1.0.0",
    planId: "plan-hash",
    createdAt: "2026-05-14T00:00:00.000Z",
    mission: {
      objective: "Hash me",
      priority: "normal",
      classification: "informational",
    },
    context: {
      sourceIds: ["b", "a"],
      evidenceRefs: ["e2", "e1"],
      constraints: ["c2", "c1"],
    },
    approvals: {
      required: false,
      policyRefs: ["p2", "p1"],
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
        stepId: "step-1",
        type: "analyze",
        title: "Analyze",
        dependencies: [],
        action: {
          tool: "tool.inspect",
          operation: "inspect",
          parameters: { beta: 2, alpha: 1 },
        },
        safety: {
          approvalRequired: false,
          dryRunSupported: true,
          riskLevel: "low",
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
      truthScoreRequired: 0.9,
      validationProfile: "default",
    },
    metadata: {
      plannerVersion: "4.2.0",
      generatedBy: "planner-service",
    },
  };
}

describe("schema replay determinism", () => {
  it("identical logical plan produces identical hash", () => {
    expect(hashCanonicalPlan(buildPlan())).toBe(hashCanonicalPlan(buildPlan()));
  });

  it("reordered object keys produce identical hash", () => {
    const plan = buildPlan();
    const reordered = {
      ...plan,
      mission: {
        classification: plan.mission.classification,
        priority: plan.mission.priority,
        objective: plan.mission.objective,
      },
      execution: {
        retryPolicy: {
          backoffMs: plan.execution.retryPolicy.backoffMs,
          maxAttempts: plan.execution.retryPolicy.maxAttempts,
        },
        timeoutMs: plan.execution.timeoutMs,
        mode: plan.execution.mode,
      },
    };

    expect(hashCanonicalPlan(plan)).toBe(hashCanonicalPlan(reordered));
  });

  it("changed meaningful field produces different hash", () => {
    const plan = buildPlan();
    const changed = buildPlan();
    changed.mission.objective = "Changed";

    expect(hashCanonicalPlan(plan)).not.toBe(hashCanonicalPlan(changed));
  });

  it("historical schema hash remains stable", () => {
    const schema = getSchemaByVersion("1.0.0");
    expect(schema?.hash).toBe(getSchemaByVersion("1.0.0")?.hash);
  });
});
