import type { RecoveryReadModel } from "./recoveryReadModel";
import type { RecoveryTimeline } from "./recoveryTimeline";

export type OperatorAction =
  | "ADD_NOTE"
  | "REQUEST_VERIFICATION"
  | "DISMISS_ADVISORY"
  | "ESCALATE_ADVISORY"
  | "VIEW_EVIDENCE";

export type OperatorActionResult = {
  action: OperatorAction;
  allowed: boolean;
  reason?: string;
};

export type OperatorView = {
  executionId: string;
  readModel: RecoveryReadModel;
  timeline: RecoveryTimeline;
  timelineMatchesReadModel: boolean;
  allowedActions: OperatorActionResult[];
  warnings: string[];
};

