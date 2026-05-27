import type { DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function shouldReadinessFailClosed(errors: readonly DecisionReadinessCertificationError[]): boolean {
  return errors.length > 0;
}
