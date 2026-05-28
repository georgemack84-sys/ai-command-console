import { getPlanHistory } from "./planPersistence";

export function readPlanHistory(planId: string) {
  return getPlanHistory(planId);
}
