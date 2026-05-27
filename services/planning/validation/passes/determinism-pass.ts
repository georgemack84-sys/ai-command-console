import { hashCanonicalPlan } from "../../schema/schema-hash";
import type { CanonicalPlan } from "../../contracts/plan-types";
import type { ValidationError } from "../validation-result";
import { hashValidationGraph } from "../evidence/graph-hash";
import type { GraphIndex } from "../structural/graph-index";

const DYNAMIC_PATTERN = /\$now|\$random|date\.now\(\)|math\.random\(\)|uuid\(\)|dynamicdependency/i;

function scan(value: unknown, path: string, errors: ValidationError[]) {
  if (typeof value === "string" && DYNAMIC_PATTERN.test(value)) {
    errors.push({
      code: "PLAN_NON_DETERMINISTIC",
      path,
      message: "Dynamic or mutable structural value detected.",
      stage: "determinism",
    });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => scan(entry, `${path}.${index}`, errors));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (DYNAMIC_PATTERN.test(key)) {
        errors.push({
          code: "PLAN_NON_DETERMINISTIC",
          path: `${path}.${key}`,
          message: "Dynamic structural key detected.",
          stage: "determinism",
        });
      }
      scan(nested, `${path}.${key}`, errors);
    }
  }
}

export function runDeterminismPass(plan: CanonicalPlan, graph: GraphIndex) {
  const errors: ValidationError[] = [];
  const planHashLeft = hashCanonicalPlan(plan);
  const planHashRight = hashCanonicalPlan(plan);
  const graphHashLeft = hashValidationGraph(graph);
  const graphHashRight = hashValidationGraph(graph);

  if (planHashLeft !== planHashRight || graphHashLeft !== graphHashRight) {
    errors.push({
      code: "PLAN_NON_DETERMINISTIC",
      path: "$",
      message: "Deterministic hashing was not stable.",
      stage: "determinism",
    });
  }

  plan.steps.forEach((step, index) => {
    scan(step.action.parameters, `steps.${index}.action.parameters`, errors);
  });

  return {
    errors,
    planHash: planHashLeft,
    graphHash: graphHashLeft,
  };
}
