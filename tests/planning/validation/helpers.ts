import type { CanonicalPlan } from "@/services/planning/contracts/plan-types";

export function buildCanonicalPlan(overrides: Partial<CanonicalPlan> = {}): CanonicalPlan {
  const base: CanonicalPlan = {
    schemaVersion: "1.1.0",
    planId: "plan-structural",
    createdAt: "2026-05-14T00:00:00.000Z",
    mission: {
      objective: "Validate structure",
      priority: "normal",
      classification: "operational",
    },
    context: {
      sourceIds: ["source-1"],
      evidenceRefs: ["evidence-1"],
      constraints: ["constraint-1"],
    },
    approvals: {
      required: false,
      policyRefs: [],
    },
    execution: {
      mode: "supervised",
      timeoutMs: 60_000,
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: 1000,
      },
    },
    steps: [
      {
        stepId: "step-a",
        type: "analyze",
        title: "Analyze input",
        dependencies: [],
        action: {
          tool: "read_file",
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
          retryable: false,
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
        title: "Validate findings",
        dependencies: ["step-a"],
        action: {
          tool: "inspect_runtime",
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

  return {
    ...base,
    ...overrides,
    mission: { ...base.mission, ...overrides.mission },
    context: { ...base.context, ...overrides.context },
    approvals: { ...base.approvals, ...overrides.approvals },
    execution: {
      ...base.execution,
      ...overrides.execution,
      retryPolicy: {
        ...base.execution.retryPolicy,
        ...overrides.execution?.retryPolicy,
      },
    },
    governance: { ...base.governance, ...overrides.governance },
    metadata: { ...base.metadata, ...overrides.metadata },
    steps: overrides.steps ?? base.steps,
  };
}
