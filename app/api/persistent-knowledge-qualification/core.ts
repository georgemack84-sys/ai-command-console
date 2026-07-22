import { getPersistentKnowledgeQualificationContract, qualifyPersistentKnowledge, validatePersistentKnowledgeQualification } from "@/services/persistent-knowledge-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PersistentKnowledgeQualificationInput, PersistentKnowledgeQualificationResult } from "@/types/persistent-knowledge-qualification";

export async function requirePersistentKnowledgeQualificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PersistentKnowledgeQualificationInput {
  return body as PersistentKnowledgeQualificationInput;
}

function resultFromBody(body: Record<string, unknown>): PersistentKnowledgeQualificationResult {
  return (body.result as PersistentKnowledgeQualificationResult | undefined) ?? qualifyPersistentKnowledge(inputFromBody(body));
}

export function contractResponse() {
  return getPersistentKnowledgeQualificationContract();
}

export async function dashboardRequest(request?: Request) {
  if (!request) return qualifyPersistentKnowledge();
  return qualifyPersistentKnowledge(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validatePersistentKnowledgeQualification(resultFromBody(await readBody(request)));
}

export async function certificationRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : qualifyPersistentKnowledge();
  return result.certification;
}

export async function ledgerRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : qualifyPersistentKnowledge();
  return { record: result.record, ledger: result.ledger, replay_hash: result.replay_hash };
}

export async function observabilityRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : qualifyPersistentKnowledge();
  return { outcome: result.certification.outcome, eligible_for_persistence: result.certification.eligible_for_persistence, observability: result.observability, integrity_hash: result.integrity_hash };
}
