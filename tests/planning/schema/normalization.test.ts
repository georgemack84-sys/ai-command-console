import { describe, expect, it } from "vitest";

import type { CanonicalPlan } from "@/services/planning/contracts/plan-types";
import { normalizeCanonicalPlan } from "@/services/planning/schema/schema-normalizer";
import { validateCanonicalPlan } from "@/services/planning/schema/schema-validator";

function buildPlan(): CanonicalPlan {
  return {
    schemaVersion: "1.0.0",
    planId: "plan-normalize",
    createdAt: "2026-05-14T00:00:00.000Z",
    mission: {
      objective: "Normalize shape",
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
        backoffMs: 1000,
        maxAttempts: 2,
      },
    },
    steps: [
      {
        stepId: "step-z",
        type: "validate",
        title: "Z",
        dependencies: ["step-a", "step-b"],
        action: {
          tool: "tool.z",
          operation: "validate",
          parameters: { second: 2, first: 1 },
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

describe("schema normalization", () => {
  it("produces stable normalized output", () => {
    const normalizedA = normalizeCanonicalPlan(buildPlan());
    const normalizedB = normalizeCanonicalPlan(buildPlan());
    expect(normalizedA).toEqual(normalizedB);
  });

  it("does not mutate input", () => {
    const input = buildPlan();
    const snapshot = JSON.parse(JSON.stringify(input));

    normalizeCanonicalPlan(input);

    expect(input).toEqual(snapshot);
  });

  it("sorts deterministic fields consistently", () => {
    const normalized = normalizeCanonicalPlan(buildPlan());
    expect(normalized.context.sourceIds).toEqual(["a", "b"]);
    expect(normalized.context.evidenceRefs).toEqual(["e1", "e2"]);
    expect(normalized.context.constraints).toEqual(["c1", "c2"]);
    expect(normalized.approvals.policyRefs).toEqual(["p1", "p2"]);
  });

  it("does not hide unknown fields before validation", () => {
    const input = {
      ...buildPlan(),
      hidden: true,
    };

    const result = validateCanonicalPlan(input);
    expect(result.status).toBe("unknown_field");
  });
});
