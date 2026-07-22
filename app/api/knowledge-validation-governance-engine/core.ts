import {
  buildKnowledgeValidationObservabilitySurface,
  getKnowledgeValidationGovernanceEngine,
  listCertificationReadinessRecords,
  listKnowledgeValidationAuditRecords,
  listKnowledgeValidationRecords,
  validateKnowledgeGovernance,
  validateKnowledgeValidationRepository,
} from "@/services/knowledge-validation-governance-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { KnowledgeValidationInput, KnowledgeValidationRepository } from "@/types/knowledge-validation-governance-engine";

export async function requireKnowledgeValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): KnowledgeValidationRepository {
  return (body.repository as KnowledgeValidationRepository | undefined) ?? validateKnowledgeGovernance(body as KnowledgeValidationInput);
}

export function contractResponse() { return getKnowledgeValidationGovernanceEngine(); }
export async function validateRequest(request: Request) { return validateKnowledgeGovernance((await readBody(request)) as KnowledgeValidationInput); }
export async function recordsRequest(request: Request) { return listKnowledgeValidationRecords((await readBody(request)) as KnowledgeValidationInput); }
export async function readinessRequest(request: Request) { return listCertificationReadinessRecords((await readBody(request)) as KnowledgeValidationInput); }
export async function auditRequest(request: Request) { return listKnowledgeValidationAuditRecords((await readBody(request)) as KnowledgeValidationInput); }
export async function resultRequest(request: Request) { return validateKnowledgeValidationRepository(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildKnowledgeValidationObservabilitySurface();
  return buildKnowledgeValidationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
