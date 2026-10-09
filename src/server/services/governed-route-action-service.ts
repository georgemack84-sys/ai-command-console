import { createRequire } from "node:module";
import { AppError } from "@/src/server/api/errors";
import type { SessionUser } from "@/src/lib/types";

const require = createRequire(import.meta.url);
const { executeControlledStructuredPlan } = require("../../../services/runtimeControl");

export type GovernedRouteActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export type GovernedRouteActionInput = {
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

export type ControlledPlanExecutor = (
  plan: Record<string, unknown>,
  options: {
    actor: GovernedRouteActor;
    identitySource: "human";
    modes: { confirmed: boolean };
  },
) => Promise<ControlledPlanResult>;

type GovernedRouteActionOptions = {
  domain: string;
  source: string;
  normalizeAction?: (action: string) => string;
  additionalPlanFields?: (input: GovernedRouteActionInput) => Record<string, unknown>;
  executePlan?: ControlledPlanExecutor;
};

export function createGovernedRouteActionExecutor({
  domain,
  source,
  normalizeAction = (action) => action,
  additionalPlanFields = () => ({}),
  executePlan = executeControlledStructuredPlan,
}: GovernedRouteActionOptions) {
  return async function executeGovernedRouteAction(input: GovernedRouteActionInput, actor: GovernedRouteActor) {
    const requestedAction = String(input?.action || "").trim();
    if (!requestedAction) {
      throw new AppError(400, `${domain}_action_required`, `A ${domain} action is required.`);
    }

    const action = normalizeAction(requestedAction);
    const payload = input?.payload && typeof input.payload === "object" ? input.payload : {};
    const controlled = await executePlan(
      {
        ...additionalPlanFields(input),
        type: "single",
        action,
        payload,
        originalRequest: requestedAction,
        source,
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
        modes: { confirmed: input?.confirmed === true },
      },
    );

    const decision = String(controlled.control?.decision?.decision || "blocked");
    const explanation = controlled.control?.decision?.explanation || "Request blocked by control review.";

    if (decision === "blocked") {
      throw new AppError(403, `${domain}_action_blocked`, explanation, {
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
      throw new AppError(409, `${domain}_action_failed`, controlled.error || `${domain} action failed.`);
    }

    const result = controlled.result;
    const actionResult = result && typeof result === "object" ? (result as Record<string, unknown>) : null;
    if (actionResult?.ok === false) {
      throw new AppError(409, `${domain}_action_failed`, String(actionResult.error || `${domain} action failed.`));
    }

    return {
      ...(actionResult || {}),
      action: requestedAction,
      output: typeof actionResult?.output === "string" ? actionResult.output : result,
      plan: controlled.plan,
      control: controlled.control,
      review: controlled.review,
    };
  };
}
