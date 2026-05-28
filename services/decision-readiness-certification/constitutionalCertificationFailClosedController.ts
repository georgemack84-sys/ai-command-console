import type { DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function shouldCertificationFailClosed(errors: readonly DecisionReadinessCertificationError[]): boolean {
  return errors.length > 0;
}
