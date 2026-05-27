export type EscalationDecision = Readonly<{
  decisionId: string;
  escalationLineageId: string;
  escalationState: "elevated" | "critical" | "frozen";
  deterministicHash: string;
}>;
