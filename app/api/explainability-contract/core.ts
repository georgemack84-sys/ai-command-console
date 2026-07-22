import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildExplainabilityObservabilitySurface,
  getExplainabilityContract,
  getExplanation,
  registerExplanation,
  replayExplanation,
  searchExplanations,
  validateExplanationRepository,
} from "@/services/explainability-contract";
import type { ExplainabilityInput, ExplainabilitySearchCriteria, ExplanationRepository } from "@/types/explainability-contract";

export async function requireExplainabilityContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ExplanationRepository {
  return (body.repository as ExplanationRepository | undefined) ?? registerExplanation(body as ExplainabilityInput);
}

export function contractResponse() { return getExplainabilityContract(); }
export async function registerRequest(request: Request) { return registerExplanation((await readBody(request)) as ExplainabilityInput); }
export async function getRequest(request: Request) {
  const body = await readBody(request);
  return getExplanation(repositoryFromBody(body), body.explanation_id as string | undefined);
}
export async function validateRequest(request: Request) { return validateExplanationRepository(repositoryFromBody(await readBody(request))); }
export async function replayRequest(request: Request) {
  const body = await readBody(request);
  return replayExplanation(getExplanation(repositoryFromBody(body), body.explanation_id as string | undefined));
}
export async function searchRequest(request: Request) {
  const body = await readBody(request);
  return searchExplanations((body.criteria as ExplainabilitySearchCriteria | undefined) ?? body, repositoryFromBody(body));
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildExplainabilityObservabilitySurface();
  return buildExplainabilityObservabilitySurface(repositoryFromBody(await readBody(request)));
}
