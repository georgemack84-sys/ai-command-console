import {
  analyzeRisk,
  buildConfidenceRiskObservabilitySurface,
  buildConfidenceRiskReasoning,
  calculateConfidence,
  generateConfidenceNarrative,
  generateRiskNarrative,
  getConfidenceRiskRecord,
  getConfidenceRiskReasoningContract,
  replayConfidenceAnalysis,
  replayRiskAnalysis,
  validateConfidenceRiskReasoning,
} from "@/services/confidence-risk-reasoning-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConfidenceRiskInput, ConfidenceRiskRepository } from "@/types/confidence-risk-reasoning-engine";

export async function requireConfidenceRiskUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConfidenceRiskRepository {
  return (body.repository as ConfidenceRiskRepository | undefined) ?? buildConfidenceRiskReasoning(body as ConfidenceRiskInput);
}

export function contractResponse() { return getConfidenceRiskReasoningContract(); }
export async function calculateConfidenceRequest(request: Request) { return calculateConfidence((await readBody(request)) as ConfidenceRiskInput); }
export async function analyzeRiskRequest(request: Request) { return analyzeRisk((await readBody(request)) as ConfidenceRiskInput); }
export async function confidenceNarrativeRequest(request: Request) { return generateConfidenceNarrative((await readBody(request)) as ConfidenceRiskInput); }
export async function riskNarrativeRequest(request: Request) { return generateRiskNarrative((await readBody(request)) as ConfidenceRiskInput); }
export async function replayConfidenceRequest(request: Request) {
  const body = await readBody(request);
  return replayConfidenceAnalysis(getConfidenceRiskRecord(repositoryFromBody(body), body.reasoning_id as string | undefined));
}
export async function replayRiskRequest(request: Request) {
  const body = await readBody(request);
  return replayRiskAnalysis(getConfidenceRiskRecord(repositoryFromBody(body), body.reasoning_id as string | undefined));
}
export async function validateRequest(request: Request) {
  const body = await readBody(request);
  return validateConfidenceRiskReasoning(getConfidenceRiskRecord(repositoryFromBody(body), body.reasoning_id as string | undefined));
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildConfidenceRiskObservabilitySurface();
  return buildConfidenceRiskObservabilitySurface(repositoryFromBody(await readBody(request)));
}
