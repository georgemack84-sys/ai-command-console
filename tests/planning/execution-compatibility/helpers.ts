import { validateSequentialDependencies } from "@/services/planning/dependencies";
import { validateExecutionTruth } from "@/services/planning/execution-truth";
import { buildSafeExecutionTruthPlan } from "@/tests/planning/execution-truth/helpers";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function buildExecutionCompatibilityFixture() {
  const normalizedPlan = buildSafeExecutionTruthPlan();
  normalizedPlan.steps[0]!.inputs.compatibility = {
    approval: {
      required: false,
      requiredRole: "operator",
      scope: {
        actionScope: ["read-config"],
        resourceScope: ["service:config"],
        environmentScope: ["local"],
        tenantScope: ["single-tenant"],
        toolScope: ["planner"],
      },
    },
    rollback: {
      required: false,
      checkpointRequired: false,
      compensationRequired: false,
    },
    compensation: {
      irreversible: false,
      requiresApproval: false,
    },
    authority: {
      parents: [],
    },
    escalation: {
      targets: [],
      terminal: true,
    },
  };
  normalizedPlan.steps[1]!.inputs.compatibility = {
    approval: {
      required: false,
      requiredRole: "operator",
      scope: {
        actionScope: ["validate-config"],
        resourceScope: ["service:config"],
        environmentScope: ["local"],
        tenantScope: ["single-tenant"],
        toolScope: ["planner"],
      },
    },
    rollback: {
      required: false,
      checkpointRequired: false,
      compensationRequired: false,
    },
    compensation: {
      irreversible: false,
      requiresApproval: false,
    },
    authority: {
      parents: ["step-read"],
    },
    escalation: {
      targets: [],
      terminal: true,
    },
  };

  const dependencyValidation = validateSequentialDependencies(normalizedPlan);
  if (!dependencyValidation.ok) {
    throw new Error("Expected dependency validation fixture to pass.");
  }

  const truth = validateExecutionTruth({
    normalizedPlan,
    dependencyValidation,
  });
  if (!truth.ok) {
    throw new Error("Expected execution truth fixture to validate.");
  }

  return {
    normalizedPlan: clone(normalizedPlan),
    dependencyValidation: clone(dependencyValidation),
    executionTruthPackage: clone(truth.executionTruthPackage),
  };
}
