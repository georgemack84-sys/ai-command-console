import {
  buildKnowledgeRepositoryObservabilitySurface,
  getKnowledgeRepositoryEvolutionLedger,
  listEvolutionLedgerEntries,
  listKnowledgeLineageGraph,
  listKnowledgeRepositoryAudits,
  listKnowledgeRepositoryRecords,
  queryKnowledgeRepository,
  storeKnowledgeRepository,
  validateKnowledgeRepository,
} from "@/services/knowledge-repository-evolution-ledger";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { KnowledgeRepositoryInput, KnowledgeRepositoryProjection } from "@/types/knowledge-repository-evolution-ledger";

export async function requireKnowledgeRepositoryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): KnowledgeRepositoryProjection {
  return (body.repository as KnowledgeRepositoryProjection | undefined) ?? storeKnowledgeRepository(body as KnowledgeRepositoryInput);
}

export function contractResponse() { return getKnowledgeRepositoryEvolutionLedger(); }
export async function storeRequest(request: Request) { return storeKnowledgeRepository((await readBody(request)) as KnowledgeRepositoryInput); }
export async function recordsRequest(request: Request) { return listKnowledgeRepositoryRecords((await readBody(request)) as KnowledgeRepositoryInput); }
export async function ledgerRequest(request: Request) { return listEvolutionLedgerEntries((await readBody(request)) as KnowledgeRepositoryInput); }
export async function lineageRequest(request: Request) { return listKnowledgeLineageGraph((await readBody(request)) as KnowledgeRepositoryInput); }
export async function auditRequest(request: Request) { return listKnowledgeRepositoryAudits((await readBody(request)) as KnowledgeRepositoryInput); }
export async function queryRequest(request: Request) { return queryKnowledgeRepository((await readBody(request)) as KnowledgeRepositoryInput); }
export async function validateRequest(request: Request) { return validateKnowledgeRepository(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildKnowledgeRepositoryObservabilitySurface();
  return buildKnowledgeRepositoryObservabilitySurface(repositoryFromBody(await readBody(request)));
}
