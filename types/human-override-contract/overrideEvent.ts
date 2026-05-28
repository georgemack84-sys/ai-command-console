export type OverrideType =
  | "pause"
  | "resume"
  | "deny"
  | "revoke"
  | "escalate"
  | "freeze"
  | "kill_switch";

export type OverrideTargetType =
  | "proposal"
  | "approval"
  | "autonomy_state"
  | "workflow"
  | "mission"
  | "global";

export type OverrideEvent = Readonly<{
  overrideId: string;
  timestamp: string;
  operatorId: string;
  operatorRole: string;
  overrideType: OverrideType;
  targetType: OverrideTargetType;
  targetId: string;
  reasonCode: string;
  justification: string;
  authoritySnapshotHash: string;
  governanceSnapshotHash: string;
  approvalGraphHash: string;
  parentOverrideId?: string;
  createdAt: string;
}>;
