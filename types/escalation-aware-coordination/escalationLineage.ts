import type { EscalationReason, EscalationState } from "./escalationStates";

export type EscalationLineageEntry = Readonly<{
  lineageEntryId: string;
  escalationId: string;
  coordinationId: string;
  escalationState: EscalationState;
  escalationReason: EscalationReason;
  createdAt: string;
  deterministicHash: string;
}>;

export type EscalationLineage = Readonly<{
  lineageId: string;
  entries: readonly EscalationLineageEntry[];
  lineageHash: string;
}>;
