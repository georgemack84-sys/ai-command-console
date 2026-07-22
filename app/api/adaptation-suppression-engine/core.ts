import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  evaluateAdaptationSuppression,
  getAdaptationSuppressionFoundation,
  replayAdaptationSuppression,
} from "@/services/adaptation-suppression-engine";
import type { AdaptationSuppressionInput, AdaptationSuppressionResult } from "@/types/adaptation-suppression-engine";

export async function requireAdaptationSuppressionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationSuppressionFoundation();
}

export async function evaluateRequest(request: Request) {
  const body = await readBody(request) as AdaptationSuppressionInput;
  return evaluateAdaptationSuppression(body);
}

export async function decisionsRequest(request: Request) {
  const body = await readBody(request) as AdaptationSuppressionInput;
  return evaluateAdaptationSuppression(body).suppression_decisions;
}

export async function explanationsRequest(request: Request) {
  const body = await readBody(request) as AdaptationSuppressionInput;
  return evaluateAdaptationSuppression(body).suppression_decisions.map((decision) => decision.explanation);
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptationSuppressionInput;
  return evaluateAdaptationSuppression(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationSuppressionResult> & AdaptationSuppressionInput;
  const result = body.suppression_decisions && body.metrics ? body as AdaptationSuppressionResult : evaluateAdaptationSuppression(body);
  return {
    replay_valid: replayAdaptationSuppression(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    suppression_state: result.suppression_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationSuppressionFoundation();
  const body = await readBody(request) as AdaptationSuppressionInput;
  const result = evaluateAdaptationSuppression(body);
  return {
    suppression_state: result.suppression_state,
    failures: result.failures,
    decisions: result.suppression_decisions.length,
    outcomes: result.suppression_decisions.map((decision) => decision.outcome),
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    modifies_proposals: result.modifies_proposals,
    approves_proposals: result.approves_proposals,
  };
}
