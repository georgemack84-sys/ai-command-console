import type { EscalationSeverity, EscalationState } from "@/types/escalation";

export type EscalationLineage = Readonly<{
  lineageId: string;
  coordinationId: string;
  escalationId: string;
  state: EscalationState;
  severity: EscalationSeverity;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  lineageHash: string;
}>;
