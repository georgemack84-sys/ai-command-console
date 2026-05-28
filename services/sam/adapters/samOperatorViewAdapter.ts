import { getRecoveryOperatorView } from "../../../controllers/recoveryOperatorController";
import { SAM_OPERATOR_ACTION_MAP } from "../samConstants";
import type { SamActionType } from "../samTypes";

export async function loadSamOperatorActionState({
  db,
  executionId,
  actionType,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  actionType: SamActionType;
  nowMs?: number;
}) {
  try {
    const result = await getRecoveryOperatorView({ db, executionId, nowMs });
    if (!result.ok) {
      return {
        operatorActionAllowed: false,
        allowedActions: [],
        source: "3.5C",
        reason: "SAM_OPERATOR_ACTION_BLOCKED",
      };
    }

    const mappedAction = SAM_OPERATOR_ACTION_MAP[actionType];
    if (mappedAction) {
      const matched = Array.isArray(result.data.allowedActions)
        ? result.data.allowedActions.find((entry) => entry.action === mappedAction)
        : null;
      return {
        operatorActionAllowed: matched?.allowed === true,
        allowedActions: Array.isArray(result.data.allowedActions) ? result.data.allowedActions : [],
        operatorView: result.data,
        source: "3.5C",
        reason: matched?.allowed === true ? undefined : matched?.reason || "SAM_OPERATOR_ACTION_BLOCKED",
      };
    }

    if (
      actionType === "recover_execution"
      || actionType === "pause_execution"
      || actionType === "resume_execution"
      || actionType === "cancel_execution"
    ) {
      return {
        operatorActionAllowed: result.data.timelineMatchesReadModel === true,
        allowedActions: Array.isArray(result.data.allowedActions) ? result.data.allowedActions : [],
        operatorView: result.data,
        source: "3.5C",
        reason: result.data.timelineMatchesReadModel === true ? undefined : "SAM_OPERATOR_ACTION_BLOCKED",
      };
    }

    return {
      operatorActionAllowed: false,
      allowedActions: Array.isArray(result.data.allowedActions) ? result.data.allowedActions : [],
      operatorView: result.data,
      source: "3.5C",
      reason: "SAM_OPERATOR_ACTION_BLOCKED",
    };
  } catch {
    return {
      operatorActionAllowed: false,
      allowedActions: [],
      source: "3.5C",
      reason: "SAM_ADAPTER_FAILED",
    };
  }
}
