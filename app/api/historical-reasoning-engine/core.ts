import { getHistoricalReasoningContract, runHistoricalReasoning, validateHistoricalReasoning } from "@/services/historical-reasoning-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { HistoricalReasoningInput, HistoricalReasoningResult } from "@/types/historical-reasoning-engine";

export async function requireHistoricalReasoningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): HistoricalReasoningInput {
  return body as HistoricalReasoningInput;
}

function resultFromBody(body: Record<string, unknown>): HistoricalReasoningResult {
  return (body.result as HistoricalReasoningResult | undefined) ?? runHistoricalReasoning(inputFromBody(body));
}

export function contractResponse() {
  return getHistoricalReasoningContract();
}

export async function dashboardRequest(request?: Request) {
  if (!request) return runHistoricalReasoning();
  return runHistoricalReasoning(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateHistoricalReasoning(resultFromBody(await readBody(request)));
}

export async function retrievalRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runHistoricalReasoning();
  return { retrieval: result.retrieval, comparison: result.comparison, outcome_correlation: result.outcome_correlation, temporal_reasoning: result.temporal_reasoning };
}

export async function recommendationsRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runHistoricalReasoning();
  return { recommendation_history: result.recommendation_history, recommendations: result.recommendations, confidence: result.historical_confidence, counterfactual_reference: result.counterfactual_reference };
}

export async function ledgerRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runHistoricalReasoning();
  return { record: result.record, ledger: result.ledger, replay_hash: result.replay_hash };
}

export async function observabilityRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runHistoricalReasoning();
  return { status: result.certification.status, production_ready: result.certification.production_ready, observability: result.observability, integrity_hash: result.integrity_hash };
}
