import { getOrganizationalLearningContract, runOrganizationalLearning, validateOrganizationalLearning } from "@/services/organizational-learning-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OrganizationalLearningInput, OrganizationalLearningResult } from "@/types/organizational-learning-framework";

export async function requireOrganizationalLearningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OrganizationalLearningInput { return body as OrganizationalLearningInput; }
function resultFromBody(body: Record<string, unknown>): OrganizationalLearningResult { return (body.result as OrganizationalLearningResult | undefined) ?? runOrganizationalLearning(inputFromBody(body)); }
export function contractResponse() { return getOrganizationalLearningContract(); }
export async function dashboardRequest(request?: Request) { if (!request) return runOrganizationalLearning(); return runOrganizationalLearning(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateOrganizationalLearning(resultFromBody(await readBody(request))); }
export async function lessonsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOrganizationalLearning(); return { lessons: result.lessons, trends: result.trends, certification: result.certification }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOrganizationalLearning(); return { recommendations: result.recommendations, strategic_evolution: result.strategic_evolution }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOrganizationalLearning(); return { metrics: result.metrics, observability: result.observability }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOrganizationalLearning(); return { record: result.record, ledger: result.ledger, replay_hash: result.replay_hash }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOrganizationalLearning(); return { status: result.certification.status, approved_for_organizational_use: result.certification.approved_for_organizational_use, observability: result.observability, integrity_hash: result.integrity_hash }; }
