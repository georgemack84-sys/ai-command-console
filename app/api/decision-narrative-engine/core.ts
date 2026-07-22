import { generateNarrative, getDecisionNarrativeEngineContract, getNarrative, replayNarrative, validateNarrative, buildDecisionNarrativeObservabilitySurface } from "@/services/decision-narrative-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DecisionNarrativeInput, DecisionNarrativeRepository } from "@/types/decision-narrative-engine";

export async function requireDecisionNarrativeUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): DecisionNarrativeRepository {
  return (body.repository as DecisionNarrativeRepository | undefined) ?? generateNarrative(body as DecisionNarrativeInput);
}

export function contractResponse() { return getDecisionNarrativeEngineContract(); }
export async function generateRequest(request: Request) { return generateNarrative((await readBody(request)) as DecisionNarrativeInput); }
export async function getRequest(request: Request) {
  const body = await readBody(request);
  return getNarrative(repositoryFromBody(body), body.narrative_id as string | undefined);
}
export async function replayRequest(request: Request) {
  const body = await readBody(request);
  return replayNarrative(getNarrative(repositoryFromBody(body), body.narrative_id as string | undefined));
}
export async function validateRequest(request: Request) {
  const body = await readBody(request);
  return validateNarrative(getNarrative(repositoryFromBody(body), body.narrative_id as string | undefined));
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildDecisionNarrativeObservabilitySurface();
  return buildDecisionNarrativeObservabilitySurface(repositoryFromBody(await readBody(request)));
}
