import type { CanonicalPlan } from "../../contracts/plan-types";
import { createGraphIndex } from "./graph-index";

export function buildPlanGraph(plan: CanonicalPlan) {
  return createGraphIndex(plan);
}

