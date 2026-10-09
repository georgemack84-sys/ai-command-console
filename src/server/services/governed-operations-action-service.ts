import { createRequire } from "node:module";
import { AppError } from "@/src/server/api/errors";
import type { SessionUser } from "@/src/lib/types";

const require = createRequire(import.meta.url);
const { executeControlledStructuredPlan } = require("../../../services/runtimeControl");

type OperationsActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

type GovernedOperationsInput = {
  action?: unknown;
  payload?: unknown;
  confirmed?: unknown;
};

type ControlledPlanResult = {
  ok?: boolean;
  error?: string;
  result?: unknown;
  plan?: Record<string, unknown>;
  review?: Record<string, unknown>;
  control?: { decision?: { decision?: string; explanation?: string } };
};

type ControlledPlanExecutor = (
  plan: Record<string, unknown>,
  options: {
    actor: OperationsActor;
    identitySource: "human";
    modes: { confirmed: boolean };
  },
) => Promise<ControlledPlanResult>;

const workspaceActionAliases: Record<string, string> = {
  "workspace:assign-owner": "collaboration:automation-assign",
  "workspace:assign-approver": "collaboration:automation-assign-approver",
  "workspace:assign-backup-approver": "collaboration:automation-assign-backup-approver",
  "workspace:snooze": "collaboration:automation-snooze",
  "workspace:run-sweep": "collaboration:automation-run-sweep",
  "workspace:create-followup": "collaboration:automation-create-followup",
  "workspace:add-note": "collaboration:automation-add-note",
  "workspace:generate-summary": "collaboration:automation-generate-summary",
  "workspace:set-status": "collaboration:automation-set-status",
};

export function normalizeGovernedOperationsAction(action: string) {
  return workspaceActionAliases[action] || action;
}

export function createGovernedOperationsActionExecutor(
  executePlan: ControlledPlanExecutor = executeControlledStructuredPlan,
) {
  return async function executeGovernedOperationsAction(input: GovernedOperationsInput, actor: OperationsActor) {
    const requestedAction = String(input?.action || "").trim();
    if (!requestedAction) {
      throw new AppError(400, "operations_action_required", "An operations action is required.");
    }

    const action = normalizeGovernedOperationsAction(requestedAction);
    const payload = input?.payload && typeof input.payload === "object" ? input.payload : {};
    const controlled = await executePlan(
      {
        type: "single",
        action,
        payload,
        originalRequest: requestedAction,
        source: "operations_api",
        meta: {
          userId: actor.id,
          workspaceId: actor.workspaceId,
          userName: actor.name || actor.email,
          userEmail: actor.email,
          userRole: actor.role,
        },
      },
      {
        actor,
        identitySource: "human",
        modes: { confirmed: Boolean(input?.confirmed) },
      },
    );

    const decision = String(controlled.control?.decision?.decision || "blocked");
    const explanation = controlled.control?.decision?.explanation || "Request blocked by control review.";

    if (decision === "blocked") {
      throw new AppError(403, "operations_action_blocked", explanation, {
        action: requestedAction,
        control: controlled.control,
        review: controlled.review,
      });
    }

    if (decision === "confirm_required") {
      return {
        action: requestedAction,
        output: explanation,
        requiresConfirmation: true,
        plan: controlled.plan,
        control: controlled.control,
        review: controlled.review,
      };
    }

    if (decision === "simulate") {
      return {
        action: requestedAction,
        output: explanation,
        simulated: true,
        plan: controlled.plan,
        control: controlled.control,
        review: controlled.review,
      };
    }

    if (controlled.ok === false) {
      throw new AppError(409, "operations_action_failed", controlled.error || "Operations action failed.");
    }

    const result = controlled.result;
    const operationResult = result && typeof result === "object" ? (result as Record<string, unknown>) : null;
    if (operationResult?.ok === false) {
      throw new AppError(409, "operations_action_failed", String(operationResult.error || "Operations action failed."));
    }

    return {
      ...(operationResult || {}),
      action: requestedAction,
      output: typeof operationResult?.output === "string" ? operationResult.output : result,
      plan: controlled.plan,
      control: controlled.control,
      review: controlled.review,
    };
  };
}

export const executeGovernedOperationsAction = createGovernedOperationsActionExecutor();
