export type OperatorInteraction = Readonly<{
  interactionId: string;
  operatorId: string;
  operatorRole: string;
  interactionType:
    | "pause"
    | "resume"
    | "deny"
    | "revoke"
    | "escalate"
    | "freeze"
    | "kill_switch";
  targetType: "proposal" | "approval" | "autonomy_state" | "workflow" | "mission" | "global";
  targetId: string;
  reasonCode: string;
  createdAt: string;
}>;
