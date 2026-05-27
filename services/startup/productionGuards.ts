import { evaluateProductionSafety } from "./productionSafety";

export function guardProductionSafety(environment: Parameters<typeof evaluateProductionSafety>[0]) {
  return evaluateProductionSafety(environment);
}
