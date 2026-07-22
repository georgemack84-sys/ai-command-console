import {
  buildKnowledgeActivationObservabilitySurface,
  getKnowledgeActivationOperatorApprovalEngine,
  listActiveKnowledgeRecords,
  listKnowledgeActivationApprovals,
  listKnowledgeActivationAudits,
  listKnowledgeActivationLedger,
  listKnowledgeRollbackRecords,
  requestKnowledgeActivation,
  validateKnowledgeActivation,
} from "@/services/knowledge-activation-operator-approval-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { KnowledgeActivationInput, KnowledgeActivationRepository } from "@/types/knowledge-activation-operator-approval-engine";

export async function requireKnowledgeActivationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): KnowledgeActivationRepository {
  return (body.repository as KnowledgeActivationRepository | undefined) ?? requestKnowledgeActivation(body as KnowledgeActivationInput);
}

export function contractResponse() { return getKnowledgeActivationOperatorApprovalEngine(); }
export async function requestActivation(request: Request) { return requestKnowledgeActivation((await readBody(request)) as KnowledgeActivationInput); }
export async function approvalsRequest(request: Request) { return listKnowledgeActivationApprovals((await readBody(request)) as KnowledgeActivationInput); }
export async function activeRequest(request: Request) { return listActiveKnowledgeRecords((await readBody(request)) as KnowledgeActivationInput); }
export async function ledgerRequest(request: Request) { return listKnowledgeActivationLedger((await readBody(request)) as KnowledgeActivationInput); }
export async function rollbackRequest(request: Request) { return listKnowledgeRollbackRecords((await readBody(request)) as KnowledgeActivationInput); }
export async function auditRequest(request: Request) { return listKnowledgeActivationAudits((await readBody(request)) as KnowledgeActivationInput); }
export async function validateRequest(request: Request) { return validateKnowledgeActivation(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildKnowledgeActivationObservabilitySurface();
  return buildKnowledgeActivationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
