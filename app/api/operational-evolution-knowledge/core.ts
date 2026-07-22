import { getOperationalEvolutionKnowledgeBundle, runOperationalEvolutionKnowledge, validateOperationalEvolutionKnowledge } from "@/services/operational-evolution-knowledge";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationalEvolutionKnowledgeInput, OperationalEvolutionKnowledgeResult } from "@/types/operational-evolution-knowledge";

export async function requireOperationalEvolutionKnowledgeUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationalEvolutionKnowledgeInput { return body as OperationalEvolutionKnowledgeInput; }
function resultFromBody(body: Record<string, unknown>): OperationalEvolutionKnowledgeResult { return (body.result as OperationalEvolutionKnowledgeResult | undefined) ?? runOperationalEvolutionKnowledge(inputFromBody(body)); }

export function contractResponse() { return getOperationalEvolutionKnowledgeBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runOperationalEvolutionKnowledge(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvolutionKnowledge(); return { evolution_registry: result.evolution_registry, evolution_stages: result.evolution_stages }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvolutionKnowledge(); return { improvement_ledger: result.improvement_ledger }; }
export async function knowledgeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvolutionKnowledge(); return { knowledge_registry: result.knowledge_registry }; }
export async function archiveRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvolutionKnowledge(); return { evidence_archive: result.evidence_archive }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvolutionKnowledge(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateOperationalEvolutionKnowledge(resultFromBody(await readBody(request))); }
