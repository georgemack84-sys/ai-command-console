import { getKnowledgeLifecycleContract, runKnowledgeLifecycleManagement, validateKnowledgeLifecycleManagement } from "@/services/knowledge-lifecycle-management";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { KnowledgeLifecycleInput, KnowledgeLifecycleResult } from "@/types/knowledge-lifecycle-management";

export async function requireKnowledgeLifecycleUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): KnowledgeLifecycleInput { return body as KnowledgeLifecycleInput; }
function resultFromBody(body: Record<string, unknown>): KnowledgeLifecycleResult { return (body.result as KnowledgeLifecycleResult | undefined) ?? runKnowledgeLifecycleManagement(inputFromBody(body)); }
export function contractResponse() { return getKnowledgeLifecycleContract(); }
export async function dashboardRequest(request?: Request) { if (!request) return runKnowledgeLifecycleManagement(); return runKnowledgeLifecycleManagement(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateKnowledgeLifecycleManagement(resultFromBody(await readBody(request))); }
export async function transitionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runKnowledgeLifecycleManagement(); return { records: result.records, transitions: result.transitions, versions: result.versions }; }
export async function policiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runKnowledgeLifecycleManagement(); return { policies: result.policies, integrity_report: result.integrity_report }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runKnowledgeLifecycleManagement(); return { ledger: result.ledger, certification: result.certification, replay_hash: result.replay_hash }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runKnowledgeLifecycleManagement(); return { status: result.certification.status, production_ready: result.certification.production_ready, observability: result.observability, integrity_hash: result.integrity_hash }; }
