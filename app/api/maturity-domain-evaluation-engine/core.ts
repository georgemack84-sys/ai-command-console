import {
  buildMaturityDomainEvaluationObservabilitySurface,
  evaluateMaturityDomains,
  getMaturityDomainEvaluationEngineBundle,
  listMaturityDomainAuditLog,
  listMaturityDomainMetrics,
  listMaturityDomainReports,
  validateMaturityDomainEvaluation,
} from "@/services/maturity-domain-evaluation-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MaturityDomainEvaluationInput, MaturityDomainEvaluationRepository } from "@/types/maturity-domain-evaluation-engine";

export async function requireMaturityDomainEvaluationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): MaturityDomainEvaluationRepository {
  return (body.repository as MaturityDomainEvaluationRepository | undefined) ?? evaluateMaturityDomains(body as MaturityDomainEvaluationInput);
}

export function engineBundleResponse() { return getMaturityDomainEvaluationEngineBundle(); }
export async function evaluateRequest(request: Request) { return evaluateMaturityDomains((await readBody(request)) as MaturityDomainEvaluationInput); }
export async function metricsRequest(request: Request) { return listMaturityDomainMetrics((await readBody(request)) as MaturityDomainEvaluationInput); }
export async function reportsRequest(request: Request) { return listMaturityDomainReports((await readBody(request)) as MaturityDomainEvaluationInput); }
export async function auditRequest(request: Request) { return listMaturityDomainAuditLog((await readBody(request)) as MaturityDomainEvaluationInput); }
export async function domainsRequest(request: Request) { return evaluateMaturityDomains((await readBody(request)) as MaturityDomainEvaluationInput).contract.domains; }
export async function validateRequest(request: Request) { return validateMaturityDomainEvaluation(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMaturityDomainEvaluationObservabilitySurface();
  return buildMaturityDomainEvaluationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
