import {
  buildTemplateHeuristicGenerationObservabilitySurface,
  generateTemplateHeuristicKnowledge,
  getTemplateHeuristicGenerationEngine,
  listCandidateKnowledgeArtifacts,
  listExecutionHeuristics,
  listPlanningTemplates,
  listTemplateHeuristicAuditRecords,
  validateTemplateHeuristicGeneration,
} from "@/services/template-heuristic-generation-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CandidateKnowledgeRepository, TemplateHeuristicGenerationInput } from "@/types/template-heuristic-generation-engine";

export async function requireTemplateHeuristicGenerationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): CandidateKnowledgeRepository {
  return (body.repository as CandidateKnowledgeRepository | undefined) ?? generateTemplateHeuristicKnowledge(body as TemplateHeuristicGenerationInput);
}

export function contractResponse() { return getTemplateHeuristicGenerationEngine(); }
export async function generateRequest(request: Request) { return generateTemplateHeuristicKnowledge((await readBody(request)) as TemplateHeuristicGenerationInput); }
export async function artifactsRequest(request: Request) { return listCandidateKnowledgeArtifacts((await readBody(request)) as TemplateHeuristicGenerationInput); }
export async function templatesRequest(request: Request) { return listPlanningTemplates((await readBody(request)) as TemplateHeuristicGenerationInput); }
export async function heuristicsRequest(request: Request) { return listExecutionHeuristics((await readBody(request)) as TemplateHeuristicGenerationInput); }
export async function auditRequest(request: Request) { return listTemplateHeuristicAuditRecords((await readBody(request)) as TemplateHeuristicGenerationInput); }
export async function validateRequest(request: Request) { return validateTemplateHeuristicGeneration(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildTemplateHeuristicGenerationObservabilitySurface();
  return buildTemplateHeuristicGenerationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
