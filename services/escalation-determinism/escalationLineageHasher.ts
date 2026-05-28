import { hashEscalationValue } from "./escalationHashingEngine";

export function hashEscalationLineage(scope: string, value: unknown): string {
  return hashEscalationValue(`escalation-lineage:${scope}`, value);
}
